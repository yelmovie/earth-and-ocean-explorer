// 캐릭터 대사 음성(로컬 mp3). 한 번에 한 대사만 재생하고, 화면 이동·대화창 닫기·탭 숨김·소리 끄기에서 멈춘다.
// 재생 중에는 배경음을 잠시 줄이고(duck), 자동재생이 막혀도 화면 글로 그대로 진행할 수 있다.
import { VOICE_IDS } from './voice-ids.js';
const available = new Set(VOICE_IDS);
export const hasVoice = id => available.has(id);
export function createVoice({ enabled, duck = () => {} }) {
  let audio = null, queue = [], ticket = 0, current = '', ducked = false;
  const src = id => `${import.meta.env?.BASE_URL ?? '/'}assets/audio/voices/${id}.mp3`;
  function finish() { if (audio) { audio.onended = audio.onerror = null; audio.pause(); } audio = null; current = ''; if (ducked) { ducked = false; duck(false); } }
  function stop() { ticket++; queue = []; finish(); }
  function next(my) {
    if (my !== ticket) return;
    const id = queue.shift(); if (!id) { finish(); return; }
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); }
    current = id; audio = new Audio(src(id)); audio.preload = 'auto';
    audio.onended = () => next(my); audio.onerror = () => next(my);
    if (!ducked) { ducked = true; duck(true); }
    audio.play().catch(() => { if (my === ticket) finish(); });
  }
  // ids: 한 대사 또는 이어 읽을 대사 목록. 없는 파일·소리 끔이면 아무것도 하지 않는다.
  function play(ids) {
    const list = [].concat(ids).filter(hasVoice);
    stop(); if (!list.length || !enabled() || document.hidden) return false;
    queue = list; next(ticket); return true;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  return { play, stop, get playing() { return current; } };
}
