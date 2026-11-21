import { companion } from './companion.js';
import { chapters, asset, tideHeight, timeLabel } from './data.js';
import { pageChallenges, correctResponse, pageReady, researchReady, mistakeHint, PAGE_SIZE, CHAPTER_TASKS } from './challenge-data.js';
import { aReady, baseStageValid, completeStage, tideIntervalDirection } from './state.js';
import { icon } from './icons.js';
import { shuffled } from './shuffle.js';
import { specimen } from './specimens.js';
import { illustration } from './illustrations.js';
import { WALK_TASK, walkResponse, walkHint } from './tide-walk-rules.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,value='',cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" data-value="'+esc(value)+'"'+(cls.includes('primary')?' aria-describedby="challenge-guidance"':'')+' '+(disabled?'disabled':'')+'>'+text+'</button>';
const selected=new Map();const errors=new Set();const revealHint=new Set();// 오답 직후 한 번만 도움말을 펼친다(다음 조작 때 다시 덮지 않게).
const ids=s=>{const m=/^s([1-5])([cd])$/.exec(s.route);if(!m)return null;const n=+m[1],step=m[2],r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0];return {n,step,r,tasks,task,key:n+'-'+task.id};};
const needsTideReview=(s,n)=>n===4&&!s.completed.includes(n)&&s.drafts[n].a!==null&&s.drafts[n].b!==null&&!tideIntervalDirection(s.drafts[n].a,s.drafts[n].b);
const scenes={
 'earth-layers':'산과 들이 있는 육지, 넓게 이어진 바다, 그 위를 감싸는 엷은 공기층이 함께 보이는 풍경',
 atmosphere:'우주에서 본 지구. 파란 바다와 육지 둘레를 얇게 빛나는 공기층이 감싸고 있어요',
 island:'탐사선에서 본 작은 섬. 흙과 바위, 풀이 있는 땅을 바다가 둘러싸고 있어요',
 'salt-field':'바닷물을 얕게 가두어 증발시키는 염전. 물이 줄어든 자리에 하얀 소금이 쌓여 있어요',
 'coast-material':'해안 바닥을 가까이 본 모습. 고운 모래, 둥근 자갈, 층이 진 단단한 바위가 나란히 있어요',
 'coast-safety':'울타리가 있는 안전한 해안 탐사길과 파도가 치는 미끄러운 바위',
 'cliff-new':'처음 보는 해안. 바다에서 곧게 솟은 높고 가파른 바위 면에 새들이 앉아 있어요',
 'tide-safety':'물이 들어오기 시작한 갯벌. 물길을 따라 바닷물이 차오르고 나무 탐사길이 해안으로 이어져요',
 'mudflat-protect':'갯벌 관찰 데크. 돋보기와 관찰 노트가 있고, 아래에는 게 구멍과 갈대가 그대로 있어요',
 'mudflat-life':'생물이 가득한 갯벌. 구멍 앞의 게들, 눈이 솟은 짱뚱어, 작은 고둥 자국과 왜가리가 보여요',
};
// 4장 적용 문제 tide-safety는 3D 탐사길 걷기로 먼저 연다. 기존 고르기 화면은 대체 화면으로 남는다.
// 예상과 화면 선택은 저장하지 않는다(저장 필드를 늘리지 않는다).
const walk={flat:false,again:false,plan:'',fails:0};
const walkPlans=[['1','08:00쯤','물이 조금 들어왔을 때'],['2','10:00쯤','물이 많이 들어왔을 때'],['3','12:00쯤','물이 가장 높을 때']];
export const walkPlanLabel=id=>walkPlans.find(plan=>plan[0]===id)?.[1]??'';
let webgl;
function canWebGL(){
 if(webgl===undefined){try{const gl=document.createElement('canvas').getContext('webgl2')??document.createElement('canvas').getContext('webgl');webgl=!!gl;gl?.getExtension?.('WEBGL_lose_context')?.loseContext();}catch{webgl=false;}}
 return webgl;
}
// WebGL이 없거나, 기기의 움직임 줄이기나 설정의 2D 대체가 켜져 있으면 기존 화면으로 연다.
export const walkAvailable=s=>typeof document!=='undefined'&&!s.settings.flatGlobe&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&canWebGL();
const walking=(s,task,solved)=>task.id===WALK_TASK&&!walk.flat&&(!solved||walk.again)&&walkAvailable(s);
function walkStart(s){
 const d=s.evidence[4]?.data??s.drafts[4],recorded=Number.isInteger(d?.a)&&Number.isInteger(d?.b);
 const record=recorded?'내 관측 기록 · A '+timeLabel(d.a)+' → B '+timeLabel(d.b)+' · 물이 '+(tideHeight(d.b)>tideHeight(d.a)?'높아졌어요':'낮아졌어요'):'관찰에서 두 순간을 저장하면 내 관측 기록이 여기에 보여요.';
 return '<div class="walk-start"><p class="walk-record">'+icon('book')+'<span>'+esc(record)+'</span></p><p class="walk-question">06:00에 나가요. 언제쯤 데크로 돌아올까요?</p><div class="challenge-options">'+walkPlans.map(([id,time,note],i)=>'<button class="challenge-option '+(walk.plan===id?'selected':'')+'" data-action="challenge-walk-plan" data-value="'+id+'" aria-pressed="'+(walk.plan===id)+'"><span class="option-key">'+(i+1)+'</span><span>'+time+'<small> · '+note+'</small></span></button>').join('')+'</div>'+button('기존 방식으로 하기','challenge-walk-flat','','text-button walk-switch')+'</div>';
}
function visual(task,n){
 if(scenes[task.art])return '<figure class="challenge-scene"><img src="'+illustration('challenge-'+task.art)+'" alt="'+scenes[task.art]+'" width="1200" height="900" decoding="async"></figure><p class="visual-caption">'+scenes[task.art]+'.</p>';
 if(task.art==='ratio')return '<div class="ratio-grid" role="img" aria-label="지구 전체 면적을 같은 크기의 칸으로 단순화한 비교 그림. 물결 무늬는 바다, 점 무늬는 육지예요.">'+Array.from({length:20},(_,i)=>'<i aria-hidden="true" class="'+(i<14?'sea':'land')+'"></i>').join('')+'<p><span class="legend-sea">바다 · 물결</span><span class="legend-land">육지 · 점</span></p></div><p class="visual-caption">같은 크기의 칸으로 전체 넓이를 비교한 모형이에요.</p>';
 if(['incoming','outgoing','tide'].includes(task.art)){
  const outgoing=task.art==='outgoing',same=task.id==='same-level',three=task.id==='time-order';
  const heights=three?[30,75,30]:same?[30,30]:outgoing?[75,30]:[30,75];
  const labels=three?['06:00','12:00','18:00']:same?['A · 앞선 기록','B · 나중 기록']:outgoing?['A · 12:00','B · 18:00']:task.art==='incoming'?['A · 06:00','B · 12:00']:['A · 앞선 기록','B · 나중 기록'];
  return '<div class="challenge-tide-pair '+(three?'three-records':'')+'">'+heights.map((h,i)=>'<figure><figcaption>'+labels[i]+'</figcaption><svg viewBox="0 0 260 170" role="img" aria-label="'+(h===75?'물이 높아 같은 기둥과 바위가 더 잠긴 모습':'물이 낮아 같은 기둥과 바위가 더 드러난 모습')+'"><image class="tide-foreshore" href="'+asset('tide-foreshore')+'" width="260" height="170" preserveAspectRatio="xMidYMid slice"/><image href="'+illustration('tide-rock')+'" x="22" y="88" width="148" height="68"/><image href="'+illustration('tide-pole')+'" x="180" y="30" width="16" height="132" preserveAspectRatio="none"/><path d="M181 50h14m-14 20h14m-14 20h14m-14 20h14m-14 20h14" stroke="#2a3f3a" stroke-width="4.5" opacity=".55"/><path d="M181 50h14m-14 20h14m-14 20h14m-14 20h14m-14 20h14" stroke="#fff7df" stroke-width="2.5"/><path d="M0 '+(156-h)+'Q70 '+(146-h)+' 135 '+(156-h)+'T260 '+(156-h)+'V170H0Z" fill="#3299ad" opacity=".83"/><path d="M0 '+(156-h)+'Q70 '+(146-h)+' 135 '+(156-h)+'T260 '+(156-h)+'" fill="none" stroke="#e2ffff" stroke-width="3"/><path d="M14 155h27m85-10h33m54 12h25" stroke="#a1dadc" stroke-width="2"/></svg></figure>').join('')+'</div><p class="visual-caption">같은 기둥의 눈금과 바위의 드러난 부분을 살펴봐요.</p>';
 }
 if(['life','poster'].includes(task.art))return '<div class="challenge-creatures">'+[['crab','게'],['skipper','짱뚱어'],['reed','갈대']].map(([id,label])=>'<figure><div>'+specimen(id)+'</div><figcaption>'+label+'</figcaption></figure>').join('')+'</div><p class="visual-caption">생김새와 움직임을 함께 살펴본 관찰 표본이에요.</p>';
 if(task.art==='lab'){
  const unequal=task.id==='unequal-water',heat=task.id==='heat-fix';
  return '<div class="challenge-lab"><div class="lab-model-pair">'+[['육지의 물',unequal?20:40,1],['바닷물',unequal?60:40,heat?2:1]].map(([label,amount,power])=>'<figure><figcaption>'+label+'</figcaption><div class="lab-model-glass"><div class="lab-model-water" style="--water-level:'+amount+'%"></div><img class="beaker-glass" src="'+illustration('lab-beaker')+'" alt="" decoding="async" draggable="false"><span class="lab-model-ticks" aria-hidden="true"></span><b>'+amount+' mL</b></div><div class="lab-model-plate" aria-hidden="true"><img src="'+illustration('lab-hotplate')+'" alt="" decoding="async" draggable="false"></div><p class="lab-model-heat">가열 세기 · '+(power===1?'약하게':'세게')+'</p></figure>').join('')+'</div><p class="visual-caption">물의 양과 가열 조건을 나란히 살펴봐요.<br>가열은 어른의 안내에 따라 안전하게 해요.</p></div>';
 }
 if(task.art==='residue'){
  const unknown=task.id==='unknown-water';
  return '<div class="residue-record"><span class="visual-record-label">이번 실험 · 그릇 바닥 확대</span><div class="challenge-residue">'+(unknown?[['표본 A',true],['표본 B',false]]:[['육지의 물',false],['바닷물',true]]).map(([label,residue])=>'<div><span>'+label+'</span><img class="residue-observation" src="'+illustration(residue?'residue-salt':'residue-clear')+'" alt="'+(residue?'가열한 그릇 바닥에 흰 알갱이가 뚜렷하게 남은 관찰 그림':'이번 표본의 그릇 바닥에 남은 물질이 적게 보이는 관찰 그림')+'" width="640" height="640" decoding="async"><small>'+(residue?'흰 흔적이 더 뚜렷해요':'이번 표본은 적게 남았어요')+'</small></div>').join('')+'</div></div><p class="visual-caption">물은 줄어들고, 녹아 있던 물질은 그릇에 남을 수 있어요.</p>';
 }

 return '<div class="challenge-art" style="background-image:url('+asset(chapters[n-1].asset)+')" role="img" aria-label="'+esc(chapters[n-1].short)+' 탐사 장면"></div>';
}
function activeItem(task,response,key){
 const picked=selected.get(key);
 return task.items?.find(item=>item.id===picked)?.id??task.items?.find(item=>!response?.[item.id])?.id;
}
function responseComplete(task,response){
 if(task.type==='choice')return task.options.some(option=>option.id===response);
 if(task.type==='multi')return Array.isArray(response)&&response.length>=task.answer.length;
 if(task.type==='order')return Array.isArray(response)&&response.length===task.items.length;
 return task.items.every(item=>task.bins.some(bin=>bin.id===response?.[item.id]));
}
function progressText(task,response){
 if(task.type==='choice')return '자료를 보고 답 한 가지를 눌러요. 바로 확인돼요.';
 if(task.type==='multi'){const count=response?.length??0;return count>task.answer.length?task.answer.length+'개만 남겨요. 선택한 답을 다시 누르면 취소돼요.':count+' / '+task.answer.length+'개 선택 · '+(task.answer.length-count)+'개 더 골라요.';}
 if(task.type==='order')return (response?.length??0)+' / '+task.items.length+'장 배치 · 다음에 올 카드를 눌러요.';
 return task.items.filter(item=>response?.[item.id]).length+' / '+task.items.length+'개 연결 · 강조된 카드의 자리를 골라요.';
}
function interaction(task,response,key,wrong=new Set()){
 if(task.type==='choice'||task.type==='multi')return '<div class="challenge-options">'+shuffled(task.options,'opt:'+key).map((o,i)=>{const chosen=task.type==='multi'?(response??[]).includes(o.id):response===o.id;return '<button class="challenge-option '+(chosen?'selected':'')+(wrong.has(o.id)?' recheck':'')+'" data-action="challenge-answer" data-value="'+esc(o.id)+'" aria-pressed="'+chosen+'"><span class="option-key">'+(i+1)+'</span><span>'+esc(o.label)+'</span>'+(task.type==='multi'?icon(chosen?'check':'circle'):'')+'</button>';}).join('')+'</div>';
 if(task.type==='order')return '<div class="challenge-sequence" aria-label="내가 만든 순서">'+(response??[]).map((id,i)=>'<div><b>'+(i+1)+'</b>'+esc(task.items.find(x=>x.id===id)?.label)+'</div>').join('')+'</div><div class="challenge-items">'+shuffled(task.items,'ord:'+key).map(item=>button(esc(item.label),'challenge-order',item.id,'challenge-item',(response??[]).includes(item.id))).join('')+'</div>'+button('마지막 카드 되돌리기','challenge-undo','','text-button',!(response??[]).length);
 const current=activeItem(task,response,key);
 return '<div class="challenge-sort-area"><div class="challenge-items">'+task.items.map(item=>'<button class="challenge-item '+(current===item.id?'selected':'')+' '+(response?.[item.id]?'assigned':'')+(wrong.has(item.id)?' recheck':'')+'" draggable="true" data-challenge-item="'+item.id+'" data-action="challenge-pick" data-value="'+item.id+'" aria-pressed="'+(current===item.id)+'"><span>'+esc(item.label)+'</span><small>'+(wrong.has(item.id)?'다시 보기':esc(task.bins.find(b=>b.id===response?.[item.id])?.label??''))+'</small></button>').join('')+'</div><div class="challenge-bins">'+task.bins.map(bin=>button('<strong>'+esc(bin.label)+'</strong><span>'+task.items.filter(x=>response?.[x.id]===bin.id).length+'개 연결</span>','challenge-bin',bin.id,'challenge-bin',!current)).join('')+'</div></div>';
}
function challengeAdvance(s,n,step,tasks,task,solved,done){
 const readyClass='primary is-ready next-target';
 if(walking(s,task,solved))return button('탐사길로 출발 →','challenge-walk-start','',walk.plan?readyClass:'primary',!walk.plan);
 if(done){
  if(step==='c')return button('다음 · 적용하기 →','challenge-continue','',readyClass+' auto-advance');
  if(needsTideReview(s,n))return button('관찰 다시 하기 →','go','s4a',readyClass);
  if(!baseStageValid(s,n))return button(aReady(s,n)?'비교 이어 하기 →':'관찰 이어 하기 →','go','s'+n+(aReady(s,n)?'b':'a'),readyClass);
  return button(s.completed.includes(n)?(n<5?'다음 탐사로 →':'최종 보고서로 →'):'탐사 배지 받기 →','challenge-finish','',readyClass);
 }
 if(!solved){
  // A saved answer from the previous version can still be confirmed once.
  if(correctResponse(task,s.research[n].answers[task.id]))return button('내 생각 확인','challenge-check','',readyClass);
  // 틀린 뒤에는 꺼진 주 버튼을 두지 않는다. 할 일은 안내 줄과 「다시 보기」 표시가 알려 준다.
  if(errors.has(n+'-'+task.id)&&responseComplete(task,s.research[n].answers[task.id]))return '';
  return button(responseComplete(task,s.research[n].answers[task.id])?'답을 고쳐 봐요':'답을 완성해요','challenge-next','','primary',true);
 }
 if(s.research[n][step]<tasks.length-1)return button('다음 문제 →','challenge-next','',readyClass+' auto-advance');
 return button('남은 문제 풀기 →','challenge-task',tasks.findIndex(t=>!s.research[n].solved.includes(t.id)),readyClass);
}
function successGuide(s,n,step){
 if(!pageReady(s,n,step))return s.research[n][step]<PAGE_SIZE-1?'잘했어! 핵심 개념을 읽고 다음 문제로 가요.':'해결했어요! 남은 문제 풀기를 눌러요.';
 if(step==='c')return '도전 완료! 핵심 개념을 읽고 새 상황에 적용해요.';
 if(needsTideReview(s,n))return '적용 완료! 관찰에서 두 순간을 다시 골라요.';
 if(!baseStageValid(s,n))return '적용 완료! 앞의 '+(aReady(s,n)?'비교':'관찰')+'를 이어 가요.';
 if(s.completed.includes(n))return n<5?'이번 장 완료! 다음 탐사로를 눌러요.':'다섯 장 완료! 최종 보고서로를 눌러요.';
 return '적용 완료! 탐사 배지 받기를 눌러요.';
}
export function challengeScreen(s,n,step){
 const r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0],key=n+'-'+task.id,solved=r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id]),done=pageReady(s,n,step),practice=!baseStageValid(s,n),hint=!solved&&errors.has(key)?mistakeHint(task,r.answers[task.id]):null,wrong=new Set(hint?.wrong??[]),walkOn=walking(s,task,solved);
 const status=walkOn?(walk.plan?'예상을 골랐어요. 탐사길로 출발을 눌러요.':'예상 한 가지를 골라요. 예상에는 맞고 틀림이 없어요.'):solved?icon('check')+' '+successGuide(s,n,step):errors.has(key)?(hint?esc(hint.text)+' ':'다시 관찰해 볼까요? ')+'단서를 보고 답을 고치면 바로 확인돼요.':progressText(task,r.answers[task.id]);
 return '<section class="learning challenge-page"><div class="page-heading"><div><p class="eyebrow"><span class="chapter-label">'+chapters[n-1].title+' · '+(step==='c'?'확장 도전':'새 상황에 적용')+'</span><span class="concept-keywords">'+(chapters[n-1].keyConcepts??[]).map(word=>'<mark>'+esc(word)+'</mark>').join('')+'</span></p><h1>'+esc(task.title)+'</h1><p>'+esc(walkOn?'탐사길을 걸어 갯벌 생물을 살펴보고, 물이 들어오기 전에 안전하게 돌아와요.':task.prompt)+'</p></div><nav class="step-tabs" aria-label="탐사 단계">'+['a','b','c','d'].map((p,i)=>{const locked=!s.settings.unlockAll&&(p==='d'&&!pageReady(s,n,'c'));return button((locked?icon('lock','tab-lock'):'')+(i+1)+'. '+['관찰','비교','도전','적용'][i],'go','s'+n+p,p===step?'active':'',locked);}).join('')+'</nav></div>'+(practice?'<div class="practice-banner">연습 · 관찰과 비교를 마치면 내 기록으로 저장돼요.</div>':'')+'<nav class="challenge-progress" aria-label="현재 활동의 문제">'+tasks.map((t,i)=>button((r.solved.includes(t.id)?icon('check'):'')+'<b>문제 '+(i+1)+'</b><span>'+esc(t.title)+'</span>','challenge-task',i,i===(r[step]??0)?'active':'')).join('')+'</nav><div class="challenge-layout"><aside class="challenge-card challenge-observation"><span class="tag">관찰 자료</span>'+visual(task,n)+'</aside><div class="challenge-board challenge-card"><div class="challenge-board-heading"><span class="tag">'+(step==='c'?'도전':'새 상황 적용')+'</span><span>'+(walkOn?'탐사길 걷기':task.type==='multi'?'두 가지 선택':task.type==='order'?'순서 만들기':task.type==='match'?'특징 연결':task.type==='sort'?'분류하기':'근거로 판단')+'</span></div>'+(walkOn?walkStart(s):interaction(task,r.answers[task.id],key,wrong)+(task.id===WALK_TASK&&walkAvailable(s)?button(solved?'탐사길 다시 걷기':'탐사길 걷기로 하기','challenge-walk-3d','','text-button walk-switch'):''))+(solved&&!walkOn&&task.why?'<p class="challenge-why-card" role="note"><span>핵심 개념</span>'+esc(task.why)+'</p>':'')+'</div></div><footer class="mission-footer"><div id="challenge-guidance" class="challenge-feedback '+(solved?'good':'')+'" role="status">'+status+'</div>'+companion(s,n,step,revealHint.delete(key))+'<p class="challenge-page-count">'+icon('book')+' 이번 장의 확장 기록 <b>'+r.solved.length+' / '+CHAPTER_TASKS+'</b></p>'+challengeAdvance(s,n,step,tasks,task,solved,done)+'</footer></section>';
}
// After a correct answer the key idea stays on screen, then the next task opens by itself.
// Any other touch cancels the timer so a learner who is still reading keeps control.
let autoTimer=null;
export function cancelAutoAdvance(){clearTimeout(autoTimer);autoTimer=null;globalThis.document?.querySelector('.auto-advance.counting')?.classList.remove('counting');}
function scheduleAutoAdvance(ctx,n,step,route){
 cancelAutoAdvance();
 if(typeof document==='undefined')return;
 const reduce=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 queueMicrotask(()=>document.querySelector('.auto-advance')?.classList.add('counting'));
 autoTimer=setTimeout(()=>{autoTimer=null;const s=ctx.state;if(s.route!==route)return;const r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0];if(!r.solved.includes(task.id))return;
  if(!pageReady(s,n,step)){const next=tasks.findIndex(t=>!r.solved.includes(t.id));if(next<0)return;selected.clear();r[step]=next;ctx.save();ctx.render();ctx.sound?.('click');}
  else if(step==='c'){ctx.navigate('s'+n+'d');}
 },reduce?4200:3200);
}
export function handleChallenge(ctx){
 const {action,value,state:s,save,render,feedback,navigate}=ctx;
 if(action!=='challenge-check')cancelAutoAdvance();
 const base=/^s([1-5])b$/.exec(s.route);
 if(action==='complete'&&base&&baseStageValid(s,+base[1])){save();navigate('s'+base[1]+'c');return true;}
 if(!action.startsWith('challenge-'))return false;
 const v=ids(s);if(!v)return true;
 const {n,step,r,tasks,task,key}=v;
 if(action.startsWith('challenge-walk-')){
  if(task.id!==WALK_TASK)return true;
  if(action==='challenge-walk-plan'&&walkPlanLabel(value)){walk.plan=value;ctx.sound?.('click');render();}
  if(action==='challenge-walk-flat'){walk.flat=true;walk.again=false;render();}
  if(action==='challenge-walk-3d'){walk.flat=false;walk.again=true;render();}
  if(action==='challenge-walk-start'&&walk.plan&&walking(s,task,r.solved.includes(task.id)))ctx.openWalk?.({plan:walk.plan});
  // 걷기 결과 카드를 닫은 뒤에 다음 문제로 넘어간다.
  if(action==='challenge-walk-closed'&&r.solved.includes(task.id)&&!pageReady(s,n,step))scheduleAutoAdvance(ctx,n,step,s.route);
  return true;
 }
 let changed=false;
 const previous=JSON.stringify(r.answers[task.id]);
 if(action==='challenge-task'){selected.delete(key);r[step]=Math.max(0,Math.min(tasks.length-1,Number(value)||0));save();render();return true;}
 if(action==='challenge-pick'){if(task.items?.some(item=>item.id===value)){selected.set(key,value);render();}return true;}
 if(action==='challenge-answer'){
  if(!task.options?.some(option=>option.id===value))return true;
  if(task.type==='multi'){const a=Array.isArray(r.answers[task.id])?r.answers[task.id]:[];r.answers[task.id]=a.includes(value)?a.filter(x=>x!==value):[...a,value];}
  else if(task.type==='choice')r.answers[task.id]=value;
  changed=true;
 }
 if(action==='challenge-order'&&task.type==='order'){
  if(!task.items.some(item=>item.id===value))return true;
  const a=r.answers[task.id]??[];if(!a.includes(value))r.answers[task.id]=[...a,value];changed=true;
 }
 if(action==='challenge-undo'&&task.type==='order'){r.answers[task.id]=(r.answers[task.id]??[]).slice(0,-1);changed=true;}
 if(action==='challenge-bin'||action==='challenge-drop'){
  if(!['sort','match'].includes(task.type)||!task.bins.some(bin=>bin.id===value))return true;
  const item=action==='challenge-drop'?ctx.itemId:activeItem(task,r.answers[task.id],key);
  if(!task.items.some(candidate=>candidate.id===item)){feedback('고칠 카드를 골라 주세요.');return true;}
  r.answers[task.id]={...r.answers[task.id],[item]:value};selected.delete(key);changed=true;
 }
 function check(){
  if(correctResponse(task,r.answers[task.id])){
   if(!r.solved.includes(task.id))r.solved.push(task.id);
   firstTryMark(r,task.id,true);
   errors.delete(key);return true;
  }
  firstTryMark(r,task.id,false);
  errors.add(key);revealHint.add(key);s.revised++;return false;
 }
 if(changed){
  if(previous===JSON.stringify(r.answers[task.id])){render();return true;}
  r.solved=r.solved.filter(id=>id!==task.id);errors.delete(key);
  const ready=responseComplete(task,r.answers[task.id]),correct=ready?check():false;
  save();
  // Tone first, then render so the status keeps its key-idea markup.
  if(ready)feedback(correct?successGuide(s,n,step):(mistakeHint(task,r.answers[task.id])?.text??'관찰 단서를 보고 고쳐 봐요.')+' 선택을 바꾸면 바로 확인돼요.',correct);
  render();
  if(ready&&correct&&(!pageReady(s,n,step)||step==='c'))scheduleAutoAdvance(ctx,n,step,s.route);
  else if(['challenge-bin','challenge-drop','challenge-order'].includes(action))ctx.sound?.('drop');
  else if(action==='challenge-answer')ctx.sound?.('click');
  return true;
 }
 if(action==='challenge-check'){
  if(!responseComplete(task,r.answers[task.id])){feedback('답을 모두 고르면 바로 확인돼요.');return true;}
  if(r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id]))return true;
  const correct=check();save();feedback(correct?successGuide(s,n,step):'관찰 단서를 보고 답을 고쳐 봐요.',correct);render();if(correct&&(!pageReady(s,n,step)||step==='c'))scheduleAutoAdvance(ctx,n,step,s.route);return true;
 }
 if(action==='challenge-next'){
  if(r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id])){selected.delete(key);r[step]=Math.min(tasks.length-1,r[step]+1);save();render();}
  return true;
 }
 if(action==='challenge-continue'){if(pageReady(s,n,'c'))navigate('s'+n+'d');return true;}
 if(action==='challenge-finish'){
  if(needsTideReview(s,n)){feedback('1. 관찰에서 물이 한 방향으로 변하는 두 순간을 다시 골라요.');return true;}
  if(!baseStageValid(s,n)){feedback('앞선 관찰과 비교를 마치면 내 탐구 배지를 받을 수 있어요.');return true;}
  if(researchReady(s,n)&&s.completed.includes(n)){navigate(n<5?'s'+(n+1)+'a':'report');return true;}
  if(researchReady(s,n)&&completeStage(s,n)){save();ctx.sound?.('reward');ctx.finishChapter(n);}
  return true;
 }
 return true;
}
// 처음 낸 답이 맞으면 firstTry, 틀리면 missed에 남긴다. 다시 고르기는 그대로 되고 판정도 바뀌지 않는다.
function firstTryMark(r,id,correct){r.firstTry??=[];r.missed??=[];if(correct){if(!r.missed.includes(id)&&!r.firstTry.includes(id))r.firstTry.push(id);}else if(!r.missed.includes(id))r.missed.push(id);}
// 걷기에서 한 행동을 기존 보기 id로 기록하고, 기존 판정(correctResponse)으로 맞았는지 정한다.
export function judgeWalk(ctx,log){
 const s=ctx.state,v=ids(s);if(!v||v.task.id!==WALK_TASK)return null;
 const {r,task,key}=v;
 cancelAutoAdvance();
 r.answers[task.id]=walkResponse(log);
 r.solved=r.solved.filter(id=>id!==task.id);
 const correct=correctResponse(task,r.answers[task.id]);
 firstTryMark(r,task.id,correct);
 if(correct){r.solved.push(task.id);errors.delete(key);walk.fails=0;walk.again=false;}
 else{errors.add(key);s.revised++;walk.fails++;}
 ctx.save();ctx.sound?.(correct?'success':'retry');ctx.render();
 return {correct,why:task.why,hint:correct?'':walkHint(log),offerFlat:!correct&&walk.fails>=3,plan:walkPlanLabel(walk.plan)};
}
export function mountChallenges(app,ctx){const get=()=>ids(ctx.state);const start=e=>{const item=e.target.closest('[data-challenge-item]');if(item)e.dataTransfer?.setData('text/plain',item.dataset.challengeItem);};const over=e=>{if(e.target.closest('[data-action="challenge-bin"]'))e.preventDefault();};const drop=e=>{const bin=e.target.closest('[data-action="challenge-bin"]'),v=get();if(!bin||!v)return;e.preventDefault();const item=e.dataTransfer?.getData('text/plain');if(!v.task.items?.some(x=>x.id===item))return;handleChallenge({...ctx,action:'challenge-drop',value:bin.dataset.value,itemId:item});};const touch=e=>{if(autoTimer&&!e.target.closest('.auto-advance'))cancelAutoAdvance();};app.addEventListener('pointerdown',touch,true);app.addEventListener('dragstart',start);app.addEventListener('dragover',over);app.addEventListener('drop',drop);return ()=>{cancelAutoAdvance();app.removeEventListener('pointerdown',touch,true);app.removeEventListener('dragstart',start);app.removeEventListener('dragover',over);app.removeEventListener('drop',drop);};}
