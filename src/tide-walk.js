import * as THREE from 'three';
import './tide-walk.css';
import { asset, creatures, tideHeight } from './data.js';
import { illustration } from './illustrations.js';
import { icon } from './icons.js';
import { bindDirectionPad, mapKeyDirection, MAP_VECTORS } from './map-controls.js';
import { course, SLOT_SECONDS, WALK_LAST_SLOT, WALK_WARN_SLOT, WALK_NOTE, WALK_SAFETY, MUD_TOP, MUD_SLOPE, walkHeight, walkClock, mudY, waterY, spotCovered, warned } from './tide-walk-rules.js';

// 3D 탐사길 걷기. 무대·캐릭터·입력·겹침 화면만 맡고, 물 높이와 판정은 tide-walk-rules.js와 기존 문제 판정이 정한다.
// 걷기만 있다. 캐릭터는 난간 안쪽의 데크와 탐사길 위로만 다닌다.
const SPEED = 3.6, REACH = 1.9, WALK_FPS = 9;
const run3 = name => illustration(`run-stage/${name}`);
// 생성해서 넣은 그림만 적는다. 여기 없는 것은 기본 도형과 기존 그림으로 보인다.
const READY = new Set(['backdrop', 'prop-cordgrass', 'prop-seablite', 'prop-rocks', 'prop-pine', 'prop-gull', 'prop-shells']);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const modelSlots = [0, 1, 2, 3];
// 탐사길 윗면(높이 0)에 해당하는 물 높이 눈금. 물 높이 표시의 맨 위 기준이다.
const pathLevel = tideHeight(0) + (0 - waterY(tideHeight(0))) / (waterY(tideHeight(WALK_LAST_SLOT)) - waterY(tideHeight(0))) * (tideHeight(WALK_LAST_SLOT) - tideHeight(0));
// 가장 낮은 물(06:00)도 막대로 보이도록 0부터 탐사길 높이까지를 한 칸으로 잡는다.
const gaugePercent = height => clamp(height / pathLevel * 100, 0, 100);
const spotNames = Object.fromEntries(creatures.map(c => [c.id, c]));
const zones = [course.deck, course.path, course.end];
const lane = course.path.z - 0.36;
const friends = Object.values(course.friends);
const canStand = (x, z) => !friends.some(friend => Math.hypot(x - friend.x, z - friend.z) < 0.85) && zones.some(zone => x >= zone.x0 - 0.001 && x <= zone.x1 + 0.001 && z <= zone.z - 0.35 && z >= -(zone.back ?? zone.z - 0.35)) && x >= course.deck.x0 + 0.4 && x <= course.end.x1 - 0.4;

const arrow = rotate => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="transform:rotate(${rotate}deg)"><path d="M12 4 21 17H3z" fill="currentColor"/></svg>`;
const padButton = (dir, label, rotate) => `<button type="button" class="tw-pad-${dir}" data-dir="${dir}" aria-label="${label}">${arrow(rotate)}</button>`;

function hud() {
  return `<div class="tw-stage"><canvas aria-hidden="true"></canvas></div>
<div class="tw-top">
  <div class="tw-instruments">
    <div class="tw-clock"><span>관측 시각</span><b data-tw="clock">06:00</b></div>
    <div class="tw-gauge" role="img" data-tw="gauge" aria-label="물 높이" style="--tw-warn:${gaugePercent(tideHeight(WALK_WARN_SLOT)).toFixed(1)}%"><span class="tw-gauge-bar"><i data-tw="level"></i><em class="tw-gauge-warn"></em></span><span class="tw-gauge-labels"><small>탐사길</small><small class="warn">경고 눈금</small><small>물 높이</small></span></div>
  </div>
  <div class="tw-guide"><p data-tw="guide" role="status"></p><ul class="tw-seen" aria-label="살펴본 생물">${course.spots.map(s => `<li data-seen="${s.id}">${esc(spotNames[s.id].name)}</li>`).join('')}</ul></div>
  <div class="tw-tools"><button type="button" class="tw-flat" data-tw-action="flat">기존 방식으로 하기</button><button type="button" class="tw-exit" data-tw-action="exit" aria-label="탐사길 나가기">${icon('close')}</button></div>
</div>
<div class="tw-pad" role="group" aria-label="이동">${padButton('up', '위로 걷기', 0)}${padButton('left', '왼쪽으로 걷기', -90)}${padButton('right', '오른쪽으로 걷기', 90)}${padButton('down', '아래로 걷기', 180)}</div>
<button type="button" class="tw-action" data-tw-action="look" disabled><span data-tw="action">살펴보기</span></button>
<p class="tw-note">${esc(WALK_NOTE)}</p>
<p class="tw-speech" data-tw="speech" hidden></p>
<div class="tw-card" data-tw="card" role="dialog" aria-modal="false" aria-labelledby="tw-card-title" hidden></div>`;
}

function boardChart() {
  const bars = modelSlots.map(slot => `<li><span style="height:${gaugePercent(tideHeight(slot))}%"></span><b>${walkClock(slot)}</b></li>`).join('');
  return `<div class="tw-chart" role="img" aria-label="06:00부터 12:00까지 물 높이가 점점 높아지는 물때 그림. 10:00에 경고 눈금에 닿아요."><ol>${bars}</ol><i class="tw-chart-warn" style="bottom:calc(28px + (100% - 28px) * ${gaugePercent(tideHeight(WALK_WARN_SLOT)) / 100})"><em>경고 눈금</em></i></div>`;
}

/** 무대: 기본 도형으로 길·갯벌·물을 만들고, 생성한 그림은 불러와지는 대로 입힌다. */
function buildStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.5, 240);
  scene.add(new THREE.HemisphereLight('#f6fbff', '#8d8272', 2.3));
  const sun = new THREE.DirectionalLight('#fff2d2', 1.5); sun.position.set(-8, 14, 10); scene.add(sun);
  const loader = new THREE.TextureLoader(), textures = new Set();
  let disposed = false;
  const load = (url, onLoad) => loader.load(url, texture => { if (disposed) { texture.dispose(); return; } texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture); onLoad(texture); }, undefined, () => {});
  const art = (name, onLoad) => { if (READY.has(name)) load(run3(name), onLoad); };
  const tile = (material, name, repeatX, repeatY) => art(name, texture => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeatX, repeatY); material.map = texture; material.color.set('#ffffff'); material.needsUpdate = true; });
  const lambert = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });
  const add = (geometry, material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); scene.add(mesh); return mesh; };
  const box = (w, h, d, material, x, y, z) => add(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const flat = (w, d) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);

  // 원경: 하늘과 먼 바다. 그림이 오기 전에는 색 띠로 보인다.
  const sky = document.createElement('canvas'); sky.width = 8; sky.height = 256;
  const skyCtx = sky.getContext('2d'), gradient = skyCtx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#6fbdea'); gradient.addColorStop(0.62, '#e6f6f7'); gradient.addColorStop(0.64, '#74bcd4'); gradient.addColorStop(1, '#5aa9c6');
  skyCtx.fillStyle = gradient; skyCtx.fillRect(0, 0, 8, 256);
  const skyTexture = new THREE.CanvasTexture(sky); skyTexture.colorSpace = THREE.SRGBColorSpace; textures.add(skyTexture);
  const backdropMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, fog: false });
  const backdrop = add(new THREE.PlaneGeometry(150, 42), backdropMaterial, 15, 9.8, -62);
  // 그림을 좌우로 뒤집어 한 번 더 이어 붙여 넓은 원경을 채운다. 수평선(그림 높이의 63%)은 카메라 눈높이에 맞춘다.
  art('backdrop', texture => { texture.wrapS = THREE.MirroredRepeatWrapping; texture.repeat.x = 2; backdrop.scale.x = 2 * texture.image.width / texture.image.height * 42 / 150; backdropMaterial.map = texture; backdropMaterial.needsUpdate = true; });

  // 갯벌 바닥은 바다 쪽(+x)으로 낮아지는 비탈이다. 높이는 규칙의 mudY와 같다.
  const mudGeometry = flat(150, 96), mudPosition = mudGeometry.attributes.position;
  for (let i = 0; i < mudPosition.count; i++) { const x = mudPosition.getX(i) + 45; mudPosition.setX(i, x); mudPosition.setY(i, MUD_TOP - MUD_SLOPE * x); }
  mudGeometry.computeVertexNormals();
  const mudMaterial = lambert('#8f8478'); add(mudGeometry, mudMaterial, 0, 0, -16); tile(mudMaterial, 'mud', 19, 12);
  // 물은 수평면이고, 높이만 물 높이 눈금을 따라 오른다.
  const waterMaterial = new THREE.MeshLambertMaterial({ color: '#3f9fc2', transparent: true, opacity: 0.8, depthWrite: false });
  const water = add(flat(190, 96), waterMaterial, 35, waterY(tideHeight(0)), -16); water.renderOrder = 1; tile(waterMaterial, 'water', 14, 7);
  // 해안 둑과 풀밭.
  const grassMaterial = lambert('#9fc47c'); box(60, 6, 96, grassMaterial, -30.3, -3.04, -16); tile(grassMaterial, 'grass', 10, 16);
  box(0.6, 3.2, 96, lambert('#b7ae9f'), -0.3, -1.62, -16);

  // 데크와 탐사길. 윗면 높이가 0이다.
  const plankMaterial = lambert('#c99a61'), woodMaterial = lambert('#8f6a43'), railMaterial = lambert('#a57c4f');
  tile(plankMaterial, 'planks', 1, 1);
  const planks = (zone, repeat) => { const mesh = box(zone.x1 - zone.x0, 0.16, zone.z * 2, plankMaterial, (zone.x0 + zone.x1) / 2, -0.08, 0); const uv = mesh.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repeat, uv.getY(i) * Math.max(1, Math.round(zone.z))); return mesh; };
  planks(course.deck, 3); planks(course.path, 12); planks(course.end, 1.5);
  const rail = (x0, x1, z, y) => box(x1 - x0, 0.09, 0.09, railMaterial, (x0 + x1) / 2, y, z);
  const railZ = (z0, z1, x, y) => box(0.09, 0.09, z1 - z0, railMaterial, x, y, (z0 + z1) / 2);
  const posts = [];
  const post = (x, z) => posts.push([x, z]);
  for (let x = course.path.x0; x <= course.path.x1; x += 3) { post(x, -course.path.z); post(x, course.path.z); }
  for (const z of [-course.end.z, course.end.z]) { post(course.end.x0 + 0.1, z); post(course.end.x1, z); }
  post(course.end.x1, 0);
  for (const y of [0.92, 0.5]) {
    rail(course.path.x0, course.path.x1, -course.path.z, y); rail(course.path.x0, course.path.x1, course.path.z, y);
    rail(course.end.x0, course.end.x1, -course.end.z, y); rail(course.end.x0, course.end.x1, course.end.z, y);
    railZ(-course.end.z, course.end.z, course.end.x1, y);
    railZ(-course.end.z, -course.path.z, course.end.x0, y); railZ(course.path.z, course.end.z, course.end.x0, y);
    rail(course.deck.x0, course.deck.x1, -course.deck.z, y); railZ(-course.deck.z, course.deck.z, course.deck.x0, y);
    railZ(-course.deck.z, -course.path.z, course.deck.x1, y); railZ(course.path.z, course.deck.z, course.deck.x1, y);
  }
  for (let x = course.deck.x0; x <= course.deck.x1; x += 3.5) box(0.2, 1, 0.2, woodMaterial, x, 0.47, -course.deck.z);
  box(0.2, 1, 0.2, woodMaterial, course.deck.x0, 0.47, course.deck.z); box(0.2, 1, 0.2, woodMaterial, course.deck.x1, 0.47, course.deck.z);
  const unit = new THREE.BoxGeometry(1, 1, 1), matrix = new THREE.Matrix4();
  const postMesh = new THREE.InstancedMesh(unit, woodMaterial, posts.length);
  // 기둥 눈금은 모형의 네 물 높이(06·08·10·12시)에 코드로 그린다. 10:00 높이는 주황 경고 눈금이다.
  const marks = [], warns = [];
  posts.forEach(([x, z], i) => {
    const bottom = mudY(x) - 0.5, height = 0.97 - bottom;
    postMesh.setMatrixAt(i, matrix.makeScale(0.22, height, 0.22).setPosition(x, bottom + height / 2, z));
    for (const slot of modelSlots) { const y = waterY(tideHeight(slot)); if (y > mudY(x) + 0.04) (slot === WALK_WARN_SLOT ? warns : marks).push([x, y, z + 0.115]); }
  });
  scene.add(postMesh);
  const markMaterial = new THREE.MeshBasicMaterial({ color: '#fff7df' }), warnMaterial = new THREE.MeshBasicMaterial({ color: '#ff8a3d' });
  const instanced = (list, material, height) => { if (!list.length) return; const mesh = new THREE.InstancedMesh(unit, material, list.length); list.forEach(([x, y, z], i) => mesh.setMatrixAt(i, matrix.makeScale(0.25, height, 0.02).setPosition(x, y, z))); scene.add(mesh); };
  instanced(marks, markMaterial, 0.05); instanced(warns, warnMaterial, 0.13);

  // 세운 그림: 캐릭터, 생물, 물때 안내판.
  // 세운 그림은 가장자리를 오려 깊이를 쓰고 물보다 먼저 그린다. 그래야 물에 잠긴 아랫부분이 수면 아래로 보이고, 난간·기둥과 앞뒤가 맞는다.
  const sprite = (height, x, y, z) => { const item = new THREE.Sprite(new THREE.SpriteMaterial({ alphaTest: 0.5, alphaToCoverage: true })); item.center.set(0.5, 0); item.position.set(x, y, z); item.visible = false; item.userData.height = height; scene.add(item); return item; };
  const still = (url, height, x, y, z) => { const item = sprite(height, x, y, z); load(url, texture => { item.material.map = texture; item.material.needsUpdate = true; item.scale.set(height * texture.image.width / texture.image.height, height, 1); item.visible = true; }); return item; };
  const spots = course.spots.map(spot => ({
    ...spot,
    // 탐사길과 부리에 가리지 않도록 표시의 오른쪽 뒤 갯벌에 둔다. 살펴볼 수 있는 자리도 생물의 왼쪽까지만이다. 갈대는 키가 커서 난간 바로 뒤에 선다.
    artX: spot.x + 2.6,
    art: still(illustration(spot.id), { reed: 2.8, crab: 1.45, skipper: 1.35 }[spot.id], spot.x + 2.6, mudY(spot.x + 2.6) - 0.04, spot.tall ? -3.1 : -5.2),
    // 생물이 갯벌 색에 묻히지 않게 밝은 젖은 모래 자리를 깐다.
    patch: spot.tall ? null : add(new THREE.CircleGeometry(1.25, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#d8cfb6', transparent: true, opacity: 0.6, depthWrite: false }), spot.x + 2.6, mudY(spot.x + 2.6) + 0.03, -5.0),
    ring: add(new THREE.RingGeometry(0.5, 0.72, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.95 }), spot.x, 0.012, -0.25),
  }));
  const boardRing = add(new THREE.RingGeometry(0.5, 0.72, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.95 }), course.board.x, 0.012, -1.5);
  // 물때 안내판의 막대는 tideHeight 값으로 그린다.
  const sign = document.createElement('canvas'); sign.width = 512; sign.height = 320;
  const signTexture = new THREE.CanvasTexture(sign); signTexture.colorSpace = THREE.SRGBColorSpace; textures.add(signTexture);
  function drawSign() {
    const c = sign.getContext('2d'); c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 512, 320); c.strokeStyle = '#7a5a36'; c.lineWidth = 14; c.strokeRect(7, 7, 498, 306);
    c.textAlign = 'center'; c.fillStyle = '#173f4b'; c.font = '800 34px NanumSquareNeo, sans-serif'; c.fillText('물때 안내판', 256, 58);
    modelSlots.forEach((slot, i) => { const h = gaugePercent(tideHeight(slot)) * 1.7, x = 70 + i * 104; c.fillStyle = '#3f9fc2'; c.fillRect(x, 262 - h, 60, h); c.fillStyle = '#173f4b'; c.font = '700 24px NanumSquareNeo, sans-serif'; c.fillText(walkClock(slot), x + 30, 294); });
    const warnY = 262 - gaugePercent(tideHeight(WALK_WARN_SLOT)) * 1.7; c.strokeStyle = '#ff8a3d'; c.lineWidth = 6; c.setLineDash([16, 10]); c.beginPath(); c.moveTo(46, warnY); c.lineTo(466, warnY); c.stroke(); c.setLineDash([]);
    signTexture.needsUpdate = true;
  }
  drawSign(); document.fonts?.load?.('800 34px NanumSquareNeo').then(() => { if (!disposed) drawSign(); }).catch(() => {});
  add(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: signTexture }), course.board.x, 1.72, -2.82);
  box(0.14, 2.4, 0.14, woodMaterial, course.board.x - 1, 1.2, -2.9); box(0.14, 2.4, 0.14, woodMaterial, course.board.x + 1, 1.2, -2.9);

  // 소품: 갯벌과 데크를 꾸미는 세운 그림. 갯벌 위의 것은 물이 들어오면 아래부터 잠긴다.
  const ground = x => x < 0 ? -0.05 : mudY(x);
  const propSets = {};
  const prop = (name, x, z, height, y = ground(x)) => { const item = sprite(height, x, y, z); (propSets[name] ??= []).push(item); return item; };
  const place = (name, height, spots) => { for (const [x, z] of spots) prop(name, x, z, height); };
  place('prop-pine', 4.6, [[-13.5, -9.5], [-4.5, -12], [-18, -5.5]]);
  place('prop-hut', 4.2, [[-10.2, -6.4]]); place('prop-bench', 0.95, [[-12.6, -3.2]]);
  place('prop-cordgrass', 1.6, [[2.2, -5.2], [4.6, -8.4], [9.4, -6.6], [1.6, -11.5], [12.5, -11]]);
  // 관찰 지점의 생물(표시 오른쪽 뒤)을 가리지 않게 그 둘레는 비워 둔다. 길 앞쪽 소품은 낮은 것만 길 가까이에 둔다.
  place('prop-seablite', 0.75, [[3.4, -4.4], [12, -7.2], [14.2, -4.3], [22.6, -9.4], [24.4, -5.6], [33.5, -6.5], [9.5, 2.9], [20.5, 3.2], [27.5, 2.8]]);
  place('prop-rocks', 0.95, [[10.6, -10], [22.2, -7], [32, -9.5], [36, -12.5], [14.5, 3.3]]);
  place('prop-shells', 0.42, [[13.2, -3.7], [23.6, -3.5], [31.6, -3.6], [24.5, 2.7]]);
  place('prop-gull', 1.35, [[11.4, -12.5], [35.6, -4.6]]);
  prop('prop-lifebuoy', -2.7, -3.0, 1.6, 0); prop('prop-lantern', -6.75, -3.0, 2.1, 0); prop('prop-crate', -0.55, -2.95, 0.8, 0); prop('prop-telescope', course.end.x1 - 0.45, -1.95, 1.5, 0);
  const fill = name => texture => { for (const item of propSets[name]) { item.material.map = texture; item.material.needsUpdate = true; item.scale.set(item.userData.height * texture.image.width / texture.image.height, item.userData.height, 1); item.visible = true; } };
  for (const name of Object.keys(propSets)) art(name, fill(name));
  // 먼 바위와 배는 기존 그림을 다시 쓴다. 배는 물에 떠 있어서 수면과 함께 오르내린다.
  still(illustration('tide-rock'), 2.2, 39, mudY(39) - 0.1, -13);
  const boat = still(illustration('tide-boat'), 2.6, 52, waterY(tideHeight(0)), -19);
  const blob = (x, z, radius) => { const mesh = add(new THREE.CircleGeometry(radius, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#12303a', transparent: true, opacity: 0.2, depthWrite: false }), x, 0.014, z); mesh.renderOrder = 2; return mesh; };
  const moa = sprite(1.55, course.friends.moa.x, 0, course.friends.moa.z), jjang = still(illustration('jjang'), 1.25, course.friends.jjang.x, 0, course.friends.jjang.z);
  blob(course.friends.moa.x, course.friends.moa.z, 0.45); blob(course.friends.jjang.x, course.friends.jjang.z + 0.1, 0.55);
  const shadow = add(new THREE.CircleGeometry(0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#12303a', transparent: true, opacity: 0.24, depthWrite: false }), 0, 0.014, 0); shadow.renderOrder = 2;
  const hero = sprite(1.85, 0, 0, 0);
  // 동작 띠: 한 줄에 같은 크기의 칸. 띠가 아직 없으면 기존 그림 한 장으로 선다.
  const strips = {};
  const cut = (owner, name, frames) => texture => { texture.repeat.set(1 / frames, 1); strips[owner + name] = { texture, frames, aspect: texture.image.width / frames / texture.image.height }; };
  load(illustration('buri'), cut('hero', 'idle', 1)); load(asset('moa'), cut('moa', 'idle', 1));
  art('buri-walk', cut('hero', 'walk', 6)); art('buri-look', cut('hero', 'look', 6)); art('buri-cheer', cut('hero', 'cheer', 6)); art('moa-call', cut('moa', 'call', 6));
  function pose(item, owner, name, frame, mirrored) {
    const set = strips[owner + name] ?? strips[owner + 'idle']; if (!set) return false;
    const index = Math.floor(frame) % set.frames;
    if (item.material.map !== set.texture) { item.material.map = set.texture; item.material.needsUpdate = true; }
    set.texture.repeat.x = (mirrored ? -1 : 1) / set.frames; set.texture.offset.x = (index + (mirrored ? 1 : 0)) / set.frames;
    item.scale.set(item.userData.height * set.aspect, item.userData.height, 1); item.visible = true;
    return strips[owner + name] !== undefined;
  }

  const view = { aspect: 1, x: 0 };
  function resize(width, height) { if (!width || !height) return; renderer.setSize(width, height, false); view.aspect = width / height; camera.aspect = view.aspect; camera.updateProjectionMatrix(); }
  function frame(state, time) {
    water.position.y = waterY(walkHeight(state.slots)); boat.position.y = water.position.y - 0.12 + Math.sin(time * 1.3) * 0.04;
    if (waterMaterial.map) waterMaterial.map.offset.set(time * 0.012, Math.sin(time * 0.4) * 0.01);
    const walkingNow = state.moving && state.pose === 'walk';
    const animated = pose(hero, 'hero', walkingNow ? 'walk' : state.pose === 'walk' ? 'idle' : state.pose, state.pose === 'walk' ? time * WALK_FPS : time * 5, state.face < 0);
    hero.position.set(state.x, walkingNow && !animated ? Math.abs(Math.sin(time * 9)) * 0.09 : 0, state.z);
    shadow.position.set(state.x, 0.014, state.z);
    pose(moa, 'moa', state.calling ? 'call' : 'idle', time * 6, false);
    for (const spot of spots) {
      const covered = spotCovered(spot, state.slots), seen = state.seen.has(spot.id);
      spot.art.visible = !covered && !!spot.art.material.map;
      // 게는 옆으로 조금씩 걷고, 짱뚱어는 갯벌 위에서 폴짝인다.
      if (spot.id === 'crab') spot.art.position.x = spot.artX + Math.sin(time * 1.1) * 0.35;
      if (spot.id === 'skipper') spot.art.position.y = mudY(spot.artX) - 0.04 + Math.max(0, Math.sin(time * 2.2)) * 0.07;
      if (spot.patch) spot.patch.visible = !covered;
      spot.ring.material.color.set(seen ? '#7ed6a5' : covered ? '#b9c2c4' : '#ffd166');
      spot.ring.scale.setScalar(seen || covered ? 1 : 1 + Math.sin(time * 4) * 0.08);
    }
    boardRing.material.color.set(state.checkedBoard ? '#7ed6a5' : '#ffd166'); boardRing.scale.setScalar(state.checkedBoard ? 1 : 1 + Math.sin(time * 4) * 0.08);
    // 고정 시점: 옆에서 비스듬히 내려다보며 따라간다. 화면 위쪽은 항상 탐사길 안쪽(-z)이다.
    const target = clamp(state.x + 1.2, -2.2, 29.5); view.x += (target - view.x) * (state.snap ? 1 : 0.08);
    // 수평선이 화면 위에서 3분의 1쯤에 오도록 살짝만 내려다본다. 하늘과 섬이 보이고 탐사길은 화면 가운데 아래에 온다.
    const distance = 15 * Math.max(1, 1.3 / view.aspect);
    camera.position.set(view.x, distance * 0.293, distance); camera.lookAt(view.x, distance * 0.144, 0);
    backdrop.position.set(view.x * 0.9 + 12, camera.position.y + 5.4, -62);
    renderer.render(scene, camera);
  }
  function dispose() {
    disposed = true;
    scene.traverse(object => { object.geometry?.dispose?.(); for (const material of [].concat(object.material ?? [])) material.dispose?.(); });
    for (const texture of textures) texture.dispose();
    renderer.dispose();
  }
  return { resize, frame, dispose };
}

/** 전체 화면 걷기 창을 연다. 끝나면 onJudge로 판정을 받고, 닫히면 onClosed를 부른다. */
export function mountTideWalk({ planLabel = '', sound = () => {}, onJudge, onClosed }) {
  const dialog = document.createElement('dialog'); dialog.className = 'tide-walk'; dialog.setAttribute('aria-label', '갯벌 탐사길 걷기'); dialog.tabIndex = -1;
  dialog.innerHTML = hud(); document.body.append(dialog);
  const canvas = dialog.querySelector('canvas');
  let stage;
  try { stage = buildStage(canvas); } catch (error) { dialog.remove(); throw error; }
  const part = name => dialog.querySelector(`[data-tw="${name}"]`);
  const guide = part('guide'), clock = part('clock'), level = part('level'), gauge = part('gauge'), action = dialog.querySelector('.tw-action'), actionLabel = part('action'), card = part('card'), speech = part('speech');
  const abort = new AbortController(), on = (target, type, fn, options) => target.addEventListener(type, fn, { signal: abort.signal, ...options });
  let state, raf = 0, last = 0, closed = false, cardTimer = 0, cardDone = null, nudge = null, padDirection = null, near = null, speechTimer = 0;
  const keys = new Map();

  function reset(message) {
    state = { slots: 0, x: course.start.x, z: course.start.z, face: 1, maxX: course.start.x, checkedBoard: false, seen: new Set(), mode: 'walk', pose: 'walk', moving: false, calling: false, snap: true };
    dialog.querySelectorAll('[data-seen]').forEach(item => item.classList.remove('is-seen'));
    hideCard(); say(''); setGuide(message || '노란 표시 앞에서 「살펴보기」를 눌러요. 갯벌 생물을 살펴보고 안전하게 데크로 돌아와요.');
    dialog.focus({ preventScroll: true });
  }
  const setGuide = text => { if (guide.textContent !== text) guide.textContent = text; };
  function say(text, hold = 0) { clearTimeout(speechTimer); speech.hidden = !text; speech.textContent = text ? `모아: ${text}` : ''; if (text && hold) speechTimer = setTimeout(() => say(''), hold); }
  function hideCard() { clearTimeout(cardTimer); card.hidden = true; card.innerHTML = ''; cardDone = null; }
  function showCard(html, { autoClose = 0, done = null, className = '' } = {}) {
    clearTimeout(cardTimer); card.className = `tw-card ${className}`; card.innerHTML = html; card.hidden = false; cardDone = done;
    card.querySelector('button')?.focus({ preventScroll: true });
    if (autoClose) cardTimer = setTimeout(closeCard, autoClose);
  }
  function closeCard() { const done = cardDone; hideCard(); if (state.mode === 'card') { state.mode = 'walk'; state.pose = 'walk'; } dialog.focus({ preventScroll: true }); done?.(); }

  function lookAt(target) {
    if (state.mode !== 'walk' || !target) return;
    keys.clear(); nudge = null; state.moving = false;
    if (target.id === 'board') {
      state.checkedBoard = true; state.mode = 'card'; state.pose = 'look'; sound('scan');
      showCard(`<h2 id="tw-card-title">물때 안내판</h2>${boardChart()}<p>06:00에 물이 가장 낮고, 12:00까지 물이 점점 들어와요. 기둥의 <b class="tw-warn-word">경고 눈금</b>에 물이 닿기 전에 데크로 돌아와요.</p><p class="tw-card-note">${esc(WALK_NOTE)}</p><button type="button" class="primary" data-tw-action="card-close">확인했어요</button>`, { className: 'tw-board-card' });
      return;
    }
    if (spotCovered(target, state.slots)) { setGuide('물에 잠겨서 지금은 볼 수 없어요. 물이 낮을 때 갯벌이 드러나요.'); sound('retry'); return; }
    const creature = spotNames[target.id], fresh = !state.seen.has(target.id);
    state.seen.add(target.id); dialog.querySelector(`[data-seen="${target.id}"]`)?.classList.add('is-seen');
    state.mode = 'card'; state.pose = 'look'; state.face = 1; sound('scan');
    showCard(`<img src="${illustration(target.id)}" alt=""><div><h2 id="tw-card-title">${esc(creature.name)}</h2><p>${esc(creature.feature)}요.</p><p class="tw-card-note">탐사길에서 눈으로만 살펴봐요.</p></div>`, { autoClose: 3200, className: 'tw-spot-card', done: () => { if (fresh) setGuide(state.seen.size === course.spots.length ? '세 생물을 모두 살펴봤어요. 시계와 기둥의 물 높이를 보고 돌아갈 때를 정해요.' : '다른 생물도 살펴봐요. 물이 들어오면 먼 곳부터 잠겨요.'); } });
  }

  function finish(calledBack) {
    state.mode = 'done'; state.moving = false; state.calling = false; say('');
    const log = { checkedBoard: state.checkedBoard, calledBack, slots: state.slots, seen: [...state.seen] };
    const result = onJudge(log);
    if (!result) { close('exit'); return; }
    state.pose = result.correct ? 'cheer' : 'walk';
    const rows = `<dl class="tw-compare"><div><dt>내 예상</dt><dd>${esc(result.plan || planLabel)}에 돌아오기</dd></div><div><dt>실제</dt><dd>${calledBack ? `${walkClock(state.slots)} · 모아가 불러서 돌아왔어요` : `${walkClock(state.slots)}에 데크로 돌아왔어요`}</dd></div><div><dt>살펴본 생물</dt><dd>${state.seen.size} / ${course.spots.length}</dd></div></dl>`;
    if (result.correct) showCard(`<h2 id="tw-card-title">안전하게 돌아왔어요!</h2>${rows}<p class="tw-why"><span>핵심 개념</span>${esc(result.why)}</p><p class="tw-card-note">${esc(WALK_SAFETY)}</p><button type="button" class="primary" data-tw-action="done">확인</button>`, { className: 'tw-result-card good' });
    else showCard(`<h2 id="tw-card-title">다시 살펴봐요</h2>${rows}<p class="tw-why"><span>모아의 도움말</span>${esc(result.hint)}</p>${result.offerFlat ? '<p class="tw-card-note">어려우면 기존 방식으로 풀어도 좋아요.</p>' : ''}<div class="tw-card-actions"><button type="button" class="primary" data-tw-action="retry">다시 걸어 보기</button><button type="button" class="${result.offerFlat ? 'primary' : 'secondary'}" data-tw-action="flat">기존 방식으로 하기</button></div>`, { className: 'tw-result-card' });
  }

  function step(dt, time) {
    if (state.mode === 'walk') {
      const before = state.slots; state.slots = Math.min(WALK_LAST_SLOT, state.slots + dt / SLOT_SECONDS);
      // 재촉하는 숫자 대신, 물이 들어오는 것을 시계와 기둥 눈금으로 보게 한다.
      if (before < 1 && state.slots >= 1) setGuide('08:00 · 물이 들어오고 있어요. 기둥에 닿는 물 높이를 살펴봐요.');
      const held = padDirection ?? [...keys.values()].at(-1) ?? nudge?.direction, vector = held ? MAP_VECTORS[held] : null;
      state.moving = false;
      if (vector) {
        // 화면 기준 입력: 오른쪽은 바다 쪽(+x), 위쪽은 탐사길 안쪽(-z).
        const dx = vector.x * SPEED * dt, dz = vector.y * SPEED * dt;
        if (dx && canStand(state.x + dx, state.z)) { state.x += dx; state.moving = true; }
        // 넓은 데크에서 좁은 탐사길로 들어설 때 난간에 막히지 않게 길 안쪽으로 붙여 준다.
        else if (dx && Math.abs(state.z) > lane && canStand(state.x + dx, Math.sign(state.z) * lane)) { state.z -= Math.sign(state.z) * Math.min(Math.abs(state.z) - lane, SPEED * dt); state.moving = true; }
        if (dz && canStand(state.x, state.z + dz)) { state.z += dz; state.moving = true; }
        if (vector.x) state.face = vector.x;
        if (nudge && (nudge.left -= dt) <= 0) nudge = null;
      }
      state.maxX = Math.max(state.maxX, state.x);
      const onDeck = state.x <= -0.6, beenOut = state.maxX >= course.gate;
      near = onDeck && Math.abs(state.x - course.board.x) <= REACH && state.z < 0.8 ? { id: 'board' } : state.x > 0 ? course.spots.find(spot => state.x >= spot.x - REACH && state.x <= spot.x + 1) ?? null : null;
      if (beenOut && onDeck) { finish(false); }
      else if (warned(state.slots)) {
        if (!beenOut && state.x <= 0.5) {
          // 나가지 않은 채 물이 찼다. 판정 없이 물이 낮은 때부터 다시 한다.
          state.mode = 'card'; sound('hint');
          showCard('<h2 id="tw-card-title">탐사길을 닫았어요</h2><p>물이 경고 눈금까지 들어왔어요. 물이 가장 낮은 06:00부터 다시 나가 봐요.</p><button type="button" class="primary" data-tw-action="retry">다시 시작</button>', { className: 'tw-result-card' });
        } else {
          state.mode = 'called'; state.calling = true; state.pose = 'walk'; keys.clear(); nudge = null; sound('hint');
          say('삐익! 물이 경고 눈금까지 들어왔어요. 안전한 길로 돌아와요!'); setGuide('모아가 불렀어요. 부리가 탐사길을 따라 데크로 돌아가요.');
        }
      }
    } else if (state.mode === 'called') {
      // 물에 빠지거나 휩쓸리는 연출 없이, 탐사길을 따라 걸어서 돌아온다.
      state.moving = true; state.face = -1; state.x -= SPEED * 1.25 * dt; state.z += (course.start.z - state.z) * Math.min(1, dt * 3);
      if (state.x <= course.start.x) { state.x = course.start.x; finish(true); }
    }
    const height = walkHeight(state.slots), label = walkClock(state.slots);
    if (clock.textContent !== label) { clock.textContent = label; gauge.setAttribute('aria-label', `관측 시각 ${label}, 물 높이는 ${warned(state.slots) ? '경고 눈금에 닿았어요' : '경고 눈금보다 낮아요'}`); }
    level.style.height = `${gaugePercent(height).toFixed(1)}%`;
    gauge.classList.toggle('is-warned', warned(state.slots));
    const canLook = state.mode === 'walk' && !!near;
    if (action.disabled === canLook) action.disabled = !canLook;
    const text = near?.id === 'board' ? '안내판 살펴보기' : '살펴보기'; if (actionLabel.textContent !== text) actionLabel.textContent = text;
    action.classList.toggle('is-ready', canLook);
    stage.frame(state, time); state.snap = false;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    // 프레임 시간을 0.05초로 잘라, 느린 기기나 탭 전환 뒤에 한꺼번에 움직이지 않게 한다.
    const dt = document.hidden ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    step(dt, now / 1000);
  }

  function close(reason = 'exit') {
    if (closed) return; closed = true;
    cancelAnimationFrame(raf); clearTimeout(cardTimer); clearTimeout(speechTimer); abort.abort(); pad.destroy(); observer.disconnect(); stage.dispose();
    if (dialog.open) dialog.close(); dialog.remove();
    onClosed?.(reason);
  }

  const pad = bindDirectionPad(dialog, '.tw-pad button', button => button.dataset.dir, {
    press: direction => { padDirection = direction; }, release: () => { padDirection = null; }, cancel: () => { padDirection = null; },
    tap: direction => { nudge = { direction, left: 0.25 }; }, blocked: () => state?.mode !== 'walk',
  });
  on(dialog, 'click', event => {
    const name = event.target.closest('[data-tw-action]')?.dataset.twAction; if (!name) return;
    if (name === 'look') lookAt(near);
    else if (name === 'card-close') closeCard();
    else if (name === 'retry') reset('데크에서 다시 시작해요. 출발 전에 데크를 둘러봐요.');
    else if (name === 'done') close('done');
    else if (name === 'flat') close('flat');
    else if (name === 'exit') close(state.mode === 'done' ? 'done' : 'exit');
  });
  // 생물 카드는 눌러서 바로 닫을 수 있다.
  on(card, 'click', () => { if (card.classList.contains('tw-spot-card')) closeCard(); });
  on(dialog, 'keydown', event => {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    const direction = mapKeyDirection(event);
    if (direction) { event.preventDefault(); if (state.mode === 'walk' && !event.repeat) keys.set(event.code || event.key, direction); return; }
    const act = event.code === 'Space' || event.key === 'Enter';
    if (act && state.mode === 'card' && card.classList.contains('tw-spot-card')) { event.preventDefault(); closeCard(); return; }
    if (act && state.mode === 'walk' && !event.target.closest('.tw-tools,.tw-card')) { event.preventDefault(); if (!event.repeat) lookAt(near); }
  });
  on(dialog, 'keyup', event => { if (mapKeyDirection(event)) keys.delete(event.code || event.key); });
  const release = () => { keys.clear(); nudge = null; padDirection = null; };
  on(window, 'blur', release); on(document, 'visibilitychange', release);
  // Esc는 걷기를 그만두고 문제 화면으로 돌아간다.
  on(dialog, 'cancel', event => { event.preventDefault(); close(state.mode === 'done' ? 'done' : 'exit'); });
  on(canvas, 'webglcontextlost', event => { event.preventDefault(); close('lost'); });
  const observer = new ResizeObserver(() => stage.resize(dialog.clientWidth, dialog.clientHeight)); observer.observe(dialog);

  dialog.showModal(); stage.resize(dialog.clientWidth, dialog.clientHeight);
  reset(); last = performance.now(); raf = requestAnimationFrame(loop);
  return () => close('exit');
}
