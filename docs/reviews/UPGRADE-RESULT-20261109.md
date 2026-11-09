# 고도화 결과 — 푸른행성 조사본부(10 earthsea) · 2026-11-09

브랜치 `claude/upgrade-20261109`(시작 8a3c853 = 운영본). push·배포 안 함. 점수는 `SCORE-20261109.md`(최종스킬 73→83/100, 디자인스킬 121→123/130), 계획은 `UPGRADE-PLAN-20261109.md`.

## 바꾼 것

| 커밋 | 내용 | 파일 |
|---|---|---|
| a37511b | 글자 하한(1024 폭 이상 ≥14px, 1600×900 이상 ≥18px), hover를 hover 가능한 기기로 한정, 쓰지 않는 PNG 원본 11장을 `assets/source-png/`로·public의 글꼴 원본 중복 3개 삭제(배포본 52→21MB), 장별 성취기준·학습목표 데이터, 실측 스크립트, 계획서 | `src/responsive-stages.css`, `styles.css`, `experience.css`, `hub.css`, `data.js`, `scripts/optimize-assets.py`, `tests/upgrade_audit.mjs`, `tests/research.test.js` |
| bb99858 | 개념영상 5편을 HyperFrames 「모아의 탐사 노트」로 교체(9초 무음 → 15초, 효과음), 장면 경계를 `src/concept-data.js` 하나로 앱 자막·장면 버튼과 공유, 효과음은 앱 소리 설정 따름, 시간표 테스트, 부분 글꼴 재생성(새 문구 + 기존 누락 19자) | `films/earth-sea-concepts/`, `public/assets/concepts/*`, `src/concepts.js`, `src/audio.js`, `tests/concepts.test.js`, `scripts/render-concepts.mjs`, `public/assets/fonts/BluePlanet*.woff2` |
| 373e922 | 오답 뒤 다시 볼 곳 안내(틀린 카드 점선+“다시 보기”, 맞은 개수, 어긋난 순서 위치). 정답 판정·저장 코드는 그대로 | `src/challenge-data.js`(`mistakeHint`), `src/challenges.js`, `src/challenge-stages.css` |
| fe57469 | 인증서 보조 글자·갯벌 흔적 체크 대비 4.5:1 이상, 실측 스크립트에 대비 측정 추가 | `src/styles.css`, `src/field-stages.css`, `tests/upgrade_audit.mjs` |

개념영상(`public/assets/concepts/`, 같은 경로·같은 파일명):

| 편 | 길이 | mp4 | webm | 포스터 webp |
|---|---|---|---|---|
| 1 지구 표면 | 15.02 s | 482 KB | 594 KB | 72 KB |
| 2 두 물의 차이 | 15.02 s | 713 KB | 683 KB | 75 KB |
| 3 해안 지형 | 15.02 s | 1,909 KB | 1,187 KB | 152 KB |
| 4 밀물과 썰물 | 15.02 s | 512 KB | 614 KB | 76 KB |
| 5 갯벌의 생명 | 15.02 s | 721 KB | 1,071 KB | 177 KB |

1280×720, H.264 High + AAC 모노 64k(faststart), VP9 + Opus 48k. 원본 1920×1080 30 fps는 TMPDIR(외장 SSD)에만 있다. 재현: `TMPDIR=<외장> npm run concepts:render`.

## 검증 명령과 실제 결과

| 명령 | 결과 |
|---|---|
| `npm test` | 50/50 통과(시작 45/45, 새 테스트 5: 성취기준, 오답 안내, 개념영상 시간표 3) |
| `npm run build` | 성공, dist 21 MB(시작 52 MB) |
| `GAME_URL=http://127.0.0.1:5122 node tests/activity_viewport.mjs` | 9개 뷰포트 × 50 상태 = 450 검사 실패 0, 자동관측·속도·일시정지·이탈 취소 흐름 통과, 오류 0 (수정 전후 모두) |
| `LOAD_URL=<빌드 미리보기> GAME_URL=<dev> node tests/upgrade_audit.mjs` | 130 경로×뷰포트: 글자 하한 미달 15→0, 44px 미만·가로 스크롤 0, 대비 미달 0(체크 아이콘 3.98:1), 콘솔·HTTP 오류 0, 첫 화면 10 Mbps 0.30 s·1.7 MB·외부 도메인 0, 개념영상 5편 webm readyState 4·15.03 s·장면 4 |
| 헤드리스 개념영상 확인(빌드 미리보기) | 자동재생·장면 3 이동 시 자막 일치, 전체 음소거 설정이면 `muted`, 움직임 줄이기면 자동재생 안 함, 오류 0 |
| `hyperframes check --json` × 5편 | ok=true, 오류 0, 대비 86/86, 경고 1(4편 물 경로 의도적 넘침) |
| 오답 안내 브라우저 확인 | s1c 분류에서 한 장 틀리면 그 카드만 점선+“다시 보기”, 안내 문장에 카드 이름, 고치면 사라짐(1280×800, 915×412 스크린샷 확인) |
| `ffprobe` | 10개 영상 h264/aac·vp9/opus 1280×720, mp4 moov가 앞(faststart) |

## 미검증 항목과 이유

- mp4(H.264)는 헤드리스 Chrome에서 재생 확인을 못 해 ffprobe로 형식만 확인했다(앱은 webm을 먼저 고른다. Safari는 mp4를 쓴다 — iPad 실기 확인 필요).
- 영상 효과음은 파형·시점·최대 음량(−2 dB)만 쟀고 귀로 듣지 않았다.
- `npm run check:layout`(Windows Edge + Python Playwright 전용)은 맥에서 못 돌렸다. 같은 범위를 Node 스크립트 두 개로 대신 확인했다.
- 40과제 전체 완주는 오늘 다시 돌리지 않았다(11-07 완주 검증 재사용). 오늘 바꾼 정답 화면은 안내 문구·표시만이고 판정 함수는 그대로이며, 40문항 전체에 대한 단위 테스트로 대신했다.
- 실기기 FPS·터치감, 40분 수업 분량, 인증서 인쇄, 스크린리더, 배포 후 확인.

## 남은 일(다음 순서)

1. 서비스워커 오프라인 재방문(D11) — 배포 담당과 캐시 정책 합의 후.
2. OG·카카오 썸네일(G7·G18) — 배포 주소 확정 후 절대 URL로.
3. 좁은 화면(915×412)에서 오답 뒤 자동으로 열리는 힌트 말풍선이 분류 카드를 가림 — 말풍선 위치를 카드 반대쪽으로(기존 동작, 이번에 바꾸지 않음).
4. 개념영상 이름표를 52 px로 키우기(앱 대화상자 안에서 약 14 px로 보임), 2편 수증기 표현 다듬기, 장 완료 배지 창에 결론 장면 그림.
5. 문항별 오개념 문구(교사 검수와 함께), 디자인 토큰 정리, 미사용 `characters.webp` 정리.
6. 공유 `.git`(원본 폴더의 `.git/objects/pack`)에 있던 `._*` 메타데이터 30개를 git 경고 때문에 지웠다(사용자 전역 규칙). 원본 작업 트리 파일은 건드리지 않았다.
