import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { freshState } from '../src/state.js';

const require = createRequire(process.env.PLAYWRIGHT_RUNNER || '/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const { chromium } = require('playwright');
const base = (process.env.GAME_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/release-safety');
const key = 'blue-planet-hq:v2';
await mkdir(out, { recursive: true });
const completed = JSON.parse(await readFile(process.env.QA_STATE || 'artifacts/release-20261111/journey-production/completed-state.json', 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = {};
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.title-start').waitFor();
  const click = action => page.locator(`[data-action="${action}"]`).first().click();
  const raw = () => page.evaluate(key => localStorage.getItem(key), key);
  const saved = async () => JSON.parse(await raw());
  async function fixture(value) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)), { key, value });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-action="settings"]').waitFor();
  }
  async function previewToggle() {
    await click('settings');
    await page.getByText('교사용 가이드', { exact: true }).click();
    await page.getByText('교사용 도구', { exact: true }).click();
    await click('toggle-unlock');
    await click('close-settings');
    await page.locator('.settings-panel').waitFor({ state: 'detached' });
  }
  await fixture(completed);
  const before = await raw();
  await previewToggle();
  await page.evaluate(() => location.hash = 's2a');
  await page.locator('#app.route-s2a').waitFor();
  await page.locator('[data-field="prediction"][data-value="different"]').click();
  assert.equal(await raw(), before);
  await previewToggle();
  assert.deepEqual((await saved()).drafts, completed.drafts);
  results.teacherDraftIsolation = true;

  const other = await context.newPage();
  other.setDefaultNavigationTimeout(120000);
  await other.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await other.locator('[data-action="sound"]').waitFor();
  await click('sound');
  const latest = await raw();
  await other.locator('[data-action="sound"]').click();
  await other.locator('.storage-warning').waitFor();
  assert.equal(await raw(), latest);
  results.twoTabConflict = true;
  await other.close();

  await fixture('{broken');
  await page.locator('.storage-warning').waitFor();
  await page.locator('.title-start').click();
  assert.equal(await raw(), '{broken');
  await page.screenshot({ path: path.join(out, 'corrupt-save-preserved.png'), fullPage: true });
  results.corruptOriginalPreserved = true;
  await click('settings');
  await click('reset-ask');
  await click('reset-confirm');
  const reset = await saved();
  assert.equal(reset.version, 2);
  assert.deepEqual(reset.completed, []);
  assert.deepEqual(reset.links, {});
  assert.equal(reset.issuedAt, null);
  assert.deepEqual(reset.expeditions, freshState().expeditions);
  results.explicitReset = true;

  const tampered = freshState();
  tampered.completed = [1, 2, 3, 4, 5];
  tampered.route = 'certificate';
  tampered.resume = 'certificate';
  tampered.issuedAt = new Date().toISOString();
  await fixture(tampered);
  await page.evaluate(() => location.hash = 'certificate');
  await page.locator('#app.route-hub').waitFor();
  assert.equal(await page.locator('[data-action="print"]').count(), 0);
  assert.deepEqual((await saved()).completed, []);
  results.derivedUnlocks = true;

  const dragging = freshState();
  Object.assign(dragging.drafts[1], { samples: ['asia', 'pacific', 'africa'], atmosphere: true });
  dragging.route = 's1b';
  await fixture(dragging);
  await page.evaluate(() => location.hash = 's1b');
  await page.locator('#app.route-s1b').waitFor();
  const center = async selector => {
    const box = await page.locator(selector).boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const source = await center('[data-sample="asia"]');
  const second = await center('[data-sample="pacific"]');
  const bin = await center('[data-sample-bin="육지"]');
  const middle = { x: source.x, y: (source.y + bin.y) / 2 };
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, point]) => ({ id, ...point })) });
  await touch('touchStart', [[1, source]]);
  await touch('touchMove', [[1, middle]]);
  await page.locator('.drag-ghost').waitFor();
  await touch('touchStart', [[1, middle], [2, second]]);
  await touch('touchMove', [[1, bin], [2, second]]);
  await touch('touchEnd', [[2, second]]);
  await touch('touchEnd', []);
  assert.equal((await saved()).drafts[1].classifications.asia, '육지', 'second touch must not take over the active drag');
  assert.equal(await page.locator('.drag-ghost').count(), 0);
  results.multitouchDragOwnership = true;

  const future = { ...freshState(), version: 999 };
  await fixture(future);
  await page.locator('.storage-warning').waitFor();
  await click('sound');
  assert.equal((await saved()).version, 999);
  results.futureVersionPreserved = true;
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  results.failure = error.stack;
  throw error;
} finally {
  await writeFile(path.join(out, 'safety.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
