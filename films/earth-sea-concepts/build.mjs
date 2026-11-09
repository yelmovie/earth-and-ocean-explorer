// 사용법 (프로젝트 루트에서)
//   node films/earth-sea-concepts/build.mjs          → chapter-1.html ~ chapter-5.html 생성, index.html = 1편
//   node films/earth-sea-concepts/build.mjs 3        → index.html = 3편 (hyperframes check/snapshot 은 index.html 을 본다)
//   node films/earth-sea-concepts/build.mjs --render 1 2 …  → 렌더 후 앱용 public/assets/concepts/chapter-N.{mp4,webm,webp}
// 렌더 원본·프레임 캐시는 TMPDIR(외장 SSD)에만 둔다. 앱 경로에는 결과 파일만 복사한다.
import { writeFileSync, readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { page, SECONDS, FPS } from './kit.mjs';
import { films } from './films.mjs';

const dir = fileURLToPath(new URL('.', import.meta.url));
const app = fileURLToPath(new URL('../../public/assets/concepts/', import.meta.url));
const ids = Object.keys(films);
mkdirSync(join(dir, 'scenes'), { recursive: true });
for (const id of ids) writeFileSync(join(dir, 'scenes', `chapter-${id}.html`), page(films[id]));
const args = process.argv.slice(2), render = args[0] === '--render';
const targets = (render ? args.slice(1) : args).filter(Boolean);
const use = id => { if (!films[id]) throw new Error('모르는 편: ' + id); copyFileSync(join(dir, 'scenes', `chapter-${id}.html`), join(dir, 'index.html')); };
use(targets[0] || '1');
if (!render) { console.log('built chapters', ids.join(' '), '→ index.html =', targets[0] || '1'); process.exit(0); }

const tmp = process.env.TMPDIR;
if (!tmp || !tmp.startsWith('/Volumes/')) throw new Error('TMPDIR 를 외장 SSD 경로로 지정하세요');
const out = join(tmp, 'film-renders'); mkdirSync(out, { recursive: true });
const run = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'], cwd: dir, maxBuffer: 64 << 20 }).toString();
const probe = (file, entries) => run('ffprobe', ['-v', 'error', '-show_entries', entries, '-of', 'csv=p=0', file]).trim();
const manifest = { duration: SECONDS, fps: FPS, width: 1280, height: 720, chapters: 5, audio: true, generator: 'films/earth-sea-concepts (HyperFrames 0.9.26, 1920x1080 30fps master → FFmpeg 1280x720 H.264+AAC / VP9+Opus)', clips: [] };
try { Object.assign(manifest, { clips: JSON.parse(readFileSync(join(app, 'manifest.json'), 'utf8')).clips || [] }); } catch {}
for (const id of targets.length ? targets : ids) {
  use(id);
  const master = join(out, `chapter-${id}-1080p.mp4`);
  run('hyperframes', ['render', '.', '--quality', 'delivery', '--fps', String(FPS), '--workers', '2', '--quiet', '-o', master]);
  const dur = Number(probe(master, 'format=duration'));
  if (Math.abs(dur - SECONDS) > 0.15) throw new Error(`chapter-${id} 길이 ${dur}s ≠ ${SECONDS}s`);
  const vf = 'scale=1280:720:flags=lanczos,format=yuv420p';
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', join(app, `chapter-${id}.mp4`)]);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '35', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', join(app, `chapter-${id}.webm`)]);
  // 포스터 = 마지막 장면(결론 + 이름표 + 모아). 움직임 줄이기·재생 실패 때 이 그림과 자막 전체가 남는다.
  const png = join(out, `chapter-${id}-last.png`);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-sseof', '-0.3', '-i', master, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', png]);
  run('node', ['-e', `require(process.env.SHARP_PATH||'/Users/yel/.local/node/lib/node_modules/sharp')(process.argv[1]).webp({quality:82}).toFile(process.argv[2]).then(()=>{})`, png, join(app, `chapter-${id}.webp`)]);
  const files = ['mp4', 'webm', 'webp'].map(ext => { const name = `chapter-${id}.${ext}`; return { name, bytes: readFileSync(join(app, name)).length }; });
  const rec = { id: Number(id), seconds: SECONDS, files };
  const i = manifest.clips.findIndex(c => c.id === Number(id)); if (i >= 0) manifest.clips[i] = rec; else manifest.clips.push(rec);
  manifest.clips.sort((a, b) => a.id - b.id);
  console.log(`chapter-${id}`, dur.toFixed(2) + 's', files.map(f => `${f.name} ${(f.bytes / 1024).toFixed(0)}KB`).join(', '));
}
writeFileSync(join(app, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
use('1');
