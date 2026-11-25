import { asset, chapters } from './data.js';
import { pageChallenges } from './challenge-data.js';
const hints=[
 [null,'표본 카드를 육지·바다 보관함으로 옮겨 봐. 몇 곳의 개수만으로 지구 전체 넓이를 알 수 있을까?'],
 ['물의 양과 가열 세기를 움직여 봐. 두 그릇의 조건을 같게 맞추면 물의 차이만 비교할 수 있어.','가열을 시작하고 물이 줄어드는 모습을 봐. 가열 전·후를 바꿔서 바닥에 남은 흔적을 비교해.'],
 ['해안을 움직여 숨은 지형까지 둘러봐.','사진 가운데와 가장자리에 무엇이 보이는지 비교해 봐.'],
 ['시간축을 천천히 움직여 봐. 같은 기둥의 물 닿는 위치가 다른 두 순간을 A와 B에 저장해.','비교선을 좌우로 움직여 같은 기둥과 바위를 봐. A에서 B로 물이 높아졌니, 낮아졌니?'],
 ['돋보기를 끌어 흔적을 찾아봐. 생물을 누르고 확대된 모습에서 특징을 골라 기록해.','도감의 사진 속 생물과 주변 모습을 함께 살펴봐.'],
];
const useObservationHint = new Set(['earth-words', 'lab-order', 'coast-safety', 'protect-sort']);
export function companion(s,n,step){
 const earth=n===1&&step==='a';
 const task=['c','d'].includes(step)?pageChallenges(n,step)[s.research[n][step]??0]:null;
 const clue=task?.clue&&!useObservationHint.has(task.id)?task.clue
   :task?.type==='order'?'앞뒤 카드 사이에 무엇이 바뀌는지 살펴봐요.'
   :task?.type==='sort'||task?.type==='match'?'자료 카드의 특징을 놓을 칸의 이름과 비교해요.'
   :task?'보기마다 관찰 기록에서 확인할 수 있는 부분을 찾아봐요.'
   :hints[n-1][step==='b'?1:0];
 const terms=chapters[n-1].keyConcepts.map(term=>`<mark>${term}</mark>`).join(' ');
 const help=earth?`<ol class="earth-help-steps">
   <li>지구를 돌려 + 세 곳을 눌러요. <mark>육지와 바다</mark>를 모두 찾아요.</li>
   <li><mark>대기</mark> 관찰을 눌러 지구 가장자리의 푸른 띠를 봐요.</li>
   <li>비교하기에서 지구 <mark>전체 넓이</mark> 자료를 살펴봐요.</li>
 </ol>`:`<p>${clue}</p>`;
 return `<div class="companion-tools"><details class="moa-hint"><summary aria-label="모아의 힌트" title="모아의 힌트"><img src="${asset('moa')}" alt=""></summary><div class="moa-bubble">${help}<p class="hint-terms">${terms}</p>${s.completed.includes(n)?`<p>${chapters[n-1].conceptSummary}</p><button data-action="concept" data-value="${n}" class="concept-replay">개념 영상 다시 보기</button>`: ''}</div></details></div>`;
}
