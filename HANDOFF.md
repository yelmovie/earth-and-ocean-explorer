# 푸른행성 조사본부 인계 (2026-11-09 밤 고도화)

브랜치 claude/upgrade-20261109(미배포). 개념영상 5편을 HyperFrames 「모아의 탐사 노트」(15초, 효과음, 장면 질문·관찰·확대·정리)로 교체했어. 소스는 films/earth-sea-concepts, 장면 시간은 src/concept-data.js 하나로 앱 자막과 공유, 재현은 `TMPDIR=<외장> npm run concepts:render`. 글자 하한(1024 폭 ≥14px, 큰 화면 ≥18px), hover 터치 정리, 대비 수정, 오답 뒤 "다시 보기" 안내, 장별 성취기준 데이터를 넣었고, 쓰지 않는 PNG 원본은 assets/source-png로 옮겨 배포본이 52→21MB. 문구를 바꾸면 scripts/subset-fonts.py(fonttools: DevCaches/pydeps-fonttools)로 글꼴 재생성. 근거: docs/reviews/SCORE·UPGRADE-PLAN·UPGRADE-RESULT-20261109.md.

# 푸른행성 조사본부 인계 (2026-11-07)

최신 작업(제작 현황 시트의 완료작 1·2·3·4·9번 지도 비교): 이동은 5번 자석 도시 방식을 기준으로 맞췄어. 어디서든 끌면 지도 이동, 상단 툴바 손 아이콘은 자유 시점 켜고 끄기, 전체 보기 아이콘은 띠 없이 섬 전체(cover 배율), 걷거나 방향키를 누르면 부리 따라가기로 복귀. 방향키 하나로 비스듬한 길을 따라 미끄러지고(hub-world.js slideOnRoad), 짧게 눌러도 한 걸음 가고, 빈 곳을 눌러도 가까운 길로 걸어. 마지막 위치는 state.mapPosition에 저장, 건물에서 나오면 입구 앞에서 다시 시작하고 모아는 길 뒤쪽에 서(hubPointBehind).
확대: 핀치·휠로 전체 보기 배율부터 기본의 1.6배까지(손가락 중간·커서 지점 고정), 끌다 놓으면 약 260ms 감쇠로 미끄러지고 지도 끝에서 멈춰(움직임 줄이기 설정이면 꺼짐). 카메라는 월드 좌표 중심(hub-world.js clampHubView·anchorHubView·glideHubView)이고, 다시 걸으면 1배 미만 배율만 1로 돌아와. 이 둘은 완료작에 없는 추가 기능이야.
디자인: 잠긴 건물 회색 처리(3번), 다음 목적지까지 빛나는 길·입구 파동, 상단 임무 칩과 기록 점(4번), 주민 짱이·게 말풍선과 복구 후 대사 변화(2·5번, hub-world.js hubResidents), 금색 다음 버튼, 화면 밖 건물 이름 숨김(현재 목적지만 방향 화살표로 고정), 갈매기. 지도 그림은 앱 시작 때 미리 불러와.
검증: npm test 37개 통과, 빌드 성공, 1280×720·1024×768·844×390 화면, 전체 보기, 끌기, 짧은 입력, 주민 대화, 걸어서 입장·복귀 위치, 콘솔 에러 없음. 브라우저 패널이 숨겨진 상태라 걷는 흐름은 프레임을 강제로 돌려 확인했어. 실제 움직임의 부드러움과 터치감은 실제 기기로 봐야 해. 새 문구로 글꼴 재생성.

# 푸른행성 조사본부 인계 (2026-10-29)

최신 작업(1~4번 프로젝트 메인·지도 참고): 타이틀 화면을 위아래 띠·카드 없는 전체화면으로 재구성했어. 새 배경 public/assets/home-deck.jpg(Canva 생성, 원본 assets/generated/20261029)에 큰 로고·금색 시작 버튼·탐사 지도 버튼·기록 5칸 점, 우하단 부리·짱이를 배치(src/screens.js home, experience.css "Title screen" 블록).
지도: 확대 배율 1.3→1.55, 좌측 "지도 둘러보기"(손 아이콘) 켜면 드래그로 지도 이동(grab 커서), 걷기·방향키·건물 이동 시 부리 따라가기로 복귀. 캐릭터 그림 로딩 중에도 지도는 그려짐(hub.js).
교사용: 설정>교사용 가이드>"모든 단계 한 번에 열기" 켜면 스테이지·보고서·엔딩·인증서 화면에 좌하단 방향키 패드(←→ 이전/다음 화면, ↑↓ 이전/다음 스테이지, 키보드 방향키 동일)와 우하단 "다음 스테이지로 바로 가기" 버튼이 떠. 이동만 하고 완료·증거는 기록하지 않아(main.js teacherNav). 해금 끄면 학생 화면에는 안 보여.
검증: npm test 28개 통과, npm run build 성공, 개발·빌드 미리보기에서 1280×720·1024×768·844×390·768×1024 화면, 손 드래그, 방향키 복귀, s1a→인증서 빠른 이동·키보드 이동 확인. 콘솔 에러 없음. 새 문구로 글꼴 부분집합 재생성(fonttools는 외장 SSD DevCaches/pydeps-fonttools).
맥 실행 메모: node_modules가 윈도우 설치본이라 맥용 rolldown·lightningcss·fsevents 바이너리를 lock 버전 그대로 추가해 둠. .claude/launch.json에 개발(5174)·빌드 미리보기(4173) 설정.

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

## 2026-11-07 과학 6~16 순차 개선 · 10번
최초 예상/증거 보존, 손상·미래형식·다중탭 저장 보호, 교사 미리보기 완전 분리, 짧은 화면 툴바 가림·48px 터치 개선. 43단위 테스트와 실제 40과제 완주·8뷰포트·저장안전 검증 통과. docs/reviews/RELEASE-REVIEW-20261107.md, SCORE-20261107.md, UPGRADE-PROMPT-20261107.md 참조. 미리보기의 변경은 새로고침하면 사라지는 임시 기록이다. 정상 학생의 과거 저장은 보존한다. 커밋·배포 안 함.
# 2026-11-12 납품 검증 완료

main의 앱 개선 소스는 `7a98ce4`다. 공개 주소는 https://yelmovie.github.io/earth-and-ocean-explorer/ 이며 main 푸시 시 GitHub Actions가 테스트·빌드 후 Pages에 배포한다.

58개 단위 테스트, 학습400상태·일반56화면·글꼴81화면·탐사40장면, 운영 전체 완주·저장7항목·PDF 한 장·영상5편·음성39개 검증을 통과했다. 최종 점수는9.0/10이고 교사 검수·실물 학교 기기·기존 제공 이미지 이용권 증빙 조건이 남아 있다. 상세 근거는 `docs/reviews/RELEASE-REVIEW-20261111.md`, `SCORE-20261111.md`에 있다.

검증 파일·캐시·임시폴더는 외장 SSD를 사용한다. 기존 `output/` 자료는 보존했다. 아래는 이전 작업 기록이다.

