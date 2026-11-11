import { asset } from './data.js';
import { icon } from './icons.js';
import { moveProbe, nearby } from './expedition-state.js';
import './expedition.css';

export { moveProbe, nearby, normalizeExpeditions } from './expedition-state.js';

export const expeditions = [
  { title: '지구 표면 관측 항해', bg: 'observatory', tool: 'camera', goal: '육지와 바다의 서로 다른 관측점을 촬영해.', nodes: [
    { x: 1, y: 1, name: '육지 관측점', detail: '땅이 이어져 보여. 몇 곳의 사진은 지구 전체 넓이를 뜻하지 않아.' },
    { x: 4, y: 2, name: '바다 관측점', detail: '넓은 물이 보여. 전체 넓이는 지구 전체 자료와 비교해야 해.' },
    { x: 2, y: 4, name: '전 지구 자료실', detail: '지구 전체 표면에서 바다가 육지보다 넓어.' },
  ] },
  { title: '두 물의 표본 수송', bg: 'lab', tool: 'sample', goal: '육지의 물과 바닷물을 같은 양으로 채집해 실험실로 가져가.', nodes: [
    { x: 1, y: 2, name: '육지의 물', detail: '육지의 물 40mL 표본을 보관했어. 맑아 보여도 물질이 녹아 있을 수 있어.' },
    { x: 4, y: 1, name: '바닷물', detail: '바닷물 40mL 표본을 보관했어. 비교할 양을 같게 맞췄어.' },
    { x: 4, y: 4, name: '실험실 도착', detail: '같은 조건에서 물을 증발시킨 뒤 남는 물질을 비교하자.' },
  ] },
  { title: '해안 사진 탐사', bg: 'coast', tool: 'camera', goal: '탐사 지점에 가까이 가서 지형의 모양을 촬영해.', nodes: [
    { x: 1, y: 1, name: '모래 관측점', detail: '고운 모래가 넓게 쌓인 모래사장이야.' },
    { x: 4, y: 2, name: '가파른 바위', detail: '높고 가파른 바위 면을 가진 절벽이야.' },
    { x: 2, y: 4, name: '뚫린 바위', detail: '구멍 너머로 바다가 보이는 바위야.' },
  ] },
  { title: '같은 해안의 두 순간', bg: 'tide', tool: 'gauge', goal: '같은 해안에서 시간차를 두고 남긴 두 관측 기록을 모아 비교해.', nodes: [
    { x: 1, y: 1, name: '첫 관측 기록', detail: '같은 기둥 앞에서 찍은 첫 기록이야. 물이 닿은 높이를 살펴봐.' },
    { x: 4, y: 2, name: '나중 관측 기록', detail: '이 관측 모형에서는 물이 계속 들어와 높아졌어. 같은 기둥에서 밀물의 변화를 살펴봐.' },
    { x: 2, y: 4, name: '안전한 관측소', detail: '물에 잠긴 길은 이용하지 않아. 실제 체험은 현장 안내와 물때를 확인해.' },
  ] },
  { title: '갯벌 흔적 탐사', bg: 'mudflat', tool: 'lens', goal: '생물의 집을 건드리지 않고 흔적을 관찰해.', nodes: [
    { x: 1, y: 2, name: '작은 구멍', detail: '생물의 집일 수 있어. 파헤치지 않고 흔적을 기록해.' },
    { x: 4, y: 1, name: '물가의 움직임', detail: '짱뚱어가 지느러미로 움직이는 모습을 살펴봤어.' },
    { x: 4, y: 4, name: '갈대 구역', detail: '갈대가 뿌리내린 곳도 생물이 사는 갯벌 환경의 일부야.' },
  ] },
];

export function mountExpedition(host, state, save, navigate, sound) {
  const start = document.createElement('button');
  start.className = 'expedition-launch';
  start.textContent = '탐사정 출항 · 직접 조사';
  host.append(start);
  let dialog;

  start.onclick = () => {
    if (dialog?.isConnected) return;
    let stage = Math.min(5, state.completed.length + 1);
    let tool = 'camera';
    const make = () => {
      const expedition = expeditions[stage - 1];
      state.expeditions ??= {};
      const record = state.expeditions[stage] ??= { found: [], x: 0, y: 3 };
      return { expedition, record };
    };
    dialog = document.createElement('dialog');
    dialog.className = 'ocean-expedition';
    dialog.setAttribute('aria-label', '탐사정 조사');
    document.body.append(dialog);

    const draw = (message = '') => {
      const focusedLabel = dialog.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
      const scrollTop = dialog.scrollTop;
      const { expedition, record } = make();
      const tideComparison = stage === 4 && record.found.includes(0) && record.found.includes(1)
        ? `<section class="ocean-tide" aria-label="같은 기둥의 물 높이 비교 모형"><strong>같은 기둥, 달라진 물 높이</strong><div>${['첫 기록', '나중 기록'].map((label, index) => `<figure><div class="ocean-tide-scene ${index ? 'later' : ''}" aria-hidden="true"><i class="ocean-tide-pole"></i><i class="ocean-tide-water"></i></div><figcaption>${label}</figcaption></figure>`).join('')}</div><p>물이 계속 들어와 높아지는 밀물의 관측 모형이야.</p></section>`
        : '';
      dialog.innerHTML = `
        <header><h2>${expedition.title}</h2><button data-close aria-label="탐사 닫기">${icon('close')}</button></header>
        <div class="ocean-brief"><p>${expedition.goal}</p><label>탐사 구역 <select aria-label="탐사 구역">${expeditions.map((item, index) => `<option value="${index + 1}" ${index + 1 === stage ? 'selected' : ''} ${index > state.completed.length && !state.settings.unlockAll ? 'disabled' : ''}>${index + 1}. ${item.title}</option>`).join('')}</select></label></div>
        <div class="ocean-workspace">
          <div class="ocean-field" style="background-image:url('${asset(expedition.bg)}')" aria-label="교육용 탐사 지도">
            ${expedition.nodes.map((node, index) => `<button class="ocean-point ${record.found.includes(index) ? 'found' : ''}" data-point="${index}" aria-label="${node.name}" style="left:${8 + node.x * 16}%;top:${8 + node.y * 16}%"><b>${record.found.includes(index) ? icon('check') : index + 1}</b><span>${node.name}</span></button>`).join('')}
            <div class="ocean-probe" style="left:${8 + record.x * 16}%;top:clamp(0px,${8 + record.y * 16}%,calc(100% - 52px))" aria-label="탐사정 위치"><img src="${asset('illustrations/buri-map')}" alt="부리 탐사대장"></div>
          </div>
          <div class="ocean-console">
            <div class="ocean-controls">
              <fieldset><legend>1. 가까이 이동</legend><div class="ocean-pad">${[[0, -1, '위'], [-1, 0, '왼쪽'], [0, 1, '아래'], [1, 0, '오른쪽']].map(([x, y, label]) => `<button data-move="${x},${y}" aria-label="탐사정 ${label}">${label}</button>`).join('')}</div></fieldset>
              <fieldset><legend>2. 도구 선택</legend><div class="ocean-tools">${[['camera', '사진'], ['sample', '표본'], ['gauge', '물 높이'], ['lens', '관찰경']].map(([id, label]) => `<button data-tool="${id}" aria-label="${label} 도구" aria-pressed="${tool === id}">${label}</button>`).join('')}</div></fieldset>
            </div>
            <p class="ocean-message" role="status">${message || '방향 버튼이나 방향키로 이동해. 도구를 고른 뒤 관측점을 눌러 봐.'}</p>
            ${tideComparison}
            <div class="ocean-log" aria-label="모은 조사 기록">${record.found.map(index => `<span>${icon('check')}${expedition.nodes[index].name}</span>`).join('')}</div>
          </div>
        </div>
        <footer><div><strong>조사 ${record.found.length}/3</strong><span>${record.found.length < 3 ? `기록 ${3 - record.found.length}개를 더 모으면 탐구할 수 있어.` : '세 기록을 모두 모았어. 탐구를 이어 가자.'}</span><small>지도 위치와 이동은 기록을 모으기 위한 교육용 모형</small></div><button data-research ${record.found.length < 3 ? 'disabled' : ''}>자료를 가지고 탐구하기</button></footer>`;

      dialog.querySelector('[data-close]').onclick = () => dialog.close();
      dialog.querySelector('select').onchange = event => {
        stage = Number(event.target.value);
        draw();
      };
      dialog.querySelectorAll('[data-move]').forEach(button => {
        button.onclick = () => move(...button.dataset.move.split(',').map(Number));
      });
      dialog.querySelectorAll('[data-tool]').forEach(button => {
        button.onclick = () => {
          tool = button.dataset.tool;
          draw();
        };
      });
      dialog.querySelectorAll('[data-point]').forEach(button => {
        button.onclick = () => {
          const index = Number(button.dataset.point);
          const node = expedition.nodes[index];
          if (!nearby(record, node)) {
            draw('먼저 방향 버튼으로 이 관측점 가까이 이동해.');
            return;
          }
          if (tool !== expedition.tool) {
            const messages = {
              2: '같은 양의 물 표본이 필요해. 표본 도구를 골라 봐.',
              4: '기준물에 닿은 물 높이를 관측할 도구를 골라 봐.',
              5: '생물의 집을 건드리지 않고 자세히 관찰할 도구를 골라 봐.',
            };
            draw(messages[stage] || '지형과 모습을 기록할 도구를 골라 봐.');
            sound('click');
            return;
          }
          if (stage === 4 && index === 1 && !record.found.includes(0)) {
            draw('같은 기준물의 첫 관측부터 기록해야 변화를 비교할 수 있어.');
            return;
          }
          if (stage === 2 && index === 2 && record.found.length < 2) {
            draw('두 장소의 물을 먼저 같은 양으로 채집해.');
            return;
          }
          if (!record.found.includes(index)) {
            record.found.push(index);
            save();
            sound('reward');
          }
          draw(node.detail);
        };
      });
      dialog.querySelector('[data-research]').onclick = () => {
        dialog.close();
        navigate(`s${stage}a`);
      };
      if (focusedLabel) dialog.querySelector(`[aria-label="${CSS.escape(focusedLabel)}"]`)?.focus({ preventScroll: true });
      dialog.scrollTop = scrollTop;
    };
    const move = (x, y) => {
      const { record } = make();
      Object.assign(record, moveProbe(record, x, y));
      save();
      draw();
    };
    dialog.addEventListener('keydown', event => {
      const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (directions[event.key] && !/INPUT|SELECT/.test(event.target.tagName)) {
        event.preventDefault();
        event.stopPropagation();
        move(...directions[event.key]);
      }
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      start.focus({ preventScroll: true });
    });
    draw();
    dialog.showModal();
  };
  return () => {
    if (dialog?.isConnected) {
      dialog.close();
      dialog.remove();
    }
    start.remove();
  };
}
