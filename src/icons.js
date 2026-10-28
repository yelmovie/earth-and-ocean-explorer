// One reusable SVG vocabulary keeps controls consistent across every scene.
const paths = {
  circle: '<circle cx="12" cy="12" r="8"/>',
  chat: '<path d="M3 4h18v13H9l-6 4zM7 8h10M7 12h7"/>',
  link: '<path d="m10 14 4-4m-6 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
  hand: '<path d="M8 13V5a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v6c0 4-2 6-6 6h-2c-2 0-4-2-5-4l-3-5a2 2 0 0 1 3-2z"/>',
  home: '<path d="m3 11 9-8 9 8M6 10v11h12V10M10 21v-7h4v7"/>',
  back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  arrow: '<path d="M3 12h18m-7-7 7 7-7 7"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8q6 4 0 8"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',
  settings: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2m0-12.8-2.2 2.2m-8.4 8.4-2.2 2.2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15"/>',
  book: '<path d="M12 6C8 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-1-10 2zm0 0v14"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
  camera: '<path d="M8 6 9 3h6l1 3h5v15H3V6z"/><circle cx="12" cy="13" r="4"/>',
  lock: '<path d="M5 10h14v11H5zm3 0V7a4 4 0 0 1 8 0v3"/>',
  unlock: '<path d="M5 10h14v11H5zm3 0V7a4 4 0 0 1 7.5-2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18"/>',
  flask: '<path d="M9 3h6m-5 0v6L4 19a1.3 1.3 0 0 0 1.2 2h13.6a1.3 1.3 0 0 0 1.2-2L14 9V3M7 15h10"/>',
  wave: '<path d="M2 8c3-5 5 5 10 0s7 5 10 0M2 15c3-5 5 5 10 0s7 5 10 0"/>',
  leaf: '<path d="M20 3C9 2 2 7 5 15s15 6 15-12zM4 21 16 8"/>',
  shell: '<path d="M12 21 4 13a7 7 0 1 1 16 0zm0 0V4m0 17L7 6m5 15 5-15M4 13h16"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  play: '<path d="m8 4 13 8L8 20z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
};

export function icon(name, className = '') {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[{earth:'globe',waves:'wave',badge:'award'}[name]??name] || paths.info}</svg>`;
}
