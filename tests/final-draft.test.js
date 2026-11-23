import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,selectFinalCase} from '../src/state.js';
import {link} from '../src/screens.js';

test('partial evidence and reason survive case switches and a save round trip without credit',()=>{
 let s=freshState();s.finalDraft.stage=1;
 assert.equal(selectFinalCase(s,1),true);s.finalDraft.reason=0;
 assert.equal(selectFinalCase(s,0),true);
 assert.deepEqual(s.finalDraft,{caseIndex:0,stage:1,reason:null});
 s=normalize(JSON.parse(JSON.stringify(s)));
 selectFinalCase(s,1);
 assert.deepEqual(s.finalDraft,{caseIndex:1,stage:null,reason:0});
 selectFinalCase(s,0);
 assert.match(link(s,{caseIndex:0,linkStage:s.finalDraft.stage,linkReason:s.finalDraft.reason}),/이유가 빠졌어요/);
 assert.deepEqual(s.links,{});assert.equal(s.issuedAt,null);
});

test('old saves still restore earned links and invalid stored drafts cannot grant credit',()=>{
 const s=freshState();delete s.finalDrafts;s.links[2]={stage:3,reason:1};
 selectFinalCase(s,2);assert.deepEqual(s.finalDraft,{caseIndex:2,stage:3,reason:1});
 const before=JSON.stringify(s);assert.equal(selectFinalCase(s,7),false);assert.equal(JSON.stringify(s),before);
 const raw=freshState();raw.finalDrafts={0:{stage:10,reason:-1},1:{stage:2,reason:0},2:{stage:3,reason:99},9:{stage:1,reason:1}};
 const restored=normalize(raw);
 assert.deepEqual(restored.finalDrafts,{0:{stage:null,reason:null},1:{stage:2,reason:0},2:{stage:3,reason:null}});
 assert.deepEqual(restored.links,{});assert.deepEqual(restored.completed,[]);
});
