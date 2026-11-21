// 인트로·파이널 이야기 영상(2026-11-21). 첫 「탐사 시작하기」와 엔딩으로 넘어갈 때 한 번, 설정·엔딩에서 다시 볼 수 있다.
// 1~8번과 같은 방식: 전체 화면(contain), 자막은 영상 안에 들어 있고 화면 자막은 읽기 도구용으로만 둔다.
// 영상 소리 트랙에는 대사만 있다(배경 음악은 앱이 튼다). 영상이 끝나거나 건너뛰면 onDone으로 다음 화면을 연다.
// 영상을 못 열면 대사 글을 화면에 보여 주고, 버튼으로 계속 진행한다.
import './story-video.css';
import { STORY_CUES } from './story-video-cues.js';

export const STORY_VIDEOS = {
  intro: { title: '푸른행성 조사본부 인트로', skip: '건너뛰기' },
  finale: { title: '푸른행성 조사본부 파이널', skip: '건너뛰기' },
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function openStoryVideo(kind, { base = '/assets/story/', muted = false, closeLabel, onOpen, onSpeech, onDone } = {}) {
  const info = STORY_VIDEOS[kind], cues = STORY_CUES[kind] || [];
  if (!info || document.querySelector('.story-video-dialog')) return false;
  const dialog = document.createElement('dialog');
  dialog.className = 'story-video-dialog';
  dialog.setAttribute('aria-label', info.title);
  const lines = cues.map(c => `<p>${c.who ? `<b>${esc(c.who)}</b> ` : ''}${esc(c.text)}</p>`).join('');
  dialog.innerHTML = `<video playsinline preload="auto" poster="${base}${kind}.jpg" aria-label="${info.title}"><source src="${base}${kind}.mp4" type="video/mp4"></video><p class="sr-only story-video-live" aria-live="polite"></p><div class="story-video-fallback" hidden><p class="story-video-status" role="status">지금은 영상을 열 수 없어. 이야기를 글로 읽어 줘.</p>${lines}</div><button type="button" class="story-video-skip" data-story-video="done">${esc(closeLabel || info.skip)}</button>`;
  const video = dialog.querySelector('video'), live = dialog.querySelector('.story-video-live'), fallback = dialog.querySelector('.story-video-fallback'), skip = dialog.querySelector('[data-story-video="done"]');
  video.muted = muted;
  document.body.append(dialog);
  dialog.showModal();
  skip.focus();
  onOpen?.();
  let cueIndex = -1, speaking = false, failed = false;
  const tick = () => {
    const t = video.currentTime || 0;
    const i = cues.findIndex(c => t >= c.s && t < c.e);
    if (i !== cueIndex) { cueIndex = i; live.textContent = i >= 0 ? `${cues[i].who ? cues[i].who + ': ' : ''}${cues[i].text}` : ''; }
    const now = !video.paused && cues.some(c => t >= c.speech[0] - 0.15 && t < c.speech[1] + 0.3);
    if (now !== speaking) { speaking = now; onSpeech?.(now); }
  };
  const fail = () => {
    if (failed) return; failed = true; video.hidden = true; fallback.hidden = false; dialog.classList.add('is-fallback');
    skip.textContent = closeLabel || '계속하기'; if (speaking) { speaking = false; onSpeech?.(false); }
  };
  skip.addEventListener('click', () => dialog.close());
  video.addEventListener('timeupdate', tick);
  video.addEventListener('pause', tick);
  video.addEventListener('ended', () => dialog.close());
  video.addEventListener('error', fail, true);
  video.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
  const timeout = setTimeout(() => { if (video.readyState === 0) fail(); }, 8000);
  dialog.addEventListener('close', () => {
    clearTimeout(timeout); if (speaking) onSpeech?.(false);
    video.pause(); video.querySelector('source')?.removeAttribute('src'); video.load(); dialog.remove(); onDone?.();
  }, { once: true });
  video.play().catch(() => {});
  return true;
}
