# 푸른행성 조사본부 — MVP TRD v3

2026-10-22. Vite 8 + ES modules + DOM/CSS + Canvas 2D, 지구 관찰 패널만 동적 Three.js. 원래 엔진을 유지하고 Phaser·UI 프레임워크를 새로 설치하지 않는다.

## 모듈 책임
| 모듈 | 책임 |
|---|---|
| src/data.js | 5장, 6관찰 지점, 4지형, 3생물, 최종5상황, 26routes, base 상대 에셋 |
| src/challenge-data.js | 단계마다8개, 총40개의 활동 정의·응답 검증·저장 정규화 |
| src/state.js | v2 저장키 호환, contentVersion3, 실제 증거/완료/인증/권한 |
| src/screens.js | 기존a/b 2D·메인·보고서·엔딩·인증서와 c/d 연결 |
| src/challenges.js | 선택·복수선택·분류·특징연결·순서 UI, 드래그, 검증, 보상 dialog |
| src/hub-world.js | 960×540월드, 문5개, 도로 graph, 걷기충돌, Dijkstra 경로·입력정규화 |
| src/hub.js / hub.css | 이미지지도·시설·y정렬 캐릭터·발자취동행·카메라·DOM이름표·입장 |
| src/main.js | 경로/공통이벤트·렌더수명·설정·저장경고·실험/관찰 이벤트 |
| src/settingsContent.js / settings.css | 공통순서와문구, 소리·가이드·교사용전체해금·저작권 |
| src/icons.js / audio.js | 공통SVG아이콘, 전역WebAudio BGM/SFX |
| src/design-tokens.css / styles.css | 의미토큰·카드·선택상태·타이포·반응형 |
| src/globe.js / specimens.js | 검수된지리자료·WebGL/2D대체, 생물관찰SVG |

## 상태와 저장
저장키는 기존 blue-planet-hq:v2를 유지한다. version:2는 호환 형식, contentVersion:3은 확장 콘텐츠의 버전이다.

- settings: muted, bgmEnabled, sfxEnabled, volume(배경음0~1), unlockAll, flatGlobe.
- drafts[1~5]: 관찰 중인 표본, 실험 조건과 예상, 사진과 핀, 관측 시각, 생물 특징.
- research[1~5]: answers[활동id], solved[검증 완료id], c/d(각0~3 문제 커서).
- completed/evidence: 완료 시점의 draft와 research를 structuredClone한 독립 스냅샷.
- links/finalDraft/issuedAt: 최종5상황의 증거·이유, 현재 선택, 인증 시각.
- route/resume/history: 현재 위치, 이어하기, 실제 방문 이력.

정의된 id·타입·범위로 입력을 정규화한다. solved 목록을 그대로 신뢰하지 않고 저장된 답을 다시 검증한다. 일부만 채운 분류, 잘못된 복수선택, 뒤집힌 순서, 알 수 없는 id는 완료를 만들지 않는다. 현재 draft를 다시 수정해도 이미 획득한 증거 스냅샷은 보존한다.

v2의 기존 증거는 baseStageValid로 재확인하고 contentVersion2로 보존한다. 새 활동을 수행한 것처럼 답안을 만들지 않는다. v3 증거는 원래 관찰과 확장8개를 모두 검증한다. localStorage 실패는 경고 배너와 메모리 진행으로 처리한다.

## 접근·완료 계약
| 경로 | 일반 학생의 조건 |
|---|---|
| a 관찰 | 1장 또는 앞 장 완료 |
| b 비교 | aReady |
| c 도전 | baseStageValid(a+b) |
| d 적용 | baseStageValid + c의4문제 완료 |
| report/link | 5장 완료 |
| ending/certificate | 최종5상황의 증거와 이유 모두 검증 |

b의 ‘기록하고 도전하기’는 c로 이동하며 배지를 주지 않는다. d의 ‘탐사 배지 받기’는 baseStageValid && researchReady(8개 모두)일 때 completeStage를 호출한다. unlockAll은 canAccess만 우회한다. 완료·증거·최종 연결·인쇄 조건을 우회하지 않는다. 관리자 연습에서도 원래 관찰이 없으면 보상을 만들 수 없다.

## 지도 좌표와 입력
배경1672×941을960×540 월드에 맞춘다. 도로 polyline 주위의 발 반지름6, 허용 도로 폭40, 광장·문 범위를 합집합으로 처리한다. 그래프에 시작·목적지 투영 노드를 연결해 최단 경로를 찾고, 매 프레임 같은 충돌 함수로 이동한다. 먼 바다 클릭은 거절한다. 길 클릭·이름표·방향키/WASD·터치 방향판은 같은 좌표계를 쓴다. 대각선 속도 정규화, 반대 키 상쇄, 독립 keyup을 제공한다.

열린 문에 접근하면 onArrive(1기반id)를 한 번 호출한다. travel은0기반id다. 복귀는 문 아래21px에 배치해 자동 재입장하지 않는다. 잠긴 문은 앞 장 완료 안내만 보여준다. 부리는 y순서로 그린다. 짱이는27px 앞의 실제 발자취를 따라 모퉁이를 돌아간다. 카메라는 cover×1.3(좁은 폭1.25)에서 주인공을 따라간다. resize마다 DOM 이름표와 상단 안전 영역을 갱신한다.

좌표를 가진 이름표와 동행 버튼은 hover에서도 translate 기준을 유지한다. 공통 버튼의 translateY 효과가 지도 앵커를 덮어 클릭 대상이 튀지 않도록 구체적인 선택자를 사용한다.

탭 숨김·창 blur·dialog·inert에서는 키와 자동 경로를 비운다. dispose는 rAF·timer·observer·이벤트를 해제한다. reduced-motion에서는 보행 bob과 복구 파동을 제거한다.

## 에셋 파이프라인
기존 배경·로고·캐릭터10종과 새 섬 PNG는 원본을 보존하고 같은 해상도 WebP를 런타임에 사용한다. 변환은 임시 파일에 저장하고 decode/verify를 통과한 뒤 최종 파일로 교체한다. 이전 변환이 중단되어 불완전한 파일이 남아도 자동 재생성한다.

시설 원본은 references/generated/facilities-atlas.png다. 생성 시트의 행 경계가 정확하지 않아 고정3×2 절단을 사용하지 않았다. 눈으로 확인한 개별 영역에서 추출하고 sourceCrop/alphaBounds/512×512/pivot(256,440)을 facilities-manifest.json에 기록한다. 실화면에서는140worldpx로 같은 문 위치에 접지한다. 원본·생성 프롬프트·추출 스크립트를 보존한다.

지도·시설 이미지가 실패하면 Canvas 대체 그림으로 이동 기능을 유지한다. 과학적 판정은 검수된 관찰 좌표와 설명 데이터를 사용한다. 자원은 모두 로컬 상대 경로다. 시스템 폰트를 사용하며 폰트 파일을 배포하지 않는다.

## UI와 접근성
배경 이미지는 장소, DOM은 글자·버튼·응답·설정, Canvas는 지도 이동을 담당한다. 본문18px, 터치48px, keep-all, focus-visible, 선택 aria-pressed, 결과 role=status, dialog/showModal을 사용한다. 작은 화면은 정보를 숨기지 않고 스크롤한다.

가로 태블릿에서 긴 활동은 확인 바를 sticky로 표시한다. 페이지의4문제를 마쳐 다음 단계 버튼이 생기면 확인 바를 일반 위치로 되돌리고 완료 footer만 고정한다. 모바일 세로는 자연스러운 스크롤을 유지한다. 실제 hit test와 겹침 검수는 artifacts/ui-sticky-results.json에 기록한다.

## 오디오 수명
전역 WebAudio 관리자 하나가 자체 합성 오음계 음악과 효과음을 담당한다. 첫 사용자 입력 후 시작한다. volume은 음악 Gain만 바꾼다. 효과음은 개별 토글·빠른 음소거를 따르며 새 효과음 전에 기존 효과음을 멈춘다. 숨겨진 탭이나 음악 끄기에서는 예약된 음악 노드도 정리하여 재개할 때 겹치지 않는다.

실제 video 요소는 없다. 동기는 설정에서2D 이야기로 다시 본다. 소리 설정은 학습 기록 초기화에도 보존한다. 음소거 상태에서도 모든 학습 안내를 읽을 수 있다.

## 실행과 검증
- npm test: 기존13개 + research5개 + hub3개 =21개 단위 테스트.
- npm run build: 상대 base './'를 쓰는 dist. 해시 경로로 정적 하위 폴더에 배포할 수 있다.
- npm run dev / npm run preview: 로컬5173/4173, 포트가 사용 중이면 Vite가 다음 포트를 선택한다.
- tests/browser_smoke.py: 실제 학생 경로로 관찰·40문제·DATA LINK·인증서·새로고침·설정을 검증한다. 지도는 별도 실입장 검사와 분리한다.
- tests/map_debug.py: 잠긴 문 안내, 열린 문 자동 입장, 복귀 재입장 방지,5문 실제 클릭 이동을 검증한다.
- tests/final_render.py: 관리자 연습26경로의 콘솔·자산 오류와 캐릭터 decode를 검증한다. 실제 완주 판정과 구분한다.
- tests/production_metrics.py: 최종 preview의 새 브라우저 컨텍스트3회에서 초기 용량·시간·요청 호스트를 실측한다.

Playwright와 Pillow는 검증·제작 환경의 도구이며 서비스 의존성이 아니다. 개발 파일·캐시·산출물은 D:에 둔다. exFAT에서 필수 링크 없는 Vite Node 진입점을 유지한다. 개발과 검증 과정의 TEMP/TMP는 D:/DevTemp를 쓴다. artifacts는 캡처와 결과, docs/reviews는 최종 판단을 담는다.

## 범위와 한계
공용 기기의 여러 학생을 계정으로 구분하지 않는다. 다른 학생이 쓰기 전에 기록 초기화를 안내한다. 서비스워커가 없으므로 방문하지 않은 화면을 오프라인에서 새로 불러오는 동작은 보장하지 않는다. 실제 학교망 부하, 학생 대상 학습효과, 제공 이미지의 상업 이용권 증빙은 납품 전 별도 확인한다. 외부 공개 배포는 이번 작업에서 수행하지 않았다.
