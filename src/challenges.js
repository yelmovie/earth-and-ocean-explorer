import { companion } from './companion.js';
import { chapters, asset } from './data.js';
import { pageChallenges, correctResponse, pageReady, researchReady } from './challenge-data.js';
import { baseStageValid, completeStage } from './state.js';
import { icon } from './icons.js';
import { specimen } from './specimens.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,value='',cls='',disabled=false)=>'<button class="'+cls+'" data-action="'+action+'" data-value="'+esc(value)+'" '+(disabled?'disabled':'')+'>'+text+'</button>';
const selected=new Map();const errors=new Set();
const ids=s=>{const m=/^s([1-5])([cd])$/.exec(s.route);if(!m)return null;const n=+m[1],step=m[2],r=s.research[n],tasks=pageChallenges(n,step),task=tasks[r[step]??0];return {n,step,r,tasks,task,key:n+'-'+task.id};};
function visual(task,n){
 if(task.art==='ratio')return '<div class="ratio-grid" role="img" aria-label="지구 전체 면적을 같은 크기의 칸으로 단순화한 비교 그림. 물결 무늬는 바다, 점 무늬는 육지예요.">'+Array.from({length:20},(_,i)=>'<i aria-hidden="true" class="'+(i<14?'sea':'land')+'"></i>').join('')+'<p><span class="legend-sea">바다 · 물결</span><span class="legend-land">육지 · 점</span></p></div><p class="visual-caption">같은 크기의 칸으로 전체 넓이를 비교한 모형이에요.</p>';
 if(['incoming','outgoing','tide'].includes(task.art)){
  const outgoing=task.art==='outgoing',same=task.id==='same-level',three=task.id==='time-order';
  const heights=three?[30,75,30]:same?[30,30]:outgoing?[75,30]:[30,75];
  const labels=three?['06:00','09:00','12:00']:same?['A · 앞선 기록','B · 나중 기록']:outgoing?['A · 09:00','B · 12:00']:task.art==='incoming'?['A · 06:00','B · 09:00']:['A · 앞선 기록','B · 나중 기록'];
  return '<div class="challenge-tide-pair '+(three?'three-records':'')+'">'+heights.map((h,i)=>'<figure><figcaption>'+labels[i]+'</figcaption><svg viewBox="0 0 260 170" role="img" aria-label="'+(h===75?'물이 높아 같은 기둥과 바위가 더 잠긴 모습':'물이 낮아 같은 기둥과 바위가 더 드러난 모습')+'"><image class="tide-foreshore" href="'+asset('tide-foreshore')+'" width="260" height="170" preserveAspectRatio="xMidYMid slice"/><path d="M46 154 63 88 81 77 104 93 116 156Z" fill="#73877d"/><path d="m63 88 18-11 10 78H46Z" fill="#8e9d8c"/><rect x="181" y="32" width="15" height="128" rx="3" fill="#996b48"/><path d="M181 50h15m-15 20h15m-15 20h15m-15 20h15m-15 20h15" stroke="#fff7df" stroke-width="3"/><path d="M0 '+(156-h)+'Q70 '+(146-h)+' 135 '+(156-h)+'T260 '+(156-h)+'V170H0Z" fill="#3299ad" opacity=".83"/><path d="M0 '+(156-h)+'Q70 '+(146-h)+' 135 '+(156-h)+'T260 '+(156-h)+'" fill="none" stroke="#e2ffff" stroke-width="3"/><path d="M14 155h27m85-10h33m54 12h25" stroke="#a1dadc" stroke-width="2"/></svg></figure>').join('')+'</div><p class="visual-caption">같은 기둥의 눈금과 바위의 드러난 부분을 살펴봐요.</p>';
 }
 if(['life','poster'].includes(task.art))return '<div class="challenge-creatures">'+[['crab','게'],['skipper','짱뚱어'],['reed','갈대']].map(([id,label])=>'<figure><div>'+specimen(id)+'</div><figcaption>'+label+'</figcaption></figure>').join('')+'</div><p class="visual-caption">생김새와 움직임을 함께 살펴본 관찰 표본이에요.</p>';
 if(task.art==='earth')return '<div class="challenge-earth"><svg viewBox="0 0 320 220" role="img" aria-label="공기층에 둘러싸인 지구의 육지와 바다를 나타낸 모형"><defs><radialGradient id="earth-ocean-'+task.id+'" cx="35%" cy="30%"><stop stop-color="#65bed0"/><stop offset=".7" stop-color="#287f9c"/><stop offset="1" stop-color="#15516e"/></radialGradient></defs><ellipse cx="160" cy="199" rx="70" ry="9" fill="#173f4b12"/><circle cx="160" cy="106" r="98" fill="#cae8e9"/><circle cx="160" cy="106" r="90" fill="#b0d9dc"/><circle cx="160" cy="106" r="82" fill="url(#earth-ocean-'+task.id+')"/><path d="m123 39 22 12 9 17-14 17-24-3-14 16-20-10 3-23 17-12zm-10 66 22 4 15 20-10 21-5 24-13-13-4-25-15-13zm69-68 25 9 19 17-8 19-22-2-7 17-18-12 8-18-9-13zm-4 71 27-8 22 19-7 18-22-3-11 27-16-14-5-25z" fill="#a4bd76" stroke="#c7d799" stroke-width="2"/><path d="M112 53q42-18 74 2M91 111q71 21 135-6" fill="none" stroke="#e9f8ef" stroke-width="5" opacity=".35"/></svg><div class="earth-components"><span class="component-land">육지</span><span class="component-sea">바다</span><span class="component-air">대기 · 지구를 둘러싼 공기</span></div></div><p class="visual-caption">육지와 바다는 지표를, 대기는 지구 바깥의 공기층을 나타내요.</p>';
 if(task.art==='lab'){
  const unequal=task.id==='unequal-water',heat=task.id==='heat-fix';
  return '<div class="challenge-lab"><div class="lab-model-pair">'+[['육지의 물',unequal?20:40,1],['바닷물',unequal?60:40,heat?2:1]].map(([label,amount,power])=>'<figure><figcaption>'+label+'</figcaption><div class="lab-model-glass"><div class="lab-model-water" style="--water-level:'+amount+'%"></div><span class="lab-model-ticks" aria-hidden="true"></span><b>'+amount+' mL</b></div><div class="lab-model-plate" aria-hidden="true"></div><p class="lab-model-heat">가열 세기 · '+(power===1?'약하게':'세게')+'</p></figure>').join('')+'</div><p class="visual-caption">물의 양과 가열 조건을 나란히 살펴봐요.<br>가열은 어른의 안내에 따라 안전하게 해요.</p></div>';
 }
 if(task.art==='residue'){
  const unknown=task.id==='unknown-water';
  return '<div class="residue-record"><span class="visual-record-label">가열 뒤의 관찰 기록</span><div class="challenge-residue">'+(unknown?[['표본 A',true],['표본 B',false]]:[['육지의 물',false],['바닷물',true]]).map(([label,residue])=>'<div><span>'+label+'</span><i class="'+(residue?'has-residue':'')+'" role="img" aria-label="'+(residue?'흰 물질이 뚜렷하게 남은 그릇':'남은 물질이 거의 보이지 않는 그릇')+'"></i><small>'+(residue?'흰 흔적이 더 뚜렷해요':'거의 남지 않았어요')+'</small></div>').join('')+'</div></div><p class="visual-caption">물은 줄어들고, 녹아 있던 물질은 그릇에 남을 수 있어요.</p>';
 }
 if(['arch','cliff'].includes(task.art)){
  const arch=task.art==='arch';
  return '<figure class="coast-detail-model"><svg viewBox="0 0 380 260" role="img" aria-label="'+(arch?'바위의 뚫린 공간 너머로 하늘과 바다가 보이는 해안':'단단한 바위 면이 높고 가파르게 서 있는 해안')+'"><rect width="380" height="260" fill="#cfe8ed"/><path d="M0 134q90-9 190 3t190-6V260H0Z" fill="#65b4bc"/><path d="M0 173q90-6 190 8t190-5" stroke="#e1f3eb" stroke-width="5" fill="none"/><path d="M0 218Q150 195 380 222V260H0Z" fill="#d3bd92"/>'+(arch?'<path d="M62 214 72 107 100 72 146 58 198 65 247 90 264 218Z" fill="#928c77"/><path d="M62 214 72 107 100 72 146 58 129 92 109 218Z" fill="#b2aa8c"/><path d="M130 222V139q0-39 34-40t39 42v81Z" fill="#cfe8ed"/><path d="M130 150q33-4 73 0v72h-73Z" fill="#65b4bc"/><path d="M131 180q33 4 72 0" fill="none" stroke="#e1f3eb" stroke-width="4"/><path d="m98 100 21-5m97 12 25 9m-149 40 17-3m102 30 42 9" stroke="#716f61" stroke-width="4"/>':'<path d="M0 49 79 28 153 43 222 22 249 57 245 206 193 222 128 205 76 217 0 200Z" fill="#a29e85"/><path d="m79 28 20 167 29 10-5-169zm74 15 12 165 28 14-2-193zm69-21 27 35-4 149-25 9Z" fill="#7c8276"/><path d="M0 49 79 28 153 43 222 22 249 57 216 66 154 61 78 49 0 67Z" fill="#a7bb86"/><path d="m39 91 49-4m27 46 43 5m40-38 45-8m-91 95 32-6" stroke="#6e796f" stroke-width="4"/>')+'<path d="M281 219h38m7-21h37M278 155h25" fill="none" stroke="#dff1e6" stroke-width="3"/></svg><figcaption>재료와 모양을 살펴보는 해안 모형</figcaption></figure>';
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
 if(task.type==='choice')return '답을 고르면 바로 확인돼요.';
 if(task.type==='multi'){const count=response?.length??0;return count>task.answer.length?'두 가지만 남겨 주세요. 선택한 답을 다시 누르면 취소돼요.':count+' / '+task.answer.length+'개 선택 · 두 가지를 고르면 바로 확인돼요.';}
 if(task.type==='order')return (response?.length??0)+' / '+task.items.length+'장 배치 · 모두 놓으면 바로 확인돼요.';
 return task.items.filter(item=>response?.[item.id]).length+' / '+task.items.length+'개 연결 · 강조된 카드의 알맞은 곳을 눌러요.';
}
function interaction(task,response,key){
 if(task.type==='choice'||task.type==='multi')return '<div class="challenge-options">'+task.options.map((o,i)=>{const chosen=task.type==='multi'?(response??[]).includes(o.id):response===o.id;return '<button class="challenge-option '+(chosen?'selected':'')+'" data-action="challenge-answer" data-value="'+esc(o.id)+'" aria-pressed="'+chosen+'"><span class="option-key">'+(i+1)+'</span><span>'+esc(o.label)+'</span>'+(task.type==='multi'?icon(chosen?'check':'circle'):'')+'</button>';}).join('')+'</div>';
 if(task.type==='order')return '<div class="challenge-sequence" aria-label="내가 만든 순서">'+(response??[]).map((id,i)=>'<div><b>'+(i+1)+'</b>'+esc(task.items.find(x=>x.id===id)?.label)+'</div>').join('')+'</div><div class="challenge-items">'+task.items.map(item=>button(esc(item.label),'challenge-order',item.id,'challenge-item',(response??[]).includes(item.id))).join('')+'</div>'+button('마지막 카드 되돌리기','challenge-undo','','text-button',!(response??[]).length);
 const current=activeItem(task,response,key);
 return '<div class="challenge-sort-area"><div class="challenge-items">'+task.items.map(item=>'<button class="challenge-item '+(current===item.id?'selected':'')+' '+(response?.[item.id]?'assigned':'')+'" draggable="true" data-challenge-item="'+item.id+'" data-action="challenge-pick" data-value="'+item.id+'" aria-pressed="'+(current===item.id)+'"><span>'+esc(item.label)+'</span><small>'+esc(task.bins.find(b=>b.id===response?.[item.id])?.label??'')+'</small></button>').join('')+'</div><div class="challenge-bins">'+task.bins.map(bin=>button('<strong>'+esc(bin.label)+'</strong><span>'+task.items.filter(x=>response?.[x.id]===bin.id).length+'개 연결</span>','challenge-bin',bin.id,'challenge-bin',!current)).join('')+'</div></div>';
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
 return '<section class="learning challenge-page"><div class="page-heading"><div><p class="eyebrow">'+chapters[n-1].title+' · '+(step==='c'?'확장 도전':'새 상황에 적용')+'</p><h1>'+esc(task.title)+'</h1><p>'+esc(task.prompt)+'</p></div><nav class="step-tabs" aria-label="탐사 단계">'+['a','b','c','d'].map((p,i)=>button((i+1)+'. '+['관찰','비교','도전','적용'][i],'go','s'+n+p,p===step?'active':'',!s.settings.unlockAll&&(p==='d'&&!pageReady(s,n,'c')))).join('')+'</nav></div>'+(practice?'<div class="practice-banner">연습 · 관찰과 비교를 마치면 내 기록으로 저장돼요.</div>':'')+'<nav class="challenge-progress" aria-label="현재 활동의 문제">'+tasks.map((t,i)=>button((r.solved.includes(t.id)?icon('check'):(i+1))+'<span>'+esc(t.title)+'</span>','challenge-task',i,i===(r[step]??0)?'active':'')).join('')+'</nav><div class="challenge-layout"><aside class="challenge-card challenge-observation"><span class="tag">관찰 자료</span>'+visual(task,n)+'</aside><div class="challenge-board challenge-card"><div class="challenge-board-heading"><span class="tag">'+(step==='c'?'도전':'적용')+' '+((r[step]??0)+1)+' / 4</span><span>'+(task.type==='multi'?'두 가지 선택':task.type==='order'?'순서 만들기':task.type==='match'?'특징 연결':task.type==='sort'?'분류하기':'근거로 판단')+'</span></div>'+interaction(task,r.answers[task.id],key)+'</div></div><footer class="mission-footer"><div class="challenge-feedback '+(solved?'good':'')+'" role="status">'+status+'</div>'+companion(s,n,step,errors.has(key))+'<p class="challenge-page-count">'+icon('book')+' 이번 장의 확장 기록 <b>'+r.solved.length+' / 8</b></p>'+challengeAdvance(s,n,step,tasks,task,solved,done)+'</footer></section>';
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
   errors.delete(key);return true;
  }
  errors.add(key);s.revised++;return false;
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
