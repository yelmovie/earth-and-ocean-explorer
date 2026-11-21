import test from 'node:test';
import assert from 'node:assert/strict';
import { tideHeight } from '../src/data.js';
import { challenges, correctResponse, pageReady } from '../src/challenge-data.js';
import { challengeScreen, handleChallenge, judgeWalk } from '../src/challenges.js';
import { freshState, normalize } from '../src/state.js';
import { WALK_TASK, WALK_NOTE, SLOT_SECONDS, course, walkHeight, walkClock, mudY, waterY, spotCovered, warned, walkResponse, walkHint } from '../src/tide-walk-rules.js';

const task = challenges[4].find(item => item.id === WALK_TASK);
const spot = id => course.spots.find(item => item.id === id);

test('the walk only shows water heights the tide model already has', () => {
  for (let slot = 0; slot <= 3; slot++) assert.equal(walkHeight(slot), tideHeight(slot));
  for (let slots = 0; slots <= 3; slots += 0.05) {
    const low = tideHeight(Math.floor(Math.min(2.999, slots))), high = tideHeight(Math.floor(Math.min(2.999, slots)) + 1);
    assert.ok(walkHeight(slots) >= low && walkHeight(slots) <= high, `between model values at ${slots}`);
    assert.ok(walkHeight(slots + 0.05) >= walkHeight(slots), 'the water only rises during the walk');
  }
  assert.equal(walkHeight(-1), 28);
  assert.equal(walkHeight(9), 83);
  assert.equal(walkHeight(NaN), 28);
});

test('the clock follows the two-hour model slots without a countdown', () => {
  assert.equal(walkClock(0), '06:00');
  assert.equal(walkClock(0.5), '07:00');
  assert.equal(walkClock(1), '08:00');
  assert.equal(walkClock(2), '10:00');
  assert.equal(walkClock(3), '12:00');
  assert.equal(walkClock(7), '12:00');
  assert.match(WALK_NOTE, /한 칸은 2시간인 학습용 관측 모형/);
  assert.ok(SLOT_SECONDS >= 20, 'one slot leaves time to walk and look');
});

test('rising water covers the far mudflat first and never the walkway', () => {
  for (const item of course.spots) assert.equal(spotCovered(item, 0), false, `${item.id} is visible at the lowest water`);
  const coveredAt = item => { for (let slots = 0; slots <= 3; slots += 0.01) if (spotCovered(item, slots)) return slots; return Infinity; };
  assert.ok(coveredAt(spot('skipper')) < coveredAt(spot('crab')));
  assert.equal(coveredAt(spot('reed')), Infinity, 'tall reeds stay visible above the water');
  assert.ok(waterY(tideHeight(3)) - mudY(spot('reed').x) < 1, 'the water around the reeds stays shallow');
  assert.ok(coveredAt(spot('skipper')) > 1, 'the farthest spot stays visible past 08:00');
  assert.ok(waterY(tideHeight(3)) < 0, 'the highest water stays under the walkway');
  assert.ok(waterY(tideHeight(0)) <= mudY(course.end.x1), 'the whole walk is exposed at the lowest water');
  assert.equal(warned(1.99), false);
  assert.equal(warned(2), true);
});

test('walk actions map to the existing options and the existing judgment decides', () => {
  assert.deepEqual(task.answer, ['0', '2']);
  assert.equal(correctResponse(task, walkResponse({ checkedBoard: true, calledBack: false })), true);
  assert.equal(correctResponse(task, walkResponse({ checkedBoard: false, calledBack: false })), false);
  assert.equal(correctResponse(task, walkResponse({ checkedBoard: true, calledBack: true })), false);
  assert.equal(correctResponse(task, walkResponse({ checkedBoard: false, calledBack: true })), false);
  for (const id of walkResponse({ checkedBoard: false, calledBack: true })) assert.ok(task.options.some(option => option.id === id));
  assert.equal(walkHint({ checkedBoard: true, calledBack: false }), '');
  assert.match(walkHint({ checkedBoard: false, calledBack: false }), /데크/);
  assert.match(walkHint({ checkedBoard: true, calledBack: true }), /경고 눈금/);
});

function session() {
  const state = freshState(), calls = { saved: 0, rendered: 0, sounds: [], opened: [] };
  state.route = 's4d'; state.research[4].d = 1;
  const ctx = { state, save: () => calls.saved++, render: () => calls.rendered++, feedback() {}, navigate() {}, finishChapter() {}, sound: name => calls.sounds.push(name), openWalk: options => calls.opened.push(options) };
  return { state, calls, ctx };
}

test('a safe walk is recorded in the same fields as the choice task', () => {
  const run = session();
  const result = judgeWalk(run.ctx, { checkedBoard: true, calledBack: false, slots: 1.2, seen: ['reed', 'crab'] });
  assert.equal(result.correct, true);
  assert.equal(result.why, task.why);
  assert.deepEqual(run.state.research[4].answers[WALK_TASK], ['0', '2']);
  assert.ok(run.state.research[4].solved.includes(WALK_TASK));
  assert.equal(run.calls.saved, 1);
  assert.equal(run.calls.rendered, 1);
  // 걷기는 새 저장 칸을 만들지 않는다. firstTry·missed는 2026-11-21 사용자 결정(첫 시도 정답 따로 표시)으로 모든 문제에 생긴 칸이다.
  assert.deepEqual(Object.keys(run.state.research[4]).sort(), ['answers', 'c', 'd', 'firstTry', 'missed', 'solved'], 'no new save field');
  assert.deepEqual(run.state.research[4].firstTry, [WALK_TASK], 'a first safe walk counts as first try');
  const restored = normalize(JSON.parse(JSON.stringify(run.state)));
  assert.ok(restored.research[4].solved.includes(WALK_TASK), 'the record survives a save round trip');
  assert.deepEqual(restored.research[4].answers[WALK_TASK], ['0', '2']);
});

test('an unsafe walk is not solved, counts a revision and offers the choice task after three tries', () => {
  const run = session();
  let result = judgeWalk(run.ctx, { checkedBoard: false, calledBack: true });
  assert.equal(result.correct, false);
  assert.ok(result.hint.length > 0);
  assert.equal(result.offerFlat, false);
  assert.deepEqual(run.state.research[4].answers[WALK_TASK], ['1', '3']);
  assert.equal(run.state.research[4].solved.includes(WALK_TASK), false);
  assert.equal(run.state.revised, 1);
  judgeWalk(run.ctx, { checkedBoard: true, calledBack: true });
  result = judgeWalk(run.ctx, { checkedBoard: false, calledBack: false });
  assert.equal(result.offerFlat, true);
  assert.equal(pageReady(run.state, 4, 'd'), false);
  result = judgeWalk(run.ctx, { checkedBoard: true, calledBack: false });
  assert.equal(result.correct, true);
  assert.equal(result.offerFlat, false);
});

test('the walk result is ignored away from the tide safety task', () => {
  const run = session();
  run.state.research[4].d = 0;
  assert.equal(judgeWalk(run.ctx, { checkedBoard: true, calledBack: false }), null);
  run.state.route = 's5d';
  assert.equal(judgeWalk(run.ctx, { checkedBoard: true, calledBack: false }), null);
  assert.equal(run.calls.saved, 0);
});

test('without WebGL the task keeps its choice screen', () => {
  const run = session();
  const screen = challengeScreen(run.state, 4, 'd');
  assert.match(screen, /data-action="challenge-answer"/);
  assert.doesNotMatch(screen, /challenge-walk-start/);
});

test('with WebGL the walk opens first and the choice screen stays one tap away', t => {
  const previous = globalThis.document;
  globalThis.document = { baseURI: 'http://localhost/', createElement: () => ({ getContext: () => ({ getExtension: () => null }) }), querySelector: () => null };
  t.after(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });
  const run = session();
  const send = (action, value) => handleChallenge({ ...run.ctx, action, value });
  let screen = challengeScreen(run.state, 4, 'd');
  assert.match(screen, /data-action="challenge-walk-plan"/);
  assert.match(screen, /data-action="challenge-walk-start"[^>]*disabled/, 'a prediction comes first');
  assert.match(screen, /기존 방식으로 하기/);
  assert.doesNotMatch(screen, /data-action="challenge-answer"/, 'the answer options are not shown before the walk');
  send('challenge-walk-start');
  assert.equal(run.calls.opened.length, 0);
  send('challenge-walk-plan', '1');
  screen = challengeScreen(run.state, 4, 'd');
  assert.doesNotMatch(screen, /data-action="challenge-walk-start"[^>]*disabled/);
  send('challenge-walk-start');
  assert.deepEqual(run.calls.opened, [{ plan: '1' }]);
  // 설정의 2D 대체는 걷기도 기존 화면으로 돌린다.
  run.state.settings.flatGlobe = true;
  assert.match(challengeScreen(run.state, 4, 'd'), /data-action="challenge-answer"/);
  run.state.settings.flatGlobe = false;
  send('challenge-walk-flat');
  screen = challengeScreen(run.state, 4, 'd');
  assert.match(screen, /data-action="challenge-answer"/);
  assert.match(screen, /data-action="challenge-walk-3d"/);
  send('challenge-walk-3d');
  assert.match(challengeScreen(run.state, 4, 'd'), /data-action="challenge-walk-start"/);
  // 다른 문제에는 걷기가 붙지 않는다.
  run.state.research[4].d = 0;
  assert.doesNotMatch(challengeScreen(run.state, 4, 'd'), /challenge-walk/);
  run.state.research[4].d = 1;
  judgeWalk(run.ctx, { checkedBoard: true, calledBack: false });
  screen = challengeScreen(run.state, 4, 'd');
  assert.match(screen, /challenge-why-card/, 'a solved walk shows the key idea on the task screen');
  assert.match(screen, /탐사길 다시 걷기/);
});
