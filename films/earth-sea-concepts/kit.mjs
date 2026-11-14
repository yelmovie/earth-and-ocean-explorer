// 「모아의 탐사 노트」 공용 부품. 편별 내용은 films.mjs, 시간표는 src/concept-data.js.
// 화면: 게임 배경 그림 위에 이름표(흰 카드 + 잉크 테두리 + 지시선), 질문 말풍선, 결론 한 줄, 모아.
import { CONCEPT_SECONDS } from '../../src/concept-data.js';
export const W = 1920, H = 1080, FPS = 30, SECONDS = CONCEPT_SECONDS;
export const C = { ink: '#173f4b', paper: '#fffdf5', note: '#fbf6e6', accent: '#b26a00', sea: '#379eaf', land: '#9ebf75', gold: '#efbd6e', line: '#173f4b' };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const len = (a, b) => Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]));

// 이름표: (x, y)에 카드 가운데, to 가 있으면 물체까지 지시선. 지시선은 카드 아래층.
export function tag({ id, x, y, text, sub = '', to = null, size = 44 }) {
  const line = to ? `<line id="ln-${id}" x1="${x}" y1="${y}" x2="${to[0]}" y2="${to[1]}" stroke="${C.line}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${len([x, y], to)}" stroke-dashoffset="${len([x, y], to)}"/><circle id="dot-${id}" cx="${to[0]}" cy="${to[1]}" r="9" fill="${C.paper}" stroke="${C.line}" stroke-width="5" opacity="0"/>` : '';
  const html = `<div class="tagwrap" id="${id}" style="left:${x}px;top:${y}px"><div class="tag" style="font-size:${size}px">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
  return { html, line };
}

// 결론 한 줄: accent 낱말 하나만 강조색.
export function conclusion(text, accent, sub = '') {
  const body = esc(text).replace(esc(accent), `<em>${esc(accent)}</em>`);
  return `<div class="endwrap"><div id="end" class="end">${body}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
}

// 효과음 길이(초, ffprobe). 자리 길이를 소리 길이와 맞춘다.
const SFX_SECONDS = { drop: 0.22, scan: 0.41, camera: 0.53, heat: 0.31, success: 0.58 };

export function page(film) {
  const tags = film.tags || [];
  const sfx = (film.sfx || []).map(([t, name, vol = 0.8], i) => `<audio id="sfx-${i}" class="clip" data-start="${t}" data-duration="${SFX_SECONDS[name]}" data-track-index="${10 + i}" data-volume="${vol}" src="assets/sfx/${name}.mp3"></audio>`).join('\n      ');
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      @font-face{font-family:'NanumSquareNeo';src:url('assets/fonts/NanumSquareNeoTTF-bRg.woff2') format('woff2');font-style:normal;font-weight:400;font-display:block}
      @font-face{font-family:'NanumSquareNeo';src:url('assets/fonts/NanumSquareNeoTTF-cBd.woff2') format('woff2');font-style:normal;font-weight:700;font-display:block}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.note}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: 'NanumSquareNeo', sans-serif; color: ${C.ink}; background: ${C.note}; }
      #cam { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
      #bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #lines { position: absolute; inset: 0; width: ${W}px; height: ${H}px; pointer-events: none; }
      .tagwrap { position: absolute; width: max-content; transform: translate(-50%, -50%); z-index: 6; }
      .tag { opacity: 0; background: ${C.paper}; border: 4px solid ${C.ink}; border-radius: 18px; padding: 8px 24px 10px; line-height: 1.15; white-space: nowrap; text-align: center; box-shadow: 0 10px 18px rgba(23,63,75,.2); }
      .tag small { display: block; font-size: 30px; color: #3c6670; margin-top: 2px; }
      #moa-wrap { position: absolute; left: 1572px; top: 712px; width: 300px; height: 315px; z-index: 8; }
      #moa { width: 100%; height: 100%; object-fit: contain; transform-origin: 50% 100%; opacity: 0; }
      #ask-wrap { position: absolute; left: 1330px; top: 250px; width: 540px; z-index: 9; }
      #ask { opacity: 0; background: ${C.paper}; border: 4px solid ${C.ink}; border-radius: 30px; padding: 26px 34px 30px; font-size: 52px; line-height: 1.22; box-shadow: 0 10px 18px rgba(23,63,75,.2); transform-origin: 80% 100%; position: relative; }
      #ask:after { content: ''; position: absolute; right: 92px; bottom: -34px; width: 44px; height: 44px; background: ${C.paper}; border-right: 4px solid ${C.ink}; border-bottom: 4px solid ${C.ink}; transform: rotate(45deg) skew(8deg, 8deg); }
      #ask .w { display: inline-block; opacity: 0; }
      .endwrap { position: absolute; left: ${film.endX ?? 760}px; top: 108px; width: max-content; transform: translate(-50%, 0); z-index: 9; }
      .end { opacity: 0; background: ${C.note}; border: 4px solid ${C.ink}; border-radius: 28px; padding: 18px 40px 22px; font-size: 68px; line-height: 1.15; white-space: nowrap; text-align: center; box-shadow: 0 12px 22px rgba(23,63,75,.22); }
      .end em { font-style: normal; color: ${C.accent}; }
      .end small { display: block; font-size: 38px; color: #3c6670; margin-top: 6px; }
      ${film.css || ''}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${SECONDS}" data-width="${W}" data-height="${H}">
      <div id="cam">
        <img id="bg" src="assets/img/${film.bg}.webp" alt="" />
        ${film.stage || ''}
      </div>
      ${film.overlay || ''}
      <svg id="lines" viewBox="0 0 ${W} ${H}">${tags.map(t => t.line).join('')}</svg>
      ${tags.map(t => t.html).join('\n      ')}
      <div id="ask-wrap"><div id="ask">${film.ask.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ')}</div></div>
      ${conclusion(film.end, film.accent, film.endSub)}
      <div id="moa-wrap"><img id="moa" src="assets/img/moa.webp" alt="" /></div>
      ${sfx}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const pop = (id, t) => {
        const ln = document.getElementById('ln-' + id);
        if (ln) { tl.fromTo(ln, { attr: { 'stroke-dashoffset': ln.getAttribute('stroke-dasharray') } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.22, ease: 'power2.out' }, t); tl.fromTo('#dot-' + id, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t + 0.18); }
        tl.fromTo('#' + id + ' .tag', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(2)' }, t + (ln ? 0.14 : 0));
      };
      const hide = (id, t) => {
        tl.to('#' + id + ' .tag', { opacity: 0, scale: 0.92, duration: 0.18, ease: 'power3.in' }, t);
        if (document.getElementById('ln-' + id)) tl.to(['#ln-' + id, '#dot-' + id], { opacity: 0, duration: 0.18 }, t);
      };
      // 모아: 오른쪽에서 들어와 찌그러졌다 섬(0.3–1.1 s).
      tl.fromTo('#moa', { opacity: 0, x: 380, rotation: 6 }, { opacity: 1, x: 0, rotation: 0, duration: 0.7, ease: 'expo.out' }, 0.25);
      tl.fromTo('#moa', { scaleY: 1, scaleX: 1 }, { scaleY: 0.9, scaleX: 1.06, duration: 0.12, ease: 'power2.out' }, 0.8);
      tl.to('#moa', { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'back.out(2.2)' }, 0.92);
      // 질문 말풍선: 낱말씩 또렷해짐, 3.25 s에 빠짐.
      tl.fromTo('#ask', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)' }, 0.95);
      tl.fromTo('#ask .w', { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.14, stagger: 0.09, ease: 'power2.out' }, 1.1);
      tl.to('#ask', { opacity: 0, scale: 0.9, duration: 0.22, ease: 'power3.in' }, 3.25);
      ${film.timeline}
      // 결론 한 줄과 모아의 반응(뛰어올랐다 내려앉기, 고개 끄덕).
      tl.fromTo('#end', { opacity: 0, y: -24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'expo.out' }, 11.65);
      tl.to('#moa', { scaleY: 0.88, scaleX: 1.08, duration: 0.12, ease: 'power2.in' }, 12.0);
      tl.to('#moa', { y: -70, scaleY: 1.06, scaleX: 0.96, duration: 0.26, ease: 'power2.out' }, 12.12);
      tl.to('#moa', { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'power2.in' }, 12.38);
      tl.to('#moa', { scaleY: 0.93, scaleX: 1.04, duration: 0.08 }, 12.68);
      tl.to('#moa', { scaleY: 1, scaleX: 1, rotation: -5, duration: 0.3, ease: 'back.out(2)' }, 12.76);
      tl.to('#moa', { rotation: 0, duration: 0.5, ease: 'power2.inOut' }, 13.6);
      tl.set({}, {}, ${SECONDS});
      window.__timelines = window.__timelines || {};
      window.__timelines['main'] = tl;
    </script>
  </body>
</html>
`;
}

// 카메라 확대: 물체 P 를 화면 C 근처로, 그림 밖이 보이지 않게 고정. 반환값은 GSAP 값과 확대 뒤 화면 좌표.
export function camera(P, s, Cx = 900, Cy = 540) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const x = clamp(Cx - P[0] * s, W - W * s, 0), y = clamp(Cy - P[1] * s, H - H * s, 0);
  return { x: Math.round(x), y: Math.round(y), scale: s, at: [Math.round(P[0] * s + x), Math.round(P[1] * s + y)] };
}
