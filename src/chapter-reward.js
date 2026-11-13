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
