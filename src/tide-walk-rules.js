import { tideHeight } from './data.js';

// 탐사길 걷기(4장 적용 문제 tide-safety)의 규칙. 화면과 3D 무대는 이 값만 읽는다.
// 한 칸은 2시간인 학습용 관측 모형이다. 실제 밀물·썰물 시각과 높이는 장소와 날짜에 따라 다르다.
// 걷기는 모형에서 물이 가장 낮은 06:00(0칸)부터 가장 높은 12:00(3칸)까지만 쓰고, 새 물 높이를 만들지 않는다.
export const WALK_TASK = 'tide-safety';
export const WALK_LAST_SLOT = 3;
export const WALK_WARN_SLOT = 2;
// 한 칸(2시간)을 화면에서 보여 주는 시간(초).
export const SLOT_SECONDS = 24;
export const WALK_NOTE = '한 칸은 2시간인 학습용 관측 모형이에요. 실제 밀물·썰물 시각과 높이는 장소와 날짜에 따라 달라요.';
export const WALK_SAFETY = '실제 갯벌에서는 물때를 미리 확인하고 어른과 함께 가요.';

// 단위는 미터. x는 데크(음수)에서 바다 쪽(양수)으로 커지고, 탐사길 윗면의 높이가 0이다.
export const course = {
  // z는 길 가운데에서 난간까지의 폭. back은 안쪽(화면 위쪽)으로 걸을 수 있는 한계다. 안내판·소품이 선 난간 앞은 비워 둔다.
  deck: { x0: -7, x1: 0, z: 3.2, back: 2.1 },
  path: { x0: 0, x1: 30, z: 1.25 },
  end: { x0: 30, x1: 33, z: 2.1, back: 1.3 },
  start: { x: -2.6, z: 0.5 },
  board: { x: -4.7 },
  // 탐사길로 이만큼 나갔다가 데크로 돌아오면 탐사를 마친다. 첫 관찰 지점(갈대) 앞에 닿기 전의 거리다.
  gate: 3,
  // 갈대는 키가 커서 물이 들어와도 물 위로 보인다. 게와 짱뚱어는 갯벌 바닥이 잠기면 보이지 않는다.
  spots: [{ id: 'reed', x: 6, tall: true }, { id: 'crab', x: 16 }, { id: 'skipper', x: 26 }],
  // 데크에서 기다리는 친구들. 부리가 겹쳐 서지 않게 비켜 간다.
  friends: { moa: { x: -1.5, z: -2.75 }, jjang: { x: -6.1, z: 1.7 } },
};

const clampSlots = slots => Math.max(0, Math.min(WALK_LAST_SLOT, Number.isFinite(slots) ? slots : 0));

/** 칸 사이를 직선으로 이은 물 높이. 정수 칸에서는 tideHeight와 같다. */
export function walkHeight(slots) {
  const t = clampSlots(slots), i = Math.min(WALK_LAST_SLOT - 1, Math.floor(t));
  return tideHeight(i) + (tideHeight(i + 1) - tideHeight(i)) * (t - i);
}

/** 모형 시각. 재촉하지 않도록 10분 단위로만 보여 준다. */
export function walkClock(slots) {
  const minutes = 6 * 60 + Math.floor(clampSlots(slots) * 12) * 10;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** 갯벌 바닥의 높이. 바다 쪽으로 갈수록 낮아진다. 비탈이 가파르면 탐사길 뒤의 갯벌이 길에 가려 보이지 않는다. */
export const MUD_TOP = -0.45, MUD_SLOPE = 0.025;
export const mudY = x => MUD_TOP - MUD_SLOPE * Math.max(0, x);
const lowWater = mudY(42), highWater = -0.3;
/** 물 높이 눈금을 무대의 수면 높이로 옮긴다. 가장 높은 물도 탐사길 윗면(0)보다 낮다. */
export const waterY = height => lowWater + (height - tideHeight(0)) / (tideHeight(WALK_LAST_SLOT) - tideHeight(0)) * (highWater - lowWater);
/** 물이 관찰 지점의 갯벌 바닥까지 올라와 생물이 보이지 않는가. */
export const spotCovered = (spot, slots) => !spot.tall && waterY(walkHeight(slots)) >= mudY(spot.x);
/** 물이 경고 눈금(10:00의 물 높이)에 닿았는가. */
export const warned = slots => walkHeight(slots) >= tideHeight(WALK_WARN_SLOT);

/** 걷기에서 한 행동을 기존 문제의 보기 id로 옮긴다. 맞았는지는 correctResponse가 정한다. */
export function walkResponse(log) {
  return [log?.calledBack ? '1' : '0', log?.checkedBoard ? '2' : '3'];
}

/** 틀렸을 때 모아가 건네는 말. 정답을 말하지 않고 다시 볼 곳만 알려 준다. */
export function walkHint(log) {
  const lines = [];
  if (!log?.checkedBoard) lines.push('출발하기 전에 데크에서 무엇을 확인하면 돌아올 때를 정할 수 있을까요? 데크를 다시 둘러봐요.');
  if (log?.calledBack) lines.push('모아가 부를 때는 물이 이미 경고 눈금까지 들어왔어요. 기둥에 닿는 물 높이를 보고 더 일찍 돌아서요.');
  return lines.join(' ');
}
