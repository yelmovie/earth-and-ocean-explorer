# 납품 안내 · 푸른행성 조사본부

이어서 볼 문서: 작업 인계 기록 [`HANDOFF.md`](../HANDOFF.md), 사용 설명 [`README.md`](../README.md). 이 문서는 두 파일을 대신하지 않고 요점만 모았습니다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 프로젝트 | 푸른행성 조사본부 (패키지 이름 `blue-planet-research-hq` 1.0.0) |
| 운영 주소 | https://earth-and-ocean-explorer.yelsam.workers.dev/ |
| 저장소 | https://github.com/yelmovie/earth-and-ocean-explorer (브랜치 `main`) |
| 앱 코드 마지막 커밋 | `0f37293` (2026-11-22, 인증서 고도화) |

## 2. 폴더 구조

배포되는 것:
- `src/` 앱 코드(바닐라 JS, three), `index.html`, `vite.config.js`
- `public/` 그림·소리·영상·글꼴·3D 말뚝 모형(`public/assets/`, 출처 `assets/CREDITS.md`), `sw.js`, `404.html`
- `worker/media-range.js` 영상 Range 처리
- 빌드 결과 `dist/`(저장소에는 올리지 않음)

보관용(배포되지 않음):
- `docs/` 기획·검토·성적표·권리 장부, `assets/` 원본 그림과 Meshy 기록, `films/` 개념 영상 제작 소스
- `tests/` 시험·점검, `scripts/` 그림·글꼴·영상 준비, `thumbnails/` 납품 썸네일, `output/`·`artifacts/` 작업 결과

## 3. 실행·빌드·검사 명령 (`package.json`)

~~~sh
mkdir -p .tmp/runtime .tmp/npm-cache
export TMPDIR="$PWD/.tmp/runtime" TMP="$PWD/.tmp/runtime" TEMP="$PWD/.tmp/runtime"
export npm_config_cache="$PWD/.tmp/npm-cache"
npm ci
npm test              # node --test tests/*.test.js
npm run build         # vite build (타입 검사 단계 없음)
npm run dev           # 127.0.0.1:5173
npm run preview       # 127.0.0.1:4173
npm run check:layout  # node tests/activity_viewport.mjs (개발 서버를 켠 상태)
~~~

- 브라우저 회귀 검사는 `tests/*-browser.mjs`와 Python 스크립트(`README.md`의 검증 절). 저장 보호는 `node tests/release-safety.mjs`입니다.
- exFAT 외장 드라이브에서는 preview를 끈 뒤 다시 빌드합니다(`README.md`).

## 4. 배포

- 호스팅: Cloudflare Workers `earth-and-ocean-explorer`(정적 파일 + 영상 Range용 Worker). 시트 운영 주소와 같습니다.
- 설정 파일은 이 저장소 밖 공용 폴더에 있습니다: `_scratch/deploy-20261118/cfg/10.json`. 내용은 정적 파일 폴더 `dist`, 없는 경로는 404 응답, Worker 진입점 `worker/media-range.js`, 이름 `earth-and-ocean-explorer`입니다.
- 배포 명령(공용 스크립트, `HANDOFF.md`): `deploy.sh 10 "10 earthsea" worker-cfg earth-and-ocean-explorer`. 이 스크립트는 `origin/main`을 받아 빌드하고 `wrangler deploy --config`를 실행합니다.
- 영상 Range 처리: `worker/media-range.js`. Cloudflare 정적 파일은 Range 요청에 파일 전체를 돌려주어 영상 탐색이 안 됩니다. `/assets/concepts/*`, `/assets/map-encounters/*`, `/assets/story/*` 요청만 이 Worker가 먼저 받아 206 조각으로 답합니다.
- 운영 확인: `_scratch/final-recheck-20261120/prodcmp.sh 10`(운영과 저장소 파일 대조)과 영상 Range 206 응답.
- `.github/workflows/deploy.yml`은 수동 실행(`workflow_dispatch`)으로만 GitHub Pages(https://yelmovie.github.io/earth-and-ocean-explorer/)에 올리는 보조 경로입니다. 푸시로 배포되지 않으며, 그 성공은 운영 배포의 근거가 아닙니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일 폴더: `dist/` 전체. `vite.config.js`가 `base: './'`(상대 경로)라서 하위 폴더에 올려도 열립니다. 현재 운영은 없는 경로를 404로 답하므로 단일 페이지 방식 되돌림 설정은 필요 없습니다.
- 서비스 워커: `public/sw.js`(정적 파일, `src/main.js`가 운영 빌드에서만 등록). 오프라인 미리 받기를 담당하며, 파일 목록을 바꿨다면 함께 확인합니다.
- Range 처리: 호스팅이 mp4·webm의 Range 요청에 206으로 답하는지 확인합니다. 답하지 않으면 `worker/media-range.js`와 같은 처리가 필요합니다. iPad Safari 영상 재생에 필수입니다.
- 환경 값: 없음. 서버·로그인·외부 API를 쓰지 않습니다. 학생 기록은 브라우저 `localStorage`(키 `blue-planet-hq:v2`)에만 있고 주소마다 따로입니다.

## 6. 버전과 변경 이력 (`git log`)

- 2026-11-21 `cd79090` 갯벌 탐사길 말뚝을 Meshy 3D 모형으로
- 2026-11-21 `c7df0eb` 3-4단계 기록: 색 토큰·영상 코드 줄 정리, 97점(실기기 제외 100점)
- 2026-11-21 `9c3b9ab`, `a68cb20` 긴 줄 나눔, 반복 색을 디자인 토큰으로 이동
- 2026-11-21 `92df25e`, `23fa20a` 인트로·파이널 이야기 영상(목소리·자막·전체 화면)
- 2026-11-21 `d160638`, `f4f32dc` 선택지 섞기, 첫 시도 정답 기록, 폰 가로 버튼·글자
- 2026-11-21 `dc6afdb` 낮은 화면에서 요약 화면 버튼 유지
- 2026-11-21 `3c24fa5`, `23b3644` 권리 장부·이미지 필요 목록·품질 줄·검수표
- 2026-11-20 제작·저작권 표기 추가, 소리 3차 수정(`HANDOFF.md`)

## 7. 권리·출처

[`docs/RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md)에 그림·영상·음악·효과음·목소리·글꼴·3D 모형의 출처와 이용 조건을 모았습니다. 법률 판정이 아니라 저장소 기록을 정리한 것입니다.

한 줄 요약: 그림은 Codex(GPT 이미지)로 만들었고, 영상은 Gemini와 직접 렌더, 배경 음악은 Suno, 효과음은 Kenney·Freesound CC0, 목소리는 ElevenLabs, 글꼴은 OFL이며 모두 유료 요금제로 만들었다는 사용자 확인이 있습니다. 3D 말뚝 모형 줄은 2026-11-22에 추가했습니다.

## 8. 알려진 한계와 남은 일

성적표 `docs/reviews/SCORE-20261121.md` 기준 97점(실기기 제외 100점)입니다.

- 남은 감점 3점(실기기·수업 대기): 학생 40분 수업(B16), 저사양 태블릿(D10), iPad 인쇄(G19).
- 권리 장부: 근거 약함 1줄(3D 말뚝의 Meshy 약관 원문). 요금제 화면 캡처는 업체 증빙용으로 있으면 좋습니다.
- 3D 탐사길 말뚝 GLB를 불러오지 못하면 예전 상자 말뚝으로 그려집니다(`HANDOFF.md`).
- `tests/tide-walk-browser.mjs`가 저장 필드 검사(143행)에서 멈추는 예전 검사 문제가 `HANDOFF.md`에 적혀 있습니다. 앱 동작과는 무관하다고 기록되어 있습니다.

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 17개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 10`로 다시 대조합니다.

## 인증서 운영 반영 · 2026-11-22

- 그림268e967, 앱0f37293, 안내·장부fc94f6e. 기존 Workers earth-and-ocean-explorer 버전848aacd9-228f-43a6-993d-dbc0c4742b5f에 배포했습니다. 공식 운영 주소는 그대로입니다.
- 단위 시험104개·빌드 통과. 운영1280×800/1024×768/1920×1080에서 종이·버튼 전체 표시, 겹침/넘침/콘솔오류0. 인쇄PDF는 A4가로1쪽, 학교54.9mm·이름68.3mm·쓰기높이11.3mm. PNG2400×1697 저장·직접열기 확인.
- 운영 index+코드/스타일17개와 새 테두리 SHA-256이 배포 빌드와 일치합니다. 비교 `.tmp/cert-design-20261122/compare.png`. 기존 기록·확장활동·첫시도·갯벌메시지와 완료 판정·저장 형식은 유지했습니다.

## 인증서 최종 운영 확인 · 2026-11-22

- 사용자 추가 지시에 맞춰 종이의 미션·기록·복구율·활동 개수 숫자 요약을 표시하지 않고 수여 본문·정성 탐구 내용을 유지했습니다. 제목은900 굵기와 얇은 동색 스트로크, PNG에도 같은 획을 적용합니다. 앱 `e7ee8b4`, 기존 Worker 버전 `5a3b9970-63fc-4ec9-832a-c5c5dae4f6e7`.
- 기존 검사·단위 시험104개·빌드 통과. 운영 세뷰 전체 종이/버튼, 입력0·진행 숫자0·제목900·겹침/넘침/콘솔오류0. A4 가로PDF1쪽·PNG2400×1697·학교54.9mm·이름68.3mm·쓰기높이11.3mm 확인.
- 운영 index+코드/스타일17개 MATCH. `.tmp/cert-design-20261122/compare.png`는 최신 운영 화면·PNG로 갱신했습니다. 완료 판정과 저장 형식은 그대로입니다.
