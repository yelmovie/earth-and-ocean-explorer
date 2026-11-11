import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { freshState, completeStage, linkEvidence, normalize, allLinked } from '../src/state.js';
import { sites, terrains, creatures, finalCases } from '../src/data.js';
import { challenges } from '../src/challenge-data.js';
import { certificate, link } from '../src/screens.js';

function completedState() {
  const state=freshState();
  Object.assign(state.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,conclusion:'global'});
  state.drafts[1].classifications=Object.fromEntries(state.drafts[1].samples.map(id=>[id,sites.find(site=>site.id===id).type]));
  Object.assign(state.drafts[2],{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'same',prepared:true,heated:true,seenBefore:true,seenAfter:true,residue:'sea',reason:'dissolved'});
  Object.assign(state.drafts[3],{photos:terrains.map(terrain=>terrain.id),pins:Object.fromEntries(terrains.map(terrain=>[terrain.id,{x:50,y:50}])),features:Object.fromEntries(terrains.map(terrain=>[terrain.id,terrain.feature])),compare:'through'});
  Object.assign(state.drafts[4],{a:0,b:3,markers:['pole','rock'],direction:'up',concept:'in'});
  Object.assign(state.drafts[5],{found:creatures.map(creature=>creature.id),features:Object.fromEntries(creatures.map(creature=>[creature.id,creature.feature])),value:'habitat',action:'observe'});
  for(let chapter=1;chapter<=5;chapter++){
    for(const task of challenges[chapter]){
      state.research[chapter].answers[task.id]=['choice','multi','order'].includes(task.type)?structuredClone(task.answer):Object.fromEntries(task.items.map(item=>[item.id,item.answer]));
      state.research[chapter].solved.push(task.id);
    }
    assert.equal(completeStage(state,chapter),true);
  }
  finalCases.forEach((item,index)=>linkEvidence(state,index,item.stage,item.answer));
  return state;
}

function legacyState(chapters=[1,2,3,4,5]) {
  const raw=completedState();
  delete raw.finalDraft;
  for(const chapter of chapters){
    raw.evidence[chapter].contentVersion=2;
    delete raw.evidence[chapter].research;
    delete raw.research[chapter];
  }
  return normalize(raw);
}

const mainSource=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const restoreSource=mainSource.slice(mainSource.indexOf('function restoreLinkDraft(){'),mainSource.indexOf('\nfunction syncLinkGuidance(){'));
function restoreDraft(state) {
  // main.js imports CSS and mounts the app. Run its actual restoration function
  // independently so this regression remains a Node test without a browser.
  runInNewContext(restoreSource+'\nrestoreLinkDraft();',{state});
}

test('certificates count archived extension records without inventing legacy completion',()=>{
  for(const [state,count] of [[completedState(),40],[legacyState(),0],[legacyState([1,3]),24]]){
    assert.equal(allLinked(state),true);
    const output=certificate(state);
    assert.match(output,/탐사 완료 인증서/);
    assert.ok(output.includes(`확장 활동 ${count}개`));
    assert.equal(Object.values(state.evidence).reduce((sum,evidence)=>sum+(evidence.research?.solved.length??0),0),count);
  }
});

test('an old completed link reentry restores its saved answer before rendering',()=>{
  const state=legacyState(),evidence=structuredClone(state.evidence),issuedAt=state.issuedAt;
  assert.deepEqual(state.finalDraft,{caseIndex:0,stage:null,reason:null});
  restoreDraft(state);
  assert.deepEqual(state.finalDraft,{caseIndex:0,...state.links[0]});
  const output=link(state,{caseIndex:0,linkStage:state.finalDraft.stage,linkReason:state.finalDraft.reason});
  assert.match(output,/data-action="link-stage"[^>]*aria-pressed="true"/);
  assert.match(output,/class="choice selected"/);
  assert.deepEqual(state.evidence,evidence);
  assert.equal(state.issuedAt,issuedAt);
  assert.match(mainSource,/if\(r==='link'\)restoreLinkDraft\(\);/,'normal render entry restores the draft');
});

test('partial or deliberately changed final choices survive reentry',()=>{
  for(const draft of [{caseIndex:0,stage:2,reason:null},{caseIndex:0,stage:null,reason:0},{caseIndex:0,stage:2,reason:0}]){
    const state=legacyState();
    state.finalDraft=structuredClone(draft);
    restoreDraft(state);
    assert.deepEqual(state.finalDraft,draft);
  }
  const fresh=freshState();
  restoreDraft(fresh);
  assert.deepEqual(fresh.finalDraft,{caseIndex:0,stage:null,reason:null});
});
