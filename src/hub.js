import './hub.css';
import { chapters } from './data.js';
import { illustration } from './illustrations.js';
import { canAccess } from './state.js';
import { hubMap, hubDoors, hubSegments, hubDistance, nearestHubRoad, canStandInHub, moveHubPoint, findHubPath, createHubInput } from './hub-world.js';

let returningFrom = null;
let seenCompleted = null;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function pixelTree(c,x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);rect(c,-3,-7,6,23,'#76553e');poly(c,[[0,-55],[-20,-22],[-11,-22],[-27,0],[24,0],[12,-22],[20,-22]],'#23594b');poly(c,[[0,-50],[-14,-24],[-6,-24],[-18,-5],[0,-5]],'#4c8361');rect(c,1,-34,7,5,'#669166');c.restore();}
function fallbackTerrain(c){
  rect(c,0,0,960,540,'#1686a4');for(let i=0;i<200;i++)rect(c,(i*73)%960,(i*97)%540,9+i%13,1,i%2?'#3eabb8':'#50b9c3');
  const outline=[[126,57],[360,13],[650,33],[822,93],[887,253],[790,390],[659,484],[410,512],[173,457],[77,316],[63,169]];
  poly(c,outline.map(([x,y])=>[x,y+17]),'#46746d');poly(c,outline,'#d5bf83');poly(c,outline.map(([x,y])=>[480+(x-480)*.94,270+(y-270)*.94]),'#8ba96d');
  for(let i=0;i<470;i++){const x=130+(i*71)%650,y=60+(i*47)%410;rect(c,x,y,2+i%3,2,i%5?'#83a265':'#e6d58f');}
  c.lineCap='round';for(const [a,b]of hubSegments){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#bba678';c.lineWidth=43;c.stroke();c.strokeStyle='#ead7a4';c.lineWidth=36;c.stroke();}
  for(const door of hubDoors)ellipse(c,door.buildingX,door.buildingY+2,64,38,'#e7d4a2');
  [[130,165],[320,100],[430,100],[520,70],[750,80],[816,185],[830,350],[640,450],[420,435],[155,343],[365,345],[650,290]].forEach(([x,y],i)=>pixelTree(c,x,y,.8+i%3*.2));
}
function building(c,door,index,done,t,reduced){
  const x=door.buildingX,y=door.buildingY,roof=['#528baf','#ca8854','#72946f','#6f90b8','#aa775a'][index];
  if(done){const glow=c.createRadialGradient(x,y,2,x,y,80);glow.addColorStop(0,'#fff5b66b');glow.addColorStop(1,'#ffec9d00');c.fillStyle=glow;c.fillRect(x-80,y-80,160,160);}
  ellipse(c,x+3,y+26,54,15,'#3459483b');
  poly(c,[[x-38,y-8],[x+1,y-27],[x+39,y-9],[x,y+11]],'#f2e4bd');poly(c,[[x-38,y-8],[x,y+11],[x,y+43],[x-38,y+23]],'#dfc99b');poly(c,[[x,y+11],[x+39,y-9],[x+39,y+23],[x,y+43]],'#b29c72');rect(c,x-34,y+20,31,3,'#c0a67a');
  poly(c,[[x-45,y-10],[x-5,y-50],[x+46,y-11],[x,y+15]],roof);poly(c,[[x-45,y-10],[x-5,y-50],[x-4,y-13],[x,y+15]],'#3b656b');
  for(let k=0;k<4;k++)poly(c,[[x-31+k*8,y-9-k*7],[x-24+k*8,y-16-k*7],[x+9+k*6,y+8-k*4],[x+3+k*6,y+12-k*4]],'#ffffff15');
  poly(c,[[x-16,y+12],[x-6,y+17],[x-6,y+39],[x-16,y+34]],'#385751');poly(c,[[x-29,y+3],[x-21,y+7],[x-21,y+20],[x-29,y+16]],done?'#fff1a0':'#85b3b7');poly(c,[[x+11,y+12],[x+28,y+3],[x+28,y+16],[x+11,y+25]],done?'#ffe69a':'#6c9299');poly(c,[[x-19,y+34],[x-6,y+40],[x-12,y+44],[x-25,y+39]],'#f4e2b4');
  if(index===0){ellipse(c,x-3,y-47,23,17,'#d3e6dc');rect(c,x-26,y-48,46,5,'#739a9e');rect(c,x-2,y-70,3,11,'#f6e5af');rect(c,x+1,y-69,14,7,'#65b3c1');poly(c,[[x+14,y-43],[x+31,y-58],[x+36,y-51],[x+20,y-36]],'#345d70');ellipse(c,x+33,y-55,5,6,'#a5d4df');}
  if(index===1){rect(c,x+20,y-47,11,28,'#9dbcc0');rect(c,x+18,y-49,15,5,'#e3e8d2');rect(c,x+23,y-58,5,10,'#b2d9ce');rect(c,x+43,y+13,24,17,'#7b6648');rect(c,x+46,y+9,6,10,'#93d3bb');rect(c,x+56,y+4,7,15,'#efc975');}
  if(index===2){rect(c,x-6,y-60,12,20,'#ecdcad');rect(c,x-10,y-62,20,5,'#759ba4');rect(c,x-2,y-72,3,12,'#3f6f77');poly(c,[[x-2,y-73],[x+21,y-68],[x-2,y-63]],done?'#f7de7a':'#8da8a3');rect(c,x+40,y+12,25,5,'#886548');rect(c,x+43,y+16,3,17,'#795c43');rect(c,x+59,y+16,3,17,'#795c43');rect(c,x+45,y+4,13,9,'#e5e4be');}
  if(index===3){rect(c,x-10,y-75,22,37,'#e5ead5');rect(c,x-10,y-64,22,8,'#598da3');rect(c,x-14,y-81,30,9,'#476b7a');rect(c,x-8,y-91,18,10,done?'#fff4ab':'#afcec9');poly(c,[[x-16,y-91],[x+1,y-104],[x+17,y-91]],'#bc765d');rect(c,x-12,y-38,26,6,'#e4d6aa');}
  if(index===4){rect(c,x+25,y-13,7,38,'#846646');ellipse(c,x+30,y-32,26,17,'#61804e');ellipse(c,x+42,y-39,17,16,'#779553');ellipse(c,x+13,y-35,20,18,'#8ca55e');rect(c,x-49,y+18,16,16,'#987e54');rect(c,x-47,y+21,12,8,done?'#cce7a5':'#b8c69b');}
  rect(c,x+44,y-44,3,47,'#8b704c');rect(c,x+47,y-44,16,11,done?'#f5d572':'#e2dcc0');
  if(done){rect(c,x+50,y-41,3,3,'#3e8067');rect(c,x+53,y-38,5,3,'#3e8067');for(let i=0;i<3;i++){const phase=reduced?.5:(t/1800+i/3)%1;rect(c,x-30+i*28+Math.sin(i*2)*9,y+17-phase*65,2,2,'#fff8bd');}}
}
function explorer(c,image,x,y,t,walking,facing,reduced,height){
  if(!image.complete||!image.naturalWidth)return;
  const bob=walking&&!reduced?Math.sin(t/110)*1.8:0;
  const lean=walking&&!reduced?Math.sin(t/220)*.025:0;
  const width=height*image.naturalWidth/image.naturalHeight;
  ellipse(c,x,y+2,height*.22,4,'#173d4b3b');
  c.save();c.translate(x,y+bob);if(facing<0)c.scale(-1,1);c.rotate(lean);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(image,-width/2,-height+3,width,height);c.restore();
}

export function mountHub(canvas,s,onArrive){
  const c=canvas.getContext('2d'),wrap=canvas.closest('.map-wrap'),input=createHubInput(),pads=new Set(),padPointers=new Map(),listeners=[];
  let pos=returningFrom?{x:hubDoors[returningFrom-1].x,y:hubDoors[returningFrom-1].y+21}:{...hubMap.spawn};
  let friend={x:pos.x-25,y:pos.y+15};if(!canStandInHub(friend))friend={...pos};
  const footsteps=[{...friend},{...pos}];
  let path=[],target=null,raf=0,previous=0,stopped=false,facing=1,entered=false,manualIntent=false,arrivalTimer=0;
  let width=960,height=540,scale=1,camera={x:0,y:0},lastCamera=null,guideOpen=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const background=new Image();let backgroundReady=false;background.decoding='async';background.onload=()=>{backgroundReady=true;};background.src=`${import.meta.env?.BASE_URL??'/'}assets/expedition-map.webp`;
  // Transparent facility illustrations can replace the procedural fallback
  // independently, while the navigation and door coordinates stay unchanged.
  const buriSprite=new Image(),moa=new Image();
  const artStatus=document.createElement('div');artStatus.className='hub-art-status';artStatus.setAttribute('role','status');
  artStatus.innerHTML='<p>탐사원과 만날 준비 중…</p><button type="button" hidden>다시 불러오기</button>';wrap.append(artStatus);
  const artReady=()=>buriSprite.complete&&buriSprite.naturalWidth>0&&moa.complete&&moa.naturalWidth>0;
  const syncArt=()=>{if(stopped)return;artStatus.hidden=artReady();};
  const failArt=()=>{if(stopped)return;artStatus.hidden=false;artStatus.querySelector('p').textContent='탐사원 그림을 불러오지 못했어. 다시 만나 볼까?';artStatus.querySelector('button').hidden=false;};
  const loadArt=()=>{artStatus.hidden=false;artStatus.querySelector('p').textContent='탐사원과 만날 준비 중…';artStatus.querySelector('button').hidden=true;buriSprite.src=illustration('buri-map');moa.src=`${import.meta.env?.BASE_URL??'/'}assets/moa-map.webp`;};
  buriSprite.onload=moa.onload=syncArt;buriSprite.onerror=moa.onerror=failArt;
  listen(artStatus.querySelector('button'),'click',loadArt);loadArt();
  const facilities=hubDoors.map((_,index)=>{const image=new Image();image.decoding='async';image.src=`${import.meta.env?.BASE_URL??'/'}assets/facility-${index+1}.webp`;return image;});
  const fallback=document.createElement('canvas');fallback.width=960;fallback.height=540;fallbackTerrain(fallback.getContext('2d'));
  const newlyCompleted=seenCompleted?s.completed.filter(id=>!seenCompleted.has(id)):[];seenCompleted=new Set(s.completed);let startedAt=0;
  const labels=[...wrap.querySelectorAll('[data-hub-stage]')],arrival=wrap.querySelector('#arrival'),companion=wrap.querySelector('[data-hub-guide]');
  const enabled=i=>canAccess(s,`s${i+1}a`),next=chapters.find(ch=>!s.completed.includes(ch.id));
  function listen(el,type,fn,options){el?.addEventListener(type,fn,options);listeners.push(()=>el?.removeEventListener(type,fn,options));}
  function message(text,persist=false){if(!arrival)return;clearTimeout(arrivalTimer);arrival.textContent=text;arrival.classList.add('is-visible');arrivalTimer=setTimeout(()=>{if(!guideOpen)arrival.classList.remove('is-visible');},persist?9500:5200);}
  function paused(){return !artReady()||document.hidden||!!document.querySelector('dialog[open]')||!!canvas.closest('[inert]');}
  function clearInput(){input.clear();pads.clear();padPointers.clear();wrap.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));previous=0;}
  function travel(i){if(!Number.isInteger(i)||i<0||i>=hubDoors.length||entered)return;clearInput();guideOpen=false;target=i;manualIntent=true;path=findHubPath(pos,hubDoors[i]);message(`${chapters[i].title}까지 길을 따라 가요.`);canvas.focus({preventScroll:true});}
  function enter(i){if(entered)return;path=[];manualIntent=false;if(!enabled(i)){message(`이곳은 아직 준비 중이에요. 먼저 ${chapters[i-1]?.title??chapters[0].title}의 조사를 마쳐 주세요.`,true);return;}entered=true;returningFrom=i+1;clearInput();onArrive(i+1);}
  function size(){const box=wrap.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;scale=Math.max(width/960,height/540)*(width<800?1.25:1.3);lastCamera=null;}
  function worldToScreen(p){return{x:p.x*scale-camera.x,y:p.y*scale-camera.y};}
  function overlays(){
    labels.forEach(label=>{const id=Number(label.dataset.hubStage),door=hubDoors[id-1];if(!door)return;const point=worldToScreen({x:door.buildingX,y:door.buildingY-61});const offscreen=point.x<85||point.x>width-85||point.y<94||point.y>height-146;
      // `top` is the bottom edge because CSS translates the label up 100%.
      // Reserve the complete label height below the floating common controls.
      const labelFloor=82+(label.offsetHeight||52);
      label.style.left=`${Math.max(86,Math.min(width-86,point.x))}px`;label.style.top=`${Math.max(labelFloor,Math.min(height-147,point.y))}px`;label.classList.toggle('is-offscreen',offscreen);label.classList.toggle('is-current',id===next?.id);label.classList.toggle('is-done',s.completed.includes(id));label.classList.toggle('is-locked',!enabled(id-1));label.setAttribute('aria-label',`${chapters[id-1].title}. ${s.completed.includes(id)?'복구 완료':enabled(id-1)?'이동하기':'잠김. 이동해서 여는 방법 듣기'}`);
    });
    if(companion){const p=worldToScreen(friend);companion.style.left=`${Math.max(65,Math.min(width-65,p.x-56))}px`;companion.style.top=`${Math.max(110,Math.min(height-150,p.y-35))}px`;}
  }
  function render(t){
    if(stopped||entered)return;raf=requestAnimationFrame(render);if(!startedAt)startedAt=t;
    const dt=Math.min((t-previous)||16,40);previous=t;if(paused()){clearInput();path=[];return;}
    const vector=input.vector(pads);let moving=false;
    if(vector.x||vector.y){path=[];target=null;manualIntent=true;const before=pos;pos=moveHubPoint(pos,{x:vector.x*dt*.105,y:vector.y*dt*.105});moving=hubDistance(pos,before)>.01;if(vector.x)facing=Math.sign(vector.x);}
    else if(path.length){const p=path[0],distance=hubDistance(pos,p),step=dt*.13;if(distance<=step){pos={...p};path.shift();}else{const dx=(p.x-pos.x)/distance,dy=(p.y-pos.y)/distance;pos=moveHubPoint(pos,{x:dx*step,y:dy*step});if(dx)facing=Math.sign(dx);}moving=true;if(!path.length&&target!==null){enter(target);if(entered)return;}}
    if(manualIntent&&moving&&!path.length){const i=hubDoors.findIndex(door=>hubDistance(pos,door)<11);if(i>=0){enter(i);if(entered)return;}}
    // Follow the recorded footsteps, so the helper turns at the same bends and
    // never cuts across a cliff to catch up with the player.
    if(hubDistance(footsteps.at(-1),pos)>1){footsteps.push({...pos});if(footsteps.length>180)footsteps.shift();}
    let remaining=27;
    for(let i=footsteps.length-1;i>0;i--){const a=footsteps[i],b=footsteps[i-1],distance=hubDistance(a,b);if(distance>=remaining){const ratio=remaining/(distance||1);friend={x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio};break;}remaining-=distance;if(i===1)friend={...b};}
    const desired={x:Math.max(0,Math.min(960*scale-width,pos.x*scale-width*.5)),y:Math.max(0,Math.min(540*scale-height,pos.y*scale-height*.56))};
    if(!lastCamera||reduced)camera=desired;else{const blend=1-Math.exp(-dt/140);camera={x:camera.x+(desired.x-camera.x)*blend,y:camera.y+(desired.y-camera.y)*blend};}lastCamera=camera;
    const dpr=canvas.width/width;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.translate(-camera.x,-camera.y);c.scale(scale,scale);c.imageSmoothingEnabled=false;c.drawImage(backgroundReady?background:fallback,0,0,960,540);
    const ordered=hubDoors.map((door,index)=>({y:door.buildingY+32,draw:()=>{
      const sprite=facilities[index],done=s.completed.includes(index+1);
      if(!sprite.complete||!sprite.naturalWidth){building(c,door,index,done,t,reduced);return;}
      if(done){const glow=c.createRadialGradient(door.x,door.y-15,2,door.x,door.y-15,86);glow.addColorStop(0,'#fff2b88c');glow.addColorStop(1,'#fff2b800');c.fillStyle=glow;c.fillRect(door.x-86,door.y-101,172,172);}
      c.drawImage(sprite,door.buildingX-70,door.y-140*440/512,140,140);
      if(done){ellipse(c,door.x,door.y+7,22,6,'#ffedb366');rect(c,door.x+37,door.y-1,3,12,'#8a7147');rect(c,door.x+33,door.y-7,11,8,'#fff2a6');}
    }}));ordered.push({y:pos.y,draw:()=>explorer(c,buriSprite,pos.x,pos.y,t,moving,facing,reduced,66)},{y:friend.y,draw:()=>explorer(c,moa,friend.x,friend.y,t,moving,facing,reduced,43)});ordered.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
    if(next){const door=hubDoors[next.id-1];ellipse(c,door.x,door.y+6,17,7,'#fff4bb75');c.strokeStyle='#ffe98d';c.lineWidth=1.5;c.beginPath();c.ellipse(door.x,door.y+6,17,7,0,0,Math.PI*2);c.stroke();}
    const elapsed=t-startedAt;if(newlyCompleted.length&&!reduced&&elapsed<3600){for(const id of newlyCompleted){const door=hubDoors[id-1];c.strokeStyle=`rgba(255,242,163,${Math.max(0,1-elapsed/3600)})`;c.lineWidth=2;c.beginPath();c.ellipse(door.x,door.y,20+elapsed/80,10+elapsed/200,0,0,Math.PI*2);c.stroke();}}
    const fog=Math.max(0,.1*(1-s.completed.length/5));if(fog)rect(c,0,0,960,540,`rgba(30,68,87,${fog})`);overlays();
  }
  const keydown=e=>{if(paused()||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;if(input.press(e.key,e.code)){e.preventDefault();guideOpen=false;}else if((e.code==='Enter'||e.code==='Space')&&e.target===canvas){e.preventDefault();const i=hubDoors.findIndex(door=>hubDistance(pos,door)<35);if(i>=0)enter(i);else message('건물 이름을 누르면 부리와 수달 모아가 함께 걸어가요.');}};
  const suspend=()=>{clearInput();path=[];};
  listen(window,'keydown',keydown);listen(window,'keyup',e=>input.release(e.key,e.code));listen(window,'blur',suspend);listen(document,'visibilitychange',suspend);
  listen(canvas,'click',e=>{if(paused())return;const box=canvas.getBoundingClientRect(),point={x:(e.clientX-box.left+camera.x)/scale,y:(e.clientY-box.top+camera.y)/scale};const door=hubDoors.find(d=>Math.abs(point.x-d.buildingX)<54&&Math.abs(point.y-d.buildingY)<66);if(door){travel(door.id-1);return;}const road=nearestHubRoad(point);if(road.distance>38){message('밝은 흙길이나 건물 이름을 눌러 주세요.');return;}target=null;manualIntent=true;path=findHubPath(pos,road.point);canvas.focus({preventScroll:true});});
  const syncPads=()=>{pads.clear();for(const direction of padPointers.values())if(direction)pads.add(direction);for(const button of wrap.querySelectorAll('[data-hub-direction]'))button.classList.toggle('is-held',pads.has(button.dataset.hubDirection));};
  for(const button of wrap.querySelectorAll('[data-hub-direction]')){
    const direction=button.dataset.hubDirection;
    listen(button,'pointerdown',e=>{e.preventDefault();if(paused())return;button.setPointerCapture?.(e.pointerId);padPointers.set(e.pointerId,direction);syncPads();path=[];canvas.focus({preventScroll:true});});
    listen(button,'pointermove',e=>{if(!padPointers.has(e.pointerId))return;const under=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-hub-direction]');padPointers.set(e.pointerId,under?.dataset.hubDirection??null);syncPads();});
    const release=e=>{padPointers.delete(e.pointerId);syncPads();};listen(button,'pointerup',release);listen(button,'pointercancel',release);listen(button,'lostpointercapture',release);
  }
  listen(companion,'click',()=>{guideOpen=!guideOpen;if(guideOpen)message(next?`다음은 ${next.title}예요. 건물 이름을 누르면 함께 걸어가요! 방향키나 WASD로도 걸을 수 있어요.`:'다섯 장소가 다시 빛나요! 최종 보고서에서 우리가 찾은 기록을 연결해요.',true);else arrival?.classList.remove('is-visible');});
  const modalObserver=new MutationObserver(()=>{if(paused()){clearInput();path=[];}});modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','inert']});
  const observer=new ResizeObserver(size);observer.observe(wrap);size();raf=requestAnimationFrame(render);if(!returningFrom)message('부리·모아와 출발해요! 노란 건물 이름을 눌러 주세요.',true);
  return{travel,dispose(){stopped=true;cancelAnimationFrame(raf);clearTimeout(arrivalTimer);clearInput();observer.disconnect();modalObserver.disconnect();listeners.forEach(remove=>remove());background.onload=null;background.onerror=null;buriSprite.onload=buriSprite.onerror=moa.onload=moa.onerror=null;artStatus.remove();}};
}
