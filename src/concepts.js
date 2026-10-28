import { chapters } from './data.js';
import { icon } from './icons.js';

// Completion is already saved by the caller. This short celebration never
// holds progress behind media playback and leaves the next destination explicit.
export function showChapterReward(n,{navigate,completed}={}){
 if(document.querySelector('dialog[open]'))return false;
 const chapter=chapters[n-1],next=n<5?`s${n+1}a`:'report',focus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.className='settings-modal chapter-reward';dialog.setAttribute('aria-labelledby','reward-title');
 dialog.innerHTML=`<div class="modal-head"><p class="eyebrow">CHAPTER ${String(n).padStart(2,'0')} · 탐사 완료</p><button class="icon-button" data-reward-close aria-label="배지 닫기">×</button></div><div class="settings-body"><div class="chapter-badge" aria-hidden="true">${icon('award')}</div><h2 id="reward-title">${chapter.evidence} 복구!</h2><p>${chapter.reward}</p><div class="reward-records"><span>관찰과 비교 완료</span><span>도전·적용 8 / 8</span></div><p class="reward-progress">본부의 기록 <b>${completed} / 5</b> 복구</p><div class="reward-track" aria-hidden="true">${chapters.map(c=>`<i class="${c.id<=completed?'filled':''}"></i>`).join('')}</div></div><footer class="modal-footer"><button class="secondary" data-reward-route="hub">탐사 지도</button><button class="primary" data-reward-route="${next}">${n<5?'다음 조사 · '+chapters[n].title:'다섯 기록 연결하기'} →</button></footer>`;
 let destination=null;
 dialog.addEventListener('click',event=>{const button=event.target.closest('[data-reward-route], [data-reward-close]');if(!button)return;destination=button.dataset.rewardRoute??null;dialog.close();});
 dialog.addEventListener('close',()=>{dialog.remove();if(destination)navigate(destination);else if(focus?.isConnected)focus.focus();},{once:true});
 document.body.append(dialog);dialog.showModal();dialog.querySelector('.primary').focus({preventScroll:true});return true;
}
const base=()=>`${import.meta.env.BASE_URL}assets/concepts/`;
export const conceptCues={
 1:[[0,'지구는 육지와 바다로 이루어져 있어.'],[3,'전체 면적은 바다가 육지보다 넓어.'],[6,'몇 곳의 표본 개수와 전체 넓이는 구분해.']],
 2:[[0,'같은 양의 물을 같은 조건에서 가열해.'],[3,'물이 증발하면서 녹아 있던 물질이 드러나.'],[6,'바닷물에는 소금 등 여러 물질이 녹아 있어.']],
 3:[[0,'고운 모래가 쌓인 모래사장을 찾아봐.'],[2.25,'가파른 절벽은 높이 솟아 있어.'],[4.5,'동굴은 바위 안쪽으로 공간이 이어져.'],[6.75,'구멍 난 바위는 너머 풍경이 보여.']],
 4:[[0,'움직이지 않는 같은 기둥을 기준으로 봐.'],[2,'바닷물이 들어오며 높아지는 변화는 밀물.'],[5,'바닷물이 빠지며 낮아지는 변화는 썰물.'],[8,'관측 모형이야. 실제 조석 시각과는 달라.']],
 5:[[0,'갯벌에는 게·짱뚱어·갈대가 살아.'],[3,'생김새도 살아가는 모습도 서로 달라.'],[6,'갯벌은 생물의 집! 흔적과 서식처를 지켜.']],
};
export function conceptMarkup(n){return `<div class="concept-player"><video playsinline preload="metadata" poster="${base()}chapter-${n}.webp" aria-label="${chapters[n-1].short} 개념 영상"><source src="${base()}chapter-${n}.webm" type="video/webm"><source src="${base()}chapter-${n}.mp4" type="video/mp4"></video><img class="concept-poster" src="${base()}chapter-${n}.webp" alt="${chapters[n-1].short} 개념 모형" hidden><div class="concept-caption" aria-live="off">${conceptCues[n][0][1]}</div><div class="concept-timeline"><i></i></div></div><div class="concept-controls"><button type="button" data-concept="play">영상 재생</button><button type="button" data-concept="replay">처음부터</button><span>9초 · 개념 모형</span></div>`;}
export function mountConcept(host,n,audio){
 const video=host.querySelector('video'),caption=host.querySelector('.concept-caption'),play=host.querySelector('[data-concept="play"]'),poster=host.querySelector('.concept-poster'),bar=host.querySelector('.concept-timeline i');
 let dead=false,failed=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 audio?.quiet(true);
 function update(){const time=video.currentTime||0;caption.textContent=(conceptCues[n].findLast(c=>c[0]<=time)||conceptCues[n][0])[1];bar.style.width=`${Math.min(100,time/9*100)}%`;}
 function fallback(){failed=true;video.hidden=true;poster.hidden=false;caption.textContent=conceptCues[n].map(c=>c[1]).join(' ');play.disabled=true;play.textContent='개념 그림으로 보기';bar.style.width='100%';audio?.quiet(false);}
 async function start(){if(dead||failed)return;try{await video.play();if(!dead)play.textContent='잠깐 멈춤';}catch{if(!dead)play.textContent='눌러서 재생';}}
 const click=e=>{const action=e.target.closest('[data-concept]')?.dataset.concept;if(!action||failed)return;if(action==='replay'){video.currentTime=0;update();start();}else if(video.paused)start();else video.pause();};
 const ended=()=>{play.textContent='다시 보기';caption.textContent=conceptCues[n].at(-1)[1];bar.style.width='100%';audio?.quiet(false);};
 const playing=()=>{audio?.quiet(true);play.textContent='잠깐 멈춤';};const paused=()=>{play.textContent=video.ended?'다시 보기':'계속 보기';};
 const visibility=()=>{if(document.hidden)video.pause();};
 host.addEventListener('click',click);video.addEventListener('timeupdate',update);video.addEventListener('ended',ended);video.addEventListener('playing',playing);video.addEventListener('pause',paused);video.addEventListener('error',fallback);document.addEventListener('visibilitychange',visibility);
 const timeout=setTimeout(()=>{if(!dead&&video.readyState===0)fallback();},8000);
 if(!reduced)start();
 return ()=>{dead=true;clearTimeout(timeout);host.removeEventListener('click',click);video.removeEventListener('timeupdate',update);video.removeEventListener('ended',ended);video.removeEventListener('playing',playing);video.removeEventListener('pause',paused);video.removeEventListener('error',fallback);document.removeEventListener('visibilitychange',visibility);video.pause();video.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));video.removeAttribute('src');video.load();audio?.quiet(false);};
}
export function showConcept(n,{audio,onDone,label='활동으로 돌아가기',reward=false}={}){
 if(document.querySelector('dialog[open]'))return false;
 const focus=document.activeElement,dialog=document.createElement('dialog');let proceed=false;dialog.className=`settings-modal concept-dialog${reward?' reward-dialog':''}`;dialog.setAttribute('aria-labelledby','concept-title');
 dialog.innerHTML=`<div class="modal-head"><div><p class="eyebrow">${reward?'탐사 배지 획득 · ':''}모아의 개념 한 장면</p><h2 id="concept-title">${chapters[n-1].short}${reward?' · 복구 완료!':''}</h2></div><button class="icon-button" data-concept-close aria-label="${onDone?'다음 활동으로 이동':'개념 영상 닫기'}">×</button></div><div class="concept-body">${conceptMarkup(n)}</div><footer class="modal-footer"><span>${reward?chapters[n-1].reward:'관찰한 증거와 연결해 봐.'}</span><button class="primary" data-concept-close>${label} →</button></footer>`;
 document.body.append(dialog);dialog.showModal();const dispose=mountConcept(dialog,n,audio);
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-concept-close]')){proceed=true;dialog.close();}});dialog.addEventListener('close',()=>{dispose();dialog.remove();if(proceed&&onDone)onDone();else if(focus?.isConnected)focus.focus();},{once:true});
 dialog.querySelector('.modal-footer button').focus({preventScroll:true});return true;
}
