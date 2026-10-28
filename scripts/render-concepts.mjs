// Deterministic SVG motion graphics. Render tools stay outside the shipped app.
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'D:/DevCaches/npm-from-c/_npx/a6797f7ff67bb1f2/node_modules/sharp');
const ffmpeg = process.env.FFMPEG_PATH || spawnSync('python', ['-c', "import sys;sys.path.insert(0,'.cache/render-libs');import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], { encoding: 'utf8' }).stdout.trim();
if (!ffmpeg) throw Error('Set FFMPEG_PATH to a local FFmpeg binary');
const out = resolve('public/assets/concepts'); mkdirSync(out, { recursive: true });
const FPS=24, seconds=9, W=1280, H=720;
const p=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a))), ease=x=>x*x*(3-2*x);
const C={ink:'#173f4b',water:'#379eaf',light:'#a2e6e0',land:'#9ebf75',sand:'#ecd3a0',rock:'#738c88',cream:'#fff9e8',gold:'#efbd6e'};
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect=(x,y,w,h,fill,rx=16,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(x,y,x2,y2,color,width=6)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/>`;
function earth(x,y,r,t){return `<g>${circle(x,y,r+18,'#b5e7df')}${circle(x,y,r,C.water)}<clipPath id="globe"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath><g clip-path="url(#globe)" transform="translate(${Math.sin(t/3)*20} 0)">${path(`M${x-r*.7} ${y-r*.65}l${r*.6} ${r*.16} ${r*.1} ${r*.4}-${r*.3} ${r*.22} ${r*.06} ${r*.5}-${r*.4}-${r*.24}-${r*.2}-${r*.56}Z`,C.land)}${path(`M${x+r*.25} ${y-r*.85}l${r*.5} ${r*.35} ${r*.15} ${r*.4}-${r*.35} ${r*.25}-${r*.1} ${r*.6}-${r*.3}-${r*.2}-${r*.12}-${r*.56}-${r*.2}-${r*.2}Z`,C.land)}</g>${path(`M${x-r*.64} ${y-r*.45}Q${x-r*.2} ${y-r*.85} ${x+r*.3} ${y-r*.6}`,'none','stroke="#ffffff80" stroke-width="14" stroke-linecap="round"')}</g>`;}
function earthClip(t){const q=ease(p(t,2.8,5.4));let grid='';for(let i=0;i<20;i++){const x=775+(i%5)*66,y=200+Math.floor(i/5)*66;grid+=rect(x,y,54,54,i<14?C.water:C.land,10,`opacity="${p(t,3+i*.04,4+i*.04)}"`);}return earth(400,338,205,t)+`<g opacity="${q}">${grid}${rect(775,495,310,24,'#d5e4d7',12)}${rect(775,495,217*q,24,C.water,12)}</g>`+Array.from({length:3},(_,i)=>circle(300+i*90,325+i%2*65,11,C.gold,`opacity="${1-p(t,2.5,4)}"`)).join('');}
function beaker(x,salty,t){const evap=ease(p(t,2.3,6.4)),y=475-180*(1-evap);let bubbles='';for(let i=0;i<6;i++){const yy=260-((t*65+i*38)%190);bubbles+=circle(x+45+i%3*45,yy,7+(i%3)*3,'#c7efec',`opacity="${p(t,2,3)*(1-p(t,6,7))}"`);}return `<g>${rect(x-15,510,240,28,C.ink)}${rect(x,230,210,270,'#e3f0eb',20,'stroke="#789a9a" stroke-width="6"')}${rect(x+8,y,194,Math.max(0,490-y),C.water,12)}${line(x+180,290,x+202,290,'#789a9a',4)}${line(x+180,360,x+202,360,'#789a9a',4)}${line(x+180,430,x+202,430,'#789a9a',4)}${salty?Array.from({length:14},(_,i)=>rect(x+22+i%7*24,477-Math.floor(i/7)*12,14,10,C.cream,3,`opacity="${evap}"`)).join(''):''}${bubbles}${path(`M${x+20} 548q20 -28 40 0t40 0t40 0`, 'none',`stroke="${C.gold}" stroke-width="7" opacity="${p(t,2,3)*(1-p(t,6,7))}"`)}</g>`;}
function saltClip(t){return beaker(300,false,t)+beaker(770,true,t)+line(600,350,680,350,C.gold,8)+circle(640,350,22,C.cream)+line(630,342,650,342,C.ink,4)+line(630,358,650,358,C.ink,4);}
function coastClip(t){const focus=Math.floor(Math.min(3,t/2));const terrain=[path('M65 240Q180 190 290 240V340H65Z',C.sand),path('M355 340V135L420 108 470 145 520 130V340Z',C.rock)+path('M365 150L415 130 470 165 510 145','none','stroke="#a8b99c" stroke-width="10"'),path('M640 340V200Q725 65 815 200V340Z',C.rock)+path('M686 340V252Q726 155 768 252V340Z',C.ink),path('M940 340V185Q1030 60 1130 185V340H1080V238Q1032 165 990 238V340Z',C.rock)];return `<g transform="translate(0 95)">${rect(30,300,1220,160,C.water,30)}${terrain.join('')}${[180,440,728,1035].map((x,i)=>rect(x-135,50,270,340,'none',20,`stroke="${C.gold}" stroke-width="8" opacity="${i===focus?1:.15}"`)).join('')}${path(`M40 ${360+Math.sin(t*2)*4}Q330 330 640 360T1230 360`,'none','stroke="#b5e7df" stroke-width="8"')}</g>`;}
function tide(t){const h=125+130*(t<4.5?ease(p(t,1,4)):1-ease(p(t,5,8)));return rect(120,150,1040,430,'#d1edf0',32)+path('M120 460Q620 330 1160 440V580H120Z',C.sand)+path('M320 560L370 350 440 370 480 560Z',C.rock)+rect(850,220,26,340,'#ad794f',4)+[260,310,360,410,460,510].map(y=>line(844,y,882,y,C.cream,5)).join('')+path(`M120 ${580-h}Q400 ${565-h} 650 ${580-h}T1160 ${580-h}V580H120Z`,C.water,'opacity=".86"')+path(`M120 ${580-h}Q400 ${565-h} 650 ${580-h}T1160 ${580-h}`,'none','stroke="#d4ffff" stroke-width="7"')+path(t<4.5?'M1015 365v-90l-18 24m18-24 18 24':'M1015 290v90l-18-24m18 24 18-24','none',`stroke="${C.gold}" stroke-width="10" stroke-linecap="round"`);}
function crab(x,y,t){return `<g transform="translate(${x} ${y})">${[-1,1].map(dir=>[0,1,2].map(i=>line(dir*28,0,dir*(54+i*6),18+i*10,C.ink,5)).join('')).join('')}${circle(0,0,33,'#d49166')}${circle(-15,-25,9,C.cream)}${circle(15,-25,9,C.cream)}${circle(-15,-26,4,C.ink)}${circle(15,-26,4,C.ink)}${line(-27,-10,-47,-36,C.ink,6)}${line(27,-10,47,-36,C.ink,6)}${circle(-47,-40,13,'#d49166')}${circle(47,-40,13,'#d49166')}</g>`;}
function habitat(t){const grow=ease(p(t,1,4));return rect(95,345,1090,250,C.sand,40)+path('M95 465Q350 400 620 445T1185 440V595H95Z','#c6b78b')+Array.from({length:7},(_,i)=>path(`M${860+i*25} 490q${-15+i*4} ${-80*grow} ${-5+i*2} ${-150*grow}`,'none',`stroke="${C.land}" stroke-width="12" stroke-linecap="round"`)).join('')+crab(360+Math.sin(t)*35,465,t)+`<g transform="translate(640 ${470+Math.sin(t*1.5)*6})">${path('M-70 0Q0-65 70 0L95-28V28L70 0Q0 50-70 0',C.water)}${circle(-30,-20,12,C.cream)}${circle(-29,-22,6,C.ink)}</g>`+circle(250,532,16,C.ink)+circle(460,555,13,C.ink)+`<g opacity="${p(t,5,6)}">${path('M580 175L640 150 700 175V230Q680 275 640 300Q600 275 580 230Z',C.land)}${path('M610 220l22 22 38-43','none',`stroke="${C.cream}" stroke-width="9" stroke-linecap="round"`)}</g>`;}
const clips=[earthClip,saltClip,coastClip,tide,habitat];
for(let n=1;n<=5;n++){
 if(process.argv[2]&&Number(process.argv[2])!==n)continue;
 const file=resolve(out,`chapter-${n}.mp4`);
 const proc=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['pipe','inherit','inherit']});
 const done=once(proc,'close'); let last;
 for(let f=0;f<seconds*FPS;f++){
  const t=f/FPS;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#f2f7e9"/><stop offset="1" stop-color="#e2efdf"/></linearGradient></defs>${rect(0,0,W,H,'url(#bg)',0)}${circle(1120,80,200,'#fff9e855')}${clips[n-1](t)}</svg>`;
  last=svg;const buf=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  if(!proc.stdin.write(buf))await once(proc.stdin,'drain');
 }
 proc.stdin.end();if((await done)[0]!==0)throw Error(`chapter ${n} failed`);
 await sharp(Buffer.from(last)).webp({quality:88}).toFile(resolve(out,`chapter-${n}.webp`));
 const webm=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',file,'-an','-c:v','libvpx-vp9','-crf','36','-b:v','0','-cpu-used','5','-row-mt','1',resolve(out,`chapter-${n}.webm`)],{stdio:'inherit'});
 if(webm.status!==0)throw Error('WebM encoding failed');
 console.log(`chapter-${n}: 9s, 1280x720, MP4 + WebM + poster`);
}
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({duration:seconds,fps:FPS,width:W,height:H,chapters:5,audio:false,generator:'scripts/render-concepts.mjs'},null,2));
