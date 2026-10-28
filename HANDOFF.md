# 푸른행성 조사본부 인계 (2026-10-28)

최신 시각 작업: image_gen으로 부리·짱이·게·짱뚱어·갈대 5종을 개별 생성해 홈/지도/이야기/최종 미션/엔딩과 갯벌 활동/도감/보고서에 적용했어. 지도 사각형 오리·CSS 시트 크롭을 제거했고, 투명 WebP와 지도용 소형 부리를 사용해. 주요 파일은 illustrations.js·specimens.js·hub.js·screens.js·experience.css, 자산은 public/assets/illustrations. 생성 프롬프트·검증은 docs/reviews/ILLUSTRATIONS-20261028.md를 봐. 원본은 assets/generated/20261028에 보존했어.

최신 작업: 전체 스테이지의 반복 조작을 줄였어. 지구 지점·해안 표시 한 번으로 기록, 갯벌 특징 선택 즉시 기록, 40문제 답 완성 즉시 검증, 분류/연결 다음 카드 자동 선택. 중간 강제 영상 15회를 없애고 장 완료는 배지와 다음 장 바로가기로 연결했어. 정답·저장·증거·해금 조건 유지.
추가 안정화: 실험 조건 실시간 안내, 가열 중 이탈 후 재시작, 타임랩스 끝/수동 조작 시 정지, 비교선 위치 보존, 이전 저장 재개, 한 입력에 중복 효과음 제거. 글꼴도 새 문구로 재생성했어.
최신 검증: Node 28개, 실제 5장·40문제·최종 5상황·인증서 완주, 4해상도 224상태, 터치·연타·키보드·이탈 회귀 통과. 상세 근거는 docs/reviews/FLOW-POLISH-20261028.md, artifacts/browser-verification.json, artifacts/experience/verification.json, artifacts/flow-polish/verification.json.

아래는 2026-10-22 구축 당시 기록이야. 현재 단계 완료는 영상을 자동으로 열지 않고, 하단 개념 영상 버튼으로 선택 재생해.
목표: 초3 지구·바다 탐사를 태블릿/전자칠판에서 직접 조작하며 배우는 게임으로 개선.
완료: 기존 5장·20화면·확장 40문제 유지. FFmpeg 개념 영상 5편(각 9초, MP4/WebM/포스터)과 큰 DOM 자막을 각 단계 완료/다시 보기에 연결. 수달 모아 생성, 지도 추종·현재 문제 힌트 적용. CC0 Kenney 효과음 9종, 소리 개별 설정·영상 중 BGM 정지. 표본 터치 분류, 실시간 실험 슬라이더·가열, 해안 쓸기·촬영, 조석 시간축·비교선, 갯벌 돋보기 구현. 팝업 중앙 배치·큰 글자·중복 안내 축약·하단 다음 버튼 고정.
검증: npm test 21개, 실제 40문제→최종 미션→인증서 완주 통과. 4해상도×26경로/40문제 224상태, 터치·영상 실패 대체·뒤로가기 검증. 정적 하위 경로 통과, 빌드 성공.
핵심: src/experience.css, concepts.js, companion.js, interactions.js, screens.js, challenges.js, main.js, audio.js.
자료: docs/EXPERIENCE-20261022.md, artifacts/experience/verification.json·tablet-contact-sheet.jpg. public/assets/concepts·audio·fonts, assets/moa-original.png와 CREDITS.md에 원본/출처. 영상 재현 scripts/render-concepts.mjs, 글꼴 재현 scripts/subset-fonts.py.
다음: 실제 학교 태블릿·전자칠판에서 터치감·뒷자리 가독성·음량 확인 후 필요한 부분만 조정.
주의: 현재 프로젝트는 F:/iscreammedia_sc34/10 earthsea. 저장/정답/해금 조건 보존. 새 문구 뒤 글꼴 부분집합 재생성. npm run dev의 실제 출력 포트 확인(이번 검증은 5174). 브라우저 검증은 설치된 Python/Playwright를 쓰며 서비스 의존성은 추가하지 않아. 반말로 소통.
