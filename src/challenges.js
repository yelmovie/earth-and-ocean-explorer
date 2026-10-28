import { companion } from './companion.js';
import { chapters, asset } from './data.js';
import { pageChallenges, correctResponse, pageReady, researchReady } from './challenge-data.js';
import { baseStageValid, completeStage } from './state.js';
import { icon } from './icons.js';
import { specimen } from './specimens.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,value='',cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" data-value="'+esc(value)+'" '+(disabled?'disabled':'')+'>'+text+'</button>';
const selected=new Map();const errors=new Set();const clues=new Set();
const ids=s=>{const m=/^s([1-5])([cd])$/.exec(s.route);if(!m)return null;const n=+m[1],step=m[2],r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0];return {n,step,r,tasks,task,key:n+'-'+task.id};};
function visual(task,n){
 if(task.art==='ratio')return '<div class="ratio-grid" role="img" aria-label="지구 전체 면적을 단순화한 그림. 바다가 육지보다 넓어요.">'+Array.from({length:20},(_,i)=>'<i class="'+(i<14?'sea':'land')+'"></i>').join('')+'<p><span class="legend-sea">바다</span> <span class="legend-land">육지</span> · 전체 면적 비교 그림</p></div>';
 if(['incoming','outgoing','tide'].includes(task.art)){const up=task.art!=='outgoing';return '<div class="challenge-tide-pair">'+[up?30:75,up?75:30].map((h,i)=>'<figure><figcaption>'+['A · 앞선 기록','B · 나중 기록'][i]+'</figcaption><svg viewBox="0 0 260 150" role="img" aria-label="'+(h===75?'물이 높아 기둥과 바위가 더 잠겼어요':'물이 낮아 기둥과 바위가 더 드러나요')+'"><rect width="260" height="150" fill="#d6edf0"/><path d="M0 120Q150 65 260 100V150H0" fill="#d6be8a"/><path d="M50 130 70 70 100 80 117 134" fill="#758b82"/><rect x="180" y="20" width="14" height="120" fill="#b2794e"/><path d="M180 40h16m-16 20h16m-16 20h16m-16 20h16" stroke="#fff4d7" stroke-width="3"/><path d="M0 '+(145-h)+'Q120 '+(130-h)+' 260 '+(140-h)+'V150H0Z" fill="#4aaabc" opacity=".82"/></svg></figure>').join('')+'</div>';}
 if(['life','poster'].includes(task.art))return '<div class="challenge-creatures">'+['crab','skipper','reed'].map(id=>'<div>'+specimen(id)+'</div>').join('')+'</div>';
 if(task.art==='earth')return '<div class="challenge-earth" role="img" aria-label="대기가 둘러싼 지구의 육지와 바다"><svg viewBox="0 0 240 150"><circle cx="120" cy="75" r="65" fill="#c1e8e7"/><circle cx="120" cy="75" r="55" fill="#3e9ab4"/><path d="m85 34 24 8 7 22-16 14 3 24-18-7-15-30zm56-7 24 18 6 20-15 15-1 32-14 8-5-30-14-10 8-23z" fill="#a8c877"/></svg><span>육지 · 바다 · 대기</span></div>';
 if(task.art==='residue')return '<div class="challenge-residue"><div><span>육지의 물</span><i></i><small>거의 남지 않음</small></div><div><span>바닷물</span><i class="has-residue"></i><small>흰 흔적이 더 뚜렷함</small></div></div>';
 return '<div class="challenge-art" style="background-image:url('+asset(chapters[n-1].asset)+');'+(task.art==='arch'?'background-position:48% 32%':task.art==='cliff'?'background-position:90% 20%':'')+'" role="img" aria-label="'+esc(chapters[n-1].short)+' 탐사 장면"></div>';
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
 if(task.type==='choice')return '답을 고르면 바로 확인돼요.';
 if(task.type==='multi'){const count=response?.length??0;return count>task.answer.length?'두 가지만 남겨 주세요. 선택한 답을 다시 누르면 취소돼요.':count+' / '+task.answer.length+'개 선택 · 두 가지를 고르면 바로 확인돼요.';}
 if(task.type==='order')return (response?.length??0)+' / '+task.items.length+'장 배치 · 모두 놓으면 바로 확인돼요.';
 return task.items.filter(item=>response?.[item.id]).length+' / '+task.items.length+'개 연결 · 강조된 카드의 알맞은 곳을 눌러요.';
}
function interaction(task,response,key){
 if(task.type==='choice'||task.type==='multi')return '<div class="challenge-options">'+task.options.map((o,i)=>{const chosen=task.type==='multi'?(response??[]).includes(o.id):response===o.id;return '<button class="challenge-option '+(chosen?'selected':'')+'" data-action="challenge-answer" data-value="'+esc(o.id)+'" aria-pressed="'+chosen+'"><span class="option-key">'+(i+1)+'</span><span>'+esc(o.label)+'</span>'+(task.type==='multi'?icon(chosen?'check':'circle'):'')+'</button>';}).join('')+'</div>';
 if(task.type==='order')return '<p class="manipulation-tip">아래 카드를 순서대로 눌러요. 끌어 넣어도 돼요.</p><div class="challenge-sequence" aria-label="내가 만든 순서">'+(response??[]).map((id,i)=>'<div><b>'+(i+1)+'</b>'+esc(task.items.find(x=>x.id===id)?.label)+'</div>').join('')+'</div><div class="challenge-items">'+task.items.map(item=>button(esc(item.label),'challenge-order',item.id,'challenge-item',(response??[]).includes(item.id))).join('')+'</div>'+button('마지막 카드 되돌리기','challenge-undo','','text-button',!(response??[]).length);
 const current=activeItem(task,response,key);
 return '<p class="challenge-instruction">'+icon(task.type==='match'?'link':'hand')+' 강조된 카드의 '+(task.type==='match'?'알맞은 설명':'보관함')+'을 눌러요. 다음 카드는 저절로 선택돼요.</p><div class="challenge-sort-area"><div class="challenge-items">'+task.items.map(item=>'<button class="challenge-item '+(current===item.id?'selected':'')+' '+(response?.[item.id]?'assigned':'')+'" draggable="true" data-challenge-item="'+item.id+'" data-action="challenge-pick" data-value="'+item.id+'" aria-pressed="'+(current===item.id)+'"><span>'+esc(item.label)+'</span><small>'+esc(task.bins.find(b=>b.id===response?.[item.id])?.label??'아직 연결하지 않았어요')+'</small></button>').join('')+'</div><div class="challenge-bins">'+task.bins.map(bin=>button('<strong>'+esc(bin.label)+'</strong><span>'+task.items.filter(x=>response?.[x.id]===bin.id).length+'개 연결</span>','challenge-bin',bin.id,'challenge-bin',!current)).join('')+'</div></div>';
}
function challengeAdvance(s,n,step,tasks,task,solved,done){
 if(done)return step==='c'?button('다음 · 적용하기 →','challenge-continue','','primary'):button('탐사 배지 받기 →','challenge-finish','','primary');
 if(!solved){
  // A saved answer from the previous version can still be confirmed once.
  if(correctResponse(task,s.research[n].answers[task.id]))return button('내 생각 확인','challenge-check','','primary');
  return button(responseComplete(task,s.research[n].answers[task.id])?'답을 고쳐 봐요':'답을 완성해요','challenge-next','','primary',true);
 }
 if(s.research[n][step]<3)return button('다음 문제 →','challenge-next','','primary');
 return button('남은 문제 풀기 →','challenge-task',tasks.findIndex(t=>!s.research[n].solved.includes(t.id)),'primary');
}
export function challengeScreen(s,n,step){
 const r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0],key=n+'-'+task.id,solved=r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id]),done=pageReady(s,n,step),practice=!baseStageValid(s,n);
 const status=solved?icon('check')+' 근거를 연결했어요! '+(done?'네 문제를 모두 해결했어요.':'다음 문제로 이어 가요.'):errors.has(key)?'다시 관찰해 볼까요? 단서를 보고 답을 고치면 바로 확인돼요.':progressText(task,r.answers[task.id]);
 return '<section class="learning challenge-page"><div class="page-heading"><div><p class="eyebrow">'+chapters[n-1].title+' · '+(step==='c'?'확장 도전':'새 상황에 적용')+'</p><h1>'+esc(task.title)+'</h1><p>'+esc(task.prompt)+'</p></div><nav class="step-tabs" aria-label="탐사 단계">'+['a','b','c','d'].map((p,i)=>button((i+1)+'. '+['관찰','비교','도전','적용'][i],'go','s'+n+p,p===step?'active':'',!s.settings.unlockAll&&(p==='d'&&!pageReady(s,n,'c')))).join('')+'</nav></div>'+(practice?'<div class="practice-banner">연습 · 관찰과 비교를 마치면 내 기록으로 저장돼요.</div>':'')+'<nav class="challenge-progress" aria-label="현재 활동의 문제">'+tasks.map((t,i)=>button((r.solved.includes(t.id)?icon('check'):(i+1))+'<span>'+esc(t.title)+'</span>','challenge-task',i,i===(r[step]??0)?'active':'')).join('')+'</nav><div class="challenge-layout"><aside class="challenge-card challenge-observation"><span class="tag">관찰 자료</span>'+visual(task,n)+'<details '+(clues.has(key)?'open':'')+'><summary>관찰 단서 살펴보기</summary><p>'+esc(task.clue)+'</p></details></aside><div class="challenge-board challenge-card"><div class="challenge-board-heading"><span class="tag">'+(step==='c'?'도전':'적용')+' '+((r[step]??0)+1)+' / 4</span><span>'+(task.type==='multi'?'두 가지 선택':task.type==='order'?'순서 만들기':task.type==='match'?'특징 연결':task.type==='sort'?'분류하기':'근거로 판단')+'</span></div>'+interaction(task,r.answers[task.id],key)+'<div class="challenge-feedback '+(solved?'good':'')+'" role="status">'+status+'</div></div></div><footer class="mission-footer">'+companion(s,n,step)+'<p class="challenge-page-count">'+icon('book')+' 이번 장의 확장 기록 <b>'+r.solved.length+' / 8</b></p>'+challengeAdvance(s,n,step,tasks,task,solved,done)+'</footer></section>';
}
export function handleChallenge(ctx){
 const {action,value,state:s,save,render,feedback,navigate}=ctx;
 const base=/^s([1-5])b$/.exec(s.route);
 if(action==='complete'&&base&&baseStageValid(s,+base[1])){save();navigate('s'+base[1]+'c');return true;}
 if(!action.startsWith('challenge-'))return false;
 const v=ids(s);if(!v)return true;
 const {n,step,r,tasks,task,key}=v;
 let changed=false;
 const previous=JSON.stringify(r.answers[task.id]);
 if(action==='challenge-task'){selected.delete(key);r[step]=Math.max(0,Math.min(3,Number(value)||0));save();render();return true;}
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
   errors.delete(key);clues.add(key);return true;
  }
  errors.add(key);clues.add(key);s.revised++;return false;
 }
 if(changed){
  if(previous===JSON.stringify(r.answers[task.id])){render();return true;}
  r.solved=r.solved.filter(id=>id!==task.id);errors.delete(key);
  const ready=responseComplete(task,r.answers[task.id]),correct=ready?check():false;
  save();render();
  if(ready)feedback(correct?'관찰 근거를 연결했어요!':'관찰 단서를 보고 고쳐 봐요. 선택을 바꾸면 바로 확인돼요.',correct);
  else if(['challenge-bin','challenge-drop','challenge-order'].includes(action))ctx.sound?.('drop');
  else if(action==='challenge-answer')ctx.sound?.('click');
  return true;
 }
 if(action==='challenge-check'){
  if(!responseComplete(task,r.answers[task.id])){feedback('답을 모두 고르면 바로 확인돼요.');return true;}
  if(r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id]))return true;
  const correct=check();save();render();feedback(correct?'관찰 근거를 연결했어요!':'관찰 단서를 보고 답을 고쳐 봐요.',correct);return true;
 }
 if(action==='challenge-next'){
  if(r.solved.includes(task.id)&&correctResponse(task,r.answers[task.id])){selected.delete(key);r[step]=Math.min(3,r[step]+1);save();render();}
  return true;
 }
 if(action==='challenge-continue'){if(pageReady(s,n,'c'))navigate('s'+n+'d');return true;}
 if(action==='challenge-finish'){
  if(!baseStageValid(s,n)){feedback('앞선 관찰과 비교를 마치면 내 탐구 배지를 받을 수 있어요.');return true;}
  if(researchReady(s,n)&&completeStage(s,n)){save();ctx.sound?.('reward');ctx.finishChapter(n);}
  return true;
 }
 return true;
}
export function mountChallenges(app,ctx){const get=()=>ids(ctx.state);const start=e=>{const item=e.target.closest('[data-challenge-item]');if(item)e.dataTransfer?.setData('text/plain',item.dataset.challengeItem);};const over=e=>{if(e.target.closest('[data-action="challenge-bin"]'))e.preventDefault();};const drop=e=>{const bin=e.target.closest('[data-action="challenge-bin"]'),v=get();if(!bin||!v)return;e.preventDefault();const item=e.dataTransfer?.getData('text/plain');if(!v.task.items?.some(x=>x.id===item))return;handleChallenge({...ctx,action:'challenge-drop',value:bin.dataset.value,itemId:item});};app.addEventListener('dragstart',start);app.addEventListener('dragover',over);app.addEventListener('drop',drop);return ()=>{app.removeEventListener('dragstart',start);app.removeEventListener('dragover',over);app.removeEventListener('drop',drop);};}
