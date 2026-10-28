export const chapters = [
  { id: 1, title: '지구 관측소', short: '지구 표면', icon: '◎', color: '#7ddfd0', asset: 'observatory', evidence: '지구 관찰 기록', reward: '관측소의 신호와 지구 지도가 돌아왔어!', goal: '지구를 여러 방향에서 살펴보고, 육지와 바다의 모습을 기록해 줘.', steps: ['푸른 지구를 돌려 봐', '내 표본과 지구 전체를 비교해'] },
  { id: 2, title: '물 표본 실험실', short: '두 물의 차이', icon: '⚗', color: '#ffcf78', asset: 'lab', evidence: '실험 비교 기록', reward: '실험실의 표본 보관대가 다시 열렸어!', goal: '두 물을 같은 조건에서 비교해서 잃어버린 표본 설명을 복구해 줘.', steps: ['공정한 실험을 준비해', '물이 사라진 뒤를 살펴봐'] },
  { id: 3, title: '해안 조사구역', short: '해안 지형', icon: '▧', color: '#aad692', asset: 'coast', evidence: '해안 조사 앨범', reward: '네가 찍은 사진이 탐사길에 전시됐어!', goal: '해안의 네 지형을 사진으로 남겨 탐사 안내 지도를 완성해 줘.', steps: ['해안의 특징을 사진에 담아', '사진에 특징을 표시해'] },
  { id: 4, title: '조석 관측소', short: '밀물과 썰물', icon: '≋', color: '#a8c5ff', asset: 'tide', evidence: '시간 비교 기록', reward: '관측소에 네 A/B 비교 게시판이 켜졌어!', goal: '같은 해안의 시간별 기록을 비교해서 물 높이 변화를 알려 줘.', steps: ['같은 장소, 다른 시간을 저장해', '두 장면에서 변화의 증거를 찾아'] },
  { id: 5, title: '갯벌 탐사구역', short: '갯벌의 생명', icon: '♧', color: '#f2b2a6', asset: 'mudflat', evidence: '생태 도감과 보호 근거', reward: '갯벌 생태 안내판 완성! 이제 다섯 기록을 연결해 보자.', goal: '작은 흔적에서 생물을 찾아, 갯벌을 지켜야 하는 까닭을 알려 줘.', steps: ['작은 흔적에서 생명을 찾아', '관찰한 증거로 갯벌을 지켜'] },
];
export const sites = [
  { id: 'asia', name: '아시아 안쪽', lon: 105, lat: 45, type: '육지' },
  { id: 'pacific', name: '태평양 한가운데', lon: -145, lat: 5, type: '바다' },
  { id: 'africa', name: '아프리카 안쪽', lon: 20, lat: 10, type: '육지' },
  { id: 'atlantic', name: '대서양 한가운데', lon: -35, lat: 10, type: '바다' },
  { id: 'australia', name: '오스트레일리아 안쪽', lon: 135, lat: -25, type: '육지' },
  { id: 'indian', name: '인도양 한가운데', lon: 80, lat: -25, type: '바다' },
];
export const terrains = [
  { id: 'sand', name: '모래사장', x: 72, y: 82, feature: '고운 모래가 넓게 쌓여 있어', detail: '알갱이가 작은 모래가 펼쳐진 곳이야.', position: '75% 95%' },
  { id: 'cliff', name: '절벽', x: 77, y: 25, feature: '바위가 높고 가파르게 서 있어', detail: '바닷가에 높고 가파른 바위 면이 보여.', position: '90% 20%' },
  { id: 'cave', name: '동굴', x: 90, y: 38, feature: '바위 안쪽으로 깊은 빈 공간이 있어', detail: '입구 안쪽으로 어두운 공간이 이어져.', position: '100% 32%' },
  { id: 'arch', name: '구멍 난 바위', x: 48.5, y: 37, feature: '바위의 구멍 너머로 바다가 보여', detail: '뚫린 부분 반대편까지 바라볼 수 있어.', position: '48% 31%' },
];
export const creatures = [
  { id: 'crab', name: '게', trace: '작은 구멍과 옆으로 난 발자국', feature: '집게와 여러 다리로 옆으로 걸어', symbol: '🦀', x: 24, y: 62 },
  { id: 'skipper', name: '짱뚱어', trace: '물가에서 폴짝이는 움직임', feature: '눈이 위로 솟고 지느러미로 움직여', symbol: '🐟', x: 57, y: 73 },
  { id: 'reed', name: '갈대', trace: '진흙에서 솟은 가느다란 잎', feature: '뿌리를 내리고 줄기와 잎이 자라', symbol: '🌿', x: 79, y: 39 },
];
export const finalCases = [
  { title: '새 지구 전시의 설명을 골라 줘', problem: '친구가 “내 표본은 육지가 더 많으니 지구도 육지가 더 넓어!”라고 말했어.', stage: 1, reasons: ['몇 개의 표본만으로 지구 전체를 알 수 있어', '지구 전체의 면적 자료와 내 표본은 구분해야 해', '초록색이 예쁘니까 육지가 더 넓어'], answer: 1 },
  { title: '이름이 지워진 물 표본', problem: '두 물을 같은 양, 같은 세기로 가열했어. 한쪽에 흰 물질이 더 남았어. 어떤 기록으로 설명할까?', stage: 2, reasons: ['물을 더 많이 넣어서만 생긴 차이야', '색이 맑으면 녹아 있는 물질이 없어', '바닷물에는 소금 등 녹아 있는 물질이 있어'], answer: 2 },
  { title: '해안 탐사 안내판을 고쳐 줘', problem: '바위 구멍 너머 바다가 보이는 사진에 “모래사장”이라고 적혀 있어.', stage: 3, reasons: ['사진 속 재료와 모양을 보고 지형 이름을 연결해', '바닷가는 모두 모래사장이야', '높은 곳이면 모두 동굴이야'], answer: 0 },
  { title: '같은 길이 물에 잠겼어', problem: '앞선 기록보다 물 높이가 올라 길 일부가 잠겼어. 관찰한 변화는 무엇일까?', stage: 4, reasons: ['물이 빠지는 썰물의 변화야', '물이 들어오는 밀물의 변화야', '관측 장비가 바다를 높인 거야'], answer: 1 },
  { title: '갯벌 체험 약속을 정해 줘', problem: '친구들이 생물의 구멍을 모두 파 보고 싶대. 우리가 모은 기록으로 설명해 보자.', stage: 5, reasons: ['갯벌은 아무것도 살지 않는 빈 땅이야', '많이 잡을수록 갯벌을 잘 조사한 거야', '갯벌은 생물의 집이므로 흔적을 지키며 관찰해'], answer: 2 },
];
export const routes = ['home', 'hub', ...chapters.flatMap(c => [`s${c.id}a`, `s${c.id}b`, `s${c.id}c`, `s${c.id}d`]), 'report', 'link', 'ending', 'certificate'];
export const asset = name => { const relative=`${import.meta.env?.BASE_URL ?? '/'}assets/${name}.webp`; return typeof document==='undefined'?relative:new URL(relative,document.baseURI).href; };
export function tideHeight(t) { return [28, 45, 66, 83, 66, 45, 28][t] ?? 28; }
export function timeLabel(t) { return `${String(6 + t).padStart(2, '0')}:00`; }
