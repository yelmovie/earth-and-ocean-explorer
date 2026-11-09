// `npm run concepts:render [N…]` → HyperFrames 개념영상(films/earth-sea-concepts)을 렌더해
// public/assets/concepts/chapter-N.{mp4,webm,webp}와 manifest.json을 만든다.
// 2026-11-09 이전의 SVG 프레임 생성기(9초 무음)는 이 파이프라인으로 교체됐다(git 기록에 남아 있음).
// TMPDIR 는 외장 SSD 경로여야 하고, 전역 `hyperframes`(0.9.26)·`ffmpeg`·`ffprobe`가 필요하다.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const build = fileURLToPath(new URL('../films/earth-sea-concepts/build.mjs', import.meta.url));
const result = spawnSync(process.execPath, [build, '--render', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
