import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { freshState } from '../src/state.js';
import { VOICE_TEXT } from '../src/voice-ids.js';

const require = createRequire(process.env.PLAYWRIGHT_RUNNER || '/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const { chromium } = require('playwright');
const base = (process.env.GAME_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/release-metrics');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { base, load: [], media: [], errors: [], resize: [] };
try {
  for (const profile of ['normal', 'school-wifi-10mbps']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (profile !== 'normal') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 1250000, uploadThroughput: 625000 });
    let bytes = 0;
    const hosts = new Set();
    const requests = [];
    cdp.on('Network.loadingFinished', event => bytes += event.encodedDataLength);
    page.on('request', request => { hosts.add(new URL(request.url()).origin); requests.push(request.url()); });
    const start = Date.now();
    await page.goto(`${base}/`, { waitUntil: 'commit' });
    const boot = await page.locator('.boot').isVisible().catch(() => false);
    await page.locator('.title-start').waitFor({ timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    const readyMs = Date.now() - start;
    await page.waitForLoadState('networkidle', { timeout: 120000 });
    report.load.push({ profile, readyMs, transferredBytes: bytes, boot, origins: [...hosts], mapDeferred: !requests.some(url => url.endsWith('/expedition-map.webp')) });
    assert.ok(report.load.at(-1).mapDeferred, 'the exploration map must load when entering the map');
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.title-start').waitFor();
  const state = process.env.QA_STATE ? JSON.parse(await readFile(process.env.QA_STATE, 'utf8')) : freshState();
  state.settings.muted = true;
  if (!process.env.QA_STATE) state.settings.unlockAll = true;
  await page.evaluate(state => localStorage.setItem('blue-planet-hq:v2', JSON.stringify(state)), state);
  await page.reload({ waitUntil: 'domcontentloaded' });

  for (let chapter = 1; chapter <= 5; chapter++) {
    await page.goto(`${base}/#s${chapter}a`, { waitUntil: 'domcontentloaded' });
    await page.locator('.moa-hint > summary').click();
    await page.locator('[data-action="concept"]:visible').click();
    await page.waitForFunction(() => document.querySelector('dialog[open] video')?.readyState >= 2, null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const media = await page.evaluate(() => {
      const video = document.querySelector('dialog[open] video');
      return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, time: video.currentTime, muted: video.muted, scenes: document.querySelectorAll('[data-cue-index]').length };
    });
    assert.equal(media.width, 1280);
    assert.equal(media.scenes, 4);
    assert.ok(media.time > 0);
    report.media.push({ chapter, ...media });
    await page.keyboard.press('Escape');
  }
  report.voiceDecode = await page.evaluate(async ({ base, ids }) => {
    const audio = new AudioContext();
    const results = [];
    for (const id of ids) {
      const response = await fetch(`${base}/assets/audio/voices/${id}.mp3`);
      if (!response.ok) throw Error(`Voice ${id} returned ${response.status}`);
      const buffer = await audio.decodeAudioData(await response.arrayBuffer());
      results.push({ id, seconds: buffer.duration, channels: buffer.numberOfChannels });
    }
    await audio.close();
    return results;
  }, { base, ids: Object.keys(VOICE_TEXT) });
  await page.goto(`${base}/#s2a`, { waitUntil: 'domcontentloaded' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  report.reducedMotion = await page.evaluate(() => ({ preference: matchMedia('(prefers-reduced-motion: reduce)').matches, activeAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length }));
  for (const [width, height] of [[1280, 800], [768, 1024], [375, 812], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2, nextVisible: !!document.querySelector('[data-action="next"]')?.getClientRects().length }));
    assert.equal(metrics.horizontalOverflow, false);
    assert.equal(metrics.nextVisible, true);
    report.resize.push({ width, height, ...metrics });
  }
  await page.evaluate(() => document.documentElement.style.zoom = '1.25');
  report.zoom125 = await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2, nextVisible: !!document.querySelector('[data-action="next"]')?.getClientRects().length }));
  await page.screenshot({ path: path.join(out, 'zoom125.png'), fullPage: true });
  assert.equal(report.zoom125.horizontalOverflow, false);
  await page.evaluate(() => document.documentElement.style.zoom = '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`${base}/#hub`, { waitUntil: 'domcontentloaded' });
  await page.locator('#hub-map').waitFor();
  await page.waitForLoadState('networkidle');
  report.frameScene = 'hub';
  report.frameTiming = await page.evaluate(() => new Promise(resolve => {
    const frames = [];
    let previous;
    function frame(now) {
      if (previous !== undefined) frames.push(now - previous);
      previous = now;
      if (frames.length < 120) requestAnimationFrame(frame);
      else {
        frames.sort((a, b) => a - b);
        resolve({ samples: frames.length, medianMs: frames[60], p95Ms: frames[114] });
      }
    }
    requestAnimationFrame(frame);
  }));
  assert.deepEqual(report.errors, []);
  await context.setOffline(true);
  const offlineNavigation = await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }).then(() => true, () => false);
  report.offlineRevisit = offlineNavigation && await page.locator('#app .hub-page').count() > 0;
  console.log(JSON.stringify({ load: report.load, clips: report.media.length, voices: report.voiceDecode.length, reducedMotion: report.reducedMotion, resize: report.resize, zoom125: report.zoom125, frameTiming: report.frameTiming, offlineRevisit: report.offlineRevisit, errors: report.errors }, null, 2));
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await writeFile(path.join(out, 'metrics.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
