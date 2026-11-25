import { chapters } from './data.js';
import { illustration } from './illustrations.js';
import { icon } from './icons.js';

// Completion is already saved by the caller. This short celebration never
// holds progress behind media playback and leaves the next destination explicit.
export function showChapterReward(n,{navigate,completed}={}){
 if(document.querySelector('dialog[open]'))return false;
 const chapter=chapters[n-1],next=n<5?`s${n+1}a`:'report',focus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.className='settings-modal chapter-reward';dialog.setAttribute('aria-labelledby','reward-title');
 dialog.innerHTML=`<div class="modal-head"><button class="icon-button" data-reward-close aria-label="배지 닫기">${icon('close')}</button></div>
 <div class="settings-body">
   <img class="chapter-badge-art" src="${illustration(`badge-${n}`)}" alt="" width="360" height="360" decoding="async">
   <h2 id="reward-title">${chapter.evidence} 복구!</h2>
   <p>${chapter.reward}</p>
   <div class="reward-track" role="progressbar" aria-label="복구한 기록" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${completed}">${chapters.map(c=>`<i class="${c.id<=completed?'filled':''}"></i>`).join('')}</div>
 </div>
 <footer class="modal-footer">
   <button class="text-button" data-reward-route="hub">${icon('map')} 탐사 지도</button>
   <button class="primary" data-reward-route="${next}">${n<5?chapters[n].title:'최종 보고서'} ${icon('arrow')}</button>
 </footer>`;
 let destination=null;
 dialog.addEventListener('click',event=>{const button=event.target.closest('[data-reward-route], [data-reward-close]');if(!button)return;destination=button.dataset.rewardRoute??null;dialog.close();});
 dialog.addEventListener('close',()=>{dialog.remove();if(destination)navigate(destination);else if(focus?.isConnected)focus.focus();},{once:true});
 document.body.append(dialog);dialog.showModal();dialog.querySelector('.primary').focus({preventScroll:true});return true;
}
