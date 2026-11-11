# 푸른행성 조사본부

2026-10-28 일러스트 개선: 지도 부리와 홈·이야기·최종 미션·엔딩의 부리/짱이는 개별 생성 투명 이미지를 공유한다. 갯벌 게·짱뚱어·갈대도 생성 관찰 그림으로 교체했다. 실행 자산은 `public/assets/illustrations/`, 생성 이력과 프롬프트는 `docs/IMAGE-GENERATION.md`에 있다. `tests/illustration_check.py`로 전체 페이지·이미지 해독·지도 이동·실패 후 재시도를 확인한다.

지구와 바다를 관찰하고, 근거를 비교하고, 갯벌을 지킬 행동을 제안하는 교육 탐사 게임 MVP.

- 스테이지 선택: 부리·짱이와 흙길을 걷는 2.5D 픽셀 RPG 지도.
- 시설 내부: 5장 × 관찰·비교·도전·적용 4화면, 총20개 학습 화면.
- 장마다 확장8문제, 총40개 추가. 분류·특징 연결·순서 배열·관찰·상황 적용.
- 실제 증거로 받는 배지5개, 시설 복구, 최종5상황 DATA LINK, 엔딩과 인증서.
- 설정의 교사용 전체 해금 하나로 26개 경로 접근. 실제 학습·보상 기록은 별도.

## 실행
Node24와 npm을 사용한다. 기존 설치가 있으면 설치를 반복하지 않는다.

~~~powershell
$env:TEMP = 'D:\DevTemp'
$env:TMP = 'D:\DevTemp'
npm ci --no-bin-links --cache .cache/npm
npm run dev
~~~

http://127.0.0.1:5173 에서 시작한다. exFAT 환경을 위해 스크립트는 Vite의 Node 진입점을 직접 실행한다.

~~~powershell
npm test
npm run build
npm run preview
~~~

Windows/exFAT에서는 preview를 종료한 뒤 다시 빌드한다. 실행 중인 preview가 dist 파일을 잡으면 빌드 정리에 실패할 수 있다.

배포 파일은 dist다. 상대 base와 hash 경로를 사용한다. 운영 주소는 https://yelmovie.github.io/earth-and-ocean-explorer/ 이며 main 푸시 시 `.github/workflows/deploy.yml`이 단위 테스트·빌드를 통과한 dist를 GitHub Pages에 배포한다. 배포 결과는 Actions와 `docs/reviews/RELEASE-REVIEW-20261111.md`에서 확인한다.

운영 주소·로컬 개발 주소·미리보기 주소는 서로 다른 저장 공간을 사용한다. 학생은 같은 운영 주소와 브라우저에서 이어서 활동한다.

## 검증
Node 단위 테스트: 저장·완료·해금·인증·40개 확장 활동·지도 30개 경로를 검사한다.
납품 브라우저 검증은 기존 Playwright 설치를 사용한다. `PLAYWRIGHT_RUNNER`에 Playwright가 설치된 package.json의 절대 경로, `BROWSER_PATH`에 Chrome 또는 Edge 실행 파일을 지정할 수 있다. 결과는 외장 SSD의 `artifacts/`에 남긴다.

- 개발 서버에서 `npm run check:layout`으로 전체 활동 배치와 자동 관측을 검사한다.
- 빌드 미리보기에서 `node tests/release-browser.mjs`로 실제 조작 완주·새로고침·인증서 출력을 검사한다.
- `node tests/release-safety.mjs`로 저장 보호·교사 시연 분리·다중 터치를 검사한다. `QA_STATE`는 앞 완주 검사의 `completed-state.json`을 가리킨다.
- `node tests/release-metrics.mjs`로 첫 로딩·개념 영상·음성·동작 줄이기를 검사한다.
- `GAME_URL`로 검증할 주소, `QA_OUTPUT`으로 외장 결과 폴더를 지정한다. 학교 실제 기기와 학생의 학습효과 확인은 별도다.

## 콘텐츠 변경
- 장/원래 관찰: src/data.js, src/screens.js, src/state.js.
- 확장 활동: src/challenge-data.js. choice/multi/sort/match/order 스키마를 따른다. 각 장 c/d에4개씩 둔다. id는 중복하지 않는다. prompt는 할 일 한 문장, clue는 관찰 가능한 근거로 작성한다. 정답 데이터 변경 후 저장 호환과 tests/research.test.js를 확인한다.
- 지도: src/hub-world.js의 도로/문을 배경과 함께 바꾼다. 모든 문까지 실제 경로 테스트를 실행한다. 그림만 바꾸고 좌표를 그대로 두지 않는다.
- 설정 문구: src/settingsContent.js. 버전은 package.json에서 읽는다.
- 디자인 토큰: src/design-tokens.css. 화면별 규칙은 styles.css/hub.css/settings.css.

## 기록과 운영
이름·학번·연락처를 받지 않는다. 같은 주소·브라우저의 localStorage에 기록한다. 공용 기기를 다른 학생에게 주기 전 설정에서 기록을 초기화한다. 초기화는 확인을 거치며 소리 설정은 보존한다. 브라우저 저장을 지우면 복구할 수 없다. 완전 오프라인 앱은 아니다.

## 문서
- docs/PRD.md — 교육 목표·각 장의 활동·보상·수용 기준
- docs/TRD.md — 구조·상태·권한·지도·검증 계약
- docs/DESIGN-SYSTEM.md — 색·타이포·크기·반응형
- docs/reviews/FINAL-CHECK-20261022.md — 최종 근거·남은 확인
- assets/CREDITS.md — 제공/생성 자산과 라이선스 검토
- docs/IMAGE-GENERATION.md — 새 이미지 생성 이력·프롬프트

공동 제작: 옐샘 & 아이스크림미디어. 외부 자료의 권리는 각 원저작자와 해당 이용 조건을 따른다.


## 모아와 함께하는 조작·개념 영상
5장마다 15초짜리 개념 영상을 연결했다. 모아의 힌트를 펼쳐 **개념 영상**을 누르면 볼 수 있다. 질문·관찰·확대·정리 장면을 직접 고르고 재생·멈춤·다시 보기를 할 수 있다. 동작 줄이기 설정에서는 수동 재생하며 재생 실패 시 개념 그림을 제공한다. 장을 처음 완료하면 배지 화면에서 다음 장 또는 지도를 고르고, 재방문에서는 다음 탐사로 이어 간다.

수달 모아는 지도에서 주인공의 발자국을 따라오고, 각 단계에서는 접는 힌트로 단서를 준다. 표본 분류와 확장 카드 활동은 터치 드래그·두 번 누르기를 함께 지원한다. 실험은 슬라이더와 시간에 따른 가열, 해안은 쓸어보기와 촬영, 조석은 시간 재생과 A/B 비교선, 갯벌은 끄는 돋보기를 사용한다.

2026-10-28 조작 개선: 지구 지점과 해안 표시는 누르는 즉시 기록·촬영한다. 갯벌은 특징 선택으로 도감을 기록하고, 확장 40문제는 답이 완성되면 자동으로 확인한다. 분류·연결 활동의 다음 미분류 카드는 자동 선택되며 직접 수정과 드래그도 가능하다. 다음 문제는 학생이 직접 넘긴다. 정답·해금·증거 저장 조건은 그대로다.

`tests/flow_polish.py`는 연타·키보드·이전 저장 재개·가열 중 이탈·타임랩스·비교선 유지 회귀를 확인한다. 변경 범위와 검증 근거는 `docs/reviews/FLOW-POLISH-20261028.md`에 기록한다.

`npm run check:layout`은 설치된 Node Playwright로 전체 활동·40개 문제·자동 관측을 확인한다. `npm run concepts:render`는 HyperFrames·FFmpeg를 사용하며, 재현 경로는 scripts/render-concepts.mjs를 참고한다. 납품 최종 근거는 `docs/reviews/RELEASE-REVIEW-20261111.md`와 `SCORE-20261111.md`에 있다.
