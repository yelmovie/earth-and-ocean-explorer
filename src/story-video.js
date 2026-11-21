// 인트로·파이널 이야기 영상(2026-11-21). 첫 「탐사 시작하기」와 엔딩으로 넘어갈 때 한 번, 설정에서 다시 볼 수 있다.
// 영상이 끝나거나 건너뛰면 onDone으로 다음 화면을 연다. 영상을 못 열어도 버튼으로 계속 진행한다.
import './story-video.css';

export const STORY_VIDEOS = {
  intro: { title: '꺼진 조사본부를 다시 밝혀라!', label: '인트로 영상', skip: '건너뛰고 탐사 시작' },
  finale: { title: '푸른행성이 다시 빛나!', label: '파이널 영상', skip: '건너뛰고 엔딩 보기' },
};

export function openStoryVideo(kind, { base = '/assets/story/', muted = false, closeLabel, onOpen, onDone } = {}) {
  const info = STORY_VIDEOS[kind];
  if (!info || document.querySelector('.story-video-dialog')) return false;
  const dialog = document.createElement('dialog');
  dialog.className = 'story-video-dialog';
  dialog.setAttribute('aria-labelledby', 'story-video-title');
  dialog.innerHTML = `<h2 id="story-video-title">${info.title}</h2><video playsinline preload="auto" controls poster="${base}${kind}.jpg" aria-label="${info.label}"><source src="${base}${kind}.mp4" type="video/mp4"></video><p class="story-video-status" role="status" hidden></p><div class="story-video-actions"><button type="button" class="primary" data-story-video="done">${closeLabel || info.skip}</button></div>`;
  const video = dialog.querySelector('video'), status = dialog.querySelector('.story-video-status');
  video.muted = muted;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector('[data-story-video="done"]').focus();
  onOpen?.();
  dialog.querySelector('[data-story-video="done"]').addEventListener('click', () => dialog.close());
  video.addEventListener('ended', () => dialog.close());
  video.addEventListener('error', () => { status.hidden = false; status.textContent = '지금은 영상을 열 수 없어. 아래 버튼으로 계속 진행해.'; }, true);
  dialog.addEventListener('close', () => { video.pause(); video.querySelector('source')?.removeAttribute('src'); video.load(); dialog.remove(); onDone?.(); }, { once: true });
  video.play().catch(() => {});
  return true;
}
