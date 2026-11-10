// 다섯 편의 장면 데이터. 장면 경계(0 / 3.5 / 8 / 11.5 s)는 src/concept-data.js 의 자막 시간과 같다.
import { readFileSync } from 'node:fs';
import { tag, camera, C } from './kit.mjs';
import { conceptCues } from '../../src/concept-data.js';

export const scenes = Object.fromEntries(Object.entries(conceptCues).map(([n, cues]) => [n, cues.map(c => c[0])]));

// ── 1편 지도: 게임의 지구(public/assets/land.geojson)를 그대로 펼친 그림(등장방형).
const MAP = { x: 170, y: 196, w: 1140, h: 570 };
const lonlat = (lon, lat) => [MAP.x + (lon + 180) / 360 * MAP.w, MAP.y + (90 - lat) / 180 * MAP.h];
const land = JSON.parse(readFileSync(new URL('../../public/assets/land.geojson', import.meta.url), 'utf8'));
const mapPath = land.features.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates))
  .map(poly => poly.map(ring => 'M' + ring.map(([lo, la]) => lonlat(lo, la).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z').join('')).join('');
const pin = (id, lon, lat, sea = false) => { const [x, y] = lonlat(lon, lat); return `<g class="pinwrap" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><g id="${id}" class="pin"><path d="M0 0C-8-14-22-24-22-40a22 22 0 0 1 44 0C22-24 8-14 0 0Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="5"/><circle cy="-40" r="8" fill="${sea ? C.sea : C.land}" stroke="${C.ink}" stroke-width="3"/></g></g>`; };
const bar = Array.from({ length: 10 }, (_, i) => `<rect class="cell ${i < 7 ? 'sea' : 'land'}" x="${240 + i * 100}" y="420" width="92" height="120" rx="10" fill="${i < 7 ? C.sea : C.land}" stroke="${C.ink}" stroke-width="4"/>`).join('');

const film1 = {
  bg: 'observatory', ask: '지구는 무엇으로 덮여 있을까?', end: '전체 넓이는 바다가 더 넓어', accent: '바다', endX: 740,
  css: `#board{position:absolute;left:130px;top:156px;width:1220px;height:650px;background:${C.paper};border:4px solid ${C.ink};border-radius:26px;box-shadow:0 14px 26px rgba(23,63,75,.25);opacity:0}
        #map,#ratio{position:absolute;inset:0;width:1920px;height:1080px}
        .pin,.cell{opacity:0} .pin{transform-origin:0 0} .cell{transform-box:fill-box;transform-origin:50% 100%}
        #counter-wrap{position:absolute;left:740px;top:880px;transform:translate(-50%,-50%);z-index:6}
        #counter{opacity:0;position:relative;background:${C.paper};border:4px solid ${C.ink};border-radius:18px;padding:10px 30px 12px;font-size:44px;white-space:nowrap;box-shadow:0 10px 18px rgba(23,63,75,.2)}
        #strike{position:absolute;left:18px;right:18px;top:50%;height:8px;background:${C.accent};border-radius:4px;transform-origin:0 50%;transform:scaleX(0)}`,
  stage: `<div id="board"></div>
        <svg id="map" viewBox="0 0 1920 1080"><clipPath id="reveal"><rect id="reveal-r" x="${MAP.x}" y="${MAP.y}" width="0" height="${MAP.h}"/></clipPath><g id="mapclip" clip-path="url(#reveal)"><rect x="${MAP.x}" y="${MAP.y}" width="${MAP.w}" height="${MAP.h}" rx="14" fill="${C.sea}"/><path d="${mapPath}" fill="${C.land}" stroke="#6f8f52" stroke-width="1.5"/></g>
        ${pin('pin-asia', 100, 48)}${pin('pin-africa', 20, 8)}${pin('pin-aus', 134, -24)}${pin('pin-pacific', -145, 5, true)}</svg>
        <svg id="ratio" viewBox="0 0 1920 1080"><rect id="ratio-back" x="214" y="394" width="1052" height="172" rx="22" fill="${C.paper}" stroke="${C.ink}" stroke-width="4" opacity="0"/>${bar}</svg>`,
  overlay: `<div id="counter-wrap"><div id="counter">내 표본: 육지 3곳 · 바다 1곳<i id="strike"></i></div></div>`,
  tags: [
    tag({ id: 't-land', x: 860, y: 262, text: '육지', to: lonlat(90, 45) }),
    tag({ id: 't-sea', x: 330, y: 610, text: '바다', to: lonlat(-140, -20) }),
    tag({ id: 't-sea7', x: 570, y: 330, text: '바다 7칸' }),
    tag({ id: 't-land3', x: 1090, y: 330, text: '육지 3칸' }),
    tag({ id: 't-whole', x: 740, y: 640, text: '지구 전체 넓이', sub: '대략으로 나눈 칸' }),
  ],
  timeline: `
      tl.fromTo('#board', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.1);
      tl.fromTo('#reveal-r', { attr: { width: 0 } }, { attr: { width: ${MAP.w} }, duration: 1.1, ease: 'power2.inOut' }, 0.35);
      pop('t-land', 1.6); pop('t-sea', 1.9);
      hide('t-land', 3.3); hide('t-sea', 3.3);
      ['#pin-asia', '#pin-africa', '#pin-aus', '#pin-pacific'].forEach((p, i) => tl.fromTo(p, { opacity: 0, y: -70, scaleY: 1 }, { opacity: 1, y: 0, duration: 0.42, ease: 'bounce.out' }, 3.6 + i * 0.4));
      tl.fromTo('#counter', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(2)' }, 5.4);
      tl.fromTo('#strike', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, 8.0);
      tl.to('#counter', { opacity: 0.55, duration: 0.3 }, 8.3);
      tl.to(['#mapclip', '.pin'], { opacity: 0.22, duration: 0.5, ease: 'power2.inOut' }, 8.1);
      tl.fromTo('#ratio-back', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 8.5);
      tl.fromTo('.cell', { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.09 }, 8.6);
      pop('t-sea7', 9.75); pop('t-land3', 10.05); pop('t-whole', 10.4);`,
  sfx: [[3.62, 'drop', 0.7], [4.02, 'drop', 0.6], [4.42, 'drop', 0.7], [4.82, 'drop', 0.6], [8.62, 'scan', 0.6], [9.77, 'scan', 0.7], [11.67, 'success', 0.8]],
};

// ── 2편 실험실: 게임의 가열 실험(같은 양 40 mL, 같은 세기)과 같은 비커·이름.
const beaker = (id, x, salt) => `<g id="${id}"><rect x="${x - 150}" y="842" width="300" height="46" rx="12" fill="#55666b" stroke="${C.ink}" stroke-width="4"/><rect id="${id}-coil" x="${x - 110}" y="852" width="220" height="16" rx="8" fill="#7f9196"/>
        <g clip-path="url(#${id}-in)"><rect id="${id}-water" x="${x - 130}" y="610" width="260" height="226" fill="${C.sea}" opacity=".85"/>${salt ? Array.from({ length: 9 }, (_, i) => `<rect class="salt" x="${x - 108 + i * 24}" y="${816 - (i % 3) * 7}" width="18" height="16" rx="3" fill="#ffffff" stroke="#9bb3b8" stroke-width="2"/>`).join('') : ''}</g>
        <clipPath id="${id}-in"><path d="M${x - 130} 470V812a24 24 0 0 0 24 24H${x + 106}a24 24 0 0 0 24-24V470Z"/></clipPath>
        <path d="M${x - 140} 450V812a34 34 0 0 0 34 34H${x + 106}a34 34 0 0 0 34-34V450" fill="rgba(240,252,255,.35)" stroke="${C.ink}" stroke-width="6"/>
        ${[0, 1, 2].map(i => `<path d="M${x + 90} ${590 + i * 80}h30" stroke="${C.ink}" stroke-width="4"/>`).join('')}
        ${[0, 1, 2].map(i => `<path class="vapor" d="M${x - 70 + i * 70} 600c-16-30 16-50 0-80s16-50 0-80" fill="none" stroke="#5f97a6" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 16" opacity="0"/>`).join('')}</g>`;
const LABZOOM = { origin: [940, 790], s: 1.45 };
const zoomed = p => [Math.round(LABZOOM.origin[0] + (p[0] - LABZOOM.origin[0]) * LABZOOM.s), Math.round(LABZOOM.origin[1] + (p[1] - LABZOOM.origin[1]) * LABZOOM.s)];
const film2 = {
  bg: 'lab', ask: '물이 증발하면 무엇이 남을까?', end: '바닷물에는 소금 등이 녹아 있어', accent: '소금',
  css: `#beakers{position:absolute;inset:0;width:1920px;height:1080px} #lab-veil{position:absolute;inset:0;background:rgba(255,253,245,.28)}`,
  stage: `<div id="lab-veil"></div><svg id="beakers" viewBox="0 0 1920 1080">${beaker('fresh', 640, false)}${beaker('sea', 1240, true)}</svg>`,
  tags: [
    tag({ id: 't-fresh', x: 640, y: 380, text: '육지의 물', sub: '40 mL' }),
    tag({ id: 't-seaw', x: 1240, y: 380, text: '바닷물', sub: '40 mL' }),
    tag({ id: 'f-fresh', x: 640, y: 380, text: '육지의 물' }),
    tag({ id: 'f-sea', x: 1240, y: 380, text: '바닷물' }),
    tag({ id: 't-same', x: 940, y: 930, text: '같은 양 · 같은 세기 · 같은 시간' }),
    tag({ id: 't-none', x: zoomed([640, 700])[0], y: 560, text: '거의 남지 않음', to: zoomed([640, 826]) }),
    tag({ id: 't-salt', x: zoomed([1240, 700])[0], y: 560, text: '흰 물질이 남음', to: zoomed([1240, 818]) }),
  ],
  timeline: `
      pop('t-fresh', 0.5); pop('t-seaw', 0.7);
      pop('t-same', 3.55);
      tl.to(['#fresh-coil', '#sea-coil'], { attr: { fill: '#e9784a' }, duration: 0.5, ease: 'power2.out' }, 3.8);
      tl.fromTo(['#fresh-water', '#sea-water'], { attr: { y: 610, height: 226 } }, { attr: { y: 836, height: 0 }, duration: 3.4, ease: 'power1.inOut' }, 4.2);
      tl.fromTo('.vapor', { opacity: 0 }, { opacity: 0.8, duration: 0.4, stagger: 0.12 }, 4.3);
      tl.fromTo('.vapor', { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': 200 }, duration: 3.6, ease: 'none' }, 4.3);
      tl.to('.vapor', { opacity: 0, duration: 0.4 }, 7.5);
      tl.fromTo('.salt', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.07, ease: 'back.out(2)' }, 7.0);
      tl.to(['#fresh-coil', '#sea-coil'], { attr: { fill: '#7f9196' }, duration: 0.4 }, 7.7);
      hide('t-fresh', 7.75); hide('t-seaw', 7.75); hide('t-same', 7.75);
      tl.fromTo('#cam', { x: 0, y: 0, scale: 1 }, { x: ${Math.round(LABZOOM.origin[0] * (1 - LABZOOM.s))}, y: ${Math.round(LABZOOM.origin[1] * (1 - LABZOOM.s))}, scale: ${LABZOOM.s}, duration: 0.8, ease: 'power2.inOut' }, 8.0);
      pop('t-none', 9.0); pop('t-salt', 9.5);
      hide('t-none', 11.3); hide('t-salt', 11.3);
      tl.to('#cam', { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power2.inOut' }, 11.4);
      pop('f-fresh', 12.2); pop('f-sea', 12.35);`,
  sfx: [[3.82, 'heat', 0.7], [7.05, 'scan', 0.5], [9.52, 'scan', 0.7], [11.67, 'success', 0.8]],
};

// ── 3편 해안: 게임 해안 사진(coast)과 같은 위치값(src/data.js terrains)으로 카메라가 찾아감.
const at = (px, py) => [Math.round(px / 100 * 1920), Math.round(py / 100 * 1080)];
const T = { sand: at(72, 82), cliff: at(77, 25), cave: at(90, 38), arch: at(48.5, 37) };
const S = 1.7, cams = Object.fromEntries(Object.entries(T).map(([k, p]) => [k, camera(p, S)]));
const shot = (k, t) => `tl.to('#cam', { x: ${cams[k].x}, y: ${cams[k].y}, scale: ${S}, duration: 0.55, ease: 'power2.inOut' }, ${t}); tl.set('#finder', { x: ${cams[k].at[0]}, y: ${cams[k].at[1]} }, ${t + 0.4});`;
const finder = t => `tl.fromTo('#finder', { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, ${t}); tl.to('#finder', { opacity: 0, duration: 0.2 }, ${t + 0.5});`;
const near = (k, dy) => ({ x: cams[k].at[0], y: cams[k].at[1] + dy, to: cams[k].at });
const film3 = {
  bg: 'coast', ask: '해안에는 어떤 모습의 땅이 있을까?', end: '해안에는 여러 모습의 지형이 있어', accent: '지형', endX: 760,
  css: `#finder{position:absolute;left:-260px;top:-210px;width:520px;height:420px;opacity:0;z-index:5} #finder i{position:absolute;width:90px;height:90px;border:0 solid #fffdf5}
        #finder i:nth-child(1){left:0;top:0;border-left-width:10px;border-top-width:10px} #finder i:nth-child(2){right:0;top:0;border-right-width:10px;border-top-width:10px}
        #finder i:nth-child(3){left:0;bottom:0;border-left-width:10px;border-bottom-width:10px} #finder i:nth-child(4){right:0;bottom:0;border-right-width:10px;border-bottom-width:10px}`,
  overlay: `<div id="finder"><i></i><i></i><i></i><i></i></div>`,
  tags: [
    tag({ id: 't-sand', ...near('sand', -200), text: '모래사장' }),
    tag({ id: 't-cliff', ...near('cliff', 230), text: '절벽' }),
    tag({ id: 't-cave', ...near('cave', -250), text: '동굴' }),
    tag({ id: 't-arch', ...near('arch', 250), text: '구멍 난 바위' }),
    tag({ id: 'w-sand', x: T.sand[0] - 230, y: T.sand[1] - 40, text: '모래사장', size: 36, to: T.sand }),
    tag({ id: 'w-cliff', x: T.cliff[0] - 20, y: T.cliff[1] + 150, text: '절벽', size: 36, to: T.cliff }),
    tag({ id: 'w-cave', x: T.cave[0] - 30, y: T.cave[1] + 170, text: '동굴', size: 36, to: T.cave }),
    tag({ id: 'w-arch', x: T.arch[0], y: T.arch[1] + 170, text: '구멍 난 바위', size: 36, to: T.arch }),
  ],
  timeline: `
      ${shot('sand', 3.5)} ${finder(3.95)} pop('t-sand', 4.0); hide('t-sand', 5.45);
      ${shot('cliff', 5.6)} ${finder(6.05)} pop('t-cliff', 6.1); hide('t-cliff', 7.85);
      ${shot('cave', 8.0)} ${finder(8.45)} pop('t-cave', 8.5); hide('t-cave', 9.4);
      ${shot('arch', 9.5)} ${finder(9.95)} pop('t-arch', 10.0); hide('t-arch', 11.35);
      tl.to('#cam', { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power2.inOut' }, 11.45);
      pop('w-sand', 12.3); pop('w-cliff', 12.42); pop('w-cave', 12.54); pop('w-arch', 12.66);`,
  sfx: [[3.97, 'camera', 0.7], [6.07, 'camera', 0.7], [8.47, 'camera', 0.7], [9.97, 'camera', 0.7], [11.67, 'success', 0.8]],
};

// ── 4편 밀물·썰물: 게임 관측 화면(src/screens.js tideScene, 480×270)을 4배로 그대로 옮김.
const tideH = [28, 45, 66, 83, 66, 45, 28];
const waterShift = h => -(h - 28); // SVG 단위(480×270), 화면에서는 4배
const y0 = 210 - 28;
const film4 = {
  bg: 'tide-foreshore', ask: '같은 곳의 물 높이는 늘 같을까?', end: '물이 들어오면 밀물, 빠지면 썰물', accent: '밀물', endX: 640,
  css: `#tide{position:absolute;inset:0;width:1920px;height:1080px} #clock-wrap{position:absolute;left:250px;top:300px;transform:translate(-50%,-50%);z-index:6}
        #clock{background:${C.paper};border:4px solid ${C.ink};border-radius:18px;padding:6px 26px 10px;font-size:60px;position:relative;width:236px;height:92px;opacity:0}
        #clock span{position:absolute;left:0;right:0;top:8px;text-align:center;opacity:0} #note-wrap{position:absolute;left:150px;top:920px;z-index:6}
        #note{background:${C.paper};border:3px solid ${C.ink};border-radius:14px;padding:4px 18px 6px;font-size:30px;opacity:0} .arrow{opacity:0}`,
  stage: `<svg id="tide" viewBox="0 0 480 270" preserveAspectRatio="none">
        <path d="M120 211 145 160 183 149 207 214Z" fill="#657f7e" stroke="#516f71" stroke-width="2"/><path d="m145 160 15 28 23-39m-23 39 29 12" fill="none" stroke="#8eaaa0" stroke-width="2"/>
        <rect x="319" y="69" width="21" height="163" rx="3" fill="#754d3b"/><rect x="322" y="70" width="15" height="160" rx="2" fill="#b77c4d"/><path d="M322 91h15m-15 25h15m-15 25h15m-15 25h15m-15 25h15m-15 25h15" stroke="#fff4d2" stroke-width="4"/>
        <g id="water"><path d="M0 ${y0 + 30} Q240 ${y0 - 10} 480 ${y0 + 10}V340H0Z" fill="#258caa" opacity=".84"/><path d="M0 ${y0 + 30}Q240 ${y0 - 10} 480 ${y0 + 10}" fill="none" stroke="#e1ffff" stroke-width="4"/><path d="M0 ${y0 + 39}Q240 ${y0 - 1} 480 ${y0 + 19}" fill="none" stroke="#82d0d2" stroke-width="2" opacity=".75"/>
        <g transform="translate(250 ${y0 - 12})"><path d="M-35 0H30L18 20H-22Z" fill="#f5eee0" stroke="#476978" stroke-width="2"/><path d="M-8 0V-25H8V0" fill="#294f6a"/><path d="M-26 7H23" stroke="#c48752" stroke-width="4"/></g></g>
        <g id="up" class="arrow"><path d="M88 150V96m-16 18 16-18 16 18" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g id="down" class="arrow"><path d="M88 96v54m-16-18 16 18 16-18" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
  overlay: `<div id="clock-wrap"><div id="clock">${['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((t, i) => `<span id="c${i}">${t}</span>`).join('')}</div></div>
        <div id="note-wrap"><div id="note">관측 모형 · 실제 시각과 달라요</div></div>`,
  tags: [
    tag({ id: 't-pole', x: 1318, y: 196, text: '기둥', sub: '움직이지 않는 기준', to: [1318, 290] }),
    tag({ id: 't-rock', x: 640, y: 470, text: '바위', to: [640, 610] }),
    tag({ id: 't-in', x: 560, y: 300, text: '밀물', sub: '물이 들어와 높아져' }),
    tag({ id: 't-out', x: 560, y: 300, text: '썰물', sub: '물이 빠져 낮아져' }),
  ],
  timeline: `
      tl.fromTo('#clock', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.4); tl.set('#c0', { opacity: 1 }, 0.4);
      tl.fromTo('#note', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6);
      pop('t-pole', 1.4); pop('t-rock', 1.7); hide('t-rock', 3.3);
      ${[1, 2, 3].map(i => `tl.to('#water', { y: ${waterShift(tideH[i])}, duration: 1.1, ease: 'power1.inOut' }, ${3.6 + (i - 1) * 1.15}); tl.set('#c${i - 1}', { opacity: 0 }, ${4.7 + (i - 1) * 1.15}); tl.set('#c${i}', { opacity: 1 }, ${4.7 + (i - 1) * 1.15});`).join('\n      ')}
      tl.fromTo('#up', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 4.0); pop('t-in', 4.3);
      hide('t-in', 7.8); tl.to('#up', { opacity: 0, duration: 0.2 }, 7.8);
      ${[4, 5, 6].map(i => `tl.to('#water', { y: ${waterShift(tideH[i])}, duration: 1.0, ease: 'power1.inOut' }, ${8.1 + (i - 4) * 1.05}); tl.set('#c${i - 1}', { opacity: 0 }, ${9.1 + (i - 4) * 1.05}); tl.set('#c${i}', { opacity: 1 }, ${9.1 + (i - 4) * 1.05});`).join('\n      ')}
      tl.fromTo('#down', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 8.4); pop('t-out', 8.7);
      hide('t-out', 11.3); tl.to('#down', { opacity: 0, duration: 0.2 }, 11.3);`,
  sfx: [[4.32, 'scan', 0.6], [8.72, 'scan', 0.6], [11.67, 'success', 0.8]],
};

// ── 5편 갯벌: 게임 도감 그림(게·짱뚱어·갈대)을 갯벌 그림의 같은 자리(src/data.js creatures)에.
const P5 = { crab: at(24, 62), skipper: at(57, 73), reed: at(79, 39) };
const film5 = {
  bg: 'mudflat', ask: '갯벌에는 무엇이 살고 있을까?', end: '갯벌은 생물의 집이야', accent: '생물의 집', endSub: '흔적을 지키며 살펴봐요', endX: 760,
  css: `.critter{position:absolute;opacity:0} #crab{left:${P5.crab[0] - 150}px;top:${P5.crab[1] - 110}px;width:300px;transform-origin:50% 100%}
        #skipper{left:${P5.skipper[0] - 200}px;top:${P5.skipper[1] - 100}px;width:400px} #reed{left:${P5.reed[0] - 110}px;top:${P5.reed[1] - 250}px;height:340px;transform-origin:50% 100%}
        #traces{position:absolute;inset:0;width:1920px;height:1080px} #traces .tr{opacity:0}`,
  stage: `<svg id="traces" viewBox="0 0 1920 1080">
        ${[[-40, 40], [10, 52], [52, 36]].map(([dx, dy], i) => `<ellipse class="tr hole" cx="${P5.crab[0] + dx}" cy="${P5.crab[1] + dy}" rx="${16 - i * 2}" ry="8" fill="#3d3326" opacity="0"/>`).join('')}
        ${Array.from({ length: 6 }, (_, i) => `<path class="tr step" d="M${P5.crab[0] + 110 + i * 34} ${P5.crab[1] + 70 + (i % 2) * 14}l10 -6m-10 6l10 6" stroke="#4a3d2c" stroke-width="5" stroke-linecap="round" fill="none"/>`).join('')}
        <ellipse id="ring1" class="tr" cx="${P5.skipper[0]}" cy="${P5.skipper[1] + 50}" rx="90" ry="22" fill="none" stroke="#e8fbff" stroke-width="6"/>
        <ellipse id="ring2" class="tr" cx="${P5.skipper[0]}" cy="${P5.skipper[1] + 50}" rx="150" ry="36" fill="none" stroke="#e8fbff" stroke-width="4"/></svg>
        <img id="crab" class="critter" src="assets/img/crab.webp" alt="" /><img id="skipper" class="critter" src="assets/img/skipper.webp" alt="" /><img id="reed" class="critter" src="assets/img/reed.webp" alt="" />`,
  tags: [
    tag({ id: 't-trace', x: P5.crab[0] + 200, y: P5.crab[1] + 200, text: '구멍과 발자국', to: [P5.crab[0] + 150, P5.crab[1] + 82] }),
    tag({ id: 't-crab', x: P5.crab[0], y: P5.crab[1] - 220, text: '게', sub: '집게와 여러 다리' }),
    tag({ id: 't-skip', x: P5.skipper[0] + 30, y: P5.skipper[1] - 200, text: '짱뚱어', sub: '위로 솟은 눈' }),
    tag({ id: 't-reed', x: P5.reed[0] - 340, y: P5.reed[1] - 60, text: '갈대', sub: '진흙에 뿌리를 내려', to: [P5.reed[0] - 30, P5.reed[1] + 60] }),
  ],
  timeline: `
      tl.fromTo('.hole', { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.12, ease: 'back.out(2)' }, 3.6);
      tl.fromTo('.step', { opacity: 0 }, { opacity: 1, duration: 0.12, stagger: 0.08 }, 3.9);
      pop('t-trace', 4.0); hide('t-trace', 5.0);
      tl.fromTo('#crab', { opacity: 0, y: 70, scale: 0.75 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }, 4.6);
      pop('t-crab', 5.15);
      tl.fromTo('#ring1', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 0.9, scale: 1, duration: 0.4, ease: 'power2.out' }, 5.7);
      tl.fromTo('#ring2', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 0.7, scale: 1, duration: 0.55, ease: 'power2.out' }, 5.8);
      tl.to(['#ring1', '#ring2'], { opacity: 0, duration: 0.4 }, 6.5);
      tl.fromTo('#skipper', { opacity: 0, x: 180 }, { opacity: 1, x: 0, duration: 0.6, ease: 'none' }, 5.95);
      tl.fromTo('#skipper', { y: 40 }, { y: -90, duration: 0.3, ease: 'power2.out' }, 5.95);
      tl.to('#skipper', { y: 0, duration: 0.3, ease: 'power2.in' }, 6.25);
      tl.to('#skipper', { scaleY: 0.9, duration: 0.08, transformOrigin: '50% 100%' }, 6.55); tl.to('#skipper', { scaleY: 1, duration: 0.25, ease: 'back.out(2)' }, 6.63);
      pop('t-skip', 6.8);
      tl.fromTo('#reed', { opacity: 0, scaleY: 0.1 }, { opacity: 1, scaleY: 1, duration: 0.9, ease: 'power2.out' }, 8.1);
      pop('t-reed', 9.1);`,
  sfx: [[3.62, 'drop', 0.5], [4.62, 'scan', 0.6], [5.97, 'drop', 0.6], [8.12, 'scan', 0.5], [11.67, 'success', 0.8]],
};

export const films = { 1: film1, 2: film2, 3: film3, 4: film4, 5: film5 };
