import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '../../8 creatures/node_modules/@playwright/test/index.mjs');
const base = process.env.GAME_URL || 'http://127.0.0.1:5173';
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/expedition-browser');
const sizes = process.env.QA_SIZES
  ? process.env.QA_SIZES.split(',').map(size => size.split('x').map(Number))
  : [[1920,1080],[1280,800],[1024,768],[1024,600],[915,412],[830,515],[768,1024],[375,812]];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_PATH });
const checks = [];
const errors = [];

function audit() {
  const dialog = document.querySelector('.ocean-expedition');
  const issues = [];
  if (dialog.scrollWidth > dialog.clientWidth + 2) issues.push('dialog horizontal overflow');
  for (const control of dialog.querySelectorAll('button,select')) {
    const rect = control.getBoundingClientRect();
    if (rect.width < 48 || rect.height < 48) issues.push(`small target ${control.textContent.trim()}`);
  }
  const field = dialog.querySelector('.ocean-field').getBoundingClientRect();
  for (const label of dialog.querySelectorAll('.ocean-point span')) {
    const rect = label.getBoundingClientRect();
    if (rect.left < field.left || rect.right > field.right || rect.top < field.top || rect.bottom > field.bottom) issues.push(`clipped map label ${label.textContent}`);
    if (parseFloat(getComputedStyle(label).fontSize) < (innerWidth >= 1600 ? 18 : 14)) issues.push(`small map label ${label.textContent}`);
  }
  const close = dialog.querySelector('[data-close]');
  const rect = close.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
  if (!close.contains(hit)) issues.push('close button unavailable after scrolling');
  return issues;
}

try {
  const entry = await browser.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  entry.setDefaultTimeout(60000);
  entry.setDefaultNavigationTimeout(120000);
  entry.on('pageerror', error => errors.push(error.message));
  await entry.goto(base, { waitUntil: 'domcontentloaded' });
  await entry.locator('.title-map').tap();
  await entry.getByRole('button', { name: '탐사정 출항 · 직접 조사' }).tap();
  assert.equal(await entry.locator('.ocean-expedition option[value="2"]').evaluate(option => option.disabled), true);
  await entry.getByRole('button', { name: '탐사정 위', exact: true }).tap();
  await entry.keyboard.press('ArrowUp');
  await entry.keyboard.press('ArrowRight');
  await entry.locator('[data-point="0"]').click();
  assert.equal(await entry.locator('.ocean-point.found').count(), 1, 'keyboard movement survives redraw');
  await entry.getByRole('button', { name: '탐사 닫기' }).click();
  assert.equal(await entry.locator('.expedition-launch').evaluate(el => el === document.activeElement), true);
  await entry.reload({ waitUntil: 'domcontentloaded' });
  await entry.getByRole('button', { name: '탐사정 출항 · 직접 조사' }).click();
  assert.equal(await entry.locator('.ocean-point.found').count(), 1, 'evidence persists after reload');
  await entry.keyboard.press('Escape');
  await entry.close();

  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    // Fixtures unlock optional voyages independently of the course's completion rules.
    await page.evaluate(async () => {
      const { mountExpedition } = await import('/src/expedition.js');
      const { freshState } = await import('/src/state.js');
      window.oceanState = freshState();
      window.oceanState.settings.unlockAll = true;
      window.oceanSounds = [];
      const host = document.createElement('section');
      document.body.append(host);
      mountExpedition(host, window.oceanState, () => {}, route => window.oceanRoute = route, sound => window.oceanSounds.push(sound));
    });
    await page.getByRole('button', { name: '탐사정 출항 · 직접 조사' }).click();
    await page.evaluate(() => document.fonts.ready);
    for (let stage = 1; stage <= 5; stage++) {
      await page.getByLabel('탐사 구역', { exact: true }).selectOption(String(stage));
      const nodes = await page.evaluate(async stage => (await import('/src/expedition.js')).expeditions[stage - 1].nodes, stage);
      let x = 0;
      let y = 3;
      await page.locator('[data-point="1"]').click();
      assert.equal(await page.locator('.ocean-point.found').count(), 0, 'distant evidence stays locked');
      assert.equal(await page.locator('[data-research]').isDisabled(), true);
      const moveTo = async node => {
        while (x !== node.x) {
          await page.getByRole('button', { name: `탐사정 ${x < node.x ? '오른쪽' : '왼쪽'}`, exact: true }).click();
          x += x < node.x ? 1 : -1;
        }
        while (y !== node.y) {
          await page.getByRole('button', { name: `탐사정 ${y < node.y ? '아래' : '위'}`, exact: true }).click();
          y += y < node.y ? 1 : -1;
        }
      };
      const tool = { 1: 'camera', 2: 'sample', 3: 'camera', 4: 'gauge', 5: 'lens' }[stage];
      const guardedPoint = { 2: 2, 4: 1 }[stage];
      if (guardedPoint !== undefined) {
        await moveTo(nodes[guardedPoint]);
        await page.locator(`[data-tool="${tool}"]`).click();
        await page.locator(`[data-point="${guardedPoint}"]`).click();
        assert.equal(await page.locator('.ocean-point.found').count(), 0, 'collection prerequisites stay enforced');
      }
      for (let i = 0; i < nodes.length; i++) {
        await moveTo(nodes[i]);
        await page.locator(`[data-tool="${tool === 'camera' ? 'lens' : 'camera'}"]`).click();
        await page.locator(`[data-point="${i}"]`).click();
        assert.equal(await page.locator('.ocean-point.found').count(), i, 'wrong tool does not collect evidence');
        await page.locator(`[data-tool="${tool}"]`).click();
        await page.locator(`[data-point="${i}"]`).click();
        const rewards = await page.evaluate(() => window.oceanSounds.filter(sound => sound === 'reward').length);
        await page.locator(`[data-point="${i}"]`).click();
        assert.equal(await page.evaluate(() => window.oceanSounds.filter(sound => sound === 'reward').length), rewards, 'reopening evidence does not repeat rewards');
      }
      assert.equal(await page.locator('.ocean-point.found').count(), 3);
      assert.equal(await page.locator('[data-research]').isEnabled(), true);
      const issues = await page.evaluate(audit);
      checks.push({ width, height, stage, issues });
      await page.locator('.ocean-expedition').screenshot({ path: path.join(out, `${width}x${height}-stage-${stage}.png`) });
      assert.deepEqual(issues, [], `expedition ${stage} at ${width}×${height}`);
    }
    await page.locator('[data-research]').click();
    assert.equal(await page.evaluate(() => window.oceanRoute), 's5a');
    await page.close();
    console.log(`Expeditions passed at ${width}×${height}`);
  }
  assert.deepEqual(errors, []);
  console.log(`Entry, keyboard, persistence, repeated rewards and ${checks.length} responsive scenes passed`);
} finally {
  await writeFile(path.join(out, 'verification.json'), JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
