import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, correctResponse, pageReady, PAGE_SIZE, CHAPTER_TASKS } from '../src/challenge-data.js';
import { handleChallenge, challengeScreen } from '../src/challenges.js';
import { freshState, normalize } from '../src/state.js';

function session(){
 const state=freshState(),calls={saved:0,rendered:0,feedback:[],routes:[],rewards:[],sounds:[]};
 const ctx={state,save:()=>calls.saved++,render:()=>calls.rendered++,feedback:(...message)=>calls.feedback.push(message),navigate:route=>calls.routes.push(route),finishChapter:n=>calls.rewards.push(n),sound:name=>calls.sounds.push(name)};
 const send=(action,value,extra={})=>handleChallenge({...ctx,action,value,...extra});
 const visit=(n,index)=>{state.route=`s${n}${index<PAGE_SIZE?'c':'d'}`;send('challenge-task',index%PAGE_SIZE);};
 return {state,calls,send,visit};
}
function solve(run,task){
 if(task.type==='choice')run.send('challenge-answer',task.answer);
 else if(task.type==='multi')task.answer.forEach(id=>run.send('challenge-answer',id));
 else if(task.type==='order')task.answer.forEach(id=>run.send('challenge-order',id));
 else task.items.forEach(item=>run.send('challenge-bin',item.answer));
}

test('all 20 activities validate through their meaningful inputs without confirm or card-pick clicks',()=>{
 const run=session();
 for(const [chapter,tasks] of Object.entries(challenges)){
  const n=Number(chapter);
  for(const [index,task] of tasks.entries()){
   run.visit(n,index);solve(run,task);
   assert.ok(run.state.research[n].solved.includes(task.id),task.id);
   assert.ok(correctResponse(task,run.state.research[n].answers[task.id]),task.id);
   const screen=challengeScreen(run.state,n,index<PAGE_SIZE?'c':'d');
   assert.match(screen,/class="primary is-ready next-target/,'solved tasks show the next available action');
   assert.match(screen,/aria-describedby="challenge-guidance"/);
   assert.match(run.calls.feedback.at(-1)[0],/다음|남은|이어|배지|넘어|적용/,'success feedback keeps the next-step instruction');
   assert.ok(screen.includes('challenge-why-card')&&screen.includes(task.why),'a solved task restates its key idea');
   assert.equal(run.state.research[n][index<PAGE_SIZE?'c':'d'],index%PAGE_SIZE,'outside the browser no timer moves the learner');
  }
  assert.equal(run.state.research[n].solved.length,CHAPTER_TASKS);
  assert.ok(pageReady(run.state,n,'c')&&pageReady(run.state,n,'d'));
 }
 const restored=normalize(JSON.parse(JSON.stringify(run.state)));
 assert.equal(Object.values(restored.research).reduce((sum,r)=>sum+r.solved.length,0),20);
 assert.deepEqual(run.state.completed,[],'solving practice tasks must not invent badges');
 assert.equal(run.state.revised,0,'partial responses are not wrong attempts');
});

test('automatic card selection supports a wrong answer, correction and a single drop commit',()=>{
 const run=session(),task=challenges[1][1];run.visit(1,1);
 run.send('challenge-bin','sea');
 task.items.slice(1).forEach(item=>run.send('challenge-bin',item.answer));
 assert.ok(!run.state.research[1].solved.includes(task.id));
 assert.equal(run.state.revised,1);
 assert.match(challengeScreen(run.state,1,'c'),/<details class="moa-hint" open[ >]/);
 const saved=run.calls.saved,rendered=run.calls.rendered;
 run.send('challenge-drop','land',{itemId:'a'});
 assert.equal(run.calls.saved,saved+1);
 assert.equal(run.calls.rendered,rendered+1);
 assert.ok(run.state.research[1].solved.includes(task.id));
 assert.equal(run.state.revised,1);
 run.send('challenge-pick','a');run.send('challenge-bin','sea');
 assert.ok(!run.state.research[1].solved.includes(task.id),'changing a correct assignment removes completion');
});

test('same choice pressed repeatedly neither repeats feedback nor counts extra errors',()=>{
 const run=session(),task=challenges[1][3];run.visit(1,3);
 run.send('challenge-answer','1');
 const revised=run.state.revised,feedback=run.calls.feedback.length,saved=run.calls.saved;
 run.send('challenge-answer','1');run.send('challenge-answer','1');
 assert.equal(run.state.revised,revised);assert.equal(run.calls.feedback.length,feedback);assert.equal(run.calls.saved,saved);
 run.send('challenge-next');assert.equal(run.state.research[1].d,1);
 run.send('challenge-answer',task.answer);
 const successFeedback=run.calls.feedback.length;
 run.send('challenge-answer',task.answer);run.send('challenge-check');
 assert.equal(run.state.research[1].solved.filter(id=>id===task.id).length,1);
 assert.equal(run.calls.feedback.length,successFeedback);
});

test('multi choice stays editable and order undo revokes completion until repaired',()=>{
 const run=session(),multi=challenges[1][0];run.visit(1,0);
 run.send('challenge-answer',multi.answer[0]);
 assert.equal(run.state.revised,0);assert.ok(!pageReady(run.state,1,'c'));
 run.send('challenge-answer',multi.answer[1]);
 assert.ok(run.state.research[1].solved.includes(multi.id));
 run.send('challenge-answer',multi.answer[0]);
 assert.ok(!run.state.research[1].solved.includes(multi.id));
 run.send('challenge-answer',multi.answer[0]);
 assert.ok(run.state.research[1].solved.includes(multi.id));
 const order=challenges[2][0];run.visit(2,0);solve(run,order);
 run.send('challenge-undo');assert.ok(!run.state.research[2].solved.includes(order.id));
 run.send('challenge-order',order.answer.at(-1));assert.ok(run.state.research[2].solved.includes(order.id));
});

test('invalid drag targets and unfinished replies cannot advance or create credit',()=>{
 const run=session();run.visit(1,1);const before=JSON.stringify(run.state.research[1]);
 run.send('challenge-drop','land',{itemId:'unknown'});
 run.send('challenge-drop','unknown',{itemId:'a'});
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
 assert.equal(run.state.evidence[1].research.solved.length,CHAPTER_TASKS);
 const evidence=structuredClone(run.state.evidence[1]);
 run.send('challenge-finish');
 assert.deepEqual(run.calls.rewards,[1],'revisiting a completed chapter must not replay its reward');
 assert.deepEqual(run.calls.sounds.filter(name=>name==='reward'),['reward']);
 assert.equal(run.calls.routes.at(-1),'s2a','completed practice can continue to the next chapter');
 assert.deepEqual(run.state.evidence[1],evidence,'the first investigation record is preserved');
});

test('a previously saved complete answer can be confirmed without reentering it',()=>{
 const run=session(),task=challenges[1][2];run.visit(1,2);
 run.state.research[1].answers[task.id]=task.answer;
 assert.match(challengeScreen(run.state,1,'d'),/data-action="challenge-check"/);
 run.send('challenge-check');assert.ok(run.state.research[1].solved.includes(task.id));
 assert.doesNotMatch(challengeScreen(run.state,1,'d'),/data-action="challenge-check"/);
});

test('completed practice leads back to missing observation or comparison instead of an unavailable badge',()=>{
 const run=session();
 challenges[1].forEach((task,index)=>{run.visit(1,index);solve(run,task);});
 assert.match(challengeScreen(run.state,1,'d'),/data-action="go" data-value="s1a"[^>]*>관찰 이어 하기/);
 Object.assign(run.state.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true});
 assert.match(challengeScreen(run.state,1,'d'),/data-action="go" data-value="s1b"[^>]*>비교 이어 하기/);
 assert.deepEqual(run.state.completed,[]);
});

test('a legacy unfinished tide draft with a turning interval offers an observation repair action',()=>{
 const run=session();
 challenges[4].forEach((task,index)=>{run.visit(4,index);solve(run,task);});
 Object.assign(run.state.drafts[4],{a:0,b:4,markers:['pole','rock'],direction:'up',concept:'in'});
 assert.match(challengeScreen(run.state,4,'d'),/data-action="go" data-value="s4a"[^>]*>관찰 다시 하기/);
 run.send('challenge-finish');
 assert.match(run.calls.feedback.at(-1)[0],/한 방향/);
 assert.deepEqual(run.calls.rewards,[]);
});

// 2026-11-21 반복 선택 결정: 다시 고르기는 그대로, 처음 낸 답이 맞은 문제만 firstTry에 남고 틀린 적 있으면 missed에 남는다.
test('first try correct answers are recorded apart from retried ones and survive a save round trip', () => {
 const run = session();
 const first = challenges[1].find(t => t.type === 'choice');
 const retried = challenges[1].filter(t => t.type === 'choice')[1];
 run.visit(1, challenges[1].indexOf(first));
 solve(run, first);
 run.visit(1, challenges[1].indexOf(retried));
 run.send('challenge-answer', retried.options.find(o => o.id !== retried.answer).id);
 run.send('challenge-answer', retried.answer);
 const r = run.state.research[1];
 assert.ok(r.solved.includes(first.id) && r.solved.includes(retried.id), 'both still solved: retrying keeps working');
 assert.deepEqual(r.firstTry, [first.id]);
 assert.deepEqual(r.missed, [retried.id]);
 const restored = normalize(JSON.parse(JSON.stringify(run.state)));
 assert.deepEqual(restored.research[1].firstTry, [first.id]);
 assert.deepEqual(restored.research[1].missed, [retried.id]);
 const legacy = JSON.parse(JSON.stringify(run.state)); delete legacy.research[1].firstTry; delete legacy.research[1].missed;
 assert.deepEqual(normalize(legacy).research[1].firstTry, [], 'an older save without the field loads with an empty list');
});

test('choice options are shown in a shuffled order but keep their ids', () => {
 const task = challenges[1].find(t => t.type === 'multi');
 // 같은 열쇠는 같은 순서, 다른 열쇠는 순서가 달라질 수 있다(정답이 늘 같은 자리에 오지 않게).
 return import('../src/shuffle.js').then(({ shuffled }) => {
  const ids = task.options.map(o => o.id);
  assert.deepEqual(shuffled(task.options, 'k').map(o => o.id), shuffled(task.options, 'k').map(o => o.id), 'stable for the same key');
  const firstSlots = new Set(Array.from({ length: 60 }, (_, i) => shuffled(ids, 'opt:' + i)[0]));
  assert.equal(firstSlots.size, ids.length, 'every option reaches the first slot across keys');
  assert.deepEqual([...shuffled(ids, 'x')].sort(), [...ids].sort(), 'nothing lost or added');
 });
});
