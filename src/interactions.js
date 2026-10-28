import { creatures, terrains, timeLabel } from './data.js';
import { handleChallenge } from './challenges.js';

// Pointer Events support pen, mouse and touch; a short press still uses the
// existing two-tap/keyboard path. No learning credit is awarded by animation.
export function mountInteractions(app,ctx){
 const {state,save,render,feedback,sound,tideScene}=ctx,m=/^s([1-5])([abcd])$/.exec(state.route);
 if(!m)return ()=>{};const n=+m[1],step=m[2],d=state.drafts[n];
 let drag=null,ghost=null,timer=null,suppressUntil=0;
 const listeners=[];const on=(el,type,fn,options)=>{el?.addEventListener(type,fn,options);listeners.push(()=>el?.removeEventListener(type,fn,options));};
 app.querySelectorAll('[data-challenge-item]').forEach(el=>el.draggable=false);
 function selectSample(pick){app.querySelectorAll('[data-sample]').forEach(el=>{el.classList.toggle('selected',el===pick);el.setAttribute('aria-pressed',String(el===pick));});}
 selectSample([...app.querySelectorAll('[data-sample]')].find(el=>!['육지','바다'].includes(d.classifications?.[el.dataset.sample])));
 function assignSample(id,type){d.classifications[id]=type;save();render();sound('drop');}
 function stopTimelapse(){clearInterval(timer);timer=null;const button=app.querySelector('[data-timelapse]');if(button){button.textContent='시간 흐름 보기';button.setAttribute('aria-pressed','false');}}
 stopTimelapse();
 function updateLabStatus(){
  const status=app.querySelector('[data-lab-status]');if(!status)return;
  const inputs=['fresh','sea','heatFresh','heatSea'].map(field=>app.querySelector(`input[data-field="${field}"]`));if(inputs.some(input=>!input))return;
  const [fresh,sea,heatFresh,heatSea]=inputs.map(input=>Number(input.value)),sameAmount=fresh===sea,sameHeat=heatFresh===heatSea;
  status.classList.toggle('ready',sameAmount&&sameHeat);status.textContent=!sameAmount?'물의 양을 같게 맞춰 줘.':!sameHeat?'가열 세기를 같게 맞춰 줘.':'같은 양 · 같은 세기! 이제 결과를 예상해 봐.';
 }
 updateLabStatus();
 on(app,'click',e=>{
  if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();return;}
  const pick=e.target.closest('[data-sample]');if(pick){selectSample(pick);return;}
  const bin=e.target.closest('[data-sample-bin]');if(bin){const id=app.querySelector('[data-sample].selected')?.dataset.sample;if(id)assignSample(id,bin.dataset.sampleBin);else feedback('먼저 옮길 표본 카드를 골라 줘.');}
  if(e.target.closest('[data-timelapse]')){
   if(timer){stopTimelapse();return;}
   const button=app.querySelector('[data-timelapse]'),input=app.querySelector('[data-field="time"]');button.textContent='관측 멈춤';button.setAttribute('aria-pressed','true');
   if(d.time>=6){d.time=0;if(input){input.value=d.time;preview(input);}save();}
   timer=setInterval(()=>{d.time=Math.min(6,d.time+1);if(input){input.value=d.time;preview(input);}save();if(d.time===6)stopTimelapse();},1000);
  }
 },true);
 function preview(el){const field=el.dataset.field;if(field==='time'){
   const t=+el.value;app.querySelector('.tide-live').innerHTML=tideScene(t);app.querySelector('.timeline output').textContent=timeLabel(t);app.querySelector('.tide-work .panel-label').textContent=`${timeLabel(t)} · 같은 해안의 관측 모형`;
   for(const slot of ['a','b']){const button=app.querySelector(`[data-action="tide-save"][data-value="${slot}"]`);if(button){button.disabled=d[slot]===t;button.textContent=button.disabled?'✓ 이 시각 저장됨':`이 순간을 ${slot.toUpperCase()}에 담기`;}}
  }else if(['fresh','sea'].includes(field)){const index=field==='fresh'?0:1,beaker=app.querySelectorAll('.beaker')[index];beaker?.querySelector('.water')?.style.setProperty('height',`${el.value}%`);if(beaker)beaker.querySelector('.beaker-mark').textContent=`${el.value} mL`;}
  const output=el.closest('.range-field')?.querySelector('output');if(output)output.textContent=['heatFresh','heatSea'].includes(field)?(+el.value===1?'약하게':'세게'):`${el.value} mL`;
  if(['fresh','sea','heatFresh','heatSea'].includes(field))updateLabStatus();
 }
 on(app,'input',e=>{if(e.target.matches('[data-field="time"]'))stopTimelapse();if(e.target.matches('input[data-field]'))preview(e.target);if(e.target.matches('[data-compare]')){app.querySelector('.tide-wipe').style.setProperty('--wipe',`${e.target.value}%`);}});
 on(document,'visibilitychange',()=>{if(document.hidden)stopTimelapse();});
 on(app,'pointerdown',e=>{
  if(e.button!==0)return;const source=e.target.closest('[data-challenge-item],[data-sample],[data-action="challenge-order"]');const coast=e.target.closest('.coast-view'),lens=e.target.closest('.survey-lens');
  if(!source&&!lens&&(!coast||e.target.closest('button,input,label')))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,source,coast,lens,startPan:d.pan,moved:false};
  (source||coast||lens).setPointerCapture?.(e.pointerId);
 });
 on(app,'pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<9)return;drag.moved=true;e.preventDefault();
  if(drag.source){
   if(!ghost){ghost=document.createElement('div');ghost.className='drag-ghost';ghost.textContent=drag.source.querySelector('span')?.textContent||drag.source.textContent;document.body.append(ghost);drag.source.classList.add('is-dragging');}
   ghost.style.left=`${e.clientX}px`;ghost.style.top=`${e.clientY}px`;
   app.querySelectorAll('.is-drop-target').forEach(el=>el.classList.remove('is-drop-target'));
   document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-action="challenge-bin"],[data-sample-bin],.challenge-sequence')?.classList.add('is-drop-target');
  }else if(drag.coast){
   const box=drag.coast.getBoundingClientRect();const pan=Math.max(0,Math.min(100,drag.startPan-dx/box.width*100));d.pan=pan;drag.coast.style.backgroundPosition=`${pan}% center`;app.querySelector('[data-field="pan"]').value=pan;
   drag.coast.querySelectorAll('.hotspot').forEach((el,i)=>{const initial=terrains[i].x;el.style.left=`${Math.max(6,Math.min(94,initial*1.2-pan*.2))}%`;});
  }else if(drag.lens){
   const area=drag.lens.closest('.mudflat-view'),box=area.getBoundingClientRect(),x=Math.max(8,Math.min(92,(e.clientX-box.left)/box.width*100)),y=Math.max(15,Math.min(85,(e.clientY-box.top)/box.height*100));
   drag.lens.style.left=`${x}%`;drag.lens.style.top=`${y}%`;drag.lens.style.backgroundPosition=`${x}% ${y}%`;drag.near=creatures.find(c=>Math.hypot(c.x-x,(c.y-y)*box.height/box.width)<13);
   drag.lens.classList.toggle('has-trace',!!drag.near);
  }
 });
 function end(e,cancelled=false){
  if(!drag||drag.id!==e.pointerId)return;const old=drag;drag=null;ghost?.remove();ghost=null;old.source?.classList.remove('is-dragging');app.querySelectorAll('.is-drop-target').forEach(el=>el.classList.remove('is-drop-target'));
  if(!old.moved||cancelled)return;suppressUntil=performance.now()+200;
  if(old.source){const bin=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-action="challenge-bin"],[data-sample-bin],.challenge-sequence');if(!bin)return;
   if(old.source.dataset.sample&&bin.dataset.sampleBin)assignSample(old.source.dataset.sample,bin.dataset.sampleBin);
   else if(old.source.dataset.challengeItem&&bin.dataset.action==='challenge-bin'){
    handleChallenge({...ctx,action:'challenge-drop',value:bin.dataset.value,itemId:old.source.dataset.challengeItem});
   }else if(old.source.dataset.action==='challenge-order'&&bin.classList.contains('challenge-sequence')){handleChallenge({...ctx,action:'challenge-order',value:old.source.dataset.value});}
  }else if(old.coast){save();sound('scan');}
  else if(old.near){d.selected=old.near.id;save();render();sound('scan');}
 }
 on(app,'pointerup',end);on(app,'pointercancel',e=>end(e,true));on(app,'lostpointercapture',e=>end(e,true));
 return ()=>{listeners.forEach(fn=>fn());clearInterval(timer);ghost?.remove();drag=null;};
}

export function tideComparison(a,b,scene){return `<div class="tide-wipe" style="--wipe:50%"><div class="tide-wipe-before">${scene(a)}</div><div class="tide-wipe-after">${scene(b)}</div><div class="wipe-line"></div><span class="wipe-label label-a">A · ${timeLabel(a)}</span><span class="wipe-label label-b">B · ${timeLabel(b)}</span></div><label class="compare-slider">비교선을 움직여 같은 기둥을 살펴봐<input type="range" min="0" max="100" value="50" data-compare aria-label="A와 B 장면 비교선"></label>`;}
