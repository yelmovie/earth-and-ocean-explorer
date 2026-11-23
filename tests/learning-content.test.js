import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {freshState, normalize} from '../src/state.js';
import {learning, recordDetail, report, certificate, link, evidenceSummary} from '../src/screens.js';
import {chapters, terrains} from '../src/data.js';

const source = file => new URL(`../${file}`, import.meta.url);
test('all twenty learning pages expose chapter concepts and a plain-language recall', () => {
  const state = freshState();
  for (const chapter of chapters) for (const step of 'abcd') {
    state.route = `s${chapter.id}${step}`;
    const html = learning(state, chapter.id, step);
    for (const term of chapter.keyConcepts) assert.ok(html.includes(`<mark>${term}</mark>`));
    assert.ok(!html.includes(chapter.conceptSummary), 'the hint leaves the conclusion for the learner');
    state.completed.push(chapter.id);
    assert.ok(learning(state, chapter.id, step).includes(chapter.conceptSummary));
    state.completed.pop();
  }
});
test('new coast albums use individual observations while old pins keep their original image', () => {
  for (const photoVersion of [1, 2]) {
    const state = freshState();
    Object.assign(state.drafts[3], {
      photoVersion, photos: terrains.map(t => t.id),
      pins: Object.fromEntries(terrains.map(t => [t.id, {x:35,y:62}])),
      features: Object.fromEntries(terrains.map(t => [t.id, t.feature])), compare:'through',
    });
    state.evidence[3] = {data:structuredClone(state.drafts[3]), research:structuredClone(state.research[3])};
    for (const html of [learning(state,3,'b'), recordDetail(state,3), report(state)]) {
      assert.equal(html.includes('illustrations/coast-cave.webp'),photoVersion===2);
      if(photoVersion===1) assert.ok(html.includes('coast.webp'));
    }
    assert.match(learning(state,3,'b'), /left:35%;top:62%/);
  }
  const legacy = freshState();delete legacy.drafts[3].photoVersion;
  assert.equal(normalize(legacy).drafts[3].photoVersion,1);
});
test('the conservation message uses only the creatures in saved observation evidence', () => {
  const state=freshState();
  assert.match(certificate(state),/갯벌 생물을 관찰하면/);
  state.evidence[5]={data:{found:['crab']}};
  assert.match(certificate(state),/게의 특징을 관찰함/);
  assert.doesNotMatch(certificate(state),/짱뚱어의 특징을 관찰/);
  assert.ok(certificate(state).includes('생물의 구멍과 갈대를 건드리지 않고, 쓰레기는 되가져감.'));
});
test('the last final case offers a route to the first remaining situation', () => {
  const state=freshState();state.links={0:{},2:{},3:{},4:{}};
  const html=link(state,{caseIndex:4});
  assert.match(html,/data-action="case" data-value="1"[^>]*>남은 상황 풀기/);
});
test('legacy tide summaries describe the observed heights without naming a turning interval', () => {
  const state=freshState();
  state.evidence[4]={data:{a:0,b:4,concept:'in'}};
  assert.match(evidenceSummary(state,4),/두 시각의 물 높이/);
  assert.doesNotMatch(evidenceSummary(state,4),/밀물의 변화/);
  state.evidence[4].data.b=3;
  assert.match(evidenceSummary(state,4),/밀물의 변화/);
});
test('six generated observations match the published manifest and credit copies', () => {
  const manifest=JSON.parse(readFileSync(source('public/assets/illustrations/manifest.json')));
  for (const name of ['coast-cave','coast-arch','coast-cliff','coast-sand','residue-salt','residue-clear']) {
    const record=manifest[name];const bytes=readFileSync(source(`public/assets/${record.file}`));
    assert.equal(record.bytes,bytes.length);
    assert.equal(record.sha256,createHash('sha256').update(bytes).digest('hex'));
    assert.deepEqual([record.width,record.height],name.startsWith('coast')?[960,720]:[640,640]);
    assert.equal(record.alphaRange[0],name.startsWith('coast')?255:0);
    assert.ok(record.alphaRange[1]>=254);
  }
  assert.equal(readFileSync(source('assets/CREDITS.md'),'utf8'),readFileSync(source('public/assets/CREDITS.md'),'utf8'));
});


test('only misclassified samples are marked after review, without clearing correct choices',()=>{
 const s=freshState();Object.assign(s.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,classifications:{asia:'바다',pacific:'바다',africa:'육지'},conclusion:'global'});
 const html=learning(s,1,'b',{sampleReview:true});
 assert.match(html,/data-sample="asia"[^>]*class="sample-token recheck"/);
 assert.equal((html.match(/sample-token recheck/g)||[]).length,1);
 assert.match(html,/어떤 부분을 보고 골랐나요/);
 assert.equal(s.drafts[1].classifications.africa,'육지');
});

test('a viewed coast photo with the wrong feature is not counted as correctly classified',()=>{
 const s=freshState();Object.assign(s.drafts[3],{photos:terrains.map(t=>t.id),pins:{sand:{x:40,y:60}},features:{sand:terrains.find(t=>t.id==='cliff').feature}});
 const html=learning(s,3,'b');
 assert.match(html,/본 사진 4 \/ 4 · 정확히 분류 0 \/ 4/);
 assert.doesNotMatch(html,/photo-card [^"]*is-done/);
 assert.match(html,/모래사장 사진의 특징은/);
 assert.match(html,/class="chip-redo">다시 고르기/);
});
