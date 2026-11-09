// Release-score evidence: production first load, every route at the scored
// viewports (font floor, touch targets, horizontal scroll), keyboard dialogs
// and concept clip playback. Run against `npm run build` + `npm run preview`.
//   LOAD_URL=<preview of dist> GAME_URL=<vite dev, for state fixtures> node tests/upgrade_audit.mjs
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(process.env.PLAYWRIGHT_RUNNER||'/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const {chromium}=require('playwright');
const base=(process.env.GAME_URL||'http://127.0.0.1:5173').replace(/\/$/,''),loadBase=(process.env.LOAD_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const out=path.resolve(process.env.QA_OUTPUT||'artifacts/upgrade-audit');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={base,loadBase,load:[],routes:[],keyboard:{},concepts:[],errors:[]};
try{
  // 1. First load: cold cache, measured twice (local link and a throttled
  //    "school Wi-Fi" profile: 10 Mbps down, 80 ms RTT).
  for(const profile of [{name:'local'},{name:'school-wifi-10mbps',down:10e6/8,up:5e6/8,latency:80}]){
    const ctx=await browser.newContext({viewport:{width:1280,height:800}});const page=await ctx.newPage();
    const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    if(profile.down)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.down,uploadThroughput:profile.up});
    let bytes=0;const hosts=new Set();cdp.on('Network.loadingFinished',e=>{bytes+=e.encodedDataLength;});page.on('request',r=>hosts.add(new URL(r.url()).host));
    const t0=Date.now();await page.goto(loadBase+'/',{waitUntil:'commit'});
    const bootVisible=await page.locator('.boot').isVisible().catch(()=>false);
    await page.waitForSelector('.title-start, [data-action="start"], .home',{timeout:30000});const interactive=Date.now()-t0;
    await page.waitForLoadState('networkidle',{timeout:30000});const idle=Date.now()-t0;
    report.load.push({profile:profile.name,interactiveMs:interactive,networkIdleMs:idle,transferredKB:Math.round(bytes/1024),hosts:[...hosts],bootPlaceholder:bootVisible});
    await ctx.close();
  }
  // 2. Every route at every scored viewport with a finished record.
  const ctx=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true});const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base+'/');
  const seedFinished=()=>page.evaluate(async()=>{
    const m=await import(new URL('./src/state.js',location.href).href).catch(()=>null);return !!m;
  });
  const devModules=await seedFinished();
  if(devModules){
    await page.evaluate(async()=>{
      const {freshState,completeStage}=await import('/src/state.js');const {sites,terrains,creatures,finalCases}=await import('/src/data.js');const {challenges}=await import('/src/challenge-data.js');
      const s=freshState();s.settings.muted=true;s.settings.flatGlobe=true;
      Object.assign(s.drafts[1],{samples:sites.map(x=>x.id),atmosphere:true,classifications:Object.fromEntries(sites.map(x=>[x.id,x.type])),conclusion:'global'});
      Object.assign(s.drafts[2],{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'different',firstPrediction:'different',prepared:true,heated:true,seenBefore:true,seenAfter:true,residue:'sea',reason:'dissolved'});
      Object.assign(s.drafts[3],{photos:terrains.map(x=>x.id),pins:Object.fromEntries(terrains.map(x=>[x.id,{x:45,y:45}])),features:Object.fromEntries(terrains.map(x=>[x.id,x.feature])),compare:'through'});
      Object.assign(s.drafts[4],{a:0,b:3,time:3,markers:['pole','rock'],direction:'up',concept:'in'});
      Object.assign(s.drafts[5],{found:creatures.map(x=>x.id),selected:'crab',features:Object.fromEntries(creatures.map(x=>[x.id,x.feature])),value:'habitat',action:'observe'});
      for(let n=1;n<=5;n++){for(const t of challenges[n]){s.research[n].answers[t.id]=['sort','match'].includes(t.type)?Object.fromEntries(t.items.map(x=>[x.id,x.answer])):structuredClone(t.answer);s.research[n].solved.push(t.id);}completeStage(s,n);}
      finalCases.forEach((c,i)=>{s.links[i]={stage:c.stage,reason:c.answer};});s.issuedAt=new Date('2026-11-09T09:00:00Z').toISOString();
      localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));
    });
    await page.reload();
    report.seededCompleted=await page.evaluate(()=>JSON.parse(localStorage.getItem('blue-planet-hq:v2')).completed.length);
  }
  const routes=['home','hub','s1a','s1b','s1c','s1d','s2a','s2b','s2c','s2d','s3a','s3b','s3c','s3d','s4a','s4b','s4c','s4d','s5a','s5b','s5c','s5d','report','link','ending','certificate'];
  const audit=()=>{
    const visible=el=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&!el.closest('[aria-hidden="true"],.sr-only,[hidden]');};
    let minFont=99,minFontText='';const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()){const text=node.textContent.trim();if(!text||!node.parentElement||!visible(node.parentElement))continue;const size=parseFloat(getComputedStyle(node.parentElement).fontSize);if(size<minFont){minFont=size;minFontText=text.slice(0,30);}}
    const small=[];for(const el of document.querySelectorAll('button,a[href],input,select,summary,[role="button"]')){if(!visible(el)||el.disabled)continue;const r=el.getBoundingClientRect();if(el.matches('input[type="range"]'))continue;if(r.width<44||r.height<44)small.push(`${(el.getAttribute('aria-label')||el.textContent).trim().slice(0,24)} ${Math.round(r.width)}x${Math.round(r.height)}`);}
    // Contrast on solid backgrounds only (text over pictures is judged by eye in screenshots).
    const rgb=c=>{const m=c.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];return {r:m[0],g:m[1],b:m[2],a:m[3]??1};};
    const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
    let minContrast=99,minContrastText='',lowContrast=0;const seen=new Set();const w2=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let tn;
    while(tn=w2.nextNode()){const el=tn.parentElement;if(!tn.textContent.trim()||!el||seen.has(el)||!visible(el))continue;seen.add(el);const cs=getComputedStyle(el);if(parseFloat(cs.opacity)<1)continue;
      let bg=null;for(let a=el;a;a=a.parentElement){const s=getComputedStyle(a);if(s.backgroundImage!=='none'||parseFloat(s.opacity)<1||s.backdropFilter&&s.backdropFilter!=='none')break;const c=rgb(s.backgroundColor);if(c.a>=.95){bg=c;break;}if(c.a>0)break;}
      if(!bg)continue;const fg=rgb(cs.color);if(fg.a<.95)continue;const L1=lum(fg),L2=lum(bg),ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
      const large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&Number(cs.fontWeight)>=700);if(ratio<(large?3:4.5))lowContrast++;if(ratio<minContrast){minContrast=+ratio.toFixed(2);minContrastText=tn.textContent.trim().slice(0,24);}}
    const de=document.documentElement;return {minFont,minFontText,smallTargets:small,hScroll:de.scrollWidth>innerWidth+2,vScroll:de.scrollHeight>innerHeight+2,minContrast,minContrastText,lowContrast};
  };
  for(const [w,h] of [[1920,1080],[1280,800],[1024,768],[1024,600],[915,412]]){
    await page.setViewportSize({width:w,height:h});
    for(const r of routes){await page.goto(`${base}/#${r}`);await page.waitForFunction(r=>document.querySelector('#app')?.classList.contains('route-'+r),r,{timeout:3000}).catch(()=>report.errors.push('route not reached '+r));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
      const a=await page.evaluate(audit);report.routes.push({size:`${w}x${h}`,route:r,...a});
      if([1920,1024].includes(w)&&['home','hub','s1a','s4b','report','certificate'].includes(r))await page.screenshot({path:path.join(out,`${w}x${h}-${r}.png`)});}
  }
  // The clip lives in Moa's hint bubble, exactly where a learner finds it.
  const openConcept=async page=>{if(!(await page.locator('.moa-hint[open]').count()))await page.locator('.moa-hint > summary').click();await page.locator('[data-action="concept"]:visible').first().click();};
  // 3. Keyboard: focus ring visible, dialogs close with Escape.
  await page.setViewportSize({width:1280,height:800});await page.goto(`${base}/#s1a`);await page.waitForTimeout(400);
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  report.keyboard.focusRing=await page.evaluate(()=>{const el=document.activeElement;const cs=getComputedStyle(el);return {tag:el.tagName,label:(el.getAttribute('aria-label')||el.textContent).trim().slice(0,30),outline:cs.outlineStyle+' '+cs.outlineWidth,boxShadow:cs.boxShadow!=='none'};});
  await openConcept(page);await page.waitForSelector('dialog[open]');await page.keyboard.press('Escape');
  report.keyboard.conceptEscCloses=await page.locator('dialog[open]').count()===0;
  // 4. Concept clips: WebM decodes in headless Chrome, poster shown first, timeline length.
  for(let n=1;n<=5;n++){
    await page.goto(`${base}/#s${n}a`);await page.waitForTimeout(300);await openConcept(page);
    await page.waitForFunction(()=>{const v=document.querySelector('dialog[open] video');return v&&v.readyState>=2;},null,{timeout:10000}).catch(()=>{});
    const info=await page.evaluate(()=>{const v=document.querySelector('dialog[open] video');return {poster:v?.poster.split('/').pop(),src:v?.currentSrc.split('/').pop(),readyState:v?.readyState,duration:v?.duration,width:v?.videoWidth,height:v?.videoHeight,label:document.querySelector('.concept-controls span')?.textContent,scenes:document.querySelectorAll('[data-cue-index]').length};});
    await page.waitForTimeout(1200);info.advanced=await page.evaluate(()=>document.querySelector('dialog[open] video')?.currentTime||0);
    if(n===4)await page.screenshot({path:path.join(out,'concept-4.png')});
    report.concepts.push({chapter:n,...info});await page.keyboard.press('Escape');
  }
  await ctx.close();
} finally {await browser.close();}
const fails=report.routes.filter(r=>r.hScroll||r.smallTargets.length);
const fontFloor=report.routes.filter(r=>(r.size==='1920x1080'&&r.minFont<18)||(r.size.startsWith('1024')&&r.minFont<14));
const contrast=report.routes.filter(r=>r.lowContrast);
report.summary={lowContrastRoutes:contrast.length,minContrast:Math.min(...report.routes.map(r=>r.minContrast)),routeChecks:report.routes.length,hScrollOrSmall:fails.length,belowFontFloor:fontFloor.length,errors:report.errors.length};
await writeFile(path.join(out,'audit.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({load:report.load,summary:report.summary,keyboard:report.keyboard,concepts:report.concepts,examples:fails.slice(0,8),contrast:contrast.slice(0,10).map(r=>`${r.size} ${r.route} ${r.lowContrast} min ${r.minContrast} "${r.minContrastText}"`),font:fontFloor.slice(0,12).map(r=>`${r.size} ${r.route} ${r.minFont}px "${r.minFontText}"`),errors:report.errors.slice(0,8)},null,1));
