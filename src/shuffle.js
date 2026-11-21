// 선택지의 화면 순서만 섞는다. 답은 보기 id로 저장하므로 판정·옛 기록은 그대로다.
// 같은 문제를 보는 동안은 순서가 바뀌지 않고(같은 열쇠 = 같은 순서), 페이지를 새로 열 때마다 새 순서가 된다.
const pageSeed = (Math.random() * 2 ** 32) >>> 0;
function hash(text) {
  let h = (2166136261 ^ pageSeed) >>> 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h || 1;
}
export function shuffled(list, key) {
  let x = hash(String(key));
  const rand = () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
