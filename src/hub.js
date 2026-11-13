import {mountMapEncounters} from './map-encounters.js';
import {mapVillainStages} from './map-villain-content.js';
import {bindDirectionPad} from './map-controls.js';
import './hub.css';
import { chapters } from './data.js';
import { illustration } from './illustrations.js';
import { canAccess } from './state.js';
import { separateHubLabel, hubMap, hubDoors, hubResidents, hubPointBehind, hubViewZoom, hubCoverScale, clampHubZoom, clampHubView, hubScreenToWorld, anchorHubView, glideHubView, hubSegments, hubDistance, nearestHubRoad, canStandInHub, moveHubPoint, findHubPath, createHubInput } from './hub-world.js';

const seenCompleted = new WeakMap();
// Keep the decoded map for return visits and load it on the first map entry.
const background=new Image();background.decoding='async';
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
// Unrestored facilities stay quiet even after the door is unlocked.
function sleeping(image){
  const sheet=document.createElement('canvas');sheet.width=image.naturalWidth;sheet.height=image.naturalHeight;
  const g=sheet.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  try{const art=g.getImageData(0,0,sheet.width,sheet.height),d=art.data;for(let i=0;i<d.length;i+=4){const l=d[i]*.3+d[i+1]*.59+d[i+2]*.11;d[i]=(l*.84+d[i]*.16)*.78+10;d[i+1]=(l*.84+d[i+1]*.16)*.78+15;d[i+2]=(l*.84+d[i+2]*.16)*.78+22;}g.putImageData(art,0,0);}catch{return image;}
  return sheet;
}
function restorationDetail(c,door,index,time,motion){
  const {x,y}=door, t=motion?time/900:0;
  c.save();c.translate(x+31,y-6);
  ellipse(c,0,5,15,5,'#23534d58');
  const paint=(a,b,w,h,color)=>rect(c,a,b,w,h,color),line=(points,color)=>poly(c,points,color);
  if(index===0){ // The globe on its small observatory stand.
    paint(-2,-3,4,10,'#8a6036');paint(-10,5,20,3,'#bf9259');
    ellipse(c,0,-11,12,11,'#244b67');ellipse(c,0,-12,10,9,'#50b3cd');
    line([[-7,-16],[-2,-19],[1,-14],[6,-14],[4,-9],[0,-7]],'#a2d67f');
    ellipse(c,-4,-16,3,2,'#d1f4d8');
  }else if(index===1){ // The tide gauge beside the shore lab.
    paint(-11,-18,22,24,'#805f46');paint(-8,-15,16,17,'#267787');
    const wave=Math.round(2*Math.sin(t));paint(-6,-8+wave,12,7-wave,'#6ac5d4');paint(-6,-8+wave,12,2,'#d5f3de');
    paint(-5,-12,4,1,'#e2e5c3');paint(2,-5,4,1,'#e2e5c3');
  }else if(index===2){ // A wide table holds the restored seafloor rock samples.
    paint(-13,0,26,4,'#976545');paint(-11,3,3,5,'#765137');paint(8,3,3,5,'#765137');
    line([[-12,0],[-8,-11],[-1,-10],[1,0]],'#8dadbe');line([[1,0],[4,-9],[10,-12],[13,0]],'#bc8e6c');paint(3,-5,9,1,'#f0cc99');
  }else if(index===3){ // The observation mast lights up.
    paint(-2,-25,4,32,'#805439');paint(-10,-14,20,3,'#d19e64');
    ellipse(c,-10,-13,5,4,'#79c4ce');ellipse(c,10,-13,5,4,'#79c4ce');ellipse(c,0,-27,5,5,'#ffebb1');
  }else{ // The restored shoreline plot grows two new shoots.
    line([[-12,-1],[12,-1],[8,8],[-8,8]],'#b67a4f');paint(-13,-2,26,3,'#e2ac72');
    for(const a of [-6,5]){paint(a,-15,2,13,'#56834b');line([[a,-9],[a-9,-15],[a-9,-19],[a-3,-17]],'#84b95a');line([[a,-7],[a+7,-15],[a+10,-14],[a+7,-9]],'#b3d174');}
  }
  c.restore();
}
function drawGuide(c,route,t,reduced){
  let offset=reduced?0:(t/70)%15,walked=0;
  for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],length=hubDistance(a,b);let d=offset;
    for(;d<length;d+=15){if(walked+d<24)continue;const x=a.x+(b.x-a.x)*d/length,y=a.y+(b.y-a.y)*d/length;ellipse(c,x,y+1,3.6,2.3,'#5b3f1470');ellipse(c,x,y,2.8,1.9,'#fff0a8');}
    offset=d-length;walked+=length;
  }
}
function gulls(c,t){
  c.strokeStyle='#ffffffd9';c.lineWidth=1.4;c.lineCap='round';
  for(let i=0;i<3;i++){const x=(t/(70+i*12)+i*340)%1100-70,y=70+i*150+Math.sin(t/1400+i)*9,flap=2+Math.sin(t/190+i*2)*1.6;c.beginPath();c.moveTo(x-6,y-flap);c.quadraticCurveTo(x-2,y-1,x,y+1);c.quadraticCurveTo(x+2,y-1,x+6,y-flap);c.stroke();}
}
function explorer(c,image,x,y,t,walking,facing,reduced,height,pose){
  if(!image.complete||!image.naturalWidth)return;
  const bob=walking&&!reduced?Math.sin(t/110)*1.8:0;
  const lean=walking&&!reduced?Math.sin(t/220)*.025:0;
  const width=height*image.naturalWidth/image.naturalHeight;
  ellipse(c,x,y+2,height*.22,4,'#173d4b3b');
  c.save();c.translate(x+(pose?.dx??0),y+bob);if((pose?.direction??facing)<0)c.scale(-1,1);c.rotate(lean+(pose&&!reduced?(pose.kind==='hurt'?1:-1)*[0,.11,.065,0][pose.frame]:0));
  if(pose?.kind==='hurt')c.filter='sepia(.35) saturate(1.6)';else if(pose)c.filter='brightness(1.18)';
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(image,-width/2,-height+3,width,height);c.restore();
}

export function mountHub(canvas,s,onArrive,onPosition,{encounterTone}={}){
  if(!background.src)background.src=`${import.meta.env?.BASE_URL??'/'}assets/expedition-map.webp`;
  const c=canvas.getContext('2d'),wrap=canvas.closest('.map-wrap'),input=createHubInput(),pads=new Set(),padPointers=new Map(),listeners=[];
  let pos=canStandInHub(s.mapPosition)?{...s.mapPosition}:{...hubMap.spawn};
  let friend={x:pos.x-25,y:pos.y+15};if(!canStandInHub(friend))friend=hubPointBehind(pos,27);
  let friendDirection='front',friendLastStep=-Infinity;
  const footsteps=[{...friend},{...pos}];
  let path=[],target=null,raf=0,previous=0,stopped=false,facing=1,entered=false,manualIntent=false,arrivalTimer=0;
  let width=960,height=540,scale=1,zoom=1,view={x:480,y:270},camera={x:0,y:0},lastView=null,guideOpen=false;
  // Dragging frees the camera; walking again hands it back to Buri.
  const touches=new Map(),controls='.hub-dpad,.hub-next,.hub-final,.hub-quest';
  let hand=false,free=null,beforeOverview=null,grab=null,pinch=null,glide=null,dragged=false,overview=false,wasMoving=false,guide=[],guideAt=0;
  const handButton=document.querySelector('[data-hub-hand]'),overviewButton=document.querySelector('[data-hub-overview]');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const sleepers=[],residents=hubResidents.map(resident=>{const image=new Image();image.decoding='async';image.src=illustration(resident.id);return{...resident,image,cue:wrap.querySelector(`[data-hub-resident="${resident.id}"]`)};});
  const fallback=document.createElement('canvas');fallback.width=960;fallback.height=540;fallbackTerrain(fallback.getContext('2d'));
  const previousCompletion=seenCompleted.get(s),newlyCompleted=previousCompletion?s.completed.filter(id=>!previousCompletion.has(id)):[];seenCompleted.set(s,new Set(s.completed));let startedAt=0;
  const labels=[...wrap.querySelectorAll('[data-hub-stage]')],arrival=wrap.querySelector('#arrival'),companion=wrap.querySelector('[data-hub-guide]'),quest=wrap.querySelector('.hub-quest');
  const enabled=i=>canAccess(s,`s${i+1}a`),next=chapters.find(ch=>!s.completed.includes(ch.id)),nextButton=wrap.querySelector('.hub-next[data-action=travel]');
  function listen(el,type,fn,options){el?.addEventListener(type,fn,options);listeners.push(()=>el?.removeEventListener(type,fn,options));}
  function message(text,persist=false){if(!arrival)return;clearTimeout(arrivalTimer);arrival.textContent=text;arrival.classList.add('is-visible');arrivalTimer=setTimeout(()=>{if(!guideOpen)arrival.classList.remove('is-visible');},persist?9500:5200);}
  function paused(){return !artReady()||document.hidden||!!document.querySelector('dialog[open]')||!!canvas.closest('[inert]');}
  const encounters=mountMapEncounters({host:wrap,stages:s.settings.unlockAll?[]:mapVillainStages.filter(stage=>s.completed.includes(Number(stage.id))),
    progress:s.mapHits,onSave:patch=>{s.mapHits={...s.mapHits,...patch};onPosition?.();},
    art:{left:import.meta.env.BASE_URL+'assets/map-encounter/map-villain-left.webp',frames:6,nativeFacing:1},palette:'#44cfea',reach:82,contact:23,
    blocked:()=>stopped||entered||overview||hand||target!==null||guideOpen||paused(),reduced:()=>reduced,tone:encounterTone});
  function clearInput(){input.clear();pads.clear();padPointers.clear();wrap.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));previous=0;}
  function syncNext(){if(nextButton){nextButton.disabled=target!==null;nextButton.setAttribute('aria-busy',String(target!==null));}}
  function cancelTravel(){const guided=target!==null;path=[];target=null;manualIntent=false;if(guided)syncNext();}
  function travel(i){
    if(!Number.isInteger(i)||i<0||i>=hubDoors.length||entered||target===i)return;
    cancelTravel();clearInput();guideOpen=false;arrival?.classList.remove('is-visible');
    if(!enabled(i)){message(`먼저 ${chapters[i-1]?.title??chapters[0].title}의 조사를 마쳐 주세요.`);return;}
    resumeFollow();canvas.focus({preventScroll:true});
    if(reduced||hubDistance(pos,hubDoors[i])<11){enter(i);return;}
    path=findHubPath(pos,hubDoors[i]);
    if(!path.length){message('길을 찾지 못했어요. 길 위에서 다시 눌러 주세요.');return;}
    target=i;syncNext();
  }
  function enter(i){if(entered)return;cancelTravel();if(!enabled(i)){message(`이곳은 아직 준비 중이에요. 먼저 ${chapters[i-1]?.title??chapters[0].title}의 조사를 마쳐 주세요.`,true);return;}entered=true;s.mapPosition={x:hubDoors[i].x,y:hubDoors[i].y+21};clearInput();onArrive(i+1);}
  function size(){const box=wrap.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;zoom=clampHubZoom(zoom,width);scale=viewScale();lastView=null;}
  function viewScale(){return overview?Math.min(width/hubMap.width,height/hubMap.height):hubCoverScale(width,height)*hubViewZoom(width)*zoom;}
  function setHand(on){if(on&&overview)setOverview(false,false);hand=on;free=on?{...view}:null;glide=null;if(!on)zoom=1;handButton?.setAttribute('aria-pressed',String(hand));}
  function setOverview(on,restore=true){
    if(on===overview)return;
    if(on)beforeOverview={zoom,hand,center:{...(free??view)}};
    const saved=beforeOverview;
    overview=on;glide=null;
    hand=!on&&restore&&!!saved?.hand;
    free=hand?{...saved.center}:null;
    zoom=on?zoom:clampHubZoom(restore?(saved?.zoom??1):1,width);
    if(!on)beforeOverview=null;
    if(hand){scale=viewScale();view=clampHubView(free,scale,width,height);lastView=view;}
    const label=on?'이전 지도 보기로 돌아가기':'지도 전체 보기';
    handButton?.setAttribute('aria-pressed',String(hand));
    overviewButton?.setAttribute('aria-pressed',String(on));overviewButton?.setAttribute('aria-label',label);if(overviewButton)overviewButton.title=label;
    wrap.classList.toggle('is-overview',on);
  }
  function cancelGesture(){if(touches.size){touches.clear();grab=null;pinch=null;wrap.classList.remove('grabbing');}}
  function resumeFollow(){cancelGesture();if(overview)setOverview(false,false);if(hand)setHand(false);}
  // A quick tap can start and end between frames, so it still takes one visible step.
  function nudge(){const v=input.vector(pads);if(paused()||(!v.x&&!v.y))return;resumeFollow();cancelTravel();manualIntent=true;pos=moveHubPoint(pos,{x:v.x*6,y:v.y*6});wasMoving=true;if(v.x)facing=Math.sign(v.x);}
  function worldToScreen(p){return{x:p.x*scale-camera.x,y:p.y*scale-camera.y};}
  function overlays(){
    const chip=quest?.getBoundingClientRect()??{width:0};
    const placedLabels=[];
    labels.forEach(label=>{const id=Number(label.dataset.hubStage),door=hubDoors[id-1];if(!door)return;const point=worldToScreen({x:door.buildingX,y:door.buildingY-61});const center=worldToScreen({x:door.x,y:door.y-30}),offscreen=center.x<0||center.x>width||center.y<0||center.y>height;
      // `top` is the bottom edge because CSS translates the label up 100%.
      // Reserve the complete label height below the floating common controls.
      const photo=wrap.querySelector('.photo-restoration')?.getBoundingClientRect();
      const labelWidth=label.offsetWidth||160,labelHeight=label.offsetHeight||52;
      let x=Math.max(labelWidth/2+16,Math.min(width-labelWidth/2-16,point.x));
      const labelFloorAt=cx=>{
        const clearsChip=cx+labelWidth/2<chip.left-8||cx-labelWidth/2>chip.right+8;
        const clearsPhoto=!photo||cx+labelWidth/2<photo.left-8||cx-labelWidth/2>photo.right+8;
        return Math.max(clearsPhoto?82:photo.bottom+10,chip.width&&!clearsChip?chip.bottom+10:82)+labelHeight;
      };
      const labelFloor=labelFloorAt(x);
      let y=Math.max(labelFloor,Math.min(height-147,point.y));
      if(!offscreen||id===next?.id){y=separateHubLabel({x,y,width:labelWidth,height:labelHeight,minY:labelFloor,maxY:Math.max(labelFloor,height-147)},placedLabels);
        const collides=(cx,cy)=>placedLabels.some(p=>cx-labelWidth/2<p.x+p.width/2+8&&cx+labelWidth/2+8>p.x-p.width/2&&cy-labelHeight<p.y+8&&cy+8>p.y-p.height);
        if(collides(x,y)){
          for(const cx of [x-labelWidth-10,x+labelWidth+10,width/2]){
            if(cx<labelWidth/2+16||cx>width-labelWidth/2-16)continue;
            const candidateFloor=labelFloorAt(cx);
            const cy=separateHubLabel({
              x:cx,y,width:labelWidth,height:labelHeight,
              minY:candidateFloor,maxY:Math.max(candidateFloor,height-147),
            },placedLabels);
            if(!collides(cx,cy)){x=cx;y=cy;break;}
          }
        }
        placedLabels.push({x,y,width:labelWidth,height:labelHeight});}
      label.style.left=`${x}px`;label.style.top=`${y}px`;label.classList.toggle('is-offscreen',offscreen);if(offscreen)label.style.setProperty('--edge-angle',`${Math.atan2(center.y-height/2,center.x-width/2)}rad`);label.classList.toggle('is-current',id===next?.id);label.classList.toggle('is-done',s.completed.includes(id));label.classList.toggle('is-locked',!enabled(id-1));label.setAttribute('aria-label',`${chapters[id-1].title}. ${s.completed.includes(id)?'복구 완료':enabled(id-1)?'이동하기':'잠김. 이동해서 여는 방법 듣기'}`);
    });
    if(companion){const p=worldToScreen(friend);companion.style.left=`${Math.max(30,Math.min(width-30,p.x))}px`;companion.style.top=`${Math.max(84,Math.min(height-20,p.y-46*scale))}px`;}
    for(const resident of residents){if(!resident.cue)continue;const p=worldToScreen({x:resident.x,y:resident.y-resident.height-3});resident.cue.style.left=`${p.x}px`;resident.cue.style.top=`${p.y}px`;resident.cue.classList.toggle('is-offscreen',p.x<30||p.x>width-30||p.y<84||p.y>height-20);}
  }
  function render(t){
    if(stopped||entered)return;raf=requestAnimationFrame(render);if(!startedAt)startedAt=t;
    // Character art may still be loading: keep drawing the map, but hold movement.
    const dt=Math.min((t-previous)||16,40);previous=t;const blocked=paused();if(blocked){clearInput();wasMoving=false;glide=null;if(artReady()){encounters.update({hero:pos,ally:friend,project:worldToScreen,scale});return;}}
    const vector=input.vector(pads);let moving=false;
    if(vector.x||vector.y||path.length)resumeFollow();
    if(vector.x||vector.y){cancelTravel();manualIntent=true;const before=pos;pos=moveHubPoint(pos,{x:vector.x*dt*.105,y:vector.y*dt*.105});moving=hubDistance(pos,before)>.01;if(vector.x)facing=Math.sign(vector.x);}
    else if(!blocked&&path.length){const p=path[0],distance=hubDistance(pos,p),step=dt*.13;if(distance<=step){pos={...p};path.shift();}else{const dx=(p.x-pos.x)/distance,dy=(p.y-pos.y)/distance;pos=moveHubPoint(pos,{x:dx*step,y:dy*step});if(dx)facing=Math.sign(dx);}moving=true;if(!path.length&&target!==null){enter(target);if(entered)return;}}
    if(manualIntent&&moving&&!path.length){const i=hubDoors.findIndex(door=>hubDistance(pos,door)<11);if(i>=0){enter(i);if(entered)return;}}
    // Follow the recorded footsteps, so the helper turns at the same bends and
    // never cuts across a cliff to catch up with the player.
    if(hubDistance(footsteps.at(-1),pos)>1){footsteps.push({...pos});if(footsteps.length>180)footsteps.shift();}
    const oldFriend=friend;
    let remaining=27;
    for(let i=footsteps.length-1;i>0;i--){const a=footsteps[i],b=footsteps[i-1],distance=hubDistance(a,b);if(distance>=remaining){const ratio=remaining/(distance||1);friend={x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio};break;}remaining-=distance;if(i===1)friend={...b};}
    if(moving&&hubDistance(oldFriend,friend)>.025){
      friendLastStep=t;
      const dx=friend.x-oldFriend.x,dy=friend.y-oldFriend.y;
      if(Math.abs(dx)>Math.abs(dy)*.75)friendDirection=dx<0?'left':'right';
      else friendDirection=dy<0?'back':'front';
    }
    // A new footstep can span several display frames on fast screens.
    const friendMoving=t-friendLastStep<80;
    if(wasMoving&&!moving){s.mapPosition={...pos};onPosition?.();}wasMoving=moving;
    const blend=1-Math.exp(-dt/140),goal=viewScale();scale=!lastView||reduced||free?goal:scale+(goal-scale)*blend;
    if(glide&&free){const step=glideHubView(free,glide,dt,scale,width,height);free=step.view;glide=step.velocity.x||step.velocity.y?step.velocity:null;}
    const desired=clampHubView(overview?{x:hubMap.width/2,y:hubMap.height/2}:free??{x:pos.x,y:pos.y-height*.06/scale},scale,width,height);
    view=!lastView||reduced||free?desired:clampHubView({x:view.x+(desired.x-view.x)*blend,y:view.y+(desired.y-view.y)*blend},scale,width,height);lastView=view;camera={x:view.x*scale-width/2,y:view.y*scale-height/2};
    const dpr=canvas.width/width;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.translate(-camera.x,-camera.y);c.scale(scale,scale);c.imageSmoothingEnabled=false;c.drawImage(background.complete&&background.naturalWidth?background:fallback,0,0,960,540);
    const elapsed=t-startedAt,revealing=!reduced&&elapsed<1800;
    if(next&&enabled(next.id-1)&&!(revealing&&newlyCompleted.length)){if(t-guideAt>350){guideAt=t;guide=findHubPath(pos,hubDoors[next.id-1]);}drawGuide(c,guide,t,reduced);}
    if(next){const door=hubDoors[next.id-1],pulse=reduced?0:(t%1800)/1800;ellipse(c,door.x,door.y+6,17,7,'#fff4bb75');c.lineWidth=1.5;c.strokeStyle='#ffe98d';c.beginPath();c.ellipse(door.x,door.y+6,17,7,0,0,Math.PI*2);c.stroke();if(pulse){c.strokeStyle=`rgba(255,233,141,${1-pulse})`;c.beginPath();c.ellipse(door.x,door.y+6,17+pulse*16,7+pulse*7,0,0,Math.PI*2);c.stroke();}}
    const reaction=encounters.update({hero:pos,ally:friend,project:worldToScreen,scale});
    const ordered=hubDoors.map((door,index)=>({y:door.buildingY+32,draw:()=>{
      const sprite=facilities[index],done=s.completed.includes(index+1);
      const rise=done?(revealing&&newlyCompleted.includes(index+1)?Math.min(1,elapsed/1100):1):0;
      if(!sprite.complete||!sprite.naturalWidth){building(c,door,index,rise>.5,t,reduced);return;}
      const x=door.buildingX-70,y=door.y-140*440/512;
      if(rise<1)c.drawImage(sleepers[index]??=sleeping(sprite),x,y,140,140);
      if(rise){c.save();c.globalAlpha=rise;c.drawImage(sprite,x,y,140,140);
        const glow=c.createRadialGradient(door.x,door.y-18,2,door.x,door.y-18,65);
        glow.addColorStop(0,'#fff0b198');glow.addColorStop(1,'#fff2b800');c.fillStyle=glow;c.fillRect(door.x-65,door.y-83,130,130);
        ellipse(c,door.x,door.y+5,19,6,'#ffedb366');restorationDetail(c,door,index,t,!reduced);c.restore();}

    }}));ordered.push({y:pos.y,draw:()=>explorer(c,buriSprite,pos.x,pos.y,t,moving,facing,reduced,66,reaction.hero)},{y:friend.y,draw:()=>explorer(c,moa,friend.x,friend.y,t,friendMoving,friendDirection==='left'?-1:1,reduced,43,reaction.ally)},...residents.map(r=>({y:r.y,draw:()=>explorer(c,r.image,r.x,r.y+(reduced?0:Math.sin(t/520+r.x)*.7),t,false,r.facing,reduced,r.height)})));ordered.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
    if(!reduced)gulls(c,t);
    if(s.completed.length===5){for(const [dx,dy,rx] of [[-30,0,12],[0,-7,21],[30,0,12]]){const x=hubMap.spawn.x+dx,y=hubMap.spawn.y+dy;ellipse(c,x,y,rx,6,'#ffe7a569');poly(c,[[x-3,y],[x,y-10],[x+3,y],[x,y+4]],'#fff1a0');}}
    if(newlyCompleted.length&&!reduced&&elapsed<3600){for(const id of newlyCompleted){const door=hubDoors[id-1];c.strokeStyle=`rgba(255,242,163,${Math.max(0,1-elapsed/3600)})`;c.lineWidth=2;c.beginPath();c.ellipse(door.x,door.y,20+elapsed/80,10+elapsed/200,0,0,Math.PI*2);c.stroke();}}
    const fog=Math.max(0,.1*(1-s.completed.length/5));if(fog)rect(c,0,0,960,540,`rgba(30,68,87,${fog})`);overlays();
  }
  const keydown=e=>{if(e.defaultPrevented||paused()||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,[contenteditable]:not([contenteditable="false"])'))return;if(input.press(e.key,e.code)){e.preventDefault();guideOpen=false;if(!e.repeat)nudge();}else if((e.code==='Enter'||e.code==='Space')&&e.target===canvas){e.preventDefault();const i=hubDoors.findIndex(door=>hubDistance(pos,door)<35);if(i>=0)enter(i);else message('건물 이름을 누르면 부리와 수달 모아가 함께 걸어가요.');}};
  const suspend=()=>{clearInput();cancelTravel();cancelGesture();glide=null;};
  listen(window,'keydown',keydown);listen(window,'keyup',e=>input.release(e.key,e.code));listen(window,'blur',suspend);listen(document,'visibilitychange',suspend);
  const local=e=>{const box=canvas.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top};};
  const fingers=()=>{const [a,b]=touches.values();return{mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},gap:Math.hypot(a.x-b.x,a.y-b.y)||1};};
  // The pointer may already be gone by the time a gesture claims it.
  const capture=id=>{try{canvas.setPointerCapture(id);}catch{}};
  function freeZoom(){if(overview){setOverview(false,false);zoom=clampHubZoom(0,width);}if(!hand){hand=true;free={...view};handButton?.setAttribute('aria-pressed','true');}glide=null;cancelTravel();}
  function zoomTo(ratio,world,screen){zoom=clampHubZoom(ratio,width);scale=viewScale();free=anchorHubView(world,screen,scale,width,height);}
  // Gestures listen on the wrap so one can start on a building name as well as on the map.
  listen(wrap,'pointerdown',e=>{
    if(e.button>0||paused()||e.target.closest(controls))return;if(!touches.size)dragged=false;touches.set(e.pointerId,local(e));glide=null;
    if(touches.size===2){grab=null;dragged=true;wrap.classList.remove('grabbing');freeZoom();for(const id of touches.keys())capture(id);const {mid,gap}=fingers();pinch={gap,ratio:zoom,world:hubScreenToWorld(view,scale,mid,width,height)};}
    else if(touches.size===1&&!overview)grab={id:e.pointerId,x:e.clientX,y:e.clientY,view:{...view},at:e.timeStamp,velocity:{x:0,y:0}};
  });
  listen(wrap,'pointermove',e=>{
    if(!touches.has(e.pointerId))return;touches.set(e.pointerId,local(e));
    if(pinch){const {mid,gap}=fingers();zoomTo(pinch.ratio*gap/pinch.gap,pinch.world,mid);return;}
    if(grab?.id!==e.pointerId)return;const dx=e.clientX-grab.x,dy=e.clientY-grab.y;if(!dragged&&Math.hypot(dx,dy)<8)return;
    if(!dragged){dragged=true;capture(e.pointerId);wrap.classList.add('grabbing');cancelTravel();setHand(true);}
    const next=clampHubView({x:grab.view.x-dx/scale,y:grab.view.y-dy/scale},scale,width,height),elapsed=e.timeStamp-grab.at;
    if(elapsed>0)grab.velocity={x:grab.velocity.x*.3+(next.x-free.x)/elapsed*.7,y:grab.velocity.y*.3+(next.y-free.y)/elapsed*.7};grab.at=e.timeStamp;free=next;
  });
  const letGo=e=>{
    if(!touches.delete(e.pointerId))return;
    // No click follows some gestures, so the swallow must not outlive them.
    if(!touches.size)setTimeout(()=>{if(!touches.size)dragged=false;},350);
    if(pinch){if(touches.size<2)pinch=null;grab=null;return;}
    if(grab?.id!==e.pointerId)return;
    // A map let go while still moving slides on; one held still first stays put.
    if(e.type==='pointerup'&&dragged&&!reduced&&e.timeStamp-grab.at<80)glide=grab.velocity;
    grab=null;wrap.classList.remove('grabbing');
  };
  listen(wrap,'pointerup',letGo);listen(wrap,'pointercancel',letGo);listen(wrap,'lostpointercapture',letGo);
  listen(wrap,'wheel',e=>{if(paused()||e.target.closest(controls))return;e.preventDefault();freeZoom();const at=local(e);zoomTo(zoom*Math.exp(-e.deltaY*.0015),hubScreenToWorld(view,scale,at,width,height),at);},{passive:false});
  // The click that ends a gesture must not walk Buri or open the building under the finger.
  listen(wrap,'click',e=>{if(!dragged||e.target.closest(controls))return;dragged=false;e.stopPropagation();e.preventDefault();},true);
  listen(handButton,'click',()=>{cancelTravel();setHand(!hand);canvas.focus({preventScroll:true});});
  listen(overviewButton,'click',()=>{cancelTravel();setOverview(!overview);canvas.focus({preventScroll:true});});
  for(const resident of residents)listen(resident.cue,'click',()=>message(`${resident.name}: ${s.completed.includes(resident.chapter)?resident.after:resident.before}`));
  listen(canvas,'click',e=>{if(paused()||hand)return;const box=canvas.getBoundingClientRect(),point={x:(e.clientX-box.left+camera.x)/scale,y:(e.clientY-box.top+camera.y)/scale};const door=hubDoors.find(d=>Math.abs(point.x-d.buildingX)<54&&Math.abs(point.y-d.buildingY)<66);if(door){travel(door.id-1);return;}const road=nearestHubRoad(point);cancelTravel();path=findHubPath(pos,road.point);canvas.focus({preventScroll:true});});
  const syncPads=()=>{pads.clear();for(const direction of padPointers.values())if(direction)pads.add(direction);for(const button of wrap.querySelectorAll('[data-hub-direction]'))button.classList.toggle('is-held',pads.has(button.dataset.hubDirection));};
  const directionPad=bindDirectionPad(wrap,'[data-hub-direction]',b=>b.dataset.hubDirection,{blocked:paused,
    press:d=>{padPointers.set(-1,d);syncPads();path=[];nudge();canvas.focus({preventScroll:true});},release:()=>{padPointers.delete(-1);syncPads();},
    tap:d=>{padPointers.set(-1,d);syncPads();nudge();padPointers.delete(-1);syncPads();}
  });listeners.push(directionPad.destroy);
  listen(companion,'click',()=>{cancelTravel();guideOpen=true;message(next?`다음은 ${next.title}${(next.title.charCodeAt(next.title.length-1)-0xac00)%28?'이에요':'예요'}. 건물 이름을 누르면 함께 걸어가요! 방향키나 WASD로도 걸을 수 있어요.`:'다섯 장소가 다시 빛나요! 최종 보고서에서 우리가 찾은 기록을 연결해요.',true);});
  const modalObserver=new MutationObserver(()=>{if(artReady()&&paused()){clearInput();cancelTravel();}});modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','inert']});
  const observer=new ResizeObserver(size);observer.observe(wrap);size();raf=requestAnimationFrame(render);
  return{travel,dispose(){stopped=true;encounters.destroy();cancelAnimationFrame(raf);clearTimeout(arrivalTimer);clearInput();observer.disconnect();modalObserver.disconnect();listeners.forEach(remove=>remove());buriSprite.onload=buriSprite.onerror=moa.onload=moa.onerror=null;artStatus.remove();}};
}
