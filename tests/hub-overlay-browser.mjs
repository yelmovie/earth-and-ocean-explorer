// Verify hub overlays against an actual app bundle and a previously completed learner save.
// GAME_URL, QA_OUTPUT, QA_STATE, BROWSER_PATH and PLAYWRIGHT_RUNNER are configurable.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(process.env.PLAYWRIGHT_RUNNER || '/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const { chromium } = require('playwright');
const base = (process.env.GAME_URL || 'http://127.0.0.1:4173').replace(/\/$/, '') + '/';
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/hub-overlays');
const statePath = process.env.QA_STATE || 'artifacts/release-20261111/live-journey/completed-state.json';
const completed = JSON.parse(await readFile(statePath, 'utf8'));
assert.equal(completed.completed.length, 5, 'QA_STATE must contain a completed five-chapter learner save');
await mkdir(out, { recursive: true });
const report = { base, statePath, checks: [], errors: [] };
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true });
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(120000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => {
  if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`);
});

function overlaps(a, b) {
  return a && b
    && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
}

async function measure() {
  return page.evaluate(() => {
    const rect = element => {
      if (!element || !element.getClientRects().length || Number(getComputedStyle(element).opacity) === 0) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    return {
      titleChip: !!document.querySelector('.hub-quest'),
      photo: rect(document.querySelector('.photo-restoration')),
      icons: [...document.querySelectorAll('.topbar button')].map(rect).filter(Boolean),
      labels: [...document.querySelectorAll('.hub-building-label')].map(element => ({ text: element.textContent, rect: rect(element) })).filter(label => label.rect),
      dpad: rect(document.querySelector('.hub-dpad')),
      next: rect(document.querySelector('.hub-next')),
      launch: rect(document.querySelector('.expedition-launch')),
      overflow: Math.max(document.documentElement.scrollWidth - innerWidth, 0),
    };
  });
}

async function check(width, height, state, open) {
  await page.waitForTimeout(250);
  const result = { width, height, state, open, ...await measure() };
  report.checks.push(result);
  await page.screenshot({ path: path.join(out, `${width}-${state}-${open ? 'open' : 'closed'}.png`) });
  assert.equal(result.overflow, 0, 'Document must remain within the viewport');
  assert.equal(result.titleChip, false, 'The map should not have a visible heading chip');
  for (const [index, icon] of result.icons.entries()) {
    assert.ok(icon.width >= 48 && icon.height >= 48, 'Header controls need 48px touch targets');
    assert.ok(!overlaps(icon, result.photo), 'Header control overlaps photo work');
    for (const other of result.icons.slice(index + 1)) assert.ok(!overlaps(icon, other), 'Header controls overlap');
  }
  if (open) {
    for (const control of [result.dpad, result.next, result.launch]) {
      assert.ok(!overlaps(result.photo, control), 'Open photo work overlaps map navigation');
    }
  }
  for (const label of result.labels) {
    for (const [name, obstacle] of [['photo work', result.photo], ...result.icons.map(icon => ['header', icon])]) {
      assert.ok(!overlaps(label.rect, obstacle), `${label.text} overlaps ${name}`);
    }
  }
  console.log(`${width}x${height} ${state} ${open ? 'open' : 'closed'} passed`);
}

async function checkMapMovement(width, height, state) {
  await page.locator('[data-hub-overview]').tap();
  await check(width, height, state + '-overview', false);
  await page.locator('[data-hub-overview]').tap();
  await page.locator('#hub-map').focus();
  for (const direction of ['ArrowLeft', 'ArrowRight']) {
    await page.keyboard.down(direction);
    await page.waitForTimeout(200);
    await page.keyboard.up(direction);
    await check(width, height, state + '-' + direction, false);
  }
}

try {
  await page.goto(base);
  await page.waitForSelector('.title-map');
  for (const [width, height] of [[375, 812], [915, 412], [1024, 768]]) {
    await page.setViewportSize({ width, height });
    for (const state of ['fresh', 'partial', 'completed', 'teacher']) {
      const fixture = structuredClone(completed);
      fixture.route = 'hub';
      fixture.resume = 'hub';
      fixture.settings.muted = true;
      fixture.settings.unlockAll = state === 'teacher';
      fixture.restoration = {};
      if (state === 'fresh') {
        fixture.completed = [];
        fixture.evidence = {};
        fixture.links = {};
        fixture.drafts = {};
        fixture.research = {};
      }
      if (state === 'partial') {
        fixture.completed = [1];
        fixture.evidence = { 1: fixture.evidence[1] };
        fixture.links = {};
      }
      await page.evaluate(value => localStorage.setItem('blue-planet-hq:v2', JSON.stringify(value)), fixture);
      await page.goto(base + '#hub');
      await page.reload();
      await page.waitForSelector('.hub-next');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('.hub-building-label')].every(label => label.style.left));
      await check(width, height, state, false);
      if (state === 'fresh') {
        await checkMapMovement(width, height, state);
        continue;
      }
      await page.locator('.photo-restoration summary').tap();
      await check(width, height, state, true);
      // A smaller scrolling photo panel must still support placement and folding.
      await page.locator('[data-photo="0"]').tap();
      await page.locator('[data-pin="0"]').tap();
      assert.equal(await page.locator('.restoration-photo-pin.placed').count(), 1);
      await page.locator('[data-fold]').tap();
      assert.equal(await page.locator('.photo-restoration').evaluate(panel => panel.open), false, 'Folding photo work should close its panel');
      if (state === 'completed') await checkMapMovement(width, height, state);
    }
  }
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = error.message;
  throw error;
} finally {
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
