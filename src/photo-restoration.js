import {chapters,asset,terrains} from './data.js';
export function placeRestorationPhoto(state,stage,photo){
 if(!state.completed.includes(stage)||![0,1,2].includes(photo))return false;
 const placed=state.restoration?.[stage]??[];if(placed.includes(photo))return false;
 state.restoration={...state.restoration,[stage]:[...placed,photo]};return true;
}
export function mountPhotoRestoration(host,state,save,sound){
 if(!host||!state.completed.length)return;
 let stage=state.completed.find(n=>(state.restoration?.[n]?.length??0)<3)??state.completed[0],selected=null;
 const panel=document.createElement('details');panel.className='photo-restoration';host.append(panel);
 // 해안 조사(3장)의 지형 이름·사진 위치를 그대로 쓴다: 이름과 사진 속 지형이 어긋나지 않게.
 const photos=['sand','cliff','arch'].map(id=>terrains.find(t=>t.id===id)),names=photos.map(t=>t.name);
 const crop=i=>`background-image:url('${asset('coast')}');background-position:${photos[i].position}`;
 function draw(){const placed=state.restoration?.[stage]??[],done=placed.length===3;
 panel.innerHTML=`<summary>📷 ${done?'사진 전시 완료':'사진으로 지도 복구'} · ${placed.length}/3</summary><div class="photo-work"><label>전시할 조사 기록 <select aria-label="복구할 조사 기록">${state.completed.map(n=>`<option value="${n}" ${n===stage?'selected':''}>${chapters[n-1].title}</option>`).join('')}</select></label><div class="photo-map" aria-label="해안 사진 안내 지도">${names.map((name,i)=>`<button class="restoration-photo-pin ${placed.includes(i)?'placed':''}" data-pin="${i}" ${selected!==i||placed.includes(i)?'disabled':''} aria-label="${name} 위치에 사진 붙이기">${placed.includes(i)?`<i class="restoration-crop" role="img" aria-label="${name} 사진" style="${crop(i)}"></i><span>✓</span>`:`<b>${i+1}</b><small>${name}</small>`}</button>`).join('')}</div><div class="photo-tray">${names.map((name,i)=>`<button data-photo="${i}" aria-pressed="${selected===i}" ${placed.includes(i)?'disabled':''}><i class="restoration-crop" aria-hidden="true" style="${crop(i)}"></i><span>${placed.includes(i)?'✓ 붙였어':name}</span></button>`).join('')}</div><p role="status">${done?'사진 세 장을 모두 붙였어! 해안 안내 지도가 완성됐어.':selected===null?'사진을 고르고, 같은 이름의 지도 자리에 톡 붙여 줘.':names[selected]+' 자리에 톡! 눌러 붙여 줘.'}</p><button data-fold>지도 계속 보기</button></div>`;
 panel.querySelector('select').onchange=e=>{stage=+e.target.value;selected=null;draw();panel.querySelector('select').focus();};
 panel.querySelector('[data-fold]').onclick=()=>{panel.open=false;panel.querySelector('summary').focus();};
 panel.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{selected=+b.dataset.photo;sound('click');draw();panel.querySelector(`[data-pin="${selected}"]`).focus();});
 panel.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{const i=+b.dataset.pin;if(i!==selected||!placeRestorationPhoto(state,stage,i))return;save();sound((state.restoration[stage].length===3)?'reward':'drop');selected=null;draw();panel.querySelector('.placed:last-of-type')?.classList.add('just-pinned');panel.querySelector('[data-photo]:not(:disabled),[data-fold]')?.focus();});
 }
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){panel.open=false;panel.querySelector('summary').focus();}});draw();
}
