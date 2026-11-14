let cleanupExpedition;
import { mountNpcGuide } from './npc-guide.js';
import { showChapterReward } from './chapter-reward.js';
let disposeNpc, closeResidentScene;
import './styles.css';
import './settings.css';
import './diagnostics.js';
import './experience.css';
import './science-stages.css';
import './field-stages.css';
import './challenge-stages.css';
import './responsive-stages.css';
import './glass-ui.css';
const loadConcepts = () => import('./concepts.js');
import { mountInteractions } from './interactions.js';
import { chapters, sites, terrains, creatures, routes, asset, tideHeight } from './data.js';
import { freshState, loadState, saveState, recordPrediction, recordTideObservation, tideIntervalDirection, previewState, aReady, canAccess, completeStage, allLinked, linkEvidence } from './state.js';
import { home, hub, learning, report, link, ending, certificate, recordDetail, tideScene, esc, character } from './screens.js';
import { icon } from './icons.js';
import { createAudio } from './audio.js';
import { createVoice, hasVoice } from './voice.js';
import { VOICE_TEXT } from './voice-ids.js';
let copy;
const loadSettings = async () => copy ??= (await import('./settingsContent.js')).settingsContent;
import { handleChallenge, mountChallenges } from './challenges.js';
import { mountActivityFlow, startActivityHeating, stageGuide } from './activity-flow.js';
let cleanupActivityFlow;

const app=document.querySelector('#app');
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const loaded=loadState(storage);let state=loaded.state,warning=loaded.warning,local={},controller=null,cleanupChallenges=null,cleanupInteractions=null,epoch=0,toastTimer,focusBeforeModal;
let studentState=null;
if(state.settings.unlockAll){state.settings.unlockAll=false;studentState=state;state=previewState(studentState);}
const audioPlayer=createAudio(()=>state.settings);
const tone=(frequency=520)=>audioPlayer.tone(frequency);
const sound=name=>audioPlayer.effect(name);
// 캐릭터 대사 음성: 화면 글과 같은 문장을 읽고, 화면 이동·대화창 닫기·소리 끄기에서 멈춘다. '다시 듣기'는 마지막 대사를 다시 읽는다.
const voice=createVoice({enabled:()=>!state.settings.muted&&state.settings.sfxEnabled!==false,duck:v=>audioPlayer.duck(v)});
let lastVoice=null,voiceRoute=null;
const voiceIdOf=text=>Object.keys(VOICE_TEXT).find(id=>VOICE_TEXT[id]===text);
function speak(ids,{replayHost}={}){const list=[].concat(ids).filter(hasVoice);if(!list.length)return false;lastVoice=list;document.querySelector('[data-action="voice-replay"]')?.removeAttribute('hidden');if(replayHost&&!replayHost.querySelector('[data-action="voice-replay"]')){const b=document.createElement('button');b.type='button';b.className='secondary voice-replay';b.dataset.action='voice-replay';b.innerHTML=`${icon('sound')}<span>다시 듣기</span>`;replayHost.prepend(b);}return voice.play(list);}
const playConcept=(n,options={})=>openOptional(loadConcepts,({showConcept})=>showConcept(n,{audio:audioPlayer,...options}));
const context=()=>({state,save,render,feedback,navigate,sound,tideScene,finishChapter:n=>{const shown=showChapterReward(n,{navigate,completed:state.completed.length});const dialog=document.querySelector('.chapter-reward[open]');if(shown&&dialog){speak(`reward-${n}`,{replayHost:dialog.querySelector('.modal-footer')});dialog.addEventListener('close',()=>voice.stop(),{once:true});}return shown;}});
function save(options){if(studentState){const status=document.querySelector('#save-status');if(status)status.textContent='미리보기 · 저장하지 않음';return;}warning=saveState(storage,state,options);const status=document.querySelector('#save-status');if(status)status.textContent=warning?'저장 확인 필요':'자동 저장됨';if(!warning)document.querySelector('.storage-warning')?.remove();else if(!document.querySelector('.storage-warning')){const p=document.createElement('div');p.className='storage-warning';p.setAttribute('role','alert');p.textContent=warning;app.prepend(p);}}
function routeName(r){const m=/^s([1-5])([abcd])$/.exec(r);return m?`${chapters[+m[1]-1].title} · ${({a:'관찰',b:'연결',c:'도전',d:'적용'}[m[2]])}`:({home:'시작 화면',hub:'탐사 지도',report:'최종 보고서',link:'DATA LINK',ending:'2D 엔딩',certificate:'조사원 인증서'}[r]||'탐사 지도');}
function navigate(route,{back=false,push=true}={}){
  if(!canAccess(state,route)){feedback('앞선 조사를 마치면 열리는 곳이야. 탐사 지도에서 다음 장소를 확인해 줘.');return;}
  voice.stop();lastVoice=null;
  document.querySelector('.concept-dialog[open], .chapter-reward[open]')?.close();
  clearTimeout(toastTimer);const oldToast=document.querySelector('#toast');if(oldToast)oldToast.className='';
  if(route!==state.route&&!back)state.history.push(state.route);
  state.history=state.history.slice(-40);state.route=route;if(route!=='home')state.resume=route;local={};save();
  if(push)window.history.pushState({route},'',`#${route}`);render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('h1')?.focus({preventScroll:true});
}
function previous(){let r;while(state.history.length){const candidate=state.history.pop();if(candidate!==state.route&&canAccess(state,candidate)){r=candidate;break;}}navigate(r||'hub',{back:true});}
function feedback(message,good=false){const hint=[...document.querySelectorAll('#hint, .challenge-feedback')].find(el=>el.getClientRects().length);if(hint){hint.textContent=message;hint.classList.toggle('good',good);}else{let toast=document.querySelector('#toast');if(!toast){toast=document.createElement('div');toast.id='toast';toast.setAttribute('role','status');document.body.append(toast);}toast.textContent=message;toast.className=good?'show good':'show';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.className='',3600);}tone(good?660:330);}
function restoreLinkDraft(){
  if(state.finalDraft.stage!==null||state.finalDraft.reason!==null)return;
  const saved=state.links[state.finalDraft.caseIndex];
  if(saved){state.finalDraft.stage=saved.stage;state.finalDraft.reason=saved.reason;}
}
function syncLinkGuidance(){
  if(state.route!=='link')return;
  const index=state.finalDraft.caseIndex,saved=state.links[index],complete=allLinked(state);
  const linked=Boolean(saved)&&saved.stage===state.finalDraft.stage&&saved.reason===state.finalDraft.reason;
  const ready=state.finalDraft.stage!==null&&state.finalDraft.reason!==null;
  const check=app.querySelector('[data-action="check-link"]'),hint=app.querySelector('#hint');
  const next=app.querySelector('[data-link-next],.link-actions [data-action="case"]');
  const ending=app.querySelector('.link-actions [data-action="go"][data-value="ending"]');
  app.querySelectorAll('.next-target').forEach(element=>element.classList.remove('next-target'));
  if(check){
    check.disabled=linked||!ready;
    check.setAttribute('aria-describedby','hint');
    check.classList.toggle('is-ready',ready&&!linked);
    check.textContent=linked?'✓ 연결 완료':'연결 확인';
  }
  let target;
  if(complete&&linked){
    if(hint)hint.textContent='다섯 상황 연결 완료! 복구된 이야기 보기를 눌러요.';
    target=ending;
  }else if(linked){
    if(hint)hint.textContent='이 상황을 연결했어요. 남은 상황을 이어 풀어요.';
    target=next;
  }else if(state.finalDraft.stage===null){
    if(hint)hint.textContent='1. 상황을 읽고 알맞은 내 조사 기록을 골라요.';
    target=app.querySelector('.evidence-options');
  }else if(state.finalDraft.reason===null){
    if(hint)hint.textContent='2. 이 기록이 상황을 설명하는 까닭을 골라요.';
    target=app.querySelector('[data-field="linkReason"]')?.closest('.choices');
  }else{
    if(hint)hint.textContent='증거와 이유를 골랐어요. 연결 확인을 눌러요.';
    target=check;
  }
  target?.classList.add('next-target');
  next?.classList.toggle('is-ready',linked&&!complete);
  ending?.classList.toggle('is-ready',complete&&linked);
}
function header(){const silent=state.settings.muted||(state.settings.bgmEnabled===false&&state.settings.sfxEnabled===false);return `<header class="topbar" aria-label="공통 도구"><div class="nav-group"><button class="icon-button" data-action="home" aria-label="홈" ${state.route==='home'?'disabled':''}>${icon('home')}</button><button class="icon-button" data-action="back" aria-label="이전 화면" ${state.route==='home'?'disabled':''}>${icon('back')}</button></div><span class="sr-only" id="save-status" role="status">${studentState?'미리보기 · 저장하지 않음':warning?'저장 확인 필요':'자동 저장됨'}</span><div class="nav-group">${state.route==='hub'?'':`<button class="icon-button" data-action="voice-replay" aria-label="대사 다시 듣기" title="대사 다시 듣기" ${lastVoice?'':'hidden'}>${icon('play')}</button>`}<button class="icon-button" data-action="sound" aria-label="${silent?'소리 켜기':'소리 끄기'}" aria-pressed="${silent}">${icon(silent?'mute':'sound')}</button><button class="icon-button" data-action="settings" aria-label="설정">${icon('settings')}</button></div></header>`;}
async function render(){
  cleanupExpedition?.();cleanupExpedition=null;
  cleanupActivityFlow?.();cleanupActivityFlow=null;
  disposeNpc?.();closeResidentScene?.();closeResidentScene=null;
  if(state.route==='s4b'&&app.classList.contains('route-s4b'))local.tideWipe=app.querySelector('[data-compare]')?.value??local.tideWipe;
  const focused=document.activeElement?.closest('[data-action],[data-field]');const focusSelector=focused?.dataset.action?`[data-action="${CSS.escape(focused.dataset.action)}"][data-value="${CSS.escape(focused.dataset.value??'')}"]${focused.dataset.field?`[data-field="${CSS.escape(focused.dataset.field)}"]`:''}`:focused?.dataset.field?`[data-field="${CSS.escape(focused.dataset.field)}"]`:null;
  cleanupInteractions?.();cleanupInteractions=null;cleanupChallenges?.();cleanupChallenges=null;controller?.dispose();controller=null;const ticket=++epoch;const r=state.route,m=/^s([1-5])([abcd])$/.exec(r);
  if(r==='link')restoreLinkDraft();
  let content=r==='home'?home(state):r==='hub'?hub(state):m?learning(state,+m[1],m[2]):r==='report'?report(state):r==='link'?link(state,{caseIndex:state.finalDraft.caseIndex,linkStage:state.finalDraft.stage,linkReason:state.finalDraft.reason}):r==='ending'?ending(state):certificate(state);
  const bg=r==='home'?'home':m?chapters[+m[1]-1].asset:r==='ending'?'ending':'terrace';
  document.body.classList.toggle('title-font',r==='home');
  app.className=`app route-${r}`;app.style.setProperty('--scene',`url("${asset(bg)}")`);
  const teacher=teacherNav(r);app.classList.toggle('has-teacher-nav',!!teacher);
  app.innerHTML=`${header()}${warning?`<div class="storage-warning" role="alert">${esc(warning)}</div>`:''}${state.settings.unlockAll?'<div class="admin-label">교사 미리보기 · 체험 내용은 저장되지 않아요</div>':''}<main id="main">${content}</main>${teacher}<span class="orientation-hint">가로로 돌리면 탐사 화면을 더 넓게 볼 수 있어.</span>`;
  app.querySelectorAll('.learning [data-note]').forEach(note=>app.querySelector('.moa-bubble')?.append(note));
  if(r==='home')disposeNpc=mountNpcGuide(app.querySelector('.title-actions'),{name:'탐사원 부리',portrait:import.meta.env.BASE_URL+'assets/dialogue/buri.webp',src:import.meta.env.BASE_URL+'assets/audio/voices/el-welcome.mp3',text:'탐사대에 온 걸 환영해! 육지와 바다의 모습을 관찰하고, 사진과 실험에서 찾은 증거로 지구 탐사 지도를 완성해 보자.',enabled:()=>!state.settings.muted&&state.settings.sfxEnabled!==false,quiet:value=>{if(value)voice.stop();audioPlayer.quiet(value);},title:'부리 목소리 듣기',onError:()=>feedback('대화를 불러오지 못했어. 다시 눌러 줘.'),note:'부리 · AI로 만든 목소리예요. 자막은 소리 없이도 볼 수 있어요.'});
  if(r==='s4b'&&local.tideWipe!==undefined){app.querySelector('[data-compare]').value=local.tideWipe;app.querySelector('.tide-wipe').style.setProperty('--wipe',`${local.tideWipe}%`);}
  cleanupChallenges=mountChallenges(app,context());
  cleanupInteractions=mountInteractions(app,context());
  cleanupActivityFlow=mountActivityFlow(app,context());
  syncLinkGuidance();
  const taskProgress=app.querySelector('.challenge-progress');
  if(taskProgress)app.querySelector('.challenge-board-heading')?.replaceChildren(taskProgress);
  document.querySelector('h1')?.setAttribute('tabindex','-1');
  if(focusSelector)document.querySelector(focusSelector)?.focus({preventScroll:true});
  if(r!==voiceRoute){voiceRoute=r;const next=chapters.find(c=>!state.completed.includes(c.id));const entry=r==='home'?['title-bubble']:r==='hub'?(state.completed.length?(next?[`goal-${next.id}`]:[]):['hub-first','goal-1']):r==='ending'&&!state.settings.unlockAll&&allLinked(state)?['ending-buri','ending-jjang']:[];if(entry.length)speak(entry);}
  if(r==='hub'){
    const wrap=app.querySelector('.map-wrap'),next=chapters.find(c=>!state.completed.includes(c.id)&&canAccess(state,`s${c.id}a`));
    const status=document.createElement('section');status.className='hub-load-status';status.setAttribute('role','status');
    status.textContent='탐사 지도를 준비하고 있어…';wrap.append(status);
    let timeout;
    try{
      const [{mountHub},{mountPhotoRestoration},{mountExpedition}]=await Promise.race([
        Promise.all([import('./hub.js'),import('./photo-restoration.js'),import('./expedition.js'),import('./photo-restoration.css')]),
        new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('map timeout')),10000);})
      ]);
      if(ticket!==epoch)return;
      controller=mountHub(wrap.querySelector('#hub-map'),state,id=>navigate(`s${id}a`),save,{encounterTone:(kind,n)=>tone(kind==='finish'?350:kind==='contact'?260:n===1?580:440)});
      mountPhotoRestoration(wrap,state,save,sound);
      if(state.completed.length||state.settings.unlockAll)cleanupExpedition=mountExpedition(wrap,state,save,navigate,sound);
      status.remove();
    }catch{
      if(ticket!==epoch)return;
      status.textContent='탐사 지도를 불러오지 못했어. 기록은 그대로야.';
      const retry=document.createElement('button');retry.className='btn';retry.textContent='다시 열기';retry.onclick=()=>location.reload();status.append(retry);
      if(next){const start=document.createElement('button');start.className='btn primary';start.textContent=next.id===1?'첫 관찰 시작':'다음 관찰 시작';start.onclick=()=>navigate(`s${next.id}a`);status.append(start);}
    }finally{clearTimeout(timeout);}
  }
  if(r==='s1a'){
    const el=document.querySelector('#globe');try{const {mountGlobe}=await import('./globe.js');if(ticket!==epoch)return;const globe=await mountGlobe(el,{flat:state.settings.flatGlobe,atmosphere:state.drafts[1].atmosphere,selected:local.site||'asia',onReady:text=>{if(ticket===epoch)document.querySelector('#globe-mode').textContent=text;}});if(ticket!==epoch){globe.dispose();return;}controller=globe;if(local.site)siteDetail(local.site);}
    catch{if(ticket===epoch){el.innerHTML='<div class="globe-unavailable">지구 그림을 불러오지 못했어.<br>관찰 지점의 설명으로 조사를 계속할 수 있어.</div>';document.querySelector('#globe-mode').textContent='텍스트 대체 관찰';if(local.site)siteDetail(local.site);}}
  }
}
function siteDetail(id){const p=sites.find(p=>p.id===id);if(!p)return;local.site=id;controller?.focus?.(id);document.querySelector('#site-detail').innerHTML=`<b>${p.name}</b><p>${p.type==='육지'?'땅이 이어져 있고 산과 평지가 보여.':'넓은 물이 이어져 있어. 바다를 관찰했어.'}</p>`;document.querySelectorAll('[data-action="site"]').forEach(el=>{el.classList.toggle('selected',el.dataset.value===id);el.setAttribute('aria-pressed',String(el.dataset.value===id));});}
function observeSite(id){
  if(!sites.some(site=>site.id===id))return;
  siteDetail(id);
  if(controller?.validated===false){feedback('지리 자료 확인에 문제가 있어. 화면을 새로 열어 줘.');return;}
  const d=state.drafts[1];if(d.samples.includes(id))return;
  d.samples.push(id);save();
  const button=app.querySelector(`[data-action="site"][data-value="${id}"]`);button.textContent=`✓ ${sites.find(site=>site.id===id).name}`;button.classList.add('collected');
  const progress=app.querySelector('.mini-progress');progress.querySelector('b').textContent=`${d.samples.length} / ${sites.length}`;progress.querySelector('i').style.width=`${d.samples.length/sites.length*100}%`;
  app.querySelector('[data-action="go"][data-value="s1b"]').disabled=!canAccess(state,'s1b');
  feedback(aReady(state,1)?'관찰 준비 완료! 모은 표본을 비교하러 가자.':`${sites.find(site=>site.id===id).name} 기록 완료 · ${d.samples.length}곳 관찰했어.`,true);sound('scan');
}
// 접힌 질문 단계(1·2)에 고를 답이 남아 있으면 그 단계를 다시 펼쳐 보여 준다(✓ 표시만 보고 지나치지 않게).
function openWrongStep(n){if(n!==2&&n!==4)return;const d=state.drafts[n],rise=tideHeight(d.b)>tideHeight(d.a),want=n===2?{residue:'sea',reason:'dissolved'}:{direction:rise?'up':'down',concept:rise?'in':'out'};const field=Object.keys(want).find(k=>d[k]!==want[k]);if(field)app.querySelectorAll('.question-step').forEach(el=>{el.open=!!el.querySelector(`[data-field="${field}"]`);});}
function updateField(field,value){const m=/^s([1-5])/.exec(state.route);if(field==='linkReason'){state.finalDraft.reason=+value;save();render();return;}if(!m)return;const n=+m[1],d=state.drafts[n],[key,sub]=field.split('.');if(!Object.hasOwn(d,key))return;if(typeof d[key]==='number')value=+value;if(key==='features')sound('click');if(n===2&&key==='prediction')recordPrediction(state,value);else if(sub)d[key][sub]=value;else d[key]=value;save();if(key==='time'||key==='pan'){render();}else if(['fresh','sea','heatFresh','heatSea'].includes(key)){d.prepared=false;d.heated=false;d.seenBefore=false;d.seenAfter=false;d.view='before';save();render();}else if(document.activeElement?.tagName!=='SELECT')render();}
const paragraphs=lines=>lines.map(line=>`<p>${esc(line)}</p>`).join('');
const details=(title,content)=>`<details><summary>${esc(title)}</summary><div class="settings-details-content">${content}</div></details>`;
async function openOptional(load, open, valid = () => true){
  const ticket=epoch;
  const isCurrent=()=>ticket===epoch&&valid();
  try{const module=await load();if(isCurrent())open(module);}
  catch{if(isCurrent())feedback('불러오지 못했어. 다시 눌러 줘.');}
}
function settings(){
  if(document.querySelector('dialog[open]'))return;
  focusBeforeModal=document.activeElement;
  const overlay=document.createElement('dialog');
  overlay.className='settings-modal settings-panel';overlay.dataset.scienceSettings='';overlay.setAttribute('aria-labelledby','settings-title');
  const audioSwitch=(name,label)=>`<div class="sound-row"><span id="${name}-label">${esc(label)}</span><button type="button" class="sound-toggle" data-action="toggle-setting" data-value="${name}" aria-labelledby="${name}-label" aria-pressed="${state.settings[name]!==false}"><span>${state.settings[name]!==false?copy.sounds.on:copy.sounds.off}</span></button></div>`;
  const finalReady=allLinked(state);
  const appContent=copy.appLines.map(([label,text])=>`<p class="settings-app-line"><b>${esc(label)}</b><span>${esc(text)}</span></p>`).join('')+`<p class="settings-signature">${esc(copy.signature)}</p>`;
  const teacherContent=paragraphs(copy.teacherLines)+details(copy.standardTitle,paragraphs([copy.standardIntro,...copy.standards]))+details(copy.toolsTitle,`<p>${esc(copy.toolsIntro)}</p><button class="admin-toggle" data-action="toggle-unlock" aria-pressed="${state.settings.unlockAll}">${icon(state.settings.unlockAll?'unlock':'lock')}<span>${esc(state.settings.unlockAll?copy.unlocked:copy.unlock)}</span></button><p>${esc(copy.toolsNote)}</p><label class="switch-row">${esc(copy.flatGlobe)}<input type="checkbox" data-setting="flatGlobe" ${state.settings.flatGlobe?'checked':''}></label>`);
  const sources=`<p>${esc(copy.sourceIntro)}</p>`+copy.sources.map(([title,text])=>`<p class="settings-source"><b>${esc(title)}</b>${esc(text)}</p>`).join('');
  const credits=paragraphs(copy.creditLines)+details(copy.sourcesTitle,sources)+copy.legal.map(text=>`<p class="legal-copy">${esc(text)}</p>`).join('');
  overlay.innerHTML=`<div class="modal-head"><div><h2 id="settings-title">설정</h2></div><button class="icon-button" data-action="close-settings" aria-label="설정 닫기">${icon('close')}</button></div><div class="settings-body science-settings-body"><section aria-label="소리" class="science-settings-audio">${audioSwitch('bgmEnabled',copy.sounds.bgm)}${audioSwitch('sfxEnabled',copy.sounds.sfx)}<label class="volume-label">${esc(copy.sounds.volume)}<output id="music-volume-output">${Math.round(state.settings.volume*100)}%</output><input aria-label="${esc(copy.sounds.volume)}" type="range" min="0" max="100" step="5" value="${state.settings.volume*100}" data-setting="volume" ${state.settings.bgmEnabled===false?'disabled':''}></label></section><div class="settings-replays science-settings-actions"><button class="secondary" data-action="replay-story">${icon('play')}${esc(copy.replay)}</button>${finalReady?`<button data-action="settings-go" data-value="ending">${icon('star')}${esc(copy.endingReplay)}</button>`:''}<button data-action="settings-go" data-value="certificate" ${!finalReady?'disabled':''}>${icon(finalReady?'award':'lock')}${esc(copy.certificate)}</button>${!finalReady?`<p class="settings-locked">${esc(copy.finalLocked)}</p>`:''}</div>${state.route==='hub'&&lastVoice?`<button class="secondary" data-action="voice-replay">${icon('play')}대사 다시 듣기</button>`:''}${details(copy.appTitle,appContent)}${details(copy.studentTitle,paragraphs([...copy.studentLines,'탐사지도에서 교란 부표 악당에게 다가가면 원형 공격 버튼이나 스페이스바로 공격해요.']))}${details(copy.teacherTitle,teacherContent)}${details(copy.copyrightTitle,credits)}<section id="reset-confirm" hidden aria-labelledby="reset-title"><h3 id="reset-title">${esc(copy.resetTitle)}</h3><p>${esc(copy.resetDescription)}</p><div class="reset-actions"><button data-action="reset-cancel">${esc(copy.resetCancel)}</button><button data-action="reset-confirm" class="danger">${esc(copy.resetConfirm)}</button></div></section></div><footer class="modal-footer science-settings-footer"><button class="text-button" data-action="reset-ask">${icon('reset')}${esc(copy.reset)}</button><button class="primary" data-action="close-settings">${esc(copy.close)}</button></footer>`;
  document.body.append(overlay);overlay.showModal();
  overlay.querySelector('[data-action="close-settings"]').focus();
  overlay.addEventListener('close',()=>{overlay.remove();render();if(!document.querySelector('dialog[open]'))(focusBeforeModal?.isConnected?focusBeforeModal:document.querySelector('[data-action="settings"]'))?.focus();},{once:true});
}
function closeSettings(){document.querySelector('.settings-panel')?.close();}
function showStory(){
  const dialog=document.createElement('dialog');dialog.className='settings-modal story-dialog';dialog.setAttribute('aria-labelledby','story-title');
  dialog.innerHTML=`<div class="modal-head"><h2 id="story-title">${esc(copy.storyTitle)}</h2><button class="icon-button" data-action="close-story" aria-label="이야기 닫기">${icon('close')}</button></div><div class="settings-body"><div class="story-friends" aria-hidden="true">${character('buri')}${character('jjang')}</div>${paragraphs(copy.storyLines)}</div><footer class="modal-footer"><span></span><button class="primary" data-action="close-story">${esc(copy.close)}</button></footer>`;
  document.body.append(dialog);dialog.showModal();speak(['story-1','story-2','story-3','story-4'],{replayHost:dialog.querySelector('.modal-footer')});dialog.addEventListener('close',()=>{voice.stop();dialog.remove();document.querySelector('[data-action="settings"]')?.focus();},{once:true});
}
function syncSettingControls(){
  for(const key of ['bgmEnabled','sfxEnabled']){
    const control=document.querySelector(`[data-action="toggle-setting"][data-value="${key}"]`);if(!control)continue;
    control.setAttribute('aria-pressed',String(state.settings[key]!==false));control.querySelector('span').textContent=state.settings[key]!==false?copy.sounds.on:copy.sounds.off;
  }
  const slider=document.querySelector('[data-setting="volume"]');if(slider)slider.disabled=state.settings.bgmEnabled===false;
  const output=document.querySelector('#music-volume-output');if(output)output.textContent=`${Math.round(state.settings.volume*100)}%`;
  audioPlayer.sync();
}
// Teacher preview: with every stage unlocked, screens can be skimmed without
// solving them. Movement never completes a stage or writes evidence.
function teacherTargets(r){
  const i=routes.indexOf(r);if(!state.settings.unlockAll||i<2)return null;
  const m=/^s([1-5])/.exec(r),n=m?+m[1]:0;
  return{left:routes[i-1],right:routes[i+1]??null,up:n?(n>1?`s${n-1}a`:'hub'):i>2?'s5a':null,down:n?(n<5?`s${n+1}a`:'report'):routes[i+1]??null};
}
function teacherNav(r){
  const t=teacherTargets(r);if(!t)return '';
  const pad=[['up','↑','이전 스테이지'],['left','←','이전 화면'],['down','↓','다음 스테이지'],['right','→','다음 화면']].map(([dir,arrow,label])=>`<button class="teacher-key" data-action="go" data-value="${t[dir]??''}" data-teacher-key="${dir}" aria-label="${label}${t[dir]?`: ${esc(routeName(t[dir]))}`:''}" title="${label}" ${t[dir]?'':'disabled'}>${arrow}</button>`).join('');
  const skip=t.down?`<button class="teacher-skip" data-action="go" data-value="${t.down}"><span><small>다음 스테이지로 바로 가기</small>${esc(routeName(t.down))}</span>${icon('arrow')}</button>`:'';
  const controls=`<div class="teacher-pad"><div class="teacher-keys">${pad}</div><p><b>교사용 이동</b>키보드 방향키도 돼요<br>← → 화면 · ↑ ↓ 스테이지</p></div>${skip}`;
  return /^s[1-5][abcd]$/.test(r)?`<details class="teacher-nav"><summary>교사 이동</summary><nav aria-label="교사용 빠른 이동">${controls}</nav></details>`:`<nav class="teacher-nav" aria-label="교사용 빠른 이동">${controls}</nav>`;
}
document.addEventListener('keydown',e=>{
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key],t=dir&&teacherTargets(state.route);
  if(!t||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||document.querySelector('dialog[open]')||e.target.closest?.('input,select,textarea,[contenteditable="true"],[role="slider"],canvas'))return;
  e.preventDefault();if(t[dir]){tone();navigate(t[dir]);}
});
// 오답 뒤 저절로 열린 도움말은 오답 소리(retry)를 끊지 않도록 조용히 열고, 학생이 직접 열 때만 hint 소리를 낸다.
const autoHints=new WeakSet();
document.addEventListener('toggle',e=>{if(!e.target.matches?.('.moa-hint'))return;const m=/^s([1-5])([ab])$/.exec(state.route),id=m&&`hint-${m[1]}${m[2]}`;if(!e.target.open){if(id&&lastVoice?.[0]===id)voice.stop();return;}if(e.target.hasAttribute('data-auto-open')&&!autoHints.has(e.target)){autoHints.add(e.target);return;}sound('hint');if(id)speak(id);},true);
// 탐사 지도: 모아 안내·주민 말풍선 글과 같은 대사를 읽는다(지도 코드가 띄운 글을 그대로 찾아 읽음).
document.addEventListener('click',e=>{
  const trigger=e.target.closest?.('[data-hub-guide],[data-hub-resident]');
  if(!trigger)return;
  queueMicrotask(async()=>{
    if(state.route!=='hub'||!trigger.isConnected)return;
    const box=document.querySelector('#arrival');
    const text=box?.classList.contains('is-visible')?box.textContent.replace(/^[^:]{1,6}: /,''):'';
    const who=trigger.matches('[data-hub-guide]')?'moa':trigger.dataset.hubResident;
    const id=who==='moa'?'hub-guide-'+(chapters.find(ch=>!state.completed.includes(ch.id))?.id??'done'):voiceIdOf(text);
    if(id&&['moa','jjang','crab'].includes(who)){
      const base=import.meta.env.BASE_URL;
      const names={moa:'수달 모아',jjang:'갯벌 길잡이 짱이',crab:'갯벌의 게 친구'};
      let openNpcScene;
      try{({openNpcScene}=await import('./npc-scene.js'));}catch{if(trigger.isConnected)speak(id);return;}
      if(state.route!=='hub'||!trigger.isConnected)return;
      closeResidentScene?.();voice.stop();
      closeResidentScene=openNpcScene({
        name:names[who],portrait:base+'assets/dialogue/'+who+'.webp',
        src:base+'assets/audio/voices/el-'+id+'.mp3',text:VOICE_TEXT[id],trigger,
        enabled:()=>!state.settings.muted&&state.settings.sfxEnabled!==false,quiet:v=>audioPlayer.quiet(v)
      });
    }else if(id)speak(id);else voice.stop();
  });
});
// 도움말 말풍선이 카드·되돌리기 버튼을 덮어도 막히지 않게, 말풍선 글이나 다른 곳을 누르면 접는다.
document.addEventListener('pointerdown',e=>{for(const hint of document.querySelectorAll('.moa-hint[open]'))if(!hint.querySelector('summary').contains(e.target)&&!e.target.closest?.('.moa-bubble button'))hint.open=false;},true);
document.addEventListener('input',e=>{if(e.target.dataset.setting!=='volume')return;state.settings.volume=Number(e.target.value)/100;syncSettingControls();});
document.addEventListener('change',e=>{
  const field=e.target.dataset.field;if(field)updateField(field,e.target.value);
  const setting=e.target.dataset.setting;if(!['volume','flatGlobe'].includes(setting))return;
  state.settings[setting]=setting==='volume'?Number(e.target.value)/100:e.target.checked;save();syncSettingControls();
});
document.addEventListener('click',async e=>{
  audioPlayer.start();
  const note=e.target.closest('[data-note]');
  if(note){const dialog=document.createElement('dialog');dialog.className='settings-modal activity-note';dialog.setAttribute('aria-label','더 알아보기');dialog.innerHTML=`<div class="modal-head"><h2>더 알아보기</h2><button class="icon-button" aria-label="닫기">${icon('close')}</button></div><div class="settings-body"><p>${esc(note.dataset.note)}</p></div>`;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();note.focus();},{once:true});document.body.append(dialog);dialog.showModal();return;}
  const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const action=button.dataset.action,value=button.dataset.value;const match=/^s([1-5])/.exec(state.route),n=match?+match[1]:0,d=state.drafts[n];
  if(['challenge-pick','challenge-task','case','tide-save','marker','link-stage'].includes(action))sound(action==='tide-save'?'scan':'click');
  if(action==='go'||action==='home'){tone();navigate(action==='home'?'home':value);return;}
  if(action==='back'){previous();return;}
  if(action==='sound'){const enable=state.settings.muted||(state.settings.bgmEnabled===false&&state.settings.sfxEnabled===false);if(!enable)voice.stop();state.settings.muted=!enable;state.settings.bgmEnabled=enable;state.settings.sfxEnabled=enable;save();audioPlayer.sync();render();if(enable)tone();return;}
  if(action==='settings'){await openOptional(loadSettings,settings,()=>button.isConnected);return;}
  if(action==='toggle-setting'){if(!['bgmEnabled','sfxEnabled'].includes(value))return;state.settings[value]=state.settings[value]===false;if(value==='sfxEnabled'&&state.settings.sfxEnabled===false)voice.stop();state.settings.muted=false;save();syncSettingControls();return;}
  if(action==='toggle-unlock'){if(studentState){state=studentState;studentState=null;}else{studentState=state;state=previewState(studentState);}save();button.setAttribute('aria-pressed',String(state.settings.unlockAll));button.innerHTML=`${icon(state.settings.unlockAll?'unlock':'lock')}<span>${esc(state.settings.unlockAll?copy.unlocked:copy.unlock)}</span>`;if(!canAccess(state,state.route)){state.route='hub';state.resume='hub';save();window.history.replaceState({route:'hub'},'','#hub');}window.history.replaceState({route:state.route},'','#'+state.route);audioPlayer.sync();return;}
  if(action==='view-record'){const dialog=document.createElement('dialog');dialog.className='settings-modal record-modal';dialog.setAttribute('aria-label',chapters[+value-1].evidence);dialog.innerHTML=`<div class="modal-head"><h2>${chapters[+value-1].evidence}</h2><button data-action="close-record" class="icon-button" aria-label="기록 닫기">${icon('close')}</button></div><div class="settings-body">${recordDetail(state,+value)}</div>`;document.body.append(dialog);dialog.showModal();dialog.querySelector('button').setAttribute('aria-label','기록 닫기');dialog.addEventListener('close',()=>{dialog.remove();button.focus();});return;}
  if(action==='close-record'){document.querySelector('.record-modal')?.close();return;}
  if(action==='close-settings'){closeSettings();return;}
  if(action==='replay-story'){closeSettings();showStory();return;}
  if(action==='close-story'){document.querySelector('.story-dialog')?.close();return;}
  if(action==='settings-go'){if(!allLinked(state))return;closeSettings();navigate(value);return;}
  if(action==='reset-ask'){const confirmation=document.querySelector('#reset-confirm');confirmation.hidden=false;confirmation.scrollIntoView({block:'nearest'});confirmation.querySelector('[data-action="reset-cancel"]').focus();return;}
  if(action==='reset-cancel'){document.querySelector('#reset-confirm').hidden=true;document.querySelector('[data-action="reset-ask"]').focus();return;}
  if(action==='reset-confirm'){const sounds={muted:state.settings.muted,volume:state.settings.volume,bgmEnabled:state.settings.bgmEnabled,sfxEnabled:state.settings.sfxEnabled};state=freshState();Object.assign(state.settings,sounds);warning='';if(studentState)state.settings.unlockAll=true;save({reset:true});audioPlayer.sync();closeSettings();navigate('home');return;}
  if(n===4&&['next','complete'].includes(action)&&!tideIntervalDirection(d.a,d.b)){
    feedback('1. 관찰에서 물이 한 방향으로 변하는 두 순간을 다시 골라요.');return;
  }
  if(handleChallenge({...context(),action,value,button,event:e}))return;
  if(action==='concept'){voice.stop();playConcept(+value);return;}
  if(action==='voice-replay'){if(lastVoice)voice.play(lastVoice);return;}
  if(action==='travel'){controller?.travel?.(+value-1);return;}
  if(action==='enter'){navigate(`s${value}a`);return;}
  if(action==='choose'){updateField(button.dataset.field,value);tone();return;}
  if(action==='site'){observeSite(value);return;}
  if(action==='rotate'){controller?.rotate?.(+value);return;}
  if(action==='atmosphere'){d.atmosphere=true;save();render();feedback(aReady(state,1)?stageGuide(state)[0]:'지구를 둘러싼 공기인 대기를 관찰했어. 구름만 대기인 것은 아니야.',true);return;}
  if(action==='next'){
    if(n===2)d.prepared=d.fresh===d.sea&&d.heatFresh===d.heatSea&&Boolean(d.prediction);
    if(!aReady(state,n)){const hints=['세 곳 이상에서 육지·바다를 모두 스캔하고 대기를 관찰해 줘.','물의 양과 가열 세기를 각각 같게 맞추고 예상을 골라 줘.','네 가지 지형을 모두 촬영해 줘.','A보다 나중 시각을 B에 저장해. 물 높이가 서로 달라야 비교할 수 있어.','세 생물 모두 보이는 특징을 골라 도감에 기록해 줘.'];feedback(hints[n-1]);return;}save();navigate(`s${n}b`);return;
  }
  if(action==='heat'){startActivityHeating();return;}
  if(action==='experiment-view'){if(value==='before')d.seenBefore=true;else d.seenAfter=true;d.view=value;save();render();return;}
  if(action==='target'){const terrain=terrains.find(t=>t.id===value);if(!terrain)return;d.target=value;const fresh=!d.photos.includes(value);if(fresh)d.photos.push(value);save();render();if(fresh){feedback(d.photos.length===4?stageGuide(state)[0]:`${terrain.name} 촬영 완료 · ${d.photos.length} / 4`,true);sound('camera');document.querySelector('.coast-view')?.classList.add('photo-captured');}return;}
  if(action==='pin'){sound('drop');const r=button.getBoundingClientRect();d.pins[value]={x:e.detail===0?50:Math.min(95,Math.max(5,(e.clientX-r.left)/r.width*100)),y:e.detail===0?50:Math.min(95,Math.max(5,(e.clientY-r.top)/r.height*100))};save();render();return;}
  if(action==='tide-save'){
    const result=recordTideObservation(state,value,d.time);
    if(result==='saved'){save();render();return;}
    const messages={
      'choose-a':'A부터 먼저 담아요. 그런 다음 시간을 움직여 B를 골라요.',
      'not-later':'A보다 나중 시각을 B에 담아요.',
      turns:'물이 한 방향으로 변하는 두 순간을 골라요. 시간을 다시 살펴봐요.',
    };
    feedback(messages[result]||'서로 다른 물 높이를 골라 A와 B에 담아요.');return;
  }
  if(action==='marker'){if(!d.markers.includes(value))d.markers.push(value);save();render();return;}
  if(action==='creature'){sound('scan');d.selected=value;save();render();return;}
  if(action==='observe-feature'){const creature=creatures.find(c=>c.id===button.dataset.creature);if(!creature||d.selected!==creature.id)return;const id=creature.id;if(d.features[id]===value&&(value!==creature.feature||d.found.includes(id)))return;d.features[id]=value;if(value!==creature.feature){d.found=d.found.filter(found=>found!==id);state.revised++;save();render();feedback('확대해서 본 생김새와 움직임을 다시 살펴봐. 알맞은 특징을 다시 골라 줘.');return;}if(!d.found.includes(id))d.found.push(id);save();render();feedback(d.found.length===3?stageGuide(state)[0]:`${creature.name} 기록 완료! 다른 흔적도 찾아봐.`,true);return;}
  if(action==='complete'){
    if(!aReady(state,n)){feedback('연습 화면이야. 앞의 관찰을 완료해야 실제 증거로 저장할 수 있어.');return;}
    if(!completeStage(state,n)){state.revised++;save();const hints=['내 표본을 모두 분류한 뒤, 전체 면적 자료와 구분한 설명을 골라 줘.','가열 전후를 확인해. 어느 쪽에 흔적이 더 남았고, 그 물질은 어디에서 왔을까?','사진 네 장에 핀과 알맞은 특징을 연결하고 두 바위의 차이를 비교해 줘.','기둥과 바위를 모두 비교해. A에서 B로 물 높이가 어떻게 변했는지 살펴봐.','직접 관찰한 생물의 집과 연결되는 가치·보호 행동을 골라 줘.'];feedback(hints[n-1]);openWrongStep(n);return;}save();navigate('hub');feedback(chapters[n-1].reward,true);return;
  }
  if(action==='case'){const linked=state.links[+value];state.finalDraft={caseIndex:+value,stage:linked?.stage??null,reason:linked?.reason??null};save();render();return;}
  if(action==='link-stage'){state.finalDraft.stage=+value;save();render();return;}
  if(action==='check-link'){
    if(state.finalDraft.stage===null||state.finalDraft.reason===null){syncLinkGuidance();return;}
    const result=linkEvidence(state,+value,state.finalDraft.stage,state.finalDraft.reason);
    if(result==='already-saved'){syncLinkGuidance();return;}
    if(result==='wrong'){state.revised++;save();feedback('상황 속 관찰과 기록의 내용을 비교해 봐. 증거와 설명이 둘 다 맞아야 연결돼.');}
    else if(result==='practice'){feedback('연습 연결은 맞았어! 해당 장을 조사하면 내 증거로 실제 연결할 수 있어.',true);}
    else{save();render();tone(660);if(allLinked(state))sound('reward');}
    return;
  }
  if(action==='print'){if(!studentState&&allLinked(state))window.print();return;}
});
window.addEventListener('popstate',()=>{const r=location.hash.slice(1)||'home';if(canAccess(state,r))navigate(r,{back:true,push:false});else{window.history.replaceState({route:'hub'},'','#hub');navigate('hub',{back:true,push:false});}});
const requested=location.hash.slice(1);if(routes.includes(requested)&&canAccess(state,requested))state.route=requested;
window.history.replaceState({route:state.route},'',`#${state.route}`);render();
