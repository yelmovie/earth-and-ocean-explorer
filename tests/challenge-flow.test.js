import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, correctResponse, pageReady } from '../src/challenge-data.js';
import { handleChallenge, challengeScreen } from '../src/challenges.js';
import { freshState, normalize } from '../src/state.js';

function session(){
 const state=freshState(),calls={saved:0,rendered:0,feedback:[],routes:[],rewards:[],sounds:[]};
 const ctx={state,save:()=>calls.saved++,render:()=>calls.rendered++,feedback:(...message)=>calls.feedback.push(message),navigate:route=>calls.routes.push(route),finishChapter:n=>calls.rewards.push(n),sound:name=>calls.sounds.push(name)};
 const send=(action,value,extra={})=>handleChallenge({...ctx,action,value,...extra});
 const visit=(n,index)=>{state.route=`s${n}${index<4?'c':'d'}`;send('challenge-task',index%4);};
 return {state,calls,send,visit};
}
function solve(run,task){
 if(task.type==='choice')run.send('challenge-answer',task.answer);
 else if(task.type==='multi')task.answer.forEach(id=>run.send('challenge-answer',id));
 else if(task.type==='order')task.answer.forEach(id=>run.send('challenge-order',id));
 else task.items.forEach(item=>run.send('challenge-bin',item.answer));
}

test('all 40 activities validate through their meaningful inputs without confirm or card-pick clicks',()=>{
 const run=session();
 for(const [chapter,tasks] of Object.entries(challenges)){
  const n=Number(chapter);
  for(const [index,task] of tasks.entries()){
   run.visit(n,index);solve(run,task);
   assert.ok(run.state.research[n].solved.includes(task.id),task.id);
   assert.ok(correctResponse(task,run.state.research[n].answers[task.id]),task.id);
   assert.equal(run.state.research[n][index<4?'c':'d'],index%4,'reading and next-question timing stay under player control');
  }
  assert.equal(run.state.research[n].solved.length,8);
  assert.ok(pageReady(run.state,n,'c')&&pageReady(run.state,n,'d'));
 }
 const restored=normalize(JSON.parse(JSON.stringify(run.state)));
 assert.equal(Object.values(restored.research).reduce((sum,r)=>sum+r.solved.length,0),40);
 assert.deepEqual(run.state.completed,[],'solving practice tasks must not invent badges');
 assert.equal(run.state.revised,0,'partial responses are not wrong attempts');
});

test('automatic card selection supports a wrong answer, correction and a single drop commit',()=>{
 const run=session(),task=challenges[1][0];run.visit(1,0);
 run.send('challenge-bin','sea');
 task.items.slice(1).forEach(item=>run.send('challenge-bin',item.answer));
 assert.ok(!run.state.research[1].solved.includes(task.id));
 assert.equal(run.state.revised,1);
 assert.match(challengeScreen(run.state,1,'c'),/<details open>/);
 const saved=run.calls.saved,rendered=run.calls.rendered;
 run.send('challenge-drop','land',{itemId:'mountain'});
 assert.equal(run.calls.saved,saved+1);
 assert.equal(run.calls.rendered,rendered+1);
 assert.ok(run.state.research[1].solved.includes(task.id));
 assert.equal(run.state.revised,1);
 run.send('challenge-pick','mountain');run.send('challenge-bin','sea');
 assert.ok(!run.state.research[1].solved.includes(task.id),'changing a correct assignment removes completion');
});

test('same choice pressed repeatedly neither repeats feedback nor counts extra errors',()=>{
 const run=session(),task=challenges[1][2];run.visit(1,2);
 run.send('challenge-answer','1');
 const revised=run.state.revised,feedback=run.calls.feedback.length,saved=run.calls.saved;
 run.send('challenge-answer','1');run.send('challenge-answer','1');
 assert.equal(run.state.revised,revised);assert.equal(run.calls.feedback.length,feedback);assert.equal(run.calls.saved,saved);
 run.send('challenge-next');assert.equal(run.state.research[1].c,2);
 run.send('challenge-answer',task.answer);
 const successFeedback=run.calls.feedback.length;
 run.send('challenge-answer',task.answer);run.send('challenge-check');
 assert.equal(run.state.research[1].solved.filter(id=>id===task.id).length,1);
 assert.equal(run.calls.feedback.length,successFeedback);
});

test('multi choice stays editable and order undo revokes completion until repaired',()=>{
 const run=session(),multi=challenges[1][1];run.visit(1,1);
 run.send('challenge-answer',multi.answer[0]);
 assert.equal(run.state.revised,0);assert.ok(!pageReady(run.state,1,'c'));
 run.send('challenge-answer',multi.answer[1]);
 assert.ok(run.state.research[1].solved.includes(multi.id));
 run.send('challenge-answer',multi.answer[0]);
 assert.ok(!run.state.research[1].solved.includes(multi.id));
 run.send('challenge-answer',multi.answer[0]);
 assert.ok(run.state.research[1].solved.includes(multi.id));
 const order=challenges[2][1];run.visit(2,1);solve(run,order);
 run.send('challenge-undo');assert.ok(!run.state.research[2].solved.includes(order.id));
 run.send('challenge-order',order.answer.at(-1));assert.ok(run.state.research[2].solved.includes(order.id));
});

test('invalid drag targets and unfinished replies cannot advance or create credit',()=>{
 const run=session();run.visit(1,0);const before=JSON.stringify(run.state.research[1]);
 run.send('challenge-drop','land',{itemId:'unknown'});
 run.send('challenge-drop','unknown',{itemId:'mountain'});
 run.send('challenge-answer','unknown');run.send('challenge-next');run.send('challenge-check');
 assert.equal(JSON.stringify(run.state.research[1]),before);
 assert.equal(run.state.revised,0);
 run.send('challenge-continue');run.send('challenge-finish');
 assert.deepEqual(run.calls.routes,[]);assert.deepEqual(run.calls.rewards,[]);
});

test('completed pages continue directly and a badge still requires original observation evidence',()=>{
 const run=session();
 challenges[1].forEach((task,index)=>{run.visit(1,index);solve(run,task);});
 run.state.route='s1c';run.send('challenge-continue');assert.deepEqual(run.calls.routes,['s1d']);
 run.state.route='s1d';run.send('challenge-finish');assert.deepEqual(run.calls.rewards,[]);
 Object.assign(run.state.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,classifications:{asia:'육지',pacific:'바다',africa:'육지'},conclusion:'global'});
 run.state.route='s1b';run.send('complete');assert.equal(run.calls.routes.at(-1),'s1c');
 run.state.route='s1d';run.send('challenge-finish');
 assert.deepEqual(run.calls.rewards,[1]);assert.deepEqual(run.state.completed,[1]);
 assert.equal(run.state.evidence[1].research.solved.length,8);
});

test('a previously saved complete answer can be confirmed without reentering it',()=>{
 const run=session(),task=challenges[1][2];run.visit(1,2);
 run.state.research[1].answers[task.id]=task.answer;
 assert.match(challengeScreen(run.state,1,'c'),/data-action="challenge-check"/);
 run.send('challenge-check');assert.ok(run.state.research[1].solved.includes(task.id));
 assert.doesNotMatch(challengeScreen(run.state,1,'c'),/data-action="challenge-check"/);
});