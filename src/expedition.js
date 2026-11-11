import {asset} from './data.js';
import './expedition.css';
export const expeditions=[
 {title:'지구 표면 관측 항해',bg:'observatory',tool:'camera',goal:'육지와 바다의 서로 다른 관측점을 촬영해.',nodes:[{x:1,y:1,name:'육지 관측점',detail:'땅이 이어져 보여. 몇 곳의 사진은 지구 전체 넓이를 뜻하지 않아.'},{x:4,y:2,name:'바다 관측점',detail:'넓은 물이 보여. 전체 넓이는 지구 전체 자료와 비교해야 해.'},{x:2,y:4,name:'전 지구 자료실',detail:'지구 전체 표면에서 바다가 육지보다 넓어.'}]},
 {title:'두 물의 표본 수송',bg:'lab',tool:'sample',goal:'육지의 물과 바닷물을 같은 양으로 채집해 실험실로 가져가.',nodes:[{x:1,y:2,name:'육지의 물',detail:'육지의 물 40mL 표본을 보관했어. 맑아 보여도 물질이 녹아 있을 수 있어.'},{x:4,y:1,name:'바닷물',detail:'바닷물 40mL 표본을 보관했어. 비교할 양을 같게 맞췄어.'},{x:4,y:4,name:'실험실 도착',detail:'같은 조건에서 물을 증발시킨 뒤 남는 물질을 비교하자.'}]},
 {title:'해안 사진 탐사',bg:'coast',tool:'camera',goal:'탐사 지점에 가까이 가서 지형의 모양을 촬영해.',nodes:[{x:1,y:1,name:'모래 관측점',detail:'고운 모래가 넓게 쌓인 모래사장이야.'},{x:4,y:2,name:'가파른 바위',detail:'높고 가파른 바위 면을 가진 절벽이야.'},{x:2,y:4,name:'뚫린 바위',detail:'구멍 너머로 바다가 보이는 바위야.'}]},
 {title:'같은 해안의 두 순간',bg:'tide',tool:'gauge',goal:'같은 기준물에서 물 높이를 두 번 관측해.',nodes:[{x:1,y:1,name:'첫 관측',detail:'첫 관측의 물 높이를 기준물에 표시했어.'},{x:4,y:2,name:'나중 관측',detail:'나중에는 물 높이가 올라왔어. 물이 들어오는 밀물 변화야.'},{x:2,y:4,name:'안전한 관측소',detail:'물에 잠긴 길은 이용하지 않아. 실제 체험은 현장 안내와 물때를 확인해.'}]},
 {title:'갯벌 흔적 탐사',bg:'mudflat',tool:'lens',goal:'생물의 집을 건드리지 않고 흔적을 관찰해.',nodes:[{x:1,y:2,name:'작은 구멍',detail:'생물의 집일 수 있어. 파헤치지 않고 흔적을 기록해.'},{x:4,y:1,name:'물가의 움직임',detail:'짱뚱어가 지느러미로 움직이는 모습을 살펴봤어.'},{x:4,y:4,name:'갈대 구역',detail:'갈대가 뿌리내린 곳도 생물이 사는 갯벌 환경의 일부야.'}]}
];
export {moveProbe,nearby,normalizeExpeditions} from './expedition-state.js';
import {moveProbe,nearby} from './expedition-state.js';
export function mountExpedition(host,state,save,navigate,sound){
 const start=document.createElement('button');start.className='expedition-launch';start.textContent='탐사정 출항 · 직접 조사';host.append(start);let dialog;
 start.onclick=()=>{
 if(dialog?.isConnected)return;
 let stage=Math.min(5,state.completed.length+1),tool='camera';
 const make=()=>{const e=expeditions[stage-1];state.expeditions??={};const r=state.expeditions[stage]??={found:[],x:0,y:3};return {e,r};};
 dialog=document.createElement('dialog');dialog.className='ocean-expedition';dialog.setAttribute('aria-label','탐사정 조사');document.body.append(dialog);
 const draw=(message='')=>{const {e,r}=make();dialog.innerHTML=`<header><h2>${e.title}</h2><button data-close aria-label="탐사 닫기">✕</button></header><p>${e.goal}</p><label>탐사 구역 <select aria-label="탐사 구역">${expeditions.map((v,i)=>`<option value="${i+1}" ${i+1===stage?'selected':''} ${i>state.completed.length&&!state.settings.unlockAll?'disabled':''}>${i+1}. ${v.title}</option>`).join('')}</select></label><div class="ocean-field" style="background-image:url('${asset(e.bg)}')" aria-label="교육용 탐사 지도">${e.nodes.map((n,i)=>`<button class="ocean-point ${r.found.includes(i)?'found':''}" data-point="${i}" style="left:${8+n.x*16}%;top:${8+n.y*16}%">${r.found.includes(i)?'✓':i+1}<span>${n.name}</span></button>`).join('')}<div class="ocean-probe" style="left:${8+r.x*16}%;top:${8+r.y*16}%" aria-label="탐사정 위치"><img src="${asset('illustrations/buri-map')}" alt="부리 탐사대장"><span>탐사정</span></div></div><div class="ocean-controls"><div class="ocean-pad">${[[0,-1,'위'],[-1,0,'왼쪽'],[0,1,'아래'],[1,0,'오른쪽']].map(([x,y,l])=>`<button data-move="${x},${y}" aria-label="탐사정 ${l}">${l}</button>`).join('')}</div><div class="ocean-tools">${[['camera','사진'],['sample','표본'],['gauge','물 높이'],['lens','관찰경']].map(([id,l])=>`<button data-tool="${id}" aria-pressed="${tool===id}">${l}</button>`).join('')}</div></div><p class="ocean-message" role="status">${message||'방향 버튼으로 가까이 이동하고, 도구를 골라 관측점을 눌러 봐.'}</p><div class="ocean-log">${r.found.map(i=>`<span>✓ ${e.nodes[i].name}</span>`).join('')}</div><footer><span>조사 ${r.found.length}/3 · 위치와 이동은 교육용 모형</span><button data-research ${r.found.length<3?'disabled':''}>자료를 가지고 탐구하기</button></footer>`;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('select').onchange=ev=>{stage=+ev.target.value;draw();};
 dialog.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>move(...b.dataset.move.split(',').map(Number)));
 dialog.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;draw();});
 dialog.querySelectorAll('[data-point]').forEach(b=>b.onclick=()=>{const i=+b.dataset.point,n=e.nodes[i];if(!nearby(r,n)){draw('먼저 방향 버튼으로 이 관측점 가까이 이동해.');return;}if(tool!==e.tool){draw(stage===2?'이 의뢰는 같은 양의 물 표본이 필요해. 표본 도구를 골라 봐.':stage===4?'사진의 색보다 기준물의 물 높이를 관측할 도구가 필요해.':stage===5?'생물의 집을 건드리지 않고 자세히 관찰할 도구를 골라 봐.':'지형과 모습을 기록할 도구를 골라 봐.');sound('click');return;}if(stage===4&&i===1&&!r.found.includes(0)){draw('같은 기준물의 첫 관측부터 기록해야 변화를 비교할 수 있어.');return;}if(stage===2&&i===2&&r.found.length<2){draw('두 장소의 물을 먼저 같은 양으로 채집해.');return;}if(!r.found.includes(i))r.found.push(i);save();sound('reward');draw(n.detail);});
 dialog.querySelector('[data-research]').onclick=()=>{dialog.close();navigate(`s${stage}a`);};
 };
 const move=(x,y)=>{const {r}=make();Object.assign(r,moveProbe(r,x,y));save();draw();};
 dialog.addEventListener('keydown',ev=>{const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(dirs[ev.key]&&!/INPUT|SELECT/.test(ev.target.tagName)){ev.preventDefault();ev.stopPropagation();move(...dirs[ev.key]);}});dialog.addEventListener('close',()=>{dialog.remove();start.focus();});draw();dialog.showModal();
 };
 return ()=>{if(dialog?.isConnected){dialog.close();dialog.remove();}start.remove();};
}
