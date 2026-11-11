import test from 'node:test';
import assert from 'node:assert/strict';
import { activityReady, stageGuide } from '../src/activity-flow.js';
import { freshState } from '../src/state.js';
import { sites, terrains, creatures } from '../src/data.js';

function observed(n) {
  const state = freshState();
  state.route = `s${n}a`;
  const draft = state.drafts[n];
  if (n === 1) Object.assign(draft, { samples: ['asia', 'pacific', 'africa'], atmosphere: true });
  if (n === 2) Object.assign(draft, { fresh: 40, sea: 40, heatFresh: 1, heatSea: 1, prediction: 'same', prepared: true });
  if (n === 3) draft.photos = terrains.map(terrain => terrain.id);
  if (n === 4) Object.assign(draft, { a: 0, b: 3 });
  if (n === 5) {
    draft.found = creatures.map(creature => creature.id);
    draft.features = Object.fromEntries(creatures.map(creature => [creature.id, creature.feature]));
  }
  return state;
}

function explained(n) {
  const state = observed(n);
  state.route = `s${n}b`;
  const draft = state.drafts[n];
  if (n === 1) {
    draft.classifications = Object.fromEntries(draft.samples.map(id => [id, sites.find(site => site.id === id).type]));
    draft.conclusion = 'global';
  }
  if (n === 2) Object.assign(draft, { heated: true, seenBefore: true, seenAfter: true, residue: 'sea', reason: 'dissolved' });
  if (n === 3) {
    draft.pins = Object.fromEntries(terrains.map(terrain => [terrain.id, { x: 50, y: 50 }]));
    draft.features = Object.fromEntries(terrains.map(terrain => [terrain.id, terrain.feature]));
    draft.compare = 'through';
  }
  if (n === 4) Object.assign(draft, { markers: ['pole', 'rock'], direction: 'up', concept: 'in' });
  if (n === 5) Object.assign(draft, { value: 'habitat', action: 'observe' });
  return state;
}

test('each unstarted observation identifies an action before allowing next', () => {
  for (let n = 1; n <= 5; n++) {
    const state = freshState();
    state.route = `s${n}a`;
    assert.equal(activityReady(state), false);
    assert.notEqual(stageGuide(state)[1], '.mission-footer > .primary');
  }
});

test('three varied globe observations plus atmosphere unlock comparison without requiring six', () => {
  const state = observed(1);
  assert.equal(activityReady(state), true);
  assert.equal(stageGuide(state)[1], '.mission-footer > .primary');
  state.drafts[1].atmosphere = false;
  assert.equal(activityReady(state), false);
  assert.equal(stageGuide(state)[1], '[data-action="atmosphere"]');
  state.drafts[1].atmosphere = true;
  state.drafts[1].samples = ['asia', 'africa', 'australia'];
  assert.equal(activityReady(state), false);
  assert.match(stageGuide(state)[0], /땅과 물/);
});

test('lab readiness accepts both predictions and never writes preparation or an answer', () => {
  const state = observed(2);
  state.drafts[2].prepared = false;
  const before = JSON.stringify(state);
  assert.equal(activityReady(state), true);
  assert.equal(JSON.stringify(state), before);
  state.drafts[2].prediction = 'different';
  assert.equal(activityReady(state), true);
  state.drafts[2].prediction = '';
  assert.equal(activityReady(state), false);
  assert.match(stageGuide(state)[0], /직접 예상/);
  state.drafts[2].prediction = 'same';
  state.drafts[2].sea = 60;
  assert.equal(activityReady(state), false);
});

test('all five observation and explanation gates expose their completed action', () => {
  for (let n = 1; n <= 5; n++) {
    assert.equal(activityReady(observed(n)), true, `chapter ${n} observation`);
    const state = explained(n), before = JSON.stringify(state);
    assert.equal(activityReady(state), true, `chapter ${n} explanation`);
    assert.match(stageGuide(state)[0], /설명 확인/);
    assert.equal(JSON.stringify(state), before, 'guidance is derived and does not save progress');
  }
});

test('wrong explanations remain submittable without a different label or answer hint', () => {
  const wrong = { 1: ['conclusion', 'sample'], 2: ['reason', 'created'], 3: ['compare', 'same'], 4: ['concept', 'out'], 5: ['action', 'collect'] };
  for (let n = 1; n <= 5; n++) {
    const state = explained(n), guide = stageGuide(state);
    const [field, value] = wrong[n];
    state.drafts[n][field] = value;
    assert.equal(activityReady(state), true, `wrong answer in chapter ${n} can be checked`);
    assert.deepEqual(stageGuide(state), guide, 'correctness is not disclosed before the learner confirms');
  }
});

test('missing explanation input keeps the next action and requirement specific', () => {
  const missing = { 1: 'conclusion', 2: 'reason', 3: 'compare', 4: 'concept', 5: 'action' };
  for (let n = 1; n <= 5; n++) {
    const state = explained(n);
    state.drafts[n][missing[n]] = '';
    assert.equal(activityReady(state), false);
    assert.equal(stageGuide(state)[1], `[data-field="${missing[n]}"]`);
  }
  const lab = explained(2);
  lab.drafts[2].seenBefore = false;
  assert.equal(activityReady(lab), false);
  assert.equal(stageGuide(lab)[1], '[data-action="experiment-view"][data-value="before"]');
});

test('practice explanations return to observation and unrelated routes stay outside the flow', () => {
  const state = freshState();
  state.route = 's5b';
  assert.equal(activityReady(state), false);
  assert.equal(stageGuide(state)[1], '[data-action="go"][data-value="s5a"]');
  for (const route of ['home', 'link', 's1c', 's1d']) {
    state.route = route;
    assert.equal(activityReady(state), false);
  }
});

test('an older unfinished tide draft that crosses a turn returns to observation', () => {
  const state = explained(4);
  state.drafts[4].b = 4;
  assert.equal(activityReady(state), false);
  assert.equal(stageGuide(state)[1], '[data-action="go"][data-value="s4a"]');
  assert.match(stageGuide(state)[0], /한 방향/);
  state.route = 's4a';
  assert.equal(activityReady(state), false);
});
