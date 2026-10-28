import { asset } from './data.js';
import { pageChallenges } from './challenge-data.js';
const hints=[
 ['서로 먼 세 곳을 스캔해 봐. 땅이 보이는 곳과 넓은 물이 보이는 곳을 모두 찾았니?','표본 카드를 육지·바다 보관함으로 옮겨 봐. 몇 곳의 개수만으로 지구 전체 넓이를 알 수 있을까?'],
 ['물의 양과 가열 세기를 움직여 봐. 두 그릇의 조건을 같게 맞추면 물의 차이만 비교할 수 있어.','가열을 시작하고 물이 줄어드는 모습을 봐. 가열 전·후를 바꿔서 바닥에 남은 흔적을 비교해.'],
 ['해안을 손가락으로 쓸어 둘러봐. + 표시를 누르면 사진이 바로 앨범에 저장돼.','사진에서 특징이 보이는 곳에 핀을 찍어. 바위의 안쪽 공간과 반대편까지 뚫린 공간을 비교해.'],
 ['시간축을 천천히 움직여 봐. 같은 기둥의 물 닿는 위치가 다른 두 순간을 A와 B에 저장해.','비교선을 좌우로 움직여 같은 기둥과 바위를 봐. A에서 B로 물이 높아졌니, 낮아졌니?'],
 ['돋보기를 끌어 흔적을 찾아봐. 생물을 누르고 확대된 모습에서 특징을 골라 기록해.','관찰한 생물의 집을 떠올려 봐. 구멍과 갈대를 지키는 행동이 생물에게 어떤 도움이 될까?'],
];
export function companion(s,n,step){
 const task=['c','d'].includes(step)?pageChallenges(n,step)[s.research[n][step]??0]:null;
 const clue=task?.clue??hints[n-1][step==='b'?1:0];
 const safe=clue.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<div class="companion-tools"><details class="moa-hint"><summary><img src="${asset('moa')}" alt="수달 모아"><span>모아의 힌트</span></summary><div class="moa-bubble"><b>작은 단서부터 찾아보자!</b><p>${safe}</p></div></details><button data-action="concept" data-value="${n}" class="concept-replay">개념 영상</button></div>`;
}
