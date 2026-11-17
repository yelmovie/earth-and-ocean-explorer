// 4장 적용 문제의 3D 탐사길 걷기를 실제 브라우저에서 끝까지 해 본다.
// 사용: GAME_URL=http://127.0.0.1:5174 node tests/tide-walk-browser.mjs  (개발 서버, 빌드 미리보기, 운영 주소 모두 가능)
// WALK_QUICK=1 이면 48초씩 기다리는 두 경로(모아가 부름, 탐사길 닫힘)를 건너뛴다.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { freshState, completeStage, SAVE_KEY } from '../src/state.js';
import { sites, terrains } from '../src/data.js';
import { challenges } from '../src/challenge-data.js';

const require = createRequire(process.env.PLAYWRIGHT_RUNNER || '/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const { chromium } = require('playwright');
const base = (process.env.GAME_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/tide-walk'); await mkdir(out, { recursive: true });
const quick = !!process.env.WALK_QUICK;

// 1~3장을 마치고 4장의 관찰·비교·도전과 적용 첫 문제까지 푼 학생. 남은 문제는 tide-safety 하나다.
function seedState(mutate = () => {}) {
  const s = freshState(); s.settings.muted = true;
  Object.assign(s.drafts[1], { samples: sites.map(x => x.id), atmosphere: true, classifications: Object.fromEntries(sites.map(x => [x.id, x.type])), conclusion: 'global' });
  Object.assign(s.drafts[2], { fresh: 40, sea: 40, heatFresh: 1, heatSea: 1, prediction: 'different', prepared: true, heated: true, seenBefore: true, seenAfter: true, residue: 'sea', reason: 'dissolved' });
  Object.assign(s.drafts[3], { photos: terrains.map(x => x.id), pins: Object.fromEntries(terrains.map(x => [x.id, { x: 45, y: 45 }])), features: Object.fromEntries(terrains.map(x => [x.id, x.feature])), compare: 'through' });
  Object.assign(s.drafts[4], { a: 0, b: 3, time: 3, markers: ['pole', 'rock'], direction: 'up', concept: 'in' });
  const solve = (n, tasks) => { for (const t of tasks) { s.research[n].answers[t.id] = ['sort', 'match'].includes(t.type) ? Object.fromEntries(t.items.map(x => [x.id, x.answer])) : structuredClone(t.answer); s.research[n].solved.push(t.id); } };
  for (let n = 1; n <= 3; n++) { solve(n, challenges[n]); assert.ok(completeStage(s, n)); }
  solve(4, challenges[4].slice(0, 3));
  s.research[4].d = 1; s.route = 's4d'; s.resume = 's4d';
  mutate(s);
  return JSON.stringify(s);
}

const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = { base, checks: [], errors: [] };
const note = (name, detail = '') => { report.checks.push({ name, detail }); console.log(`ok  ${name}${detail ? ` · ${detail}` : ''}`); };

async function open({ viewport = { width: 1280, height: 800 }, state = seedState(), init, reducedMotion } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', e => report.errors.push(`pageerror ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`console ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  if (init) await page.addInitScript(init);
  await page.goto(`${base}/`);
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, state]);
  await page.goto(`${base}/?walk=${Date.now()}#s4d`);
  await page.locator('.challenge-page').waitFor();
  return { context, page };
}
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const walk = page => page.locator('dialog.tide-walk');
const card = page => page.locator('dialog.tide-walk .tw-card');
const actionReady = page => page.locator('dialog.tide-walk .tw-action:not([disabled])');
const actionLabel = page => page.locator('dialog.tide-walk [data-tw="action"]').textContent();
const clock = page => page.locator('dialog.tide-walk [data-tw="clock"]').textContent();

async function start(page, plan = '1') {
  await page.locator(`[data-action="challenge-walk-plan"][data-value="${plan}"]`).click();
  await page.locator('[data-action="challenge-walk-start"]:not([disabled])').click();
  await walk(page).waitFor();
  await page.waitForFunction(() => document.querySelector('dialog.tide-walk [data-tw="guide"]')?.textContent.length > 0);
}
// 키보드: 조건이 될 때까지 방향키를 누르고 있는다.
async function holdKey(page, key, until, timeout = 20000) {
  await page.keyboard.down(key);
  try { await until.waitFor({ timeout }); } finally { await page.keyboard.up(key); }
}
// 화면 버튼: 조건이 될 때까지 방향판 버튼을 누르고 있는다.
async function holdPad(page, direction, until, timeout = 20000) {
  const box = await page.locator(`dialog.tide-walk .tw-pad [data-dir="${direction}"]`).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  try { await until.waitFor({ timeout }); } finally { await page.mouse.up(); }
}
const away = page => page.locator('dialog.tide-walk .tw-action[disabled]');
// 다시 시작하면 시계가 06:00으로 돌아간다(다음 프레임에 그려진다).
const restarted = page => page.waitForFunction(() => document.querySelector('dialog.tide-walk [data-tw="clock"]').textContent === '06:00' && document.querySelector('dialog.tide-walk .tw-card').hidden);
const spotCardGone = page => page.waitForFunction(() => document.querySelector('dialog.tide-walk .tw-card')?.hidden);

try {
  // ── 1. 키보드로 안내판을 보지 않고 다녀오면 기존 판정이 틀렸다고 한다 ─────────────
  {
    const { context, page } = await open();
    const html = await page.locator('.challenge-board').innerHTML();
    assert.match(html, /challenge-walk-plan/); assert.doesNotMatch(html, /challenge-answer/);
    assert.equal(await page.locator('[data-action="challenge-walk-start"]').isDisabled(), true, '예상을 고르기 전에는 출발할 수 없다');
    await page.screenshot({ path: path.join(out, 'start-card-1280.png') });
    await start(page, '2');
    assert.equal(await page.locator('dialog.tide-walk .tw-pad button').count(), 4);
    assert.match(await page.locator('dialog.tide-walk .tw-note').textContent(), /한 칸은 2시간인 학습용 관측 모형/);
    assert.equal(await clock(page), '06:00');
    await page.screenshot({ path: path.join(out, 'walk-deck-1280.png') });
    await holdKey(page, 'ArrowRight', actionReady(page));
    assert.equal(await actionLabel(page), '살펴보기');
    await page.keyboard.press('Space');
    await page.locator('dialog.tide-walk .tw-spot-card').waitFor();
    assert.match(await card(page).textContent(), /갈대/);
    await page.screenshot({ path: path.join(out, 'walk-reed-1280.png') });
    await page.keyboard.press('Space'); await spotCardGone(page);
    assert.equal(await page.locator('dialog.tide-walk [data-seen="reed"].is-seen').count(), 1);
    await holdKey(page, 'KeyA', page.locator('dialog.tide-walk .tw-result-card'));
    assert.match(await card(page).textContent(), /다시 살펴봐요/);
    assert.match(await card(page).textContent(), /내 예상\s*10:00쯤에 돌아오기/);
    let s = await saved(page);
    assert.deepEqual(s.research[4].answers['tide-safety'], ['0', '3']);
    assert.equal(s.research[4].solved.includes('tide-safety'), false);
    assert.equal(s.revised, 1);
    await page.screenshot({ path: path.join(out, 'walk-retry-1280.png') });
    note('키보드 · 안내판을 보지 않고 다녀옴 → 틀림, 기존 필드에 [0,3] 기록');

    // ── 2. 화면 버튼으로 안내판을 보고 세 곳을 살펴본 뒤 돌아오면 맞다 ─────────────
    await page.locator('dialog.tide-walk [data-tw-action="retry"]').click();
    await restarted(page);
    await holdPad(page, 'left', actionReady(page));
    assert.equal(await actionLabel(page), '안내판 살펴보기');
    await page.locator('dialog.tide-walk .tw-action').click({ force: true });
    await page.locator('dialog.tide-walk .tw-board-card').waitFor();
    assert.match(await card(page).textContent(), /물때 안내판/);
    assert.match(await card(page).textContent(), /한 칸은 2시간인 학습용 관측 모형/);
    const bars = await page.locator('dialog.tide-walk .tw-chart li span').evaluateAll(list => list.map(el => el.getBoundingClientRect().height));
    assert.ok(bars[0] < bars[1] && bars[1] < bars[2] && bars[2] < bars[3], '안내판 막대가 모형의 물 높이 순서대로 높아진다');
    await page.screenshot({ path: path.join(out, 'walk-board-1280.png') });
    const paused = await clock(page); await page.waitForTimeout(2600); assert.equal(await clock(page), paused, '카드가 떠 있는 동안 시계가 멈춘다');
    await page.locator('dialog.tide-walk [data-tw-action="card-close"]').click();
    for (const id of ['reed', 'crab', 'skipper']) {
      await holdPad(page, 'right', away(page), 6000).catch(() => {});
      await holdPad(page, 'right', actionReady(page));
      await page.locator('dialog.tide-walk .tw-action').click({ force: true });
      await page.locator('dialog.tide-walk .tw-spot-card').waitFor();
      if (id === 'skipper') await page.screenshot({ path: path.join(out, 'walk-skipper-1280.png') });
      await card(page).click(); await spotCardGone(page);
      assert.equal(await page.locator(`dialog.tide-walk [data-seen="${id}"].is-seen`).count(), 1, `${id} 살펴봄`);
    }
    const turned = await clock(page);
    await holdPad(page, 'left', page.locator('dialog.tide-walk .tw-result-card'));
    const text = await card(page).textContent();
    assert.match(text, /안전하게 돌아왔어요/); assert.match(text, /핵심 개념/); assert.match(text, /어른과 함께/); assert.match(text, /3 \/ 3/);
    s = await saved(page);
    assert.deepEqual(s.research[4].answers['tide-safety'], ['0', '2']);
    assert.ok(s.research[4].solved.includes('tide-safety'));
    assert.deepEqual(Object.keys(s.research[4]).sort(), ['answers', 'c', 'd', 'solved']);
    await page.screenshot({ path: path.join(out, 'walk-success-1280.png') });
    await page.locator('dialog.tide-walk [data-tw-action="done"]').click();
    await walk(page).waitFor({ state: 'detached' });
    assert.equal(await page.locator('.challenge-why-card').count(), 1);
    assert.equal(await page.locator('[data-action="challenge-answer"][aria-pressed="true"]').count(), 2);
    note('화면 버튼 · 안내판 확인 + 세 생물 + 제때 돌아옴 → 맞음, [0,2]와 solved 기록', `돌아선 시각 ${turned}`);

    // 장 완료 기록도 기존 형식 그대로 남는다.
    await page.locator('[data-action="challenge-finish"]').click();
    await page.locator('.chapter-reward[open]').waitFor();
    s = await saved(page);
    assert.ok(s.completed.includes(4)); assert.ok(s.evidence[4].research.solved.includes('tide-safety'));
    await page.reload(); await page.locator('.challenge-page, .hub-page, #hub-map').first().waitFor();
    s = await saved(page);
    assert.ok(s.completed.includes(4) && s.research[4].solved.includes('tide-safety'), '새로고침 뒤에도 기록이 남는다');
    note('배지 받기 → completed·evidence[4] 기록, 새로고침 뒤 유지');
    await context.close();
  }

  // ── 3. 태블릿 크기와 작은 화면에서 버튼이 화면 안에 있고 서로 겹치지 않는다 ─────────
  for (const viewport of [{ width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }, { width: 915, height: 412 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
    const { context, page } = await open({ viewport });
    const overflow = await page.evaluate(() => { const board = document.querySelector('.challenge-board'), de = document.documentElement; return { board: board.scrollHeight - board.clientHeight, page: de.scrollHeight - innerHeight, small: [...document.querySelectorAll('.challenge-board button,.mission-footer button')].filter(b => b.getClientRects().length && (b.getBoundingClientRect().height < 47 || b.getBoundingClientRect().bottom > innerHeight + 2)).map(b => b.textContent.trim().slice(0, 14)) }; });
    assert.ok(overflow.board <= 3 && overflow.page <= 2, `출발 전 카드가 ${viewport.width}x${viewport.height}에 들어간다: ${JSON.stringify(overflow)}`);
    assert.deepEqual(overflow.small, [], `출발 전 버튼 크기 ${viewport.width}x${viewport.height}`);
    await start(page);
    const issues = await page.evaluate(() => {
      const found = [], rect = el => el.getBoundingClientRect(), hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const root = document.querySelector('dialog.tide-walk'), pick = selector => [...root.querySelectorAll(selector)].filter(el => el.getClientRects().length);
      for (const el of pick('.tw-pad button,.tw-action,.tw-tools button')) { const r = rect(el); if (r.width < 52 || r.height < 52) found.push(`작은 버튼 ${el.getAttribute('aria-label') || el.textContent} ${Math.round(r.width)}x${Math.round(r.height)}`); if (!el.getAttribute('aria-label') && !el.textContent.trim()) found.push('이름 없는 버튼'); }
      const blocks = pick('.tw-instruments,.tw-guide,.tw-tools,.tw-pad,.tw-action,.tw-note');
      for (const el of blocks) { const r = rect(el); if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) found.push(`화면 밖 ${el.className}`); }
      for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (hit(rect(blocks[i]), rect(blocks[j]))) found.push(`겹침 ${blocks[i].className} / ${blocks[j].className}`);
      const canvas = root.querySelector('canvas'); if (Math.abs(canvas.clientWidth - innerWidth) > 2 || Math.abs(canvas.clientHeight - innerHeight) > 2) found.push('캔버스가 화면을 채우지 않음');
      return found;
    });
    await page.screenshot({ path: path.join(out, `walk-${viewport.width}x${viewport.height}.png`) });
    assert.deepEqual(issues, [], `겹침 화면 ${viewport.width}x${viewport.height}`);
    // 안내판 카드도 화면 안에 들어온다.
    await holdKey(page, 'ArrowLeft', actionReady(page)); await page.keyboard.press('Enter');
    await page.locator('dialog.tide-walk .tw-board-card').waitFor();
    const cardFits = await card(page).evaluate(el => { const r = el.getBoundingClientRect(), b = el.querySelector('button').getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1 && b.height >= 48; });
    assert.ok(cardFits, `안내판 카드 ${viewport.width}x${viewport.height}`);
    await page.screenshot({ path: path.join(out, `board-${viewport.width}x${viewport.height}.png`) });
    await page.locator('dialog.tide-walk [data-tw-action="card-close"]').click();
    // 생물 카드가 방향판·살펴보기 버튼·위쪽 표시를 가리지 않는다.
    await actionReady(page).waitFor();   // 카드가 닫히면 안내판 앞에서 다시 살펴볼 수 있다.
    await holdKey(page, 'ArrowRight', away(page)); await holdKey(page, 'ArrowRight', actionReady(page)); await page.keyboard.press('Space');
    await page.locator('dialog.tide-walk .tw-spot-card').waitFor();
    const covered = await page.evaluate(() => { const rect = el => el.getBoundingClientRect(), hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1, root = document.querySelector('dialog.tide-walk'), cardRect = rect(root.querySelector('.tw-card')); return [...root.querySelectorAll('.tw-pad,.tw-action,.tw-instruments,.tw-guide,.tw-tools')].filter(el => hit(cardRect, rect(el))).map(el => el.className).concat(cardRect.left < -1 || cardRect.right > innerWidth + 1 || cardRect.bottom > innerHeight + 1 ? ['화면 밖'] : []); });
    await page.screenshot({ path: path.join(out, `spot-${viewport.width}x${viewport.height}.png`) });
    assert.deepEqual(covered, [], `생물 카드 ${viewport.width}x${viewport.height}`);
    // Esc는 걷기를 그만두고 문제 화면으로 돌아간다. 기록은 바뀌지 않는다.
    await page.keyboard.press('Escape');
    await walk(page).waitFor({ state: 'detached' });
    assert.equal((await saved(page)).research[4].answers['tide-safety'], undefined);
    assert.equal(await page.locator('[data-action="challenge-walk-start"]').count(), 1);
    note(`화면 배치 ${viewport.width}x${viewport.height}`, '출발 전 카드 · 버튼 52px 이상 · 겹침 없음 · Esc 나가기');
    await context.close();
  }

  // ── 4. 대체 화면: 기존 방식 버튼, 설정의 2D 대체, 움직임 줄이기, WebGL 실패 ───────
  {
    const { context, page } = await open();
    await page.locator('[data-action="challenge-walk-flat"]').click();
    assert.equal(await page.locator('[data-action="challenge-answer"]').count(), 4);
    await page.locator('[data-action="challenge-walk-3d"]').click();
    await start(page);
    await page.locator('dialog.tide-walk [data-tw-action="flat"]').click();
    await walk(page).waitFor({ state: 'detached' });
    for (const id of challenges[4][3].answer) await page.locator(`[data-action="challenge-answer"][data-value="${id}"]`).click();
    await page.locator('.challenge-feedback.good').waitFor();
    const s = await saved(page);
    assert.deepEqual([...s.research[4].answers['tide-safety']].sort(), ['0', '2']); assert.ok(s.research[4].solved.includes('tide-safety'));
    assert.equal(await page.locator('[data-action="challenge-walk-3d"]').textContent(), '탐사길 다시 걷기');
    note('기존 방식으로 하기 → 2D 고르기 화면으로 풀고 같은 기록');
    await context.close();
  }
  {
    const { context, page } = await open({ state: seedState(s => { s.settings.flatGlobe = true; }) });
    assert.equal(await page.locator('[data-action="challenge-answer"]').count(), 4); assert.equal(await page.locator('[data-action^="challenge-walk"]').count(), 0);
    note('설정의 2D 대체 → 기존 화면');
    await context.close();
  }
  {
    const { context, page } = await open({ reducedMotion: true });
    assert.equal(await page.locator('[data-action="challenge-answer"]').count(), 4); assert.equal(await page.locator('[data-action^="challenge-walk"]').count(), 0);
    note('기기의 움직임 줄이기 → 기존 화면');
    await context.close();
  }
  {
    const noWebGL = () => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/.test(type) ? null : original.call(this, type, ...rest); }; };
    const { context, page } = await open({ init: noWebGL });
    assert.equal(await page.locator('[data-action="challenge-answer"]').count(), 4); assert.equal(await page.locator('[data-action^="challenge-walk"]').count(), 0);
    note('WebGL 없음 → 기존 화면');
    await context.close();
  }
  {
    // 처음 확인 때는 되다가 무대를 만들 때 실패하는 기기.
    const flaky = () => { const original = HTMLCanvasElement.prototype.getContext; let calls = 0; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { if (/webgl/.test(type) && ++calls > 1) return null; return original.call(this, type, ...rest); }; };
    const { context, page } = await open({ init: flaky });
    const before = report.errors.length;
    await page.locator('[data-action="challenge-walk-plan"][data-value="1"]').click();
    await page.locator('[data-action="challenge-walk-start"]').click();
    await page.locator('[data-action="challenge-answer"]').first().waitFor();
    assert.equal(await walk(page).count(), 0);
    assert.match(await page.locator('.challenge-feedback').textContent(), /기존 방식으로 바꿨어/);
    report.errors.splice(before);   // three.js가 남기는 WebGL 생성 실패 로그는 이 경우의 정상 동작이다.
    note('3D 무대 만들기 실패 → 안내와 함께 기존 화면');
    await context.close();
  }

  // ── 5. 교사 미리보기: 방향키가 화면 이동이 아니라 걷기로 쓰이고, 저장하지 않는다 ────
  {
    const { context, page } = await open({ state: seedState(s => { s.settings.unlockAll = true; }) });
    await start(page);
    await holdKey(page, 'ArrowRight', actionReady(page));
    assert.equal(await page.evaluate(() => location.hash), '#s4d');
    await page.keyboard.press('Escape'); await walk(page).waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-action="challenge-walk-flat"]').count(), 1, '교사가 기존 방식을 고를 수 있다');
    note('교사 미리보기 · 방향키는 걷기, 기존 방식 선택 가능');
    await context.close();
  }

  if (!quick) {
    // ── 6. 경고 눈금까지 남아 있으면 모아가 부르고 걸어서 돌아온다 ───────────────────
    {
      const { context, page } = await open();
      await start(page, '3');
      await holdKey(page, 'ArrowLeft', actionReady(page)); await page.keyboard.press('Space');
      await page.locator('dialog.tide-walk [data-tw-action="card-close"]').click();
      await holdKey(page, 'ArrowRight', actionReady(page));
      await holdKey(page, 'ArrowRight', away(page), 6000).catch(() => {});
      await holdKey(page, 'ArrowRight', actionReady(page));   // 게 지점에서 기다린다.
      await page.locator('dialog.tide-walk [data-tw="speech"]:not([hidden])').waitFor({ timeout: 70000 });
      assert.equal(await clock(page), '10:00');
      assert.match(await page.locator('dialog.tide-walk [data-tw="speech"]').textContent(), /안전한 길로 돌아와요/);
      assert.equal(await page.evaluate(() => { const rect = el => el.getBoundingClientRect(), root = document.querySelector('dialog.tide-walk'), s = rect(root.querySelector('.tw-speech')); return [...root.querySelectorAll('.tw-pad,.tw-action,.tw-instruments,.tw-guide,.tw-tools,.tw-note')].filter(el => { const r = rect(el); return s.left < r.right && r.left < s.right && s.top < r.bottom && r.top < s.bottom; }).length; }), 0, '모아의 말풍선이 다른 표시를 가리지 않는다');
      await page.screenshot({ path: path.join(out, 'walk-called-1280.png') });
      await page.locator('dialog.tide-walk .tw-result-card').waitFor({ timeout: 20000 });
      assert.match(await card(page).textContent(), /모아가 불러서 돌아왔어요/);
      assert.match(await card(page).textContent(), /경고 눈금/);
      const s = await saved(page);
      assert.deepEqual(s.research[4].answers['tide-safety'], ['1', '2']); assert.equal(s.research[4].solved.includes('tide-safety'), false);
      note('경고 눈금까지 남음 → 10:00에 모아가 부름, 걸어서 복귀, [1,2] 기록(틀림)');
      await context.close();
    }
    // ── 7. 나가지 않고 기다리면 판정 없이 처음부터 다시 한다 ────────────────────────
    {
      const { context, page } = await open();
      await start(page);
      await page.locator('dialog.tide-walk .tw-result-card').waitFor({ timeout: 70000 });
      assert.match(await card(page).textContent(), /탐사길을 닫았어요/);
      assert.equal((await saved(page)).research[4].answers['tide-safety'], undefined);
      await page.locator('dialog.tide-walk [data-tw-action="retry"]').click();
      await restarted(page);
      note('나가지 않고 10:00 → 탐사길 닫힘, 판정 없이 06:00부터 다시');
      await context.close();
    }
  }

  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  assert.deepEqual(report.errors, [], '콘솔 오류와 실패한 요청이 없어야 한다');
  console.log(`\n${report.checks.length}개 확인 통과 · 오류 0 · ${base}`);
} catch (error) {
  await writeFile(path.join(out, 'report.json'), JSON.stringify({ ...report, failed: String(error?.stack || error) }, null, 2));
  console.error(report.errors.slice(0, 10).join('\n'));
  throw error;
} finally {
  await browser.close();
}
