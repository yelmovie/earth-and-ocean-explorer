import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshState, recordPrediction, previewState, normalize, loadState, saveState, aReady, canAccess, stageValid, completeStage, linkEvidence, allLinked } from '../src/state.js';
import * as stateModule from '../src/state.js';
import { challenges } from '../src/challenge-data.js';
import { sites, terrains, creatures, routes, finalCases } from '../src/data.js';

function investigated(s,n){
  const d=s.drafts[n];
  if(n===1){d.samples=['asia','pacific','africa'];d.atmosphere=true;for(const id of d.samples)d.classifications[id]=sites.find(p=>p.id===id).type;d.conclusion='global';}
  if(n===2)Object.assign(d,{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'same',prepared:true,heated:true,seenBefore:true,seenAfter:true,residue:'sea',reason:'dissolved'});
  if(n===3){d.photos=terrains.map(t=>t.id);for(const t of terrains){d.pins[t.id]={x:50,y:50};d.features[t.id]=t.feature;}d.compare='through';}
  if(n===4)Object.assign(d,{a:0,b:3,markers:['pole','rock'],direction:'up',concept:'in'});
  if(n===5){d.found=creatures.map(c=>c.id);for(const c of creatures)d.features[c.id]=c.feature;d.value='habitat';d.action='observe';}
  for(const task of challenges[n]){s.research[n].answers[task.id]=['choice','multi','order'].includes(task.type)?structuredClone(task.answer):Object.fromEntries(task.items.map(i=>[i.id,i.answer]));s.research[n].solved.push(task.id);}
  return s;
}
test('新規 progress: only first observation open; unknown routes never open',()=>{const s=freshState();assert.ok(canAccess(s,'s1a'));assert.ok(!canAccess(s,'s1b'));assert.ok(!canAccess(s,'s2a'));assert.ok(!canAccess(s,'certificate'));assert.ok(!canAccess(s,'invalid'));});
test('admin one toggle opens every route without evidence or certificate',()=>{const s=freshState();s.settings.unlockAll=true;for(const r of routes)assert.ok(canAccess(s,r),r);for(let n=1;n<=5;n++)assert.equal(completeStage(s,n),false);assert.deepEqual(s.completed,[]);assert.deepEqual(s.evidence,{});assert.equal(linkEvidence(s,0,1,1),'practice');assert.equal(allLinked(s),false);assert.equal(s.issuedAt,null);s.settings.unlockAll=false;assert.ok(!canAccess(s,'report'));});
test('globe requires varied samples and atmosphere; local counts cannot substitute whole-earth data',()=>{const s=investigated(freshState(),1);s.drafts[1].samples=['asia','africa','australia'];assert.equal(aReady(s,1),false);s.drafts[1].samples=['asia','pacific','africa'];s.drafts[1].atmosphere=false;assert.equal(aReady(s,1),false);s.drafts[1].atmosphere=true;s.drafts[1].conclusion='sample';assert.equal(completeStage(s,1),false);s.drafts[1].conclusion='global';assert.ok(completeStage(s,1));});
test('water experiment enforces same conditions and actual observations',()=>{const s=investigated(freshState(),2);s.drafts[2].sea=60;assert.ok(!stageValid(s,2));s.drafts[2].sea=40;s.drafts[2].seenAfter=false;assert.ok(!stageValid(s,2));s.drafts[2].seenAfter=true;assert.ok(completeStage(s,2));assert.equal(s.evidence[2].data.prediction,'same');});
test('coast evidence requires all photos, feature pins and comparison',()=>{const s=investigated(freshState(),3);delete s.drafts[3].pins.arch;assert.ok(!stageValid(s,3));s.drafts[3].pins.arch={x:70,y:40};assert.ok(completeStage(s,3));s.drafts[3].pins.arch.x=30;assert.equal(s.evidence[3].data.pins.arch.x,70,'evidence snapshot must be independent');});
test('new coast records retain the current photo version and independent pins', () => {
  const state = investigated(freshState(),3);
  assert.equal(state.drafts[3].photoVersion,2);
  assert.ok(completeStage(state,3));
  assert.equal(state.evidence[3].data.photoVersion,2);
  const restored = normalize(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.drafts[3],state.drafts[3]);
  assert.deepEqual(restored.evidence[3],state.evidence[3]);
  restored.drafts[3].pins.arch.x = 70;
  assert.equal(restored.evidence[3].data.pins.arch.x,50);
});
test('unversioned coast drafts and archived evidence keep their original photo coordinates', () => {
  const state = freshState();
  for (let stage = 1; stage <= 5; stage++) {
    investigated(state,stage);
    completeStage(state,stage);
  }
  finalCases.forEach((item,index) => linkEvidence(state,index,item.stage,item.answer));
  state.drafts[3].pins.arch = {x:71,y:43};
  state.evidence[3].data.pins.arch = {x:62,y:51};
  delete state.drafts[3].photoVersion;
  delete state.evidence[3].data.photoVersion;
  const restored = normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.version,2);
  assert.equal(restored.drafts[3].photoVersion,1);
  assert.equal(restored.evidence[3].data.photoVersion,1);
  assert.deepEqual(restored.drafts[3].pins,state.drafts[3].pins);
  assert.deepEqual(restored.evidence[3].data.pins,state.evidence[3].data.pins);
  assert.deepEqual(restored.completed,state.completed);
  assert.deepEqual(restored.links,state.links);
  assert.equal(restored.issuedAt,state.issuedAt);
  assert.ok(completeStage(restored,3));
  assert.equal(restored.evidence[3].data.photoVersion,1);
});
test('coast version follows the stored photo record independently of other progress', () => {
  const raw = {version:2,drafts:{3:{photos:[],pins:{}}}};
  assert.equal(normalize(raw).drafts[3].photoVersion,1,'even an old empty photo draft keeps its original images');
  assert.equal(normalize({version:2}).drafts[3].photoVersion,2,'an absent record starts with new images');
  for (const photoVersion of [1,0,3,'2',null]) {
    raw.drafts[3].photoVersion = photoVersion;
    assert.equal(normalize(raw).drafts[3].photoVersion,1,'only an explicit supported new version selects new images');
  }
  raw.drafts[3].photoVersion = 2;
  assert.equal(normalize(raw).drafts[3].photoVersion,2);
});
test('revisiting and changing an unfinished draft does not erase certified evidence on reload',()=>{const s=investigated(freshState(),2);completeStage(s,2);s.drafts[2].sea=60;s.drafts[2].prepared=false;const restored=normalize(JSON.parse(JSON.stringify(s)));assert.ok(restored.completed.includes(2));assert.equal(restored.evidence[2].data.sea,40);assert.equal(restored.drafts[2].sea,60);});
test('unfinished final situation, selected evidence and reason resume together',()=>{const s=freshState();s.finalDraft={caseIndex:3,stage:4,reason:1};const restored=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.finalDraft,s.finalDraft);assert.deepEqual(restored.links,{});});
test('tides reject same height and reversed time; both incoming and outgoing valid',()=>{const s=investigated(freshState(),4);s.drafts[4].b=6;assert.ok(!aReady(s,4));s.drafts[4].a=3;s.drafts[4].b=0;assert.ok(!aReady(s,4));s.drafts[4].a=3;s.drafts[4].b=6;s.drafts[4].direction='down';s.drafts[4].concept='out';assert.ok(stageValid(s,4));});
test('mudflat needs observed features and a matching protection action',()=>{const s=investigated(freshState(),5);s.drafts[5].features.crab='wrong';assert.ok(!aReady(s,5));s.drafts[5].features.crab=creatures[0].feature;s.drafts[5].action='collect';assert.ok(!completeStage(s,5));s.drafts[5].action='observe';assert.ok(completeStage(s,5));});
test('normal completion unlocks in order and DATA LINK needs both proof and reasoning',()=>{const s=freshState();for(let n=1;n<=5;n++){assert.ok(canAccess(s,`s${n}a`));investigated(s,n);assert.ok(canAccess(s,`s${n}b`));assert.ok(completeStage(s,n));}assert.ok(canAccess(s,'report'));assert.ok(!canAccess(s,'ending'));assert.equal(linkEvidence(s,0,2,1),'wrong');assert.equal(linkEvidence(s,0,1,0),'wrong');for(let i=0;i<5;i++)assert.equal(linkEvidence(s,i,finalCases[i].stage,finalCases[i].answer),'saved');assert.ok(allLinked(s));assert.ok(s.issuedAt);assert.ok(canAccess(s,'certificate'));assert.equal(new Set(s.completed).size,5);});
test('repeated final evidence confirmation cannot emit a new saved event',()=>{
 const s=freshState();
 for(let n=1;n<=5;n++){investigated(s,n);completeStage(s,n);}
 finalCases.forEach((item,index)=>linkEvidence(s,index,item.stage,item.answer));
 const before=JSON.stringify(s),last=finalCases.at(-1);
 assert.equal(linkEvidence(s,4,last.stage,last.answer),'already-saved');
 assert.equal(JSON.stringify(s),before);
});
test('resume, evidence, audio and unlock survive a real serialization round trip',()=>{const s=freshState();for(let n=1;n<=5;n++){investigated(s,n);completeStage(s,n);}finalCases.forEach((c,i)=>linkEvidence(s,i,c.stage,c.answer));s.route='certificate';s.resume='certificate';s.history=['home','hub','s1a'];s.settings={muted:true,volume:.2,unlockAll:true,flatGlobe:true};const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.route,'certificate');assert.equal(loaded.resume,'certificate');assert.ok(allLinked(loaded));assert.deepEqual(loaded.settings,{bgmEnabled:false,sfxEnabled:false,...s.settings});assert.deepEqual(loaded.evidence[4],s.evidence[4]);});
test('bad/missing/versioned saves and blocked storage do not crash',()=>{for(const raw of ['{broken','null','[]','{"version":1}']){const r=loadState({getItem:()=>raw});assert.equal(r.state.route,'home');assert.ok(r.warning);}assert.equal(loadState({getItem:()=>null}).warning,'');assert.ok(saveState({setItem(){throw Error('blocked');}},freshState()));const malformed={version:2,drafts:{1:{samples:32},4:{a:-9,b:'bad'}},settings:{volume:500}};assert.deepEqual(normalize(malformed).drafts[1].samples,[]);assert.equal(normalize(malformed).drafts[4].a,null);assert.equal(normalize(malformed).settings.volume,1);});
test('land source matches all curated scan points, excluding ambiguous coasts and lakes',()=>{const geo=JSON.parse(readFileSync(new URL('../public/assets/land.geojson',import.meta.url)));function inside(point,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>point[1])!==(yj>point[1]))&&(point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi))c=!c;}return c;}for(const p of sites){const land=geo.features.some(f=>(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).some(poly=>inside([p.lon,p.lat],poly[0])&&!poly.slice(1).some(r=>inside([p.lon,p.lat],r))));assert.equal(land,p.type==='육지',p.name);}});

test('map position survives a save and bad values fall back to the plaza',()=>{const s=freshState();assert.equal(s.mapPosition,null);s.mapPosition={x:310,y:194};assert.deepEqual(normalize(JSON.parse(JSON.stringify(s))).mapPosition,{x:310,y:194});for(const bad of [{x:'1',y:2},{x:NaN,y:2},[1,2],'x'])assert.equal(normalize({...JSON.parse(JSON.stringify(s)),mapPosition:bad}).mapPosition,null);});

test('replaying a completed investigation preserves its original evidence',()=>{const s=investigated(freshState(),2);completeStage(s,2);s.drafts[2].prediction='different';completeStage(s,2);assert.equal(s.evidence[2].data.prediction,'same');});
test('damaged save is never overwritten by navigation',()=>{let raw='{broken';const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const loaded=loadState(storage);assert.ok(saveState(storage,loaded.state));assert.equal(raw,'{broken');assert.equal(saveState(storage,loaded.state,{reset:true}),'');assert.equal(JSON.parse(raw).version,2);});
test('another tab save is preserved and repeated conflicts stay blocked',()=>{let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const a=loadState(storage).state,b=loadState(storage).state;a.route='hub';assert.equal(saveState(storage,a),'');const expected=raw;assert.ok(saveState(storage,b));assert.ok(saveState(storage,b));assert.equal(raw,expected);assert.equal(saveState(storage,a),'');});
test('newer content version cannot be silently downgraded',()=>{const raw=JSON.stringify({...freshState(),contentVersion:99});let stored=raw;const storage={getItem:()=>stored,setItem:(k,v)=>stored=v};const loaded=loadState(storage);assert.ok(loaded.warning);assert.ok(saveState(storage,loaded.state));assert.equal(stored,raw);});

test('first prediction survives revisions and saved evidence reload',()=>{const s=investigated(freshState(),2);recordPrediction(s,'same');recordPrediction(s,'different');assert.equal(s.drafts[2].firstPrediction,'same');assert.equal(s.drafts[2].prediction,'different');completeStage(s,2);const restored=normalize(JSON.parse(JSON.stringify(s)));assert.equal(restored.evidence[2].data.firstPrediction,'same');});
test('teacher preview changes never mutate student records',()=>{const student=investigated(freshState(),2),before=JSON.stringify(student),preview=previewState(student);recordPrediction(preview,'different');completeStage(preview,2);preview.research[1].solved.push('preview');assert.equal(JSON.stringify(student),before);assert.equal(student.settings.unlockAll,false);assert.equal(preview.settings.unlockAll,true);});

test('new tide evidence cannot infer one direction across a turning point', () => {
  for (const [a,b,direction,concept] of [[0,4,'up','in'],[2,6,'down','out']]) {
    const state = investigated(freshState(),4);
    Object.assign(state.drafts[4],{a,b,direction,concept});
    assert.equal(completeStage(state,4),false,`${a} → ${b} crosses the high-water record`);
    assert.deepEqual(state.completed,[]);
    assert.equal(state.evidence[4],undefined);
    state.completed.push(4);
    assert.equal(completeStage(state,4),false,'a completed flag without archived evidence cannot bypass the guard');
  }
});

test('tide interval direction includes the intermediate observations', () => {
  const direction = stateModule.tideIntervalDirection;
  assert.equal(typeof direction,'function');
  for (const [a,b] of [[0,1],[0,3],[1,3],[2,3]]) assert.equal(direction(a,b),'up');
  for (const [a,b] of [[3,4],[3,6],[4,6],[5,6]]) assert.equal(direction(a,b),'down');
  for (const [a,b] of [[0,4],[0,6],[1,5],[2,6],[3,3],[3,0],[-1,3],[0,7],[null,3],[0,1.5]]) {
    assert.equal(direction(a,b),null,`${a} → ${b}`);
  }
});

test('recording a new first tide observation permits a new outgoing pair', () => {
  const record = stateModule.recordTideObservation;
  assert.equal(typeof record,'function');
  const state = investigated(freshState(),4);
  const otherDraft = structuredClone(state.drafts[2]);
  assert.equal(record(state,'a',3),'saved');
  assert.equal(state.drafts[4].a,3);
  assert.equal(state.drafts[4].b,null);
  assert.deepEqual(state.drafts[4].markers,[]);
  assert.equal(state.drafts[4].direction,'');
  assert.equal(state.drafts[4].concept,'');
  assert.equal(record(state,'b',6),'saved');
  assert.equal(stateModule.tideIntervalDirection(state.drafts[4].a,state.drafts[4].b),'down');
  assert.deepEqual(state.drafts[2],otherDraft);
  state.drafts[4].markers=['pole'];
  const before = JSON.stringify(state);
  assert.equal(record(state,'b',6),'saved');
  assert.equal(JSON.stringify(state),before,'repeating the same save preserves current observations');
});

test('rejected tide observations leave the existing draft untouched', () => {
  const record = stateModule.recordTideObservation;
  assert.equal(typeof record,'function');
  const state = investigated(freshState(),4);
  const before = JSON.stringify(state);
  assert.equal(record(state,'b',4),'turns');
  assert.equal(record(state,'b',6),'turns');
  assert.equal(record(state,'b',0),'not-later');
  assert.equal(record(state,'invalid',2),'invalid');
  assert.equal(record(state,'b',7),'invalid');
  assert.equal(JSON.stringify(state),before);
  const empty = freshState();
  assert.equal(record(empty,'b',3),'choose-a');
  assert.equal(empty.drafts[4].b,null);
});

test('archived turning-point tide evidence and earned certificate survive reload and revisit', () => {
  const state = freshState();
  for (let chapter=1;chapter<=5;chapter++) {
    investigated(state,chapter);
    completeStage(state,chapter);
  }
  // A pre-fix record shape, reconstructed without the new recording helper.
  state.drafts[4].b=4;
  state.evidence[4].data.b=4;
  finalCases.forEach((item,index)=>linkEvidence(state,index,item.stage,item.answer));
  const archived=structuredClone(state.evidence[4]);
  const issuedAt=state.issuedAt;
  const restored=normalize(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.completed,[1,2,3,4,5]);
  assert.deepEqual(restored.evidence[4],archived);
  assert.equal(restored.issuedAt,issuedAt);
  assert.equal(allLinked(restored),true);
  assert.equal(completeStage(restored,4),true);
  assert.deepEqual(restored.evidence[4],archived);
  assert.equal(stateModule.recordTideObservation(restored,'a',3),'saved');
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(restored))).evidence[4],archived);
});
