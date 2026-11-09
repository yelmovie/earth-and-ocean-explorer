import { sites, terrains, creatures, timeLabel } from './data.js';
import { aReady } from './state.js';
import { icon } from './icons.js';

const playable = new Set(['s1a', 's2a', 's2b', 's3a', 's4a', 's4b', 's5a']);
// Playback belongs to this visit, never to the learner's saved answers.
const playback = { route: '', playing: false, speed: 1, heating: false, progress: 0, phase: 0 };
let activeHeat;
export function activityControls(route) {
  if (!playable.has(route)) return '';
  return `<div class="activity-playback" aria-label="실험 자동재생"><button type="button" data-autoplay aria-pressed="false">${icon('play')}<span>자동재생</span></button><label><span class="sr-only">재생 속도</span><select data-playback-speed aria-label="재생 속도">${[0.5,1,2,3].map(speed=>`<option value="${speed}" ${speed===playback.speed?'selected':''}>${speed}배속</option>`).join('')}</select></label></div>`;
}
export function startActivityHeating() { activeHeat?.(); }

export function stageGuide(state) {
  const route=state.route,n=Number(route[1]),d=state.drafts[n];
  if(!d)return null;
  const choice=field=>`[data-field="${field}"]`;
  if(route==='s1a') {
    const next=sites.find(site=>!d.samples.includes(site.id));
    if(next)return [`${next.name}을 눌러 관찰해요. 자동재생으로 차례로 볼 수도 있어요.`,`[data-action="site"][data-value="${next.id}"]`];
    if(!d.atmosphere)return ['대기 관찰을 눌러 지구를 둘러싼 공기를 살펴봐요.','[data-action="atmosphere"]'];
  }
  if(route==='s1b') {
    if(d.samples.some(id=>!d.classifications[id]))return ['강조된 표본을 살펴보고 육지 또는 바다를 눌러요.','[data-sample].selected'];
    if(!d.conclusion)return ['전체 면적 그림과 표본을 비교해 설명을 골라요.',choice('conclusion')];
  }
  if(route==='s2a') {
    if(d.fresh!==d.sea)return ['두 물의 양을 같게 맞춰요.',choice('sea')];
    if(d.heatFresh!==d.heatSea)return ['두 가열 세기도 같게 맞춰요.',choice('heatSea')];
    if(!d.prediction)return ['조건을 맞췄어요. 가열 뒤의 결과를 직접 예상해요.',choice('prediction')];
  }
  if(route==='s2b') {
    if(!d.heated)return ['자동재생 또는 가열하기를 눌러 물의 변화를 관찰해요.','[data-action="heat"]'];
    if(!d.residue)return ['두 그릇의 바닥을 비교하고 관찰한 결과를 골라요.',choice('residue')];
    if(!d.reason)return ['남은 물질이 어디에서 왔는지 설명을 골라요.',choice('reason')];
  }
  if(route==='s3a'&&!aReady(state,3))return ['장면의 ＋를 눌러 네 지형을 촬영해요.','[data-action="target"]:not(.selected)'];
  if(route==='s3b') {
    const next=terrains.find(t=>!d.pins[t.id]||!d.features[t.id]);
    if(next)return !d.pins[next.id]?[`${next.name} 사진에서 특징이 보이는 곳을 눌러요.`,`[data-action="pin"][data-value="${next.id}"]`]:[`${next.name} 사진에 알맞은 특징을 골라요.`,choice(`features.${next.id}`)];
    if(!d.compare)return ['동굴과 구멍 난 바위의 차이를 골라요.',choice('compare')];
  }
  if(route==='s4a'&&!aReady(state,4))return d.a===null?['앞선 시각을 A에 담아요. 자동재생으로 두 순간을 기록할 수도 있어요.','[data-action="tide-save"][data-value="a"]']:['시간을 움직여 물 높이가 다른 나중 순간을 B에 담아요.',choice('time')];
  if(route==='s4b') {
    if(d.markers.length<2)return ['비교선을 움직이고 기둥과 바위를 각각 확인해요.','[data-compare]'];
    if(!d.direction)return ['A에서 B로 물 높이가 어떻게 변했는지 골라요.',choice('direction')];
    if(!d.concept)return ['관찰한 변화의 이름을 골라요.',choice('concept')];
  }
  if(route==='s5a') {
    if(d.selected&&!d.found.includes(d.selected))return ['확대한 생물에서 보이는 특징을 직접 골라요.','[data-action="observe-feature"]'];
    const next=creatures.find(c=>!d.found.includes(c.id));
    if(next)return ['갯벌의 흔적을 눌러 생물을 확대해요.',`[data-action="creature"][data-value="${next.id}"]`];
  }
  if(route==='s5b') {
    if(!d.value)return ['관찰한 생물들의 집인 갯벌의 가치를 골라요.',choice('value')];
    if(!d.action)return ['생물의 집을 지킬 보호 약속을 골라요.',choice('action')];
  }
  return ['선택을 마쳤으면 다음 버튼을 눌러 이어 가요.','.mission-footer > .primary'];
}

export function mountActivityFlow(app,ctx) {
  const {state,save,render,tideScene,sound}=ctx,route=state.route;
  if(playback.route!==route)Object.assign(playback,{route,playing:false,heating:false,progress:0,phase:0});
  if(!/^s[1-5][ab]$/.test(route)){activeHeat=null;return ()=>{};}
  const n=Number(route[1]),d=state.drafts[n],button=app.querySelector('[data-autoplay]'),speed=app.querySelector('[data-playback-speed]');
  let disposed=false,timer,last=performance.now(),automatic=false;
  const listeners=[];
  const on=(el,type,fn,options)=>{el?.addEventListener(type,fn,options);listeners.push(()=>el?.removeEventListener(type,fn,options));};
  const clear=()=>{clearTimeout(timer);timer=null;};
  function guide(message) {
    app.querySelectorAll('.next-target').forEach(el=>el.classList.remove('next-target'));
    const [text,target]=stageGuide(state),hint=app.querySelector('#hint');
    if(hint)hint.textContent=message||text;
    const el=app.querySelector(target);
    // Choice groups receive an outline as a whole, never an answer hint.
    (el?.closest('.choices')||el)?.classList.add('next-target');
  }
  function sync() {
    if(button){button.setAttribute('aria-pressed',String(playback.playing));button.innerHTML=`${icon(playback.playing?'pause':'play')}<span>${playback.playing?'직접 해보기':playback.heating?'이어보기':'자동재생'}</span>`;}
    app.classList.toggle('activity-playing',playback.playing);
    if(playback.heating) {
      const visual=app.querySelector('#experiment-visual');visual?.classList.add('playback-heating');
      visual?.querySelectorAll('.water').forEach((water,i)=>water.style.height=`${(i?d.sea:d.fresh)*(1-playback.progress)}%`);
      const heat=app.querySelector('[data-action="heat"]');
      if(heat){heat.disabled=true;heat.textContent=`가열 ${Math.round(playback.progress*100)}%`;}
      let progress=app.querySelector('.experiment-progress');
      if(!progress){progress=document.createElement('progress');progress.className='experiment-progress';progress.max=1;progress.setAttribute('aria-label','가열 진행률');visual?.after(progress);}
      progress.value=playback.progress;
    }
  }
  function stop(message) {clear();playback.playing=false;sync();guide(message);}
  function click(selector) {
    const el=app.querySelector(selector);if(!el||el.disabled)return false;
    automatic=true;try{el.click();}finally{automatic=false;}
    return true;
  }
  function field(name,value) {
    const el=app.querySelector(`[data-field="${name}"]`);if(!el)return;
    automatic=true;try{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}finally{automatic=false;}
  }
  function heat() {
    Object.assign(playback,{heating:true,progress:0,playing:true});
    Object.assign(d,{view:'before',heated:false,seenBefore:true});
    sound('heat');save();render();
  }
  function tick() {
    if(disposed||!playback.playing)return;
    if(document.hidden||document.querySelector('dialog[open]')){stop();return;}
    if(playback.heating) {
      const now=performance.now();playback.progress=Math.min(1,playback.progress+(now-last)*playback.speed/3200);last=now;sync();
      if(playback.progress===1){Object.assign(playback,{heating:false,playing:false});Object.assign(d,{heated:true,seenBefore:true,seenAfter:true,view:'after'});save();render();return;}
    } else if(route==='s1a') {
      const site=sites.find(site=>!d.samples.includes(site.id));
      if(site)click(`[data-action="site"][data-value="${site.id}"]`);
      else if(!d.atmosphere)click('[data-action="atmosphere"]');
      else {stop('관찰을 마쳤어요. 다음 · 비교하기를 눌러요.');return;}
    } else if(route==='s2a') {
      if(d.fresh!==d.sea)field('sea',d.fresh);
      else if(d.heatFresh!==d.heatSea)field('heatSea',d.heatFresh);
      else {stop('조건을 맞췄어요. 결과는 직접 예상해 주세요.');return;}
    } else if(route==='s2b') {d.view='before';d.seenBefore=true;heat();return;
    } else if(route==='s3a') {
      const target=terrains.find(t=>!d.photos.includes(t.id));
      if(target)click(`[data-action="target"][data-value="${target.id}"]`);
      else {stop('네 지형을 촬영했어요. 다음 · 비교하기를 눌러요.');return;}
    } else if(route==='s4a') {
      if(playback.phase===0){d.time=0;d.a=0;d.b=null;playback.phase=1;save();render();return;}
      const t=Math.min(3,d.time+1);d.time=t;
      const input=app.querySelector('[data-field="time"]');if(input)input.value=t;
      app.querySelector('.tide-live').innerHTML=tideScene(t);app.querySelector('.timeline output').textContent=timeLabel(t);
      app.querySelector('.tide-work .panel-label').textContent=`${timeLabel(t)} · 같은 해안의 관측 모형`;
      if(t===3){d.b=3;playback.playing=false;playback.phase=0;save();render();return;}save();
    } else if(route==='s4b') {
      const positions=[0,25,50,75,100,75,50],value=positions[playback.phase++];
      if(value===undefined){playback.phase=0;stop('같은 기둥과 바위를 확인하고 변화와 이름을 직접 골라요.');return;}
      const input=app.querySelector('[data-compare]');input.value=value;automatic=true;try{input.dispatchEvent(new Event('input',{bubbles:true}));}finally{automatic=false;}
      if(playback.phase===3&&!d.markers.includes('pole')){d.markers.push('pole');save();}
      if(playback.phase===5&&!d.markers.includes('rock')){d.markers.push('rock');save();}
      app.querySelectorAll('[data-action="marker"]').forEach(el=>{if(d.markers.includes(el.dataset.value)){el.classList.add('selected');el.textContent=`✓ ${el.dataset.value==='pole'?'기둥':'바위'} 확인`;}});
    } else if(route==='s5a') {
      const next=creatures.find(c=>!d.found.includes(c.id));
      playback.playing=false;
      if(next){click(`[data-action="creature"][data-value="${next.id}"]`);sync();guide('확대한 생물의 특징을 직접 골라요. 다음 생물도 자동재생으로 찾을 수 있어요.');}
      else stop('생물 관찰을 마쳤어요. 다음 · 비교하기를 눌러요.');
      return;
    }
    if(!disposed){guide(playback.heating?'물의 변화를 관찰해요.':undefined);schedule();}
  }
  function schedule() {clear();if(playback.playing&&!disposed)timer=setTimeout(tick,playback.heating?60:1400/playback.speed);}
  on(button,'click',()=>{if(playback.playing)stop('잠시 멈췄어요. 재생 버튼을 누르면 이어져요.');else{playback.playing=true;last=performance.now();sync();schedule();}});
  on(speed,'change',()=>{playback.speed=Number(speed.value);last=performance.now();schedule();});
  on(app,'click',e=>{if(automatic||e.target.closest('[data-autoplay],.activity-playback'))return;if(playback.playing)stop();queueMicrotask(()=>{if(!disposed)guide();});},{capture:true});
  on(app,'pointerdown',e=>{if(e.target.closest('input[data-field],[data-compare],.survey-lens,.coast-view')&&playback.playing)stop();});
  on(app,'input',e=>{if(!automatic&&e.target.matches('[data-field],[data-compare]')){if(route==='s4a')playback.phase=0;if(playback.playing)stop();}});
  on(document,'visibilitychange',()=>{if(document.hidden)stop();});
  activeHeat=heat;guide();sync();schedule();
  return ()=>{disposed=true;clear();listeners.forEach(off=>off());activeHeat=null;};
}
