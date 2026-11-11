// Exercise the deployed bundle through learner controls without injecting progress.
// GAME_URL, QA_OUTPUT, BROWSER_PATH and PLAYWRIGHT_RUNNER can point to an existing QA setup.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sites, terrains, creatures, finalCases } from '../src/data.js';
import { challenges } from '../src/challenge-data.js';

const require = createRequire(process.env.PLAYWRIGHT_RUNNER || '/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const { chromium } = require('playwright');
const base = (process.env.GAME_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const out = path.resolve(process.env.QA_OUTPUT || 'artifacts/release-browser');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const report = { base, journey: [], guidance: { challengeActions: 0 }, safety: {}, errors: [], requests: [] };
const key = 'blue-planet-hq:v2';
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', request => report.requests.push(request.url()));
  const click = (action, value) => page.locator(`[data-action="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`).first().click();
  const choose = (field, value) => page.locator(`[data-action="choose"][data-field="${field}"][data-value="${value}"]`).click();
  const route = name => page.waitForFunction(name => document.querySelector('#app')?.classList.contains(`route-${name}`), name);
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const shot = name => page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  async function slider(field, value) {
    const input = page.locator(`[data-field="${field}"]`);
    const config = await input.evaluate(el => ({ min: Number(el.min), step: Number(el.step) || 1 }));
    await input.focus();
    await page.keyboard.press('Home');
    for (let i = config.min; i < value; i += config.step) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), String(value));
  }
  async function extensions(chapter) {
    for (const [step, start] of [['c', 0], ['d', 4]]) {
      await route(`s${chapter}${step}`);
      for (const [index, task] of challenges[chapter].slice(start, start + 4).entries()) {
        if (index) await click('challenge-next');
        if (task.type === 'choice') await click('challenge-answer', task.answer);
        else if (task.type === 'multi') {
          for (const answer of task.answer) await click('challenge-answer', answer);
        } else if (task.type === 'order') {
          for (const answer of task.answer) await click('challenge-order', answer);
        } else {
          for (const [itemIndex, item] of task.items.entries()) {
            let answer = item.answer;
            if (chapter === 1 && start === 0 && index === 0 && itemIndex === 0) {
              answer = task.bins.find(bin => bin.id !== answer).id;
            }
            await click('challenge-bin', answer);
          }
          if (chapter === 1 && start === 0 && index === 0) {
            assert.equal(await page.locator('.challenge-feedback.good').count(), 0);
            await shot('wrong-answer-guidance');
            await click('challenge-pick', task.items[0].id);
            await click('challenge-bin', task.items[0].answer);
          }
        }
        await page.locator('.challenge-feedback.good').waitFor();
        const advance=page.locator('.mission-footer > .primary');
        assert.equal(await advance.isEnabled(),true);
        assert.match(await advance.getAttribute('class'),/is-ready.*next-target/);
        assert.equal(await advance.getAttribute('aria-describedby'),'challenge-guidance');
        assert.match(await page.locator('.challenge-feedback').innerText(),/다음|남은|배지|이어/);
        report.guidance.challengeActions++;
        report.journey.push(task.id);
      }
      if (step === 'c') await click('challenge-continue');
      else {
        await click('challenge-finish');
        await page.locator('.chapter-reward[open]').waitFor();
        const next = chapter < 5 ? `s${chapter + 1}a` : 'report';
        await page.locator(`[data-reward-route="${next}"]`).click();
        await route(next);
      }
    }
    console.log(`Chapter ${chapter} complete`);
  }

  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.title-start').waitFor();
  await shot('home');
  await click('go', 'hub');
  await route('hub');
  await page.goto(`${base}/#s1a`, { waitUntil: 'domcontentloaded' });
  await route('s1a');
  assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
  assert.equal(await page.locator('[data-action="next"]').getAttribute('aria-describedby'),'hint');
  await page.waitForFunction(() => document.querySelector('#globe-mode')?.textContent !== '준비 중');
  for (const id of ['asia', 'pacific', 'africa']) await click('site', id);
  await click('atmosphere');
  assert.equal(await page.locator('[data-action="next"]').isEnabled(),true);
  assert.match(await page.locator('#hint').innerText(),/관찰 완료/);
  assert.equal((await saved()).drafts[1].samples.length,3);
  report.guidance.threeGlobeSamples=true;
  await click('next');
  await route('s1b');
  for (const id of ['asia', 'pacific', 'africa']) {
    await page.locator(`[data-sample="${id}"]`).click();
    await page.locator(`[data-sample-bin="${sites.find(site => site.id === id).type}"]`).click();
  }
  assert.equal(await page.locator('[data-action="complete"]').isDisabled(),true);
  await choose('conclusion', 'sample');
  const explanationLabel=await page.locator('[data-action="complete"]').innerText();
  assert.equal(await page.locator('[data-action="complete"]').isEnabled(),true);
  await click('complete');
  await route('s1b');
  await page.waitForTimeout(50);
  assert.match(await page.locator('#hint').innerText(),/표본|면적/,'confirmation feedback must survive the activity guidance microtask');
  await choose('conclusion', 'global');
  assert.equal(await page.locator('[data-action="complete"]').innerText(),explanationLabel,'button text must not disclose correctness');
  report.guidance.wrongExplanationReview=true;
  await click('complete');
  await extensions(1);

  await slider('sea', 40);
  await slider('heatSea', 1);
  await choose('prediction', 'same');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await route('s2a');
  assert.equal((await saved()).drafts[2].prediction, 'same');
  assert.equal(await page.locator('[data-field="sea"]').inputValue(), '40');
  await click('next');
  await route('s2b');
  await click('experiment-view', 'before');
  await click('heat');
  await page.waitForFunction(() => document.querySelector('.beaker.evaporated'));
  await click('experiment-view', 'after');
  await choose('residue', 'sea');
  await choose('reason', 'dissolved');
  await click('complete');
  await extensions(2);

  for (const terrain of terrains) await click('target', terrain.id);
  await click('next');
  await route('s3b');
  for (const terrain of terrains) {
    await click('pin', terrain.id);
    await page.locator(`[data-field="features.${terrain.id}"]`).selectOption(terrain.feature);
  }
  await choose('compare', 'through');
  await click('complete');
  await extensions(3);

  await slider('time', 0);
  await click('tide-save', 'a');
  await slider('time', 3);
  await click('tide-save', 'b');
  await click('next');
  await route('s4b');
  await click('marker', 'pole');
  await click('marker', 'rock');
  await choose('direction', 'up');
  await choose('concept', 'in');
  await click('complete');
  await extensions(4);

  for (const creature of creatures) {
    await click('creature', creature.id);
    await page.locator(`[data-action="observe-feature"][data-creature="${creature.id}"][data-value="${creature.feature}"]`).click();
  }
  await click('next');
  await route('s5b');
  await choose('value', 'habitat');
  await choose('action', 'observe');
  await click('complete');
  await extensions(5);
  await shot('report');
  await click('go', 'link');
  await route('link');
  assert.equal(await page.locator('[data-action="check-link"]').isDisabled(),true);
  assert.match(await page.locator('#hint').innerText(),/기록을 골라/);
  for (const [index, item] of finalCases.entries()) {
    await click('case', index);
    await click('link-stage', item.stage);
    assert.equal(await page.locator('[data-action="check-link"]').isDisabled(),true);
    await choose('linkReason', item.answer);
    assert.equal(await page.locator('[data-action="check-link"]').isEnabled(),true);
    await click('check-link', index);
    assert.equal(await page.locator('[data-action="check-link"]').isDisabled(),true);
    assert.match(await page.locator('.link-actions .next-target').innerText(),/상황|이야기/);
  }
  await click('case',0);
  assert.equal(await page.locator('[data-action="link-stage"].selected').getAttribute('data-value'),String(finalCases[0].stage));
  assert.equal(await page.locator('[data-field="linkReason"].selected').getAttribute('data-value'),String(finalCases[0].answer));
  assert.equal(await page.locator('[data-action="check-link"]').isDisabled(),true);
  const savedLinks=structuredClone((await saved()).links);
  const alternative=finalCases[0].reasons.findIndex((_,index)=>index!==finalCases[0].answer);
  await choose('linkReason',alternative);
  assert.equal(await page.locator('[data-action="check-link"]').isEnabled(),true);
  await click('check-link',0);
  assert.deepEqual((await saved()).links,savedLinks,'reviewing a changed answer preserves earned evidence');
  await choose('linkReason',finalCases[0].answer);
  assert.equal(await page.locator('[data-action="check-link"]').isDisabled(),true);
  report.guidance.finalEvidenceSteps=true;
  await click('go', 'ending');
  await route('ending');
  await click('go', 'certificate');
  await route('certificate');
  const completed = await saved();
  assert.equal(completed.completed.length, 5);
  assert.equal(Object.keys(completed.links).length, 5);
  assert.equal(report.journey.length, 40);
  assert.equal(completed.drafts[2].firstPrediction, 'same');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await route('certificate');
  assert.equal(await page.locator('[data-action="print"]').isEnabled(), true);
  await shot('certificate');
  const pdf = await page.pdf({ path: path.join(out, 'certificate.pdf'), preferCSSPageSize: true, printBackground: true });
  report.printPages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  report.printBytes = pdf.length;
  assert.equal(report.printPages, 1, 'certificate prints on one sheet');
  await writeFile(path.join(out, 'completed-state.json'), JSON.stringify(completed, null, 2));

  await click('settings');
  await page.keyboard.press('Escape');
  await page.locator('.settings-panel').waitFor({ state: 'detached' });
  assert.equal(await page.locator('[data-action="settings"]').evaluate(el => el === document.activeElement), true);
  await click('settings');
  await page.getByText('교사용 가이드', { exact: true }).click();
  await page.getByText('교사용 도구', { exact: true }).click();
  await click('toggle-unlock');
  await click('reset-ask');
  assert.equal(await page.locator('[data-action="reset-cancel"]').evaluate(el => el === document.activeElement), true);
  await click('reset-cancel');
  await click('close-settings');
  assert.deepEqual((await saved()).evidence, completed.evidence);
  report.safety = { completeJourney: true, reload: true, inMissionReload: true, predictionPreserved: true, teacherRecordIsolation: true, resetCancel: true, escapeFocusReturn: true };
  report.requestOrigins = [...new Set(report.requests.map(url => new URL(url).origin))];
  delete report.requests;
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify({ tasks: report.journey.length, printPages: report.printPages, safety: report.safety, errors: report.errors }));
} catch (error) {
  report.failure = error.stack;
  for (const context of browser.contexts()) for (const page of context.pages()) {
    await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await writeFile(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
