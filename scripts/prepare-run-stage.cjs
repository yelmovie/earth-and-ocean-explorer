// 3D 탐사길 걷기 그림 가공: 생성 원본(assets/generated/20261117-run-stage/*.png)을 실행용 WebP로 바꾼다.
// 사용: node scripts/prepare-run-stage.cjs [이름 ...]
// sharp는 프로젝트 의존성이 아니다. SHARP_PATH로 설치 위치를 줄 수 있다(기본: 외장 SSD의 wrangler에 딸린 sharp).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const sharp = require(process.env.SHARP_PATH || '/Volumes/T7 Shield/DevCaches/tools/wrangler-4.154.0/node_modules/sharp');
const root = path.resolve(__dirname, '..'), source = path.join(root, 'assets/generated/20261117-run-stage'), target = path.join(root, 'public/assets/illustrations/run-stage');
const spec = require(path.join(root, 'docs/IMAGE-PROMPTS-20261117-run-stage.json'));
const CELL = 256, FRAMES = 6;

// 동작 띠: 투명한 빈 열로 칸을 나누고, 칸마다 같은 배율로 줄여 발 높이와 몸 중심을 맞춘다.
async function strip(file, out) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info, alpha = (x, y) => data[(y * width + x) * 4 + 3];
  const filled = Array.from({ length: width }, (_, x) => { let n = 0; for (let y = 0; y < height; y++) if (alpha(x, y) > 24) n++; return n; });
  let runs = [], start = -1;
  for (let x = 0; x <= width; x++) { const on = x < width && filled[x] > 2; if (on && start < 0) start = x; if (!on && start >= 0) { runs.push([start, x]); start = -1; } }
  // 가는 틈으로 끊긴 조각은 가까운 것끼리 붙이고, 티끌은 버린다.
  runs = runs.filter(([a, b]) => b - a > 6);
  while (runs.length > FRAMES) { let best = 0, gap = Infinity; for (let i = 0; i < runs.length - 1; i++) { const g = runs[i + 1][0] - runs[i][1]; if (g < gap) { gap = g; best = i; } } runs.splice(best, 2, [runs[best][0], runs[best + 1][1]]); }
  if (runs.length !== FRAMES) throw new Error(`${path.basename(file)}: 칸을 ${runs.length}개 찾았다(6개여야 한다)`);
  const boxes = runs.map(([x0, x1]) => {
    let top = height, bottom = 0, sum = 0, count = 0;
    for (let y = 0; y < height; y++) for (let x = x0; x < x1; x++) if (alpha(x, y) > 24) { top = Math.min(top, y); bottom = Math.max(bottom, y); sum += x; count++; }
    return { x0, x1, top, bottom: bottom + 1, center: sum / count };
  });
  const tallest = Math.max(...boxes.map(b => b.bottom - b.top)), widest = Math.max(...boxes.map(b => Math.max(b.center - b.x0, b.x1 - b.center) * 2));
  const scale = Math.min((CELL - 10) / tallest, (CELL - 6) / widest);
  const layers = [];
  for (const [i, b] of boxes.entries()) {
    const w = Math.max(1, Math.round((b.x1 - b.x0) * scale)), h = Math.max(1, Math.round((b.bottom - b.top) * scale));
    const input = await sharp(file).ensureAlpha().extract({ left: b.x0, top: b.top, width: b.x1 - b.x0, height: b.bottom - b.top }).resize(w, h).png().toBuffer();
    const left = Math.round(i * CELL + CELL / 2 - (b.center - b.x0) * scale);
    layers.push({ input, left: Math.max(i * CELL, Math.min((i + 1) * CELL - w, left)), top: CELL - 4 - h });
  }
  const result = await sharp({ create: { width: CELL * FRAMES, height: CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).webp({ quality: 88, alphaQuality: 92, effort: 5 }).toFile(out);
  return { frames: FRAMES, feetSpread: Math.max(...boxes.map(b => b.bottom)) - Math.min(...boxes.map(b => b.bottom)), heightSpread: tallest - Math.min(...boxes.map(b => b.bottom - b.top)), sourceFrames: boxes.map(b => [b.x0, b.top, b.x1 - b.x0, b.bottom - b.top]), width: result.width, height: result.height, bytes: result.size };
}
// 소품 묶음: 한 줄에 놓인 소품을 빈 열로 나눠 하나씩 저장한다. 흐린 가장자리 색 번짐은 지운다.
async function props(file, out, image) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 96) data[i] = 0;
  const alpha = (x, y) => data[(y * width + x) * 4 + 3];
  const filled = Array.from({ length: width }, (_, x) => { let n = 0; for (let y = 0; y < height; y++) if (alpha(x, y)) n++; return n; });
  let runs = [], start = -1;
  for (let x = 0; x <= width; x++) { const on = x < width && filled[x] > 2; if (on && start < 0) start = x; if (!on && start >= 0) { runs.push([start, x]); start = -1; } }
  runs = runs.filter(([a, b]) => b - a > 12);
  while (runs.length > image.parts.length) { let best = 0, gap = Infinity; for (let i = 0; i < runs.length - 1; i++) { const g = runs[i + 1][0] - runs[i][1]; if (g < gap) { gap = g; best = i; } } runs.splice(best, 2, [runs[best][0], runs[best + 1][1]]); }
  if (runs.length !== image.parts.length) throw new Error(`${path.basename(file)}: 소품을 ${runs.length}개 찾았다(${image.parts.length}개여야 한다)`);
  const made = {};
  for (const [i, [x0, x1]] of runs.entries()) {
    let top = height, bottom = 0;
    for (let y = 0; y < height; y++) for (let x = x0; x < x1; x++) if (alpha(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    const name = `prop-${image.parts[i]}`;
    const r = await sharp(data, { raw: { width, height, channels: 4 } }).extract({ left: x0, top, width: x1 - x0, height: bottom + 1 - top }).resize(384, 384, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 92, effort: 5 }).toFile(path.join(target, name + '.webp'));
    made[name] = { width: r.width, height: r.height, bytes: r.size };
  }
  return { parts: made };
}
async function tile(file, out) { const r = await sharp(file).resize(512, 512, { fit: 'cover' }).webp({ quality: 82, effort: 5 }).toFile(out); return { width: r.width, height: r.height, bytes: r.size }; }
async function backdrop(file, out) { const r = await sharp(file).resize(1600, 1024, { fit: 'inside' }).webp({ quality: 82, effort: 5 }).toFile(out); return { width: r.width, height: r.height, bytes: r.size }; }

(async () => {
  fs.mkdirSync(target, { recursive: true });
  const manifestPath = path.join(target, 'manifest.json'), manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const wanted = process.argv.slice(2);
  for (const image of spec.images) {
    if (wanted.length && !wanted.includes(image.name)) continue;
    const file = path.join(source, image.name + '.png'); if (!fs.existsSync(file)) { console.log('원본 없음', image.name); continue; }
    const out = path.join(target, image.name + '.webp');
    const made = await ({ strip, tile, backdrop, props })[image.kind](file, out, image);
    const meta = await sharp(file).metadata();
    manifest[image.name] = { file: image.kind === 'props' ? `illustrations/run-stage/prop-*.webp` : `illustrations/run-stage/${image.name}.webp`, kind: image.kind, ...made, original: `assets/generated/20261117-run-stage/${image.name}.png`, originalSize: [meta.width, meta.height], sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
    console.log(image.name, JSON.stringify(made));
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
})().catch(error => { console.error(error.message); process.exit(1); });
