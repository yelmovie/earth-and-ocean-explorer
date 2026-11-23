# 10번 푸른행성 조사본부 — 요청 항목 로컬 수정·검증

2026-11-23. 대상은 `yelmovie/earth-and-ocean-explorer` 하나다. 이 문서는 지정된 최종검수 수정 항목의 로컬 근거이며, 운영 배포나 실기기 검수 완료 판정은 아니다.

## 기준과 작업 범위

- 원격 기본 브랜치 `main`: `35aad7c1e0def4cf7be6a6b4107a033de7936d5d`. 시작 전·작업 중·커밋 전 `git ls-remote --symref`로 같은 값을 확인했다.
- 독립 얕은 clone: `/Users/yel/Documents/Codex/2026-11-23/task-3/earth-and-ocean-explorer`.
- 로컬 브랜치: `fix/final-review-science-10-20261123`.
- 저장소의 README·HANDOFF·PRD·TRD·최근 교사/검수 기록과 기존 검사를 대조했다. 저장소와 상위 경로에 AGENTS.md가 없고, 저장소 `.agents/skills`도 없다. 홈 `.agents/skills` 목록 및 Aside 지침을 확인했다.
- 게임공통설계 원문·학습 상호작용 기준과 로컬 태블릿 3D 스킬을 적용했다. 최종점검은 요청된 기능·재시도·터치·로컬 빌드 범위에 한정했다.
- 기존 사용자 체크아웃·다른 프로젝트·Antigravity·Beatbound·앱 설정은 변경하지 않았다. 재시작, push, 원격 브랜치 작성, 운영/프리뷰 배포, 시트 수정, 외부 발송을 하지 않았다. 아래 미리보기는 localhost 프로세스다.

## 수정 전 재현과 변경

| 위치 | 최신 코드에서 재현한 문제 | 최소 변경 및 결과 |
| --- | --- | --- |
| 1장 관찰 | 3/3을 채워도 진행률 아래에 대기 미완 안내가 없었다. | `남은 일: 대기 확인`을 진행률 바로 아래에 표시한다. 세 번째 지점 직후와 새로고침에서도 동작한다. 기존 문단 숨김 CSS의 영향과 짧은 화면 넘침을 함께 수정했다. |
| 1장 분류 | 오답 제출 뒤 어떤 표본을 고칠지 표시되지 않았다. | 제출 후 틀린 표본만 `다시 보기`와 테두리로 표시한다. `어떤 부분을 보고 골랐나요?`와 땅·물 단서를 제시하고 기존 선택을 보존한다. 수정하면 해당 강조가 사라진다. |
| 2장 도전 | `예상→조건→가열→비교`만 통과하고 `조건→예상→가열→비교`는 거절했다. | 선행 관계를 검사한다. 예상·조건 맞추기가 모두 가열 전이고 비교가 가열 후인 두 순서를 인정한다. 중복·누락·미등록 카드와 나머지 22개 순서는 거절한다. 관찰/도전/해설에 같은 양·세기·시간, 함께 가열 종료 후 비교를 일치시켰다. |
| 3장 비교 | 틀린 특징을 고르면 다음 지형으로 안내되고, 오답 카드도 완료 표시와 특징 수에 들어갔다. | 본 사진 수와 정확히 분류한 수를 구분한다. 정답 특징과 핀이 함께 있어야 완료로 표시한다. 오답 지형에 머물고 `다시 고르기`를 글로 표시한다. 하단 안내도 같은 지형을 가리킨다. |
| 4장 비교·안전 | 과정 이름과 한 시각의 상태를 구분하는 표시, 공식 물때의 장소·날짜 안내가 부족했다. | 같은 장소의 두 시각·같은 기둥/바위 비교를 유지한다. 그림에 높은/낮은/중간 물 높이 상태를 표시하고 질문에서 상태 비교와 움직이는 과정을 구분한다. 도움말·안전 도전·탐사길에 해당 장소·날짜의 공식 물때와 현장 안내를 어른과 확인하도록 명시했다. |
| 최종 증거 연결 | 한 항목만 고르고 다른 상황으로 갔다 돌아오면 선택이 사라졌다. | 상황별 미완 선택을 `finalDrafts`에 보관한다. 현재 `finalDraft`와 완료 증거 `links`를 유지한다. 수동/자동 다음 상황 이동 및 새로고침 뒤 선택을 복원하고 증거/이유 중 빠진 항목을 표시한다. 미완 선택으로 완료나 인증서를 만들지 않는다. |

2장 관찰 화면의 두 준비 순서, 시작 시 WebGL 불가에 대한 2D 대체, 교사 미리보기의 학생 기록 분리, 기존 영상·인증서 기능은 이미 구현돼 있어 애플리케이션 코드를 중복 수정하지 않고 회귀 확인했다. 5장 생물 특징→근거→보전 행동과 5장 구조·조사 카드·보고서·인증서·기존 에셋을 유지했다.

## 검증 방법과 증거

최종 실행 결과는 이 문서와 같은 체크아웃의 `artifacts/final-review-20261123/`에 보존한다. 이 폴더는 Git에서 제외되며 원격에 올리지 않았다.

| 검사 | 실행/확인 범위 | 증거 |
| --- | --- | --- |
| 단위 회귀 | `npm test`: 111개. 순서 24개 전수 조합, 저장 호환·완료 분리, 재시도·과학 문구 포함. | `unit.log` |
| 빌드 | `npm run build`. lint/typecheck 스크립트는 이 저장소에 없다. | `build.log` |
| 기존 자동 배치 | 1280×800·1024×768·1920×1080·915×412의 120상태 모두 통과. 자동 관찰·정지/재개·가열 중 이동·관찰 후 24상태도 통과했다. | `layout/layout.json`, `layout/flow.json` |
| 지정 회귀 | `tests/final-review-browser.mjs`: 8개 흐름. 터치 탭, 키보드 대체 입력, WebGL 초기화 불가, 두 준비/도전 순서, 해안 오답 복귀, 미완 선택 복원. 밀도 높은 6개 상태를 4크기(24상태)로 추가 검사한다. | `priority/verification.json`, 상태별 PNG |
| 일반 학생 경로 | 저장 주입·교사 해금 없이 인트로→지도→허용된 1장 해시 입장, 이후 5장 관찰·비교·20과제·보상·보고서·최종5상황·엔딩·인증서를 실제 조작한다. 지도 걷기 자체의 전수 검사는 아니다. | `journey/verification.json`, `journey/completed-state.json` |
| 영상·출력 | 인트로 27.833초·엔딩 27.792초(1280×720)를 재생하고 실제 자연 종료를 확인한다. Chromium PDF 인쇄 1쪽과 실제 PNG 다운로드(2400×1697)를 생성하고 화면/PNG를 시각 검토했다. 실물 프린터 출력은 아니다. | `journey/story-*.png`, `journey/certificate.pdf`, `journey/certificate.png` |
| 저장·교사·터치 | `tests/release-safety.mjs`: 교사 기록 분리, 다중 탭 충돌, 손상/미래 저장 원본 보호, 명시적 초기화, 파생 해금, 다중 터치 소유권, 옛 증거 보존. | `safety/safety.json` |
| 3D 탐사길 | `tests/tide-walk-browser.mjs`: 키보드·화면 방향 버튼, 안내판/세 생물/복귀, 오답 이력·배지·재시작, 크기별 배치, 2D/동작 줄이기/WebGL 실패 대체. 빠른 모드로 타이머 경로를 생략하지 않고 17항목 모두 통과했다. | `tide-walk/report.json`, 상태별 PNG |
| 글꼴 | 실제 사용하는 NanumSquareNeo 3종에서 소스의 한글 648자 누락 0. 이전 생성 스크립트가 만든 현재 미사용 글꼴 3개는 이 작업에서 생성한 파일만 정리했다. 기존 폰트·에셋은 변경하지 않았다. | 로컬 fontTools cmap 대조 |

주요 재실행 명령(기존 Playwright 경로를 사용하며 새 서비스 의존성을 추가하지 않는다):

```sh
npm test
npm run build
GAME_URL=http://127.0.0.1:5183 QA_OUTPUT=artifacts/final-review-20261123/layout QA_SIZES=1280x800,1024x768,1920x1080,915x412 npm run check:layout
GAME_URL=http://127.0.0.1:4183 QA_OUTPUT=artifacts/final-review-20261123/priority node tests/final-review-browser.mjs
GAME_URL=http://127.0.0.1:4183 QA_OUTPUT=artifacts/final-review-20261123/journey node tests/release-browser.mjs
GAME_URL=http://127.0.0.1:4183 QA_OUTPUT=artifacts/final-review-20261123/safety QA_STATE=artifacts/final-review-20261123/journey/completed-state.json node tests/release-safety.mjs
GAME_URL=http://127.0.0.1:4183 QA_OUTPUT=artifacts/final-review-20261123/tide-walk node tests/tide-walk-browser.mjs
```

## 발생한 오류와 처리

- 처음 읽기 전용 `git status --short --branch`는 종료 코드 0이었지만 macOS 임시 `xcrun_db` 캐시 생성 권한 오류를 출력했다. 권한·앱·Git 설정을 바꾸지 않았다. 승인된 로컬 변경/검증 명령은 표준 도구 권한 경로로 실행했다. 자동 승인 심사 거절은 없었다.
- 없는 저장소 `.agents` 경로를 포함한 목록 명령은 `No such file or directory`를 반환했다. 이후 존재 여부를 확인해 미제공으로 기록했다. 작업공간 의존성 조회 도구도 이 위임 스레드를 지원하지 않아, 이미 설치된 Node/Playwright/Chrome 경로를 확인해 사용했다.
- Aside 지침은 CLI 업데이트를 요구했지만 기존 환경 변경 금지 지시에 따라 실행하지 않았다. 저장소의 기존 격리 Playwright 검사를 사용했다.
- 편집 스크립트 문법 오류는 소스 적용 전에 멈췄고 바로잡았다. 초기 재현 스크립트의 저장 주입 후 문서 로드 누락, 개발 서버 초기 문서 전환 대기도 수정했다.
- 2장 새 허용 순서를 예전 오답 검사로 간주하던 테스트는 실제 잘못된 가열 전후 순서를 검사하도록 갱신했다. 기존 브라우저 검사도 현재 영상, 인증서 `.cert-paper`, 숫자 제거, `firstTry`/`missed` 저장 형식과 재시도 이력에 맞췄다. 앱의 이미 수정된 기능을 되돌리지 않았다.
- 실행 중 발견한 대기 안내 숨김·짧은 화면 넘침·해안 안내 불일치는 수정 후 같은 검사로 재확인했다. 실패를 통과로 숨기거나 검사 자체를 건너뛰지 않았다.

## 과학·안전 문구 근거와 남은 범위

과정과 상태의 구분은 [NOAA 조석 교육 자료](https://oceanservice.noaa.gov/education/tutorial_tides/tides01_intro.html)를 대조했다. 현장 정보 확인 경로는 [국립해양조사원 스마트 조석예보](https://www.khoa.go.kr/swtc/main.do), 체험 안전 안내는 [해양경찰청 갯벌 안전수칙](https://www.korea.kr/news/policyNewsView.do?newsId=148916340)을 참고했다. 이 게임의 시각·높이는 설명용 모형이며 현장 출입 판단 자료가 아니다.

검증 환경은 macOS의 격리 헤드리스 Chrome/Chromium과 터치 에뮬레이션이다. 실제 iPad·Android 태블릿·전자칠판의 터치감/음량/가독성, Safari, 실제 프린터, 교실 학습 효과와 운영 주소는 이번 작업에서 검증하지 않았다. 원격 push·배포·시트 수정·외부 납품은 별도 승인 범위로 남는다.
