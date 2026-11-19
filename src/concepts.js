import './concept-focus.css';
import './concept-fullscreen.css';
import { chapters } from './data.js';
import { CONCEPT_SECONDS, conceptCues, conceptTerms, conceptSceneLabels } from './concept-data.js';
export { conceptCues, conceptTerms };

const base=()=>`${import.meta.env.BASE_URL}assets/concepts/`;
export function emphasize(text,terms){let rest=text,result='';const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));while(rest){const hit=terms.map(term=>({term,index:rest.indexOf(term)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index||b.term.length-a.term.length)[0];if(!hit){result+=escape(rest);break;}result+=escape(rest.slice(0,hit.index))+`<mark class="concept-keyword">${escape(hit.term)}</mark>`;rest=rest.slice(hit.index+hit.term.length);}return result;}
export function conceptMarkup(n){return `<div class="concept-player"><video playsinline preload="metadata" poster="${base()}chapter-${n}.webp" aria-label="${chapters[n-1].short} 개념 영상"><source src="${base()}chapter-${n}.webm" type="video/webm"><source src="${base()}chapter-${n}.mp4" type="video/mp4"></video><img class="concept-poster" src="${base()}chapter-${n}.webp" alt="${chapters[n-1].short} 개념 모형" hidden><div class="concept-caption" aria-live="off">${emphasize(conceptCues[n][0][1],conceptTerms[n])}</div><div class="concept-timeline"><i></i></div></div><div class="concept-controls"><button type="button" data-concept="play">영상 재생</button><button type="button" data-concept="replay">처음부터</button><span>${CONCEPT_SECONDS}초 · 개념 모형</span></div><div class="concept-focus"><small>기억할 낱말</small>${conceptTerms[n].map(term=>`<strong>${term}</strong>`).join('')}</div><nav class="concept-chapters" aria-label="개념 장면 선택">${conceptCues[n].map((cue,i)=>`<button type="button" data-concept="seek" data-cue-index="${i}" ${i===0?'aria-current="step"':''}>${i+1} · ${conceptSceneLabels[i]}</button>`).join('')}</nav>`;}
export function mountConcept(host,n,audio,voice){
 const video=host.querySelector('video'),player=host.querySelector('.concept-player'),caption=host.querySelector('.concept-caption'),play=host.querySelector('[data-concept="play"]'),poster=host.querySelector('.concept-poster'),bar=host.querySelector('.concept-timeline i');
 let dead=false,failed=false,spoken=-1,holding=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 audio?.quiet(true);
 // The clips carry a few CC0 action sounds; they obey the app's mute and effect switches.
 video.muted=audio?.effectsAllowed?!audio.effectsAllowed():true;
 // 영상 소리 크기는 효과음 크기를 따르고, 모아가 자막을 읽는 동안에는 ×0.3으로 줄였다가 읽기가 끝나면 되돌린다(0.2초 전환). 목소리를 끄면 줄이지 않는다.
 const level=()=>Math.max(0,Math.min(1,audio?.effectVolume?.()??1)),reading=()=>String(voice?.playing||'').startsWith(`concept-${n}-`);
 video.volume=level();
 const duckTimer=setInterval(()=>{const base=level(),target=base*(reading()?.3:1),step=base*.7/4+.001,now=video.volume;video.volume=Math.max(0,Math.min(1,Math.abs(target-now)<=step?target:now+Math.sign(target-now)*step));},50);
 // 모아가 자막을 읽는다: 장면이 바뀌면 그 줄을 읽고, 앞 줄을 다 읽기 전에 다음 장면이 오면 영상을 잠깐 세워 기다린다.
 // 기다릴 때는 되감지 않고 다음 장면 0.55초 전에 미리 멈춘다(영상 속 앞 줄 자막이 또렷이 남는 자리). 운영 서버가 영상 범위 요청을 받지 않아 되감기가 0초로 튀기 때문.
 function narrate(cue){if(!voice||dead)return;spoken=cue;voice.play(`concept-${n}-${cue+1}`,{ended:()=>{if(holding&&!dead){holding=false;start();}}});}
 function update(){let time=video.currentTime||0;let cue=Math.max(0,conceptCues[n].findLastIndex(c=>c[0]<=time));const next=conceptCues[n][cue+1];if(voice&&!video.paused&&cue===spoken&&next&&time>=next[0]-.55&&voice.playing===`concept-${n}-${cue+1}`){holding=true;video.pause();}else if(voice&&!video.paused&&cue===spoken+1&&spoken>=0&&voice.playing===`concept-${n}-${spoken+1}`){holding=true;video.pause();cue=spoken;}else if(voice&&!video.paused&&cue!==spoken)narrate(cue);caption.innerHTML=emphasize(conceptCues[n][cue][1],conceptTerms[n]);host.querySelectorAll('[data-cue-index]').forEach((b,i)=>i===cue?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));bar.style.width=`${Math.min(100,time/CONCEPT_SECONDS*100)}%`;}
 // 자막은 영상 그림 안에 들어 있다: 영상이 실제로 재생되면 아래 글 상자는 화면에서만 숨기고(스크린리더용 글은 유지), 영상이 안 되면 그대로 보인다.
 function fallback(){failed=true;host.classList.remove('is-playing');player.classList.remove('is-burned');video.hidden=true;poster.hidden=false;caption.innerHTML=emphasize(conceptCues[n].map(c=>c[1]).join(' '),conceptTerms[n]);play.disabled=true;host.querySelectorAll('[data-cue-index]').forEach(b=>b.disabled=true);play.textContent='개념 그림으로 보기';bar.style.width='100%';audio?.quiet(false);}
 async function start(){if(dead||failed)return;try{await video.play();if(!dead)play.textContent='잠깐 멈춤';}catch{if(!dead)play.textContent='눌러서 재생';}}
 const click=e=>{const action=e.target.closest('[data-concept]')?.dataset.concept;if(!action||failed)return;holding=false;spoken=-1;voice?.stop();if(action==='seek'){const index=Number(e.target.closest('[data-cue-index]')?.dataset.cueIndex);if(conceptCues[n][index]){video.currentTime=conceptCues[n][index][0];update();}return;}if(action==='replay'){video.currentTime=0;update();start();}else if(video.paused)start();else video.pause();};
 const ended=()=>{host.classList.remove('is-playing');play.textContent='다시 보기';caption.innerHTML=emphasize(conceptCues[n].at(-1)[1],conceptTerms[n]);bar.style.width='100%';audio?.quiet(false);};
 const playing=()=>{if(!failed){host.classList.add('is-playing');player.classList.add('is-burned');}audio?.quiet(true);play.textContent='잠깐 멈춤';update();};const paused=()=>{if(holding)return;host.classList.remove('is-playing');play.textContent=video.ended?'다시 보기':'계속 보기';};
 const visibility=()=>{if(document.hidden){holding=false;video.pause();}};
 host.addEventListener('click',click);video.addEventListener('timeupdate',update);video.addEventListener('ended',ended);video.addEventListener('playing',playing);video.addEventListener('pause',paused);video.addEventListener('error',fallback);document.addEventListener('visibilitychange',visibility);
 const timeout=setTimeout(()=>{if(!dead&&video.readyState===0)fallback();},8000);
 if(!reduced)start();
 return ()=>{dead=true;holding=false;voice?.stop();clearTimeout(timeout);clearInterval(duckTimer);host.removeEventListener('click',click);video.removeEventListener('timeupdate',update);video.removeEventListener('ended',ended);video.removeEventListener('playing',playing);video.removeEventListener('pause',paused);video.removeEventListener('error',fallback);document.removeEventListener('visibilitychange',visibility);video.pause();video.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));video.removeAttribute('src');video.load();audio?.quiet(false);};
}
export function showConcept(n,{audio,voice,onDone,label='활동으로 돌아가기',reward=false}={}){
 if(document.querySelector('dialog[open]'))return false;
 const focus=document.activeElement,dialog=document.createElement('dialog');let proceed=false;dialog.className=`settings-modal concept-dialog${reward?' reward-dialog':''}`;dialog.setAttribute('aria-labelledby','concept-title');
 dialog.innerHTML=`<div class="modal-head"><div><p class="eyebrow">${reward?'탐사 배지 획득 · ':''}모아의 개념 한 장면</p><h2 id="concept-title">${chapters[n-1].short}${reward?' · 복구 완료!':''}</h2></div><button class="icon-button" data-concept-close aria-label="${onDone?'다음 활동으로 이동':'개념 영상 닫기'}">×</button></div><div class="concept-body">${conceptMarkup(n)}</div><footer class="modal-footer"><span>${reward?chapters[n-1].reward:'관찰한 증거와 연결해 봐.'}</span><button class="primary" data-concept-close>${label} →</button></footer>`;
 document.body.append(dialog);dialog.showModal();const dispose=mountConcept(dialog,n,audio,voice);
 // 전체 화면 재생: 재생 중에는 위쪽 조작 막대가 잠시 뒤 사라지고, 화면을 누르거나 마우스를 움직이거나 키를 누르면 다시 나온다.
 let awake=0;const wake=()=>{dialog.classList.add('ui-awake');clearTimeout(awake);awake=setTimeout(()=>dialog.classList.remove('ui-awake'),2600);};
 dialog.addEventListener('pointerdown',wake);dialog.addEventListener('keydown',wake);dialog.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')wake();});
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-concept-close]')){proceed=true;dialog.close();}});dialog.addEventListener('close',()=>{clearTimeout(awake);dispose();dialog.remove();if(proceed&&onDone)onDone();else if(focus?.isConnected)focus.focus();},{once:true});
 dialog.querySelector('.modal-footer button').focus({preventScroll:true});return true;
}
