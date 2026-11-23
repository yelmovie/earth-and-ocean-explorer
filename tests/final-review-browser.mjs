// Focused final-review regressions. Fixtures are labelled; the full unseeded journey is release-browser.mjs.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {freshState,completeStage,SAVE_KEY} from '../src/state.js';
import {sites,terrains,creatures,finalCases} from '../src/data.js';
import {challenges} from '../src/challenge-data.js';
const {chromium}=createRequire(process.env.PLAYWRIGHT_RUNNER||'/Volumes/T7 Shield/DevCaches/playwright-runner/package.json')('playwright');
const base=(process.env.GAME_URL||'http://127.0.0.1:4183').replace(/\/$/,'');
const out=path.resolve(process.env.QA_OUTPUT||'artifacts/final-review-priority');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(15000);
const report={base,fixtureUse:'Earned prior chapters seeded for isolated regressions; no learner or production data.',checks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
const note=name=>{report.checks.push(name);console.log('ok '+name);};
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
const click=(action,value)=>page.locator(`[data-action="${action}"]${value===undefined?'':`[data-value="${value}"]`}`).first().tap();
const choose=(field,value)=>page.locator(`[data-action="choose"][data-field="${field}"][data-value="${value}"]`).tap();
const shot=name=>page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});
function earned(limit){
 const s=freshState();s.settings.muted=true;
 Object.assign(s.drafts[1],{samples:['asia','pacific','africa'],atmosphere:true,classifications:{asia:'육지',pacific:'바다',africa:'육지'},conclusion:'global'});
 Object.assign(s.drafts[2],{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'same',prepared:true,heated:true,seenBefore:true,seenAfter:true,residue:'sea',reason:'dissolved'});
 Object.assign(s.drafts[3],{photos:terrains.map(t=>t.id),pins:Object.fromEntries(terrains.map(t=>[t.id,{x:50,y:50}])),features:Object.fromEntries(terrains.map(t=>[t.id,t.feature])),compare:'through'});
 Object.assign(s.drafts[4],{a:0,b:3,markers:['pole','rock'],direction:'up',concept:'in'});
 Object.assign(s.drafts[5],{found:creatures.map(c=>c.id),features:Object.fromEntries(creatures.map(c=>[c.id,c.feature])),value:'habitat',action:'observe'});
 for(let n=1;n<=limit;n++){for(const t of challenges[n]){s.research[n].answers[t.id]=['sort','match'].includes(t.type)?Object.fromEntries(t.items.map(i=>[i.id,i.answer])):structuredClone(t.answer);s.research[n].solved.push(t.id);}assert.equal(completeStage(s,n),true);}
 return s;
}
async function seed(s,route){s.route=route;s.resume=route;await page.goto(`${base}/?setup=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.locator('[data-action="settings"]').waitFor();await page.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[SAVE_KEY,s]);await page.goto(`${base}/?case=${Date.now()}#${route}`,{waitUntil:'domcontentloaded'});await page.locator(`#app.route-${route}`).waitFor();await page.evaluate(()=>document.fonts.ready);}
async function denseLayout(label){
 report.denseLayouts??=[];
 for(const [width,height]of [[1280,800],[1024,768],[1920,1080],[915,412]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const issues=await page.evaluate(()=>{
   const issues=[];
   for(const el of document.querySelectorAll('.learning .activity,.learning .work-panel,.learning .challenge-board'))if(el.scrollHeight>el.clientHeight+3)issues.push(`overflow ${el.className} ${el.scrollHeight}/${el.clientHeight}`);
   const reminder=document.querySelector('[data-observation-remaining]:not([hidden])');
   if(reminder){const r=reminder.getBoundingClientRect();if(!r.height||r.bottom>document.querySelector('.mission-footer').getBoundingClientRect().top)issues.push('remaining task hidden or below footer');}
   return issues;
  });
  report.denseLayouts.push({label,width,height,issues});await shot(`${label}-${width}x${height}`);assert.deepEqual(issues,[],`${label} ${width}x${height}`);
 }
 await page.setViewportSize({width:1280,height:800});
}
async function slider(field,value){const el=page.locator(`[data-field="${field}"]`),range=await el.evaluate(e=>({min:+e.min,step:+e.step||1}));await el.focus();await page.keyboard.press('Home');for(let v=range.min;v<value;v+=range.step)await page.keyboard.press('ArrowRight');await page.keyboard.press('Tab');assert.equal(await el.inputValue(),String(value));}
try{
 const s=freshState();s.settings.muted=true;s.settings.flatGlobe=true;await seed(s,'s1a');
 await page.waitForFunction(()=>document.querySelector('#globe-mode')?.textContent==='2D 대체 관찰');
 for(const id of ['asia','pacific','africa'])await click('site',id);
 assert.equal(await page.locator('[data-observation-remaining]').innerText(),'남은 일: 대기 확인');assert.equal(await page.locator('[data-observation-remaining]').isVisible(),true);
 assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);await denseLayout('01-atmosphere-remaining');
 await click('atmosphere');await click('next');
 for(const id of ['asia','pacific','africa']){await page.locator(`[data-sample="${id}"]`).tap();await page.locator(`[data-sample-bin="${id==='asia'?'바다':sites.find(x=>x.id===id).type}"]`).tap();}
 await choose('conclusion','global');await click('complete');
 assert.equal(await page.locator('[data-sample].recheck').count(),1);assert.equal(await page.locator('[data-sample].recheck').getAttribute('data-sample'),'asia');assert.match(await page.locator('#hint').innerText(),/어떤 부분/);await denseLayout('01-wrong-only');
 await page.locator('[data-sample="asia"]').tap();await page.locator('[data-sample-bin="육지"]').tap();assert.equal(await page.locator('[data-sample].recheck').count(),0);await click('complete');await page.locator('#app.route-s1c').waitFor();note('1장 2D·대기 미완 표시·오답 표본만 강조·두 번 누르기 수정');
 // Automatic WebGL-unavailable fallback, independent of the settings switch.
 const flat=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});await flat.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};});
 const fallback=await flat.newPage();await fallback.goto(`${base}/#s1a`,{waitUntil:'domcontentloaded'});await fallback.waitForFunction(()=>document.querySelector('#globe-mode')?.textContent==='2D 대체 관찰');
 for(const id of ['asia','pacific','africa'])await fallback.locator(`[data-action="site"][data-value="${id}"]`).tap();await fallback.locator('[data-action="atmosphere"]').tap();assert.equal(await fallback.locator('[data-action="next"]').isEnabled(),true);await fallback.screenshot({path:path.join(out,'01-webgl-fallback.png')});await flat.close();note('WebGL 초기화 불가 시 자동 2D 대체에서 같은 관찰 판단 가능');
 for(const first of ['prediction','conditions']){
  const s=earned(1);s.drafts[2]=freshState().drafts[2];await seed(s,'s2a');
  if(first==='prediction')await choose('prediction','same');
  assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
  await slider('sea',40);assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);await slider('heatSea',1);
  if(first==='conditions'){assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);await choose('prediction','different');}
  assert.match(await page.locator('[data-lab-status]').innerText(),/같은 시간 후 함께 종료/);await click('next');await page.locator('#app.route-s2b').waitFor();
  await click('heat');await page.waitForFunction(()=>document.querySelectorAll('.beaker.evaporated').length===2);
  const d=(await saved()).drafts[2];assert.ok(d.heated&&d.seenBefore&&d.seenAfter);assert.equal(d.fresh,d.sea);assert.equal(d.heatFresh,d.heatSea);
  await choose('residue','sea');await choose('reason','dissolved');await click('complete');await page.locator('#app.route-s2c').waitFor();
  for(const id of first==='prediction'?['a','b','c','d']:['b','a','c','d'])await click('challenge-order',id);
  assert.ok((await saved()).research[2].solved.includes('lab-order'));assert.match(await page.locator('.challenge-why-card').innerText(),/어느 쪽/);await page.locator('.challenge-why-card').tap();await denseLayout(`02-${first}-first`);note(`2장 ${first} 우선 준비·가열 전 조건 검사·함께 종료·도전 순서 통과`);
 }
 const coast=earned(2);coast.drafts[3]={...freshState().drafts[3],photos:terrains.map(t=>t.id)};await seed(coast,'s3b');await click('pin','sand');await choose('features.sand',terrains.find(t=>t.id==='cliff').feature);
 assert.equal(await page.locator('.photo-card.is-done').count(),0);assert.match(await page.locator('.coast-feature-panel').innerText(),/정확히 분류 0 \/ 4/);assert.match(await page.locator('.coast-feature-panel h2').innerText(),/모래사장/);assert.equal((await saved()).completed.includes(3),false);await denseLayout('03-wrong-stays-here');assert.match(await page.locator('#hint').innerText(),/모래사장/);
 await page.locator('[aria-label="모래사장 특징 다시 고르기"]').tap();assert.equal((await saved()).drafts[3].features.sand,'');await choose('features.sand',terrains.find(t=>t.id==='sand').feature);
 for(const t of terrains.filter(t=>t.id!=='sand')){await click('pin',t.id);await choose(`features.${t.id}`,t.feature);}
 await choose('compare','through');await denseLayout('03-classified');await click('complete');await page.locator('#app.route-s3c').waitFor();note('3장 본 사례/정확한 분류 분리·오답 기록 제외·제자리 다시 고르기·복귀');
 for(const [a,b,direction,concept]of [[0,3,'up','in'],[3,6,'down','out']]){
  const s=earned(3);s.drafts[4]=freshState().drafts[4];await seed(s,'s4a');await slider('time',a);await click('tide-save','a');await slider('time',b);await click('tide-save','b');await click('next');
  assert.match(await page.locator('.question-step').first().innerText(),/상태 비교/);assert.match(await page.locator('.question-step').last().innerText(),/움직이는 과정/);assert.equal(await page.locator('[data-tide-state]').count(),2);
  await click('marker','pole');await click('marker','rock');await choose('direction',direction);await choose('concept',concept);await shot(`04-${concept}`);await click('complete');await page.locator('#app.route-s4c').waitFor();note(`4장 ${concept} 두 시각 비교·과정/상태·대체 입력 통과`);
 }
 const final=earned(5);await seed(final,'link');await click('link-stage',1);await page.locator('.link-actions [data-action="case"]').tap();await choose('linkReason',0);await page.locator('.case-tabs [data-value="0"]').tap();
 assert.deepEqual((await saved()).finalDraft,{caseIndex:0,stage:1,reason:null});assert.match(await page.locator('.link-status').innerText(),/이유가 빠졌어요/);await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('[data-action="link-stage"].selected').getAttribute('data-value'),'1');assert.match(await page.locator('#hint').innerText(),/까닭/);await shot('05-partial-restored');
 await choose('linkReason',finalCases[0].answer);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).finalDraft.caseIndex===1,SAVE_KEY);assert.deepEqual((await saved()).finalDraft,{caseIndex:1,stage:null,reason:0});assert.match(await page.locator('.link-status').innerText(),/증거가 빠졌어요/);assert.deepEqual((await saved()).evidence,final.evidence);note('최종 미션 미완 선택·새로고침·자동 다음 이동 보존 및 빠진 항목 표시');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.stack;await shot('failure').catch(()=>{});throw error;}
finally{await writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
