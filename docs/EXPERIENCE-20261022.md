# 모아·개념 영상·터치 활동 개선

요청한 범위: 단계 완료 뒤 개념 영상, 태블릿/전자칠판 화면 균형, 공개 라이선스 효과음, 동물 길잡이, 직접 조작하는 탐구 활동. 기존 5장·20화면·확장 40문제와 실제 증거를 요구하는 완료 조건을 유지했다.

## 적용 내용

| 장 | 직접 조작과 관찰 | 개념 영상 |
|---|---|---|
| 지구 | 기존 3D 회전·스캔 + 내 표본 카드의 터치 분류 | 육지·바다·대기, 표본 개수와 전체 면적의 구분 |
| 물 | 양·가열 세기 슬라이더에 실시간 반응, 2.4초 가열 관찰 | 같은 조건 → 물의 증발 → 남은 물질 |
| 해안 | 손가락으로 쓸어보기, 촬영 반응, 특징 핀 | 모래사장·절벽·동굴·구멍 난 바위 |
| 조석 | 시간축 스크러빙·자동 관측, A/B 저장과 비교선 | 같은 기준물에서 밀물·썰물 비교 |
| 갯벌 | 움직이는 돋보기로 흔적 찾기, 확대 관찰·도감 기록 | 생물의 다양한 특징과 서식처 보호 |

확장 활동의 분류·특징 연결은 실제 Pointer Events 드래그와 카드→보관함 누르기를 함께 지원한다. 순서 활동도 끌기/누르기로 조작한다. 실험·사진·생태 특징·문제 풀이 기록은 기존 저장 형식을 사용한다. 애니메이션·영상만으로 완료나 인증서를 주지 않는다.

## 영상 설계와 연결

- 5편 × 9초, 1280×720 / 24fps. MP4(H.264)·WebM(VP9)·끝 장면 WebP. 무음으로 렌더하고 큰 DOM 자막을 시간에 맞춰 표시한다.
- 관찰 완료, 비교 완료, 도전 완료, 적용 보상에서 해당 장 영상을 연다. 모든 학습 화면 하단에 다시 보기가 있다. 영상이 끝나도 저절로 다음 활동으로 넘어가지 않는다.
- 학생/교사가 재생·멈춤·처음부터·다음 활동을 선택한다. 동작 줄이기에서는 직접 재생한다. 재생 실패 때는 포스터와 전체 개념 문장으로 대체한다.
- 영상 중 BGM을 멈추고 종료/닫힘에 복구한다. 닫을 때 소스·타이머·이벤트를 정리한다. Escape·브라우저 뒤로가기는 예전 다음 활동을 실행하지 않는다.

각 영상은 인물이 없는 교육 도해다. 카메라는 고정, 정면, 16:9 전체 도해 구도를 유지한다. AI 영상 생성 대신 SVG→sharp→FFmpeg를 사용해 형태·시간·개념을 결정적으로 렌더했다. 사람 캐릭터 시트는 필요하지 않다.

| 영상 | 0–3초 | 3–6초 | 6–9초 / 종료 구도 |
|---|---|---|---|
| 지구 | 육지·바다 관찰 | 전체 면적 그림 등장 | 전체 자료와 표본 구분, 두 그림 유지 |
| 물 | 같은 두 그릇 | 수면이 낮아지고 수증기 등장 | 바닷물 쪽 흰 물질, 비교 구도 유지 |
| 해안 | 모래사장·절벽 강조 | 절벽·동굴 강조 | 구멍 난 바위 강조, 네 지형 유지 |
| 조석 | 동일 기둥에서 높아지는 물 | 밀물에서 썰물로 전환 | 낮아진 수면과 고정 기준물 유지 |
| 갯벌 | 생물과 뿌리 등장 | 서로 다른 모습과 움직임 | 보호 표시, 생물의 집 구도 유지 |

CAMERA: static · no speed · full diagram framing · final comparison held. SCENE: 기존 크림·청록·남색 팔레트, 같은 크기·위치의 비교 대상, 글자와 음원은 영상에 굽지 않음. 생성 코드는 `scripts/render-concepts.mjs`, 자막은 `src/concepts.js`에 있다. `FFMPEG_PATH`와 `SHARP_PATH`로 다른 환경의 로컬 도구를 지정할 수 있다.

## 화면과 흐름

- 제목 28–44px, 주요 본문 20–28px, 보조 라벨 17–24px. Jua/Pretendard를 부분집합으로 만들어 약 228KB로 제공한다. 파생 글꼴의 내부 이름까지 BluePlanetDisplay/BluePlanetBody로 변경하고 OFL 원문을 동봉했다.
- 팝업은 `inset:0; margin:auto`로 가운데에 놓고 내용 높이에 맞춘다. 머리/버튼 영역은 유지하고 긴 내용만 안쪽에서 스크롤한다. 배경 blur는 사용하지 않는다.
- 반복되는 목표·인물 안내·중복 선택 라벨을 줄였다. 추가 설명과 모아의 힌트는 펼칠 때 보인다. 배경 위 흰 막을 줄여 장소 그림이 보이게 했다.
- 문제 확인·다음 문제·다음 단계 버튼은 하단 한 자리에 나오며 짧은 스크롤 중에도 화면에 남는다. 이미 푼 문제의 비활성 확인 버튼을 함께 늘어놓지 않는다. 촬영 슬라이더는 사진 밖으로 옮겨 촬영 지점을 가리지 않는다.
- 지도에서 모아는 주인공의 발자국을 따라간다. 활동마다 모아의 힌트는 현재 단계/문제의 관찰 단서를 보여 준다.

## 효과음·캐릭터 출처

효과음 9종: Kenney Interface Sounds, https://kenney.nl/assets/interface-sounds, CC0 1.0. 다운로드 ZIP의 라이선스와 파일명 대응을 `public/assets/audio`에 보존했다. MP3 변환·음량 정규화 후 선택·스캔·촬영·드롭·힌트·정답·다시 생각하기·보상·가열에 배치했다. 효과음은 동시에 하나, BGM·효과음은 개별 스위치를 사용한다. 음량 슬라이더는 BGM만 조절하고 탭이 숨으면 모두 정지한다.

수달 모아는 내장 image_gen으로 만든 투명 배경 캐릭터다. 원본 `assets/moa-original.png`, 실행용 `public/assets/moa.webp`, 지도용 `moa-map.webp`. 알파 0–255 확인.

사용 프롬프트: “One small sea otter companion named Moa, full body standing in a friendly three-quarter front view, one paw raised as if offering a clue. Chestnut fur, cream muzzle and belly, small round ears, dark expressive eyes, tiny teal explorer neckerchief, visible tail. Tasteful hand-painted 2D storybook game art for ages 8–10, warm cream/navy/teal palette, clean silhouette, soft shading. One character only, genuinely transparent background, no text, frame, scenery or collage.”

## 검증

- `npm test`: 21개 통과. 저장·완료·해금·실제 증거 조건 유지.
- `tests/browser_smoke.py`: 실제 조작으로 5장/확장 40문제 → 최종 5상황 → 엔딩·인증서, 새로고침, 관리자 기록 분리, 초기화 취소 포커스 통과.
- `tests/experience_check.py`: 1280×800 / 1280×720 / 1024×768 / 1920×1080, 전체 26경로 및 40문제별 224상태. 가로 넘침·48px 미만 조작 영역·80px를 넘는 학습 화면 스크롤 0건. 실제 터치 드래그·해안 쓸기·돋보기, 실시간 슬라이더, 가열, 비교선, 영상 5편, 동작 줄이기, 실패 대체·닫기·뒤로가기 확인.
- 결과: `artifacts/experience/verification.json`, 화면 모음: `artifacts/experience/tablet-contact-sheet.jpg`. 정적 하위 경로에서 26경로·영상 5편·글꼴·소리·학습 기록 분리도 통과했다 (`tests/production_flow.py`).

실제 학교 태블릿/전자칠판 하드웨어에서의 후열 가독성·터치감·스피커 음량은 현장 확인이 남아 있다. 브라우저 자동 검증은 실제 학습 효과 검증을 대신하지 않는다. 새 문구를 추가하면 `python scripts/subset-fonts.py` 후 빌드한다.
