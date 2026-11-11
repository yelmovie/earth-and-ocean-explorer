import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const require=createRequire(process.env.PLAYWRIGHT_RUNNER||'/Volumes/T7 Shield/DevCaches/playwright-runner/package.json');
const {chromium}=require('playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:5173';
const out=path.resolve(process.env.QA_OUTPUT||'artifacts/activity-viewport');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.goto(base);
async function seed(route='s1a',draft={}) {
  await page.evaluate(async({route,draft})=>{
    const {freshState,completeStage}=await import('/src/state.js');
    const {sites,terrains,creatures}=await import('/src/data.js');
    const {challenges}=await import('/src/challenge-data.js');
    const s=freshState();s.settings.muted=true;s.settings.flatGlobe=true;
    Object.assign(s.drafts[1],{samples:sites.map(x=>x.id),atmosphere:true,classifications:Object.fromEntries(sites.map(x=>[x.id,x.type])),conclusion:'global'});
    Object.assign(s.drafts[2],{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'different',prepared:true,heated:true,seenBefore:true,seenAfter:true,residue:'sea',reason:'dissolved'});
    Object.assign(s.drafts[3],{photos:terrains.map(x=>x.id),pins:Object.fromEntries(terrains.map(x=>[x.id,{x:45,y:45}])),features:Object.fromEntries(terrains.map(x=>[x.id,x.feature])),compare:'through'});
    Object.assign(s.drafts[4],{a:0,b:3,time:3,markers:['pole','rock'],direction:'up',concept:'in'});
    Object.assign(s.drafts[5],{found:creatures.map(x=>x.id),selected:'crab',features:Object.fromEntries(creatures.map(x=>[x.id,x.feature])),value:'habitat',action:'observe'});
    for(let n=1;n<=5;n++){
      for(const t of challenges[n]){s.research[n].answers[t.id]=['sort','match'].includes(t.type)?Object.fromEntries(t.items.map(x=>[x.id,x.answer])):structuredClone(t.answer);s.research[n].solved.push(t.id);}
      completeStage(s,n);
    }
    // Valid prior evidence unlocks every stage, while activities use fresh drafts.
    const fresh=freshState();s.drafts=fresh.drafts;Object.assign(s.drafts[Number(route[1])],draft);
    s.research=fresh.research;s.route=route;s.resume=route;
    localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));
  },{route,draft});
  await page.goto(`${base}/?fixture=${Date.now()}#${route}`);await page.evaluate(()=>document.fonts.ready);
}
const audit=()=>{
  const issues=[],de=document.documentElement;
  if(de.scrollHeight>innerHeight+2)issues.push(`document height ${de.scrollHeight}/${innerHeight}`);
  if(de.scrollWidth>innerWidth+2)issues.push(`document width ${de.scrollWidth}/${innerWidth}`);
  const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('details:not([open]) > :not(summary)');
  for(const el of document.querySelectorAll('.topbar button,.learning button,.learning select,.learning input,.learning summary')){
    if(!visible(el))continue;
    const r=el.getBoundingClientRect(),label=(el.getAttribute('aria-label')||el.textContent).trim().slice(0,45);
    if(r.width<47||r.height<47)issues.push(`small target ${label} [${Math.round(r.width)}x${Math.round(r.height)}]`);
    if(r.top<0||r.left<0||r.bottom>innerHeight+2||r.right>innerWidth+2)issues.push(`outside ${label} [${[r.x,r.y,r.width,r.height].map(Math.round)}]`);
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    if(!el.disabled&&hit&&!el.contains(hit))issues.push(`covered ${label} by ${hit.className}`);
    if(!el.matches('input,select,summary,.trace,.survey-lens')){
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode()){
        if(!node.textContent.trim()||node.parentElement.closest('.sr-only,.challenge-progress'))continue;
        const range=document.createRange();range.selectNodeContents(node);
        if([...range.getClientRects()].some(t=>t.left<r.left-2||t.right>r.right+2||t.top<r.top-2||t.bottom>r.bottom+2)){issues.push(`text clipped ${label}`);break;}
      }
    }
  }
  for(const el of document.querySelectorAll('.activity,.challenge-layout,.work-panel,.challenge-board')){
    const r=el.getBoundingClientRect();if(el.scrollHeight>el.clientHeight+3)issues.push(`panel overflow ${el.className}: ${el.scrollHeight}/${el.clientHeight}`);
    if(r.bottom>document.querySelector('.mission-footer').getBoundingClientRect().top+2)issues.push(`panel crosses footer ${el.className}`);
  }
  for(const el of document.querySelectorAll('.range-field>span,.range-field>output,.creature-header h2,.creature-cards p,.beaker-mark')){
    if(!visible(el))continue;
    const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    if(hit&&!el.contains(hit))issues.push(`covered label ${el.textContent.trim()} by ${hit.className}`);
  }
  const ticks=[...document.querySelectorAll('.beaker-scale i')].filter(visible);
  for(let i=0;i<ticks.length;i++)for(let j=i+1;j<ticks.length;j++){
    if(ticks[i].parentElement!==ticks[j].parentElement)continue;
    const a=ticks[i].getBoundingClientRect(),b=ticks[j].getBoundingClientRect();
    if(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push('overlapping beaker scale');
  }
  const tide=document.querySelector('.tide-wipe-before .tide-scene');
  if(tide){
    const rect=tide.getBoundingClientRect();
    const paintedHeight=Math.min(rect.height,rect.width*270/480);
    if(paintedHeight<130)issues.push(`tide comparison too small: ${Math.round(paintedHeight)}px`);
  }
  return [...new Set(issues)];
};
const checks=[];
try {
  if(!process.env.FLOW_ONLY){
    await seed();
    // Layout fixture: six samples and an expanded creature create the dense states.
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('blue-planet-hq:v2'));s.settings.unlockAll=true;s.drafts[1].samples=['asia','pacific','africa','atlantic','australia','indian'];s.drafts[5].selected='crab';localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));});
    await page.reload();
    const sizes=process.env.QA_SIZES?process.env.QA_SIZES.split(',').map(x=>x.split('x').map(Number)):[[1920,1080],[1366,768],[1280,800],[1024,768],[1024,600],[915,412],[830,515],[768,1024],[375,812]];
    for(const [width,height]of sizes){
      await page.setViewportSize({width,height});
      for(let n=1;n<=5;n++)for(const step of 'abcd'){
        const route=`s${n}${step}`;if(process.env.QA_DEBUG)console.log(route);await page.goto(`${base}/#${route}`);await page.evaluate(()=>document.fonts.ready);
        for(const task of ['c','d'].includes(step)?[0,1,2,3]:[null]){
          if(task!==null)await page.locator(`[data-action="challenge-task"][data-value="${task}"]`).click();
          const issues=await page.evaluate(audit);checks.push({size:[width,height],route,task,issues});
          if((task===null||task===0)&&[1280,915,375].includes(width))await page.screenshot({path:path.join(out,`${width}x${height}-${route}.png`)});
        }
      }
      console.log(`viewport ${width}x${height} checked`);
    }
    const failures=checks.filter(x=>x.issues.length);await writeFile(path.join(out,'layout.json'),JSON.stringify({checks:checks.length,failures,errors},null,2));
    console.log(JSON.stringify({checks:checks.length,failures:failures.length,examples:failures.slice(0,14),errors},null,2));
    assert.equal(failures.length,0,'Every stage must fit without clipping or scrolling');
  }
  if(!process.env.LAYOUT_ONLY){
    await page.setViewportSize({width:1280,height:800});
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blue-planet-hq:v2')));
    const stateChecks=[];
    const checkState=async(label)=>{
      for(const [width,height]of [[1280,800],[915,412],[375,812]]){
        await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const issues=await page.evaluate(audit);
        stateChecks.push({label,size:[width,height],issues});
        await page.screenshot({path:path.join(out,`${width}x${height}-${label}.png`)});
        assert.deepEqual(issues,[],`${label} at ${width}x${height}`);
      }
      await page.setViewportSize({width:1280,height:800});
    };
    const play=()=>page.locator('[data-autoplay]').click();
    const speed=value=>page.locator('[data-playback-speed]').selectOption(String(value));
    await seed('s2a');await speed(3);await play();
    await page.waitForFunction(()=>document.querySelector('[data-field="sea"]').value==='40'&&document.querySelector('[data-field="heatSea"]').value==='1');
    await page.waitForFunction(()=>document.querySelector('[data-autoplay]').getAttribute('aria-pressed')==='false');
    assert.equal((await saved()).drafts[2].prediction,'');
    await page.locator('[data-field="prediction"][data-value="different"]').click();await page.locator('[data-action="next"]').click();
    await page.waitForURL(url=>url.hash==='#s2b');await speed(0.5);await page.locator('[data-action="heat"]').click();
    await page.waitForFunction(()=>document.querySelector('.experiment-progress')?.value>0.1);await play();
    const paused=await page.locator('.experiment-progress').evaluate(el=>el.value);await page.waitForTimeout(500);
    assert.equal(await page.locator('.experiment-progress').evaluate(el=>el.value),paused);assert.equal((await saved()).drafts[2].heated,false);
    await checkState('heating-paused');
    await speed(3);await play();await page.waitForFunction(()=>document.querySelector('.beaker.evaporated'));
    const lab=(await saved()).drafts[2];assert.equal(lab.heated,true);assert.equal(lab.residue,'');assert.equal(lab.reason,'');
    assert.equal(await page.locator('[data-autoplay]').getAttribute('aria-pressed'),'false');
    await checkState('heated-result');
    await page.locator('[data-field="residue"][data-value="sea"]').click();await checkState('lab-reason');
    await seed('s2b',{fresh:40,sea:40,heatFresh:1,heatSea:1,prepared:true,prediction:'different'});
    await page.locator('[data-action="heat"]').click();await page.locator('[data-action="go"][data-value="s2a"]').click();await page.waitForTimeout(1500);
    assert.equal((await saved()).drafts[2].heated,false);
    await seed('s1a');await speed(3);await play();await page.waitForFunction(()=>document.querySelector('[data-action="atmosphere"]')?.disabled);
    assert.equal((await saved()).drafts[1].samples.length,6);assert.equal((await saved()).drafts[1].conclusion,'');
    await page.waitForFunction(()=>document.querySelector('[data-autoplay]')?.getAttribute('aria-pressed')==='false');await checkState('globe-observed');
    await seed('s3a');await speed(3);await play();await page.waitForFunction(()=>document.querySelector('.mini-progress b')?.textContent==='4 / 4');
    assert.deepEqual((await saved()).drafts[3].features,{});
    await page.waitForFunction(()=>document.querySelector('[data-autoplay]')?.getAttribute('aria-pressed')==='false');await checkState('coast-captured');
    await seed('s4a');await speed(3);await play();await page.waitForFunction(()=>document.querySelector('[data-autoplay]')?.getAttribute('aria-pressed')==='false');
    const tide=(await saved()).drafts[4];assert.equal(tide.a,0);assert.equal(tide.b,3);assert.equal(tide.direction,'');
    await checkState('tide-recorded');
    await page.locator('[data-action="next"]').click();await page.waitForURL(url=>url.hash==='#s4b');await play();
    await page.waitForFunction(()=>document.querySelector('[data-autoplay]')?.getAttribute('aria-pressed')==='false');
    assert.deepEqual((await saved()).drafts[4].markers,['pole','rock']);assert.equal((await saved()).drafts[4].concept,'');
    await page.locator('[data-field="direction"][data-value="up"]').click();await checkState('tide-concept');
    await seed('s5a');await speed(3);await play();await page.waitForFunction(()=>document.querySelector('[data-action="observe-feature"]'));
    assert.equal(await page.locator('[data-autoplay]').getAttribute('aria-pressed'),'false');assert.deepEqual((await saved()).drafts[5].features,{});
    await page.locator('[data-action="observe-feature"]').first().click();
    await checkState('creature-recorded');
    await seed('s1b',{samples:['asia','pacific','africa'],atmosphere:true});assert.equal(await page.locator('[data-autoplay]').count(),0);
    await page.locator('[data-sample-bin="육지"]').click();assert.equal((await saved()).drafts[1].classifications.asia,'육지');
    await page.locator('.moa-hint > summary').click();await page.locator('[data-note]').click();assert.equal(await page.locator('dialog[open]').count(),1);await page.locator('dialog[open] button').click();
    console.log('Autoplay: condition setup, answer boundary, pause/resume, speed, navigation cancellation, all observation stages and manual controls passed');
    await writeFile(path.join(out,'flow.json'),JSON.stringify({passed:true,stateChecks,errors},null,2));assert.deepEqual(errors,[]);
  }
} finally {await browser.close();}
