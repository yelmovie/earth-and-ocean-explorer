import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Completion and preview decisions remain in screens.js; this module only lays out the award.
export function certificatePaper({actual, date, promise}) {
  return `<section class="certificate-page cert-design">
    <article class="cert-paper" aria-label="푸른행성 조사원 인증서">
      <img class="cert-frame" src="/assets/certificate-frame-20261122.webp" alt="" aria-hidden="true">
      <div class="cert-content">
        <h1 class="cert-title">푸른행성 조사원 인증서</h1>
        <div class="cert-recipient" aria-label="인쇄한 뒤 손으로 쓰는 학교, 학년, 반, 번호, 이름 빈칸">
          <div class="cert-class"><span class="cert-blank school" data-cert-blank="school"></span> 학교 <span class="cert-blank" data-cert-blank="grade"></span> 학년 <span class="cert-blank" data-cert-blank="class"></span> 반 <span class="cert-blank" data-cert-blank="number"></span> 번</div>
          <div class="cert-name">이름 <span class="cert-blank name" data-cert-blank="name"></span></div>
        </div>
        <p class="cert-award">위 조사원은 지구와 바다의 다섯 가지 기록을 모으고,<br>생명이 살아가는 갯벌을 지킬 방법을 탐구하였으므로<br>이 인증서를 수여함.</p>
        <p class="cert-promise"><b>나의 갯벌 지킴 메시지</b><span>${escape(promise)}</span></p>
        <div class="cert-bottom">
          <p class="cert-date"><small>완료일</small>${escape(date)}</p>
          <div class="cert-stamp"><b>푸른행성</b><span>${actual ? '탐사 인증' : '연습용 예시'}</span></div>
          <p class="cert-issuer"><small>발급자</small>푸른행성 조사본부</p>
        </div>
        <p class="cert-credit">기획·제작: 옐샘 &amp; ⓒ 아이스크림미디어</p>
      </div>
    </article>
    <footer class="cert-controls">
      <p class="cert-note">${actual ? '인쇄한 뒤 빈칸을 채워요.' : '미리보기 · 탐사를 마치면 저장할 수 있어요.'}</p>
      <div class="certificate-actions">
        <button class="primary" data-action="print" ${actual ? '' : 'disabled hidden'}>인쇄 / PDF 저장</button>
        <button class="secondary" data-action="cert-png" ${actual ? '' : 'disabled hidden'}>PNG 저장</button>
        <button class="${actual ? 'secondary' : 'primary'}" data-action="go" data-value="hub">${icon('map')} 탐사 지도</button>
        <button type="button" class="icon-button field-note" aria-label="인증서 안내" title="인증서 안내" data-note="학교의 공식 수료증이 아닌, 이 게임의 학습 완료 기록이야. 개인정보는 포함하지 않아.">${icon('info')}</button>
      </div>
      <p class="cert-error" role="status" aria-live="polite"></p>
    </footer>
  </section>`;
}
