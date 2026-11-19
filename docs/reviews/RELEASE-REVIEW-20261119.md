# 배포 검토 보고서 — 푸른행성 조사본부

> 작성일: 2026-11-19 오후 · 브랜치: main · 기준 커밋: `5039b07`(11-18 `96e2322` 위에 4:3 도전 화면 제목 배치·18px 하한·설정 창 닫기 정리) · 배포 대상: Cloudflare Workers `earth-and-ocean-explorer` (https://earth-and-ocean-explorer.yelsam.workers.dev)
> 범위: 2026-11-18 놀이 화면 비율·중복 조작 버튼 작업 뒤의 최종 납품 점검. 이번 변경이 닿는 B·C·E·G와 초기 로딩(D1)은 다시 실행했고, 바꾸지 않은 학습 설계(A)·데이터 안전(F)·에셋 출처는 `RELEASE-REVIEW-20261111.md`의 실측 결과를 인용한다(증거등급 「이전 확인」으로 표시).

## 최종 판정

**조건부 배포 가능** (점수 92/100, `SCORE-20261119.md`)

### 왜 이 판정인가

- FAIL 0개. 빌드·단위 테스트 101개·레이아웃 270검사·실제 클릭 완주·저장 안전 8항목·3D 탐사길 15항목·지도 겹침 검사가 모두 통과했다.
- A·F·B 핵심 경로에 FAIL·NOT TESTED 없음. NOT TESTED 3개(B16 실제 40분 수업, D10 저사양 실기, G19 iOS 인쇄)는 사람·실기가 필요한 항목이다.
- 규칙상 「배포 가능」까지 가능하지만, 장별 콘텐츠가 아직 `needsReview: true`·`reviewer: null`(교사 최종 검수 전)이라 11-11 판정과 같이 보수적으로 조건부를 유지한다.

### 배포 전 처리할 조건

1. 코드 조건 없음(11-18 `96e2322`, 11-19 `5039b07`로 배포).
2. 교사 최종 검수(`src/data.js` 장별 `needsReview`) — 담당 교사가 수업 전 확인.
3. 학교 태블릿 실기에서 한 차시 시연(B16·D10), iOS 인쇄(G19) — 수업 투입 전 교사가 확인.

### 배포 후 확인할 것

1. 운영 주소의 `index.html`·핵심 번들 해시가 빌드와 같은지(`cmp.sh`).
2. 운영 주소에서 보고서·증거 연결 화면이 스크롤 없이 한 화면에 보이는지.

---

## 요약

| 영역 | PASS | WARNING | FAIL | NOT TESTED | N/A |
|---|---|---|---|---|---|
| A 교육적 품질 | 15 | 1 | 0 | 0 | 1 |
| B 기능 | 18 | 0 | 0 | 1 | 0 |
| C 태블릿·UI | 24 | 0 | 0 | 0 | 1 |
| D 성능 | 12 | 1 | 0 | 1 | 0 |
| E 코드 품질 | 12 | 1 | 0 | 0 | 1 |
| F 데이터·안전 | 14 | 1 | 0 | 0 | 0 |
| G 배포 | 19 | 0 | 0 | 1 | 0 |
| **합계** | 114 | 4 | 0 | 3 | 3 |

## 실행 환경 (실측)

| 항목 | 값 |
|---|---|
| package manager | npm (`package-lock.json` 하나) |
| 실행 명령 | `npm run dev` / `npm run build` / `npm test` / `npm run check:layout` |
| 배포 URL | https://earth-and-ocean-explorer.yelsam.workers.dev |

| 명령 | 결과 |
|---|---|
| install | 기존 `node_modules` 사용(재설치 안 함) |
| lint | **정의 안 됨** (N/A) |
| typecheck | **정의 안 됨** (바닐라 JS, N/A) |
| test | `npm test` 101개 통과 |
| build | `npm run build` 통과(1.8초) |

브라우저 확인: 함 — 헤드리스 Chrome(Playwright, `_shared/run-stage-lock.sh browser`)과 앱 내 브라우저.

자동 스윕: `.tmp/layout-balance-20261118/measure.mjs` 26화면 × 3해상도(오류 0) + `tests/activity_viewport.mjs` 20활동 × 9해상도 270검사(실패 0).

---

## A. 교육적 품질 — 이번에 학습 문구·판정을 바꾸지 않음

| # | 판정 | 근거 |
|---|---|---|
| A1~A7, A9~A12, A14~A17 | PASS(이전 확인 + 완주 재확인) | 11-11 검토의 장별 목표·성취기준(`src/data.js` `standard`), 예상→관찰→근거 구조. 이번 완주(`tests/release-browser.mjs`)에서 오답 안내 `wrongExplanationReview:true`, 제출 전 정답 비노출 테스트(`tests/activity-flow.test.js`) 통과 |
| A8 클릭 반복 통과 | WARNING(이전 확인) | 선택형 문항은 반복 선택으로 맞힐 수 있음. 오답 횟수는 `revised`로 기록 |
| A13 단정 서술 | N/A | 사회·문화 소재 없음 |

## B. 기능

| # | 판정 | 근거 |
|---|---|---|
| B1~B15, B17~B19 | PASS(확인됨) | 홈→지도→5장×4화면→확장 20문제→보고서→증거 연결 5개→엔딩→인증서 인쇄까지 실제 클릭 완주, 새로고침·미션 중 새로고침·이어하기·초기화 취소·Esc 포커스 복귀(`release-browser` safety 7항목), 교사 기록 분리·두 탭 충돌·손상 원본 보존·해금 재계산·멀티터치(`release-safety` 8항목) |
| B15 비활성 버튼 이유 | PASS(확인됨) | 증거 연결의 꺼진 「연결 확인」은 이제 숨김. 틀린 뒤·답을 바꿨을 때만 보이며 안내 줄이 이유를 말함(`src/main.js` `syncLinkGuidance`) |
| B16 40분 수업 분량 | NOT TESTED | 실제 학생 수업 미실시 |

## C. 태블릿·UI

| # | 판정 | 근거 |
|---|---|---|
| C1·C2·C4·C5·C6·C17 | PASS(확인됨) | 270검사 겹침·잘림·화면 밖 0. 보고서(1280·1024)·증거 연결(1024)·인증서(1280·1024)·엔딩(1920)의 문서 스크롤 제거 — 이전 「연결 확인/다음 상황」·「더 알아보기」가 스크롤 아래로 숨던 문제 해결(`docs/LAYOUT-BALANCE-20261118.md`) |
| C3 터치 영역 | PASS(확인됨) | 활동 버튼 47px 이상 검사 통과, 탐사길 버튼 52px 이상 |
| C7·C19·C25 | PASS(이전 확인 + 270검사의 768×1024·375×812) | |
| C8·C24 | PASS(이전 확인) | 동작 줄이기 시 3D 탐사길→2D, 자동 넘김 지연(탐사길 검사 「기기의 움직임 줄이기 → 기존 화면」 재확인) |
| C9·C12·C13·C14·C15·C16·C18·C21 | PASS(이전 확인) | |
| C10 음소거 | PASS(확인됨) | 위 띠 오른쪽 소리 버튼 |
| C11 키보드 | PASS(확인됨) | 지구 회전 버튼을 없앤 대신 지구가 초점을 받아 ←/→로 돈다(앱 내 브라우저에서 확인), 지도 방향키, 탐사길 방향키 |
| C20 글자 하한 | PASS(확인됨, 11-19) | 26화면 × 1024·1280·1920 = 78화면에서 18px 미만 글자 0, 문서 스크롤 0(앱 내 브라우저 전수 측정). 3장 「다시 고르기」는 되돌리기 그림 + `aria-label`, 엔딩·화면 인증서·4:3 증거 요약 18px |
| C22 캔버스↔DOM | N/A | Phaser 없음(지도는 자체 캔버스, `hub-overlay-browser` 겹침 검사 통과) |
| C23 다음 행동 인지 | PASS(확인됨, 11-19) | 주 버튼 1개·오른쪽 아래. 단계 탭을 위 도구 띠 가운데로 올리고 도전 제목을 두 줄로 맞춰 도전·적용 20문제 × 3해상도 놀이 영역 최저 70.1%(1024×768, 전 63.2%) |

## D. 성능

| # | 판정 | 측정값 |
|---|---|---|
| D1 초기 로딩 | PASS(확인됨) | 운영 주소 첫 화면(시작 버튼·글꼴 준비)까지 1.57초, 10Mbps·80ms 모사 1.86초, 첫 전송 1.04MB, 준비 표시(`.boot`) 있음, 요청 출처 운영 주소 하나(`.tmp/layout-balance-20261118/load.mjs`) |
| D2 이미지 | PASS | `dist` 안 1MB 초과 이미지 0개 |
| D3 오디오·영상 | PASS | 5MB 초과 0개(개념 영상 최대 약 1.7MB) |
| D4 3D | PASS(이전 확인) | Three 번들 546kB(gzip 135kB), 지도·3D 지연 로딩 |
| D5·D7·D12·D14 | PASS(이전 확인) | |
| D6 미사용 파일 | PASS(확인됨, 11-19) | 런타임·코드 어디에서도 부르지 않는 6개(구형 캐릭터 시트 `characters.webp`, `logo.webp`, 이전 부분집합 글꼴 3개, `map-villain-left.webp`, 약 1.0MB) 삭제. 운영에서 404 확인, 완주 오류 0 |
| D8·D9 | PASS(이전 확인) | |
| D10 저사양 실기 | NOT TESTED | 학교 기기 없음 |
| D11 오프라인 재방문 | PASS(확인됨, 11-19) | `public/sw.js`: 화면 HTML·일반 파일은 네트워크 먼저(온라인이면 늘 최신 배포), 해시 빌드 파일은 저장본 먼저, 영상·Range 요청은 통과. 미리보기·운영 주소 모두 `release-metrics` 오프라인 새로고침 → 지도 화면 복원(`offlineRevisit:true`) |
| D13 정적 모션 위험 | WARNING(이전 확인) | 유리 효과 `backdrop-filter` |

## E. 코드 품질

| # | 판정 | 근거 |
|---|---|---|
| E1·E3·E5~E14 | PASS(확인됨) | 콘솔 오류 0(측정 3해상도·완주), 404 0, 테스트·빌드 통과, lock 하나. `tests/release-metrics.mjs` 음성 경로를 앱 규칙(`EL_VOICE_IDS` → `el-`)과 맞춰 11-19 끝까지 통과(프레임 중앙 16.7ms) |
| E2 큰 파일 | WARNING | `src/styles.css` 3,778줄 |
| E4 any | N/A | TypeScript 아님 |

## F. 데이터·안전 — 이번에 저장 구조를 바꾸지 않음

| # | 판정 | 근거 |
|---|---|---|
| F1~F11, F13~F15 | PASS(이번 `release-safety` 재확인 + 이전 확인) | 이름·학번 수집 없음, 키 `blue-planet-hq:v2`, 미래 버전·손상 원본 보존, 해금 재계산(`derivedUnlocks:true`), 비밀키 없음 |
| F12 에셋 출처 | WARNING(이전 확인) | 기존 제공 이미지의 최초 생성 계정·이용권 증빙 |

## G. 배포

| # | 판정 | 근거 |
|---|---|---|
| G1~G10, G12, G14~G18, G20 | PASS | 상대 base `./`, Workers 정적 자산 + `404-page`, 배포 설정 `_scratch/deploy-20261118/cfg/10c.json`(직전 배포와 같은 값), 롤백 대상 직전 운영 커밋 `edddfcc` |
| G11 배포 후 smoke | PASS(확인됨) | `96e2322` 배포 뒤 운영 주소에서 `tests/release-browser.mjs` 홈→인증서 실제 클릭 완주·안전 7항목 통과·오류 0. `cmp.sh`: `index.html`, `index-BNO6cY-n.js`, `globe-CFe-HPfs.js`, `index-HTgEbnns.css` 빌드=운영 MATCH |
| G13 git status | PASS | 다른 세션(개념 영상 자막)의 미커밋 변경은 커밋에서 제외 |
| G19 인쇄 | NOT TESTED(iOS) | PC 인증서 PDF 1쪽은 운영 완주에서 확인(`printPages:1`). iOS 인쇄·공유 시트 미확인 |

## 2026-11-19 추가 배포

- 커밋 `5039b07` → `_scratch/deploy-20261118/deploy.sh 10 "10 earthsea" worker-cfg earth-and-ocean-explorer`(다른 세션이 올린 영상 Range 워커 `worker/media-range.js`를 쓰는 `cfg/10.json`, 영상 Range 요청 206 유지 확인). Version ID `b53d69c6-d7d2-4baa-898d-b952654bd74c`.
- `cmp.sh`: `index.html`, `index-DvVy95kl.js`, `globe-ftJWxfya.js`, `index-BGszSAwU.css` 빌드 = 운영 MATCH.
- 운영 주소 `tests/release-browser.mjs` 홈→인증서 실제 클릭 완주·안전 7항목·인쇄 1쪽·오류 0. 첫 화면 1.76초(10Mbps·80ms 모사 1.69초), 첫 전송 1.04MB.
- 빌드 미리보기: `check:layout` 270검사 실패 0, `release-safety` 8항목, `release-metrics`, 3D 탐사길 15항목, 지도 겹침 통과. 단위 테스트 101개.

## 2026-11-19 성능 정리 배포

- 커밋 `cb1175f`(서비스워커·미사용 파일 정리, 개념 영상 manifest 크기를 `d2c11a7` 영상과 맞춤) → `deploy.sh 10`, Version ID `194b2123-df52-44d3-b88f-057dd16c9e15`.
- `cmp.sh`: `index.html`·`index-BeJHJjTV.js`·`sw.js`·개념 영상 manifest MATCH, 영상 Range 206 유지, 삭제 파일 404.
- 운영 주소 완주·안전 7항목·인쇄 1쪽·오류 0, 오프라인 재방문 통과. 첫 화면 1.04초(10Mbps·80ms 모사 1.64초).
- 빌드 미리보기: 단위 테스트 101개, `release-safety` 8항목, `release-metrics`, 3D 탐사길 15항목, 지도 겹침 통과.

## 개선 권장 (판정 밖)

- 1920×1080 인증서는 인쇄용 문서 비율(1080px 고정)이라 아래 여백 약 19%(11-18과 같음, 예외로 둠).
