import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, correctResponse, normalizeResearch, pageReady, researchReady } from '../src/challenge-data.js';
import { freshState, baseStageValid, completeStage, canAccess, normalize } from '../src/state.js';
const answer=t=>['choice','multi','order'].includes(t.type)?structuredClone(t.answer):Object.fromEntries(t.items.map(i=>[i.id,i.answer]));
test('five stages each have eight distinct, substantive activities',()=>{const ids=[];for(const tasks of Object.values(challenges)){assert.equal(tasks.length,8);assert.ok(new Set(tasks.map(t=>t.type)).size>=3);for(const t of tasks){assert.ok(t.prompt&&t.clue);assert.ok(correctResponse(t,answer(t)));assert.ok(!correctResponse(t,undefined));assert.ok(!correctResponse(t,{}));ids.push(t.id);}}assert.equal(new Set(ids).size,40);});
test('old observation alone never grants the new badge or the next stage',()=>{const s=freshState();Object.assign(s.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,classifications:{asia:'육지',pacific:'바다',africa:'육지'},conclusion:'global'});assert.ok(baseStageValid(s,1));assert.ok(canAccess(s,'s1c'));assert.ok(!canAccess(s,'s1d'));assert.ok(!completeStage(s,1));for(const t of challenges[1].slice(0,4)){s.research[1].answers[t.id]=answer(t);s.research[1].solved.push(t.id);}assert.ok(pageReady(s,1,'c'));assert.ok(canAccess(s,'s1d'));assert.ok(!researchReady(s,1));assert.ok(!completeStage(s,1));for(const t of challenges[1].slice(4)){s.research[1].answers[t.id]=answer(t);s.research[1].solved.push(t.id);}assert.ok(completeStage(s,1));assert.ok(canAccess(s,'s2a'));assert.equal(s.evidence[1].research.solved.length,8);const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded.evidence[1],s.evidence[1]);});
test('forged solved IDs and partial assignments are discarded on reload',()=>{const t=challenges[1][0];const raw={1:{answers:{[t.id]:{mountain:'land'},'unknown':'x'},solved:[t.id,'unknown'],c:900,d:-1}};const out=normalizeResearch(raw);assert.deepEqual(out[1].solved,[]);assert.equal(out[1].c,3);assert.equal(out[1].d,0);assert.ok(!Object.hasOwn(out[1].answers,'unknown'));assert.doesNotThrow(()=>normalizeResearch({1:{solved:{},answers:null}}));});
test('sort rejects a wrong bucket, multi rejects missing or extra claims and order rejects reversed evidence',()=>{for(const tasks of Object.values(challenges))for(const t of tasks){const a=answer(t);if(t.type==='choice')assert.ok(!correctResponse(t,'invalid'));if(t.type==='multi'){assert.ok(!correctResponse(t,a.slice(1)));assert.ok(!correctResponse(t,[...a,'99']));}if(t.type==='order')assert.ok(!correctResponse(t,[...a].reverse()));if(['sort','match'].includes(t.type)){a[t.items[0].id]='wrong';assert.ok(!correctResponse(t,a));}}});
test('genuine v2 evidence is retained without inventing new research or stars',()=>{const s=freshState();Object.assign(s.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,classifications:{asia:'육지',pacific:'바다',africa:'육지'},conclusion:'global'});delete s.contentVersion;delete s.research;s.completed=[1];s.evidence={1:{title:'기존 기록',data:structuredClone(s.drafts[1])}};const restored=normalize(s);assert.deepEqual(restored.completed,[1]);assert.equal(restored.research[1].solved.length,0);assert.equal(restored.evidence[1].contentVersion,2);});
test('every chapter names a real 2022 curriculum standard and a learning objective',async()=>{
  const { chapters }=await import('../src/data.js');const { readFileSync }=await import('node:fs');
  // settingsContent.js imports package.json, so read the teacher-facing list as text.
  const listed=[...readFileSync(new URL('../src/settingsContent.js',import.meta.url),'utf8').matchAll(/'\[(4과06-0\d)\] /g)].map(m=>m[1]);
  for(const c of chapters){assert.match(c.standard,/^4과06-0[1-3]$/);assert.ok(listed.includes(c.standard),c.standard);assert.ok(c.objective.length>=15,c.title);}
  assert.deepEqual([...new Set(chapters.map(c=>c.standard))],['4과06-01','4과06-02','4과06-03']);
});
test('every chapter records its curriculum source and pending teacher review honestly', async () => {
  const { chapters } = await import('../src/data.js');
  for (const chapter of chapters) {
    assert.equal(typeof chapter.needsReview, 'boolean', chapter.title);
    assert.ok(chapter.reviewer === null || typeof chapter.reviewer === 'string' && chapter.reviewer.trim(), chapter.title);
    if (chapter.reviewer === null) assert.equal(chapter.needsReview, true, chapter.title);
    assert.ok(Array.isArray(chapter.sources) && chapter.sources.length > 0, chapter.title);
    for (const source of chapter.sources) {
      assert.ok(typeof source.title === 'string' && source.title.trim(), chapter.title);
      assert.equal(new URL(source.url).protocol, 'https:', chapter.title);
      assert.ok(typeof source.section === 'string' && source.section.trim(), chapter.title);
    }
  }
});
test('chapter concepts are short, curriculum-linked and supported by science sources', async () => {
  const { chapters } = await import('../src/data.js');
  for (const chapter of chapters) {
    assert.ok(chapter.keyConcepts.length >= 2 && chapter.keyConcepts.length <= 3, chapter.title);
    assert.equal(new Set(chapter.keyConcepts).size, chapter.keyConcepts.length, chapter.title);
    assert.ok(chapter.keyConcepts.every(term => term.trim() && term.length <= 16), chapter.title);
    assert.ok(chapter.conceptSummary.length <= 100, chapter.title);
    assert.match(chapter.conceptSummary, /요\.$/, chapter.title);
    assert.ok(chapter.sources.some(source => source.section.includes(chapter.standard)), chapter.title);
    assert.ok(chapter.sources.some(source => new URL(source.url).hostname !== 'www.goe.go.kr'), chapter.title);
  }
  assert.match(chapters[0].objective, /대기/);
  assert.match(chapters[1].conceptSummary, /수증기.*증발/);
  assert.match(chapters[1].steps[1], /증발.*남은 물질/);
  const conservation = chapters[4].conservation;
  assert.ok(conservation.claim && conservation.evidenceLabel && conservation.action && conservation.sharePrompt);
  assert.match(conservation.action, /구멍.*갈대.*쓰레기/);
  assert.match(conservation.sharePrompt, /관찰한 생물.*약속.*설명/);
});
test('content revisions preserve recorded character lines and final answer keys', async () => {
  const { chapters, finalCases } = await import('../src/data.js');
  const { VOICE_TEXT } = await import('../src/voice-ids.js');
  for (const chapter of chapters) {
    assert.equal(chapter.goal, VOICE_TEXT[`goal-${chapter.id}`], chapter.title);
    assert.equal(chapter.reward, VOICE_TEXT[`reward-${chapter.id}`], chapter.title);
  }
  assert.deepEqual(finalCases.map(item => item.answer), [1, 2, 0, 1, 2]);
  assert.match(finalCases[1].problem, /육지의 물과 바닷물/);
  const unknownWater = challenges[2].find(task => task.id === 'unknown-water');
  assert.match(unknownWater.prompt, /같은 양.*같은 조건.*모두 증발/);
  assert.match(unknownWater.options.find(option => option.id === unknownWater.answer).label, /수 있어요/);
  const tideMatch = challenges[4].find(task => task.id === 'tide-match');
  assert.match(tideMatch.prompt, /중간에 방향이 바뀌지 않은/);
  assert.match(tideMatch.clue, /중간 시각의 기록/);
});
test('a wrong complete answer points at what to recheck without revealing the answer',async()=>{
  const { mistakeHint }=await import('../src/challenge-data.js');
  for(const tasks of Object.values(challenges))for(const t of tasks){
    if(['sort','match'].includes(t.type)){
      const wrong=Object.fromEntries(t.items.map((x,i)=>[x.id,i===0?t.bins.find(b=>b.id!==x.answer).id:x.answer]));
      const h=mistakeHint(t,wrong);assert.deepEqual(h.wrong,[],t.id);assert.match(h.text,/칸의 기준과 비교/);
      for(const bin of t.bins)assert.ok(!h.text.includes(bin.label)||t.items[0].label.includes(bin.label),`${t.id} hint does not name the right bin`);
      assert.equal(mistakeHint(t,Object.fromEntries(t.items.map(x=>[x.id,x.answer]))),null);
    }
    if(t.type==='multi'){const bad=t.options.find(o=>!t.answer.includes(o.id)).id;const h=mistakeHint(t,[t.answer[0],bad]);assert.deepEqual(h.wrong,[]);assert.match(h.text,/관찰한 근거/);}
    if(t.type==='order'){const swapped=[...t.answer];[swapped[0],swapped[1]]=[swapped[1],swapped[0]];assert.match(mistakeHint(t,swapped).text,/두 카드 사이/);}
  }
});
