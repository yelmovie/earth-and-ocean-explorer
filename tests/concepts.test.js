import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { CONCEPT_SECONDS, conceptCues, conceptTerms, conceptSceneLabels } from '../src/concept-data.js';
import { films, scenes } from '../films/earth-sea-concepts/films.mjs';
import { SECONDS } from '../films/earth-sea-concepts/kit.mjs';

const dir = new URL('../public/assets/concepts/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));

test('app captions, scene buttons and the rendered clips share one timeline', () => {
  assert.equal(SECONDS, CONCEPT_SECONDS);
  assert.equal(manifest.duration, CONCEPT_SECONDS);
  for (let n = 1; n <= 5; n++) {
    const starts = conceptCues[n].map(c => c[0]);
    assert.deepEqual(starts, [0, 3.5, 8, 11.5], `chapter ${n} scene boundaries`);
    assert.deepEqual(scenes[n], starts, `film ${n} follows the caption times`);
    assert.equal(starts.length, conceptSceneLabels.length);
    assert.ok(starts.every((t, i) => i === 0 || t > starts[i - 1]) && starts.at(-1) < CONCEPT_SECONDS);
    const clip = manifest.clips.find(c => c.id === n);
    assert.equal(clip?.seconds, CONCEPT_SECONDS, `manifest chapter ${n}`);
    for (const ext of ['mp4', 'webm', 'webp']) {
      const bytes = statSync(new URL(`chapter-${n}.${ext}`, dir)).size;
      assert.equal(clip.files.find(f => f.name === `chapter-${n}.${ext}`)?.bytes, bytes, `${ext} recorded`);
      if (ext !== 'webp') assert.ok(bytes <= 2.5 * 1024 * 1024, `chapter-${n}.${ext} ≤ 2.5MB`);
    }
  }
});

test('each clip keeps one idea: key terms in captions, the in-film line never repeats a caption', () => {
  for (let n = 1; n <= 5; n++) {
    const captions = conceptCues[n].map(c => c[1]).join(' ');
    for (const term of conceptTerms[n]) assert.ok(captions.includes(term), `chapter ${n} caption names ${term}`);
    const film = films[n];
    assert.ok(film.end.includes(film.accent), `chapter ${n} accent word is in the conclusion`);
    assert.ok(!conceptCues[n].some(c => c[1] === film.end || c[1] === film.ask), `chapter ${n} film text is not a caption copy`);
    assert.ok(film.ask.endsWith('?'), `chapter ${n} opens on a question`);
  }
});

test('the tide clip states it is a model, not real tide times', () => {
  assert.match(films[4].overlay, /관측 모형/);
  assert.match(conceptCues[4].at(-1)[1], /모형/);
});

test('the water clip compares remaining substances within the shown experiment', () => {
  const observation = conceptCues[2].find(([time]) => time === 8)[1];
  assert.match(observation, /이번 실험/);
  assert.match(observation, /흰 물질.*더 뚜렷하게/);
  assert.doesNotMatch(observation, /육지의 물은 거의 남지/);
  const filmLabels = films[2].tags.map(tag => tag.html).join(' ');
  assert.match(filmLabels, /이번 표본은 적게 남음/);
  assert.doesNotMatch(filmLabels, /거의 남지 않음/);
});
