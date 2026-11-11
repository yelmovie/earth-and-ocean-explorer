# 푸른행성 조사본부 — 에셋·도구 고지

검토일 2026-11-12. 앱의 설정 > 이미지·소리·저작권 고지에서도 핵심 정보를 볼 수 있다.

## 도구·라이선스 검토
| 대상 | 사용 범위 | 확인 결과 | 남은 확인 |
|---|---|---|---|
| Vite8.3.4 | 개발·정적 빌드 | 설치 패키지 MIT | 의존 라이선스 고지 보존 |
| Three.js0.186.1 | 지구 관찰 패널 | 설치 패키지 MIT | 원저작자 고지 보존 |
| Web Audio / Kenney Interface Sounds | 자체 합성 BGM + CC0 효과음 9종 | Kenney 공식 배포 ZIP의 License.txt 보존, MP3 변환 | 실제 기기 음량 확인 |
| 나눔스퀘어 네오 | 본문·제목·숫자·SVG 글꼴 | 네이버 공식 Regular/Bold/ExtraBold WOFF2, SIL OFL 1.1 원문·출처 동봉 | 새 문구에도 공식 원본 글꼴 사용 |
| 제공된 배경·로고·캐릭터10종 | 기존 프로젝트의 학습·메인·엔딩 그림 | 제공된 생성형AI 이미지로 기록되어 있음 | 최초 생성 계정·상업 이용권 증빙은 제공자 확인 필요 |
| 새 섬·시설5종 | 이 요청에서 생성·적용 | 내장 image_gen 사용, 원본·이력 보존 | 납품 주체의 계정/약관·최종 권리 증빙 확인 |
| Pillow | 전달 포맷 변환·스프라이트 추출 | 설치된 Python 라이브러리, 서비스에 배포하지 않음 | Pillow 배포 라이선스에 따른 도구 사용 |
| Natural Earth | 로컬 육지 경계 | Public Domain | 출처 고지 유지 |

제공 이미지의 최초 생성 계정·사용권 증빙은 납품 주체의 확인이 필요하다. 이미지 생성 이력은 `docs/IMAGE-GENERATION.md`, 운영 배포와 최종 검증은 `docs/reviews/RELEASE-REVIEW-20261111.md`에 기록한다.

## 이미지
- 기존 PNG: logo, terrace, ending, tide, home, observatory, characters, mudflat, coast, lab. 원본을 보존하고 동일 크기 WebP를 실행 화면에서 사용한다.
- expedition-map.webp: 2026-10-22 내장 image_gen 생성 섬, 원본 expedition-map.png는 `assets/source-png/`에 보존하며 배포에서 제외한다. 학습용 가상 탐사 지도다.
- facility-1~5.webp: 새 생성 시설 시트에서 분리한 관측소·실험실·해안 초소·수위 관측탑·생태 시설. 원본 references/generated/facilities-atlas.png, sourceCrop과 pivot은 public/assets/facilities-manifest.json.
- 지도 부리와 홈·이야기·최종 미션·엔딩의 부리/짱이: 2026-10-28 내장 image_gen으로 개별 생성한 투명 일러스트. 기존 캐릭터 시트를 정체성 참고로 사용했다. 지도 수달 모아는 기존 생성 이미지를 유지한다.
- 게·짱뚱어·갈대 관찰 그림: 2026-10-28 내장 image_gen 생성. 실제 사진이나 종 동정 자료가 아닌 학습용 관찰 일러스트다. UI·수치와 연동되는 과학 도해는 프로젝트 자체 CSS/SVG/Canvas다.
- `home-deck.jpg`는 2026-10-29 Canva 이미지 생성(generate-image)으로 만든 바닷가 연구소 데크 타이틀 배경(1920×1080)이다. 원본은 `assets/generated/20261029/home-seaside-deck.jpg`에 보존한다. 납품 전 Canva 계정의 AI 생성물 이용 조건을 확인한다.
- 장면은 현장 사진이 아닌 학습용 재현이다. 위치·날씨·크기·생물의 공간 배치는 과학 사실의 증거로 삼지 않는다.

## 교육 내용·지리 출처
| 범위 | 자료 |
|---|---|
| 교육과정 | 교육부 2022 개정 과학과 교육과정 / 경기도교육청 공개 부록2, [4과06-01~03]. goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202411110127574203.pdf |
| 지표 면적 | NOAA Ocean Service, oceanservice.noaa.gov. 학생 화면은 바다가 더 넓다는 정성 비교로 표현. |
| 육지 경계 | Natural Earth 1:110m land GeoJSON, naturalearthdata.com, Public Domain. public/assets/land.geojson에 포함. |
| 해안·실험·갯벌 | 위 성취기준의 탐구 활동과 기존 프로젝트 설계를 바탕으로 직접 구성. 실제 조석 예보나 위치 안내가 아님. |

## 저작권 안내
ⓒ 2026 옐샘 & 아이스크림미디어. All rights reserved.

앱 화면 캡처·자체 제작 일러스트·자체 제작 음원은 무단 복제·재배포·전용·상업적 이용을 금지한다. 실제 제공 플랫폼의 이용 조건은 그 플랫폼 약관을 따른다.

외부 공개 자료·효과음·폰트의 저작권은 각 원저작자와 소장 기관에 있으며 각 자료의 공개 라이선스와 이용 조건을 따른다. 외부 자료에 프로젝트의 독점 권리를 주장하지 않는다.


## 이번 개선의 추가 에셋 (2026-10-22)
- 수달 모아: 내장 image_gen으로 생성. 원본 `assets/moa-original.png`, 실행용 `moa.webp`, 지도용 `moa-map.webp`. 투명 알파 확인. 생성 프롬프트는 docs/EXPERIENCE-20261022.md.
- 개념 영상 5종은 2026-11-09에 HyperFrames 자체 도해로 교체했다. 1920×1080 원본을 각 15초 / 1280×720 / 30fps로 변환했으며 효과음을 포함한 MP4·WebM와 정지 그림 WebP를 제공한다. 장면·자막 시점은 `src/concept-data.js`, 소스와 검증은 `films/earth-sea-concepts/`에 있다.
- 효과음: https://kenney.nl/assets/interface-sounds · Kenney · CC0 1.0. 원본 `License.txt`를 `public/assets/audio/Kenney-License.txt`에 보존. 원래 파일명과 사용처는 `sources.json`. MP3 변환과 음량 정규화 수행.
- 현재 글꼴은 네이버 나눔스퀘어 네오 공식 원본 WOFF2다. `public/assets/fonts/SOURCE.md`에 출처가 있으며 `NanumSquareNeo-OFL.txt`에 SIL OFL 1.1 전문을 보존한다. BluePlanetDisplay/BluePlanetBody는 이전 부분집합 글꼴의 이름이다. 이전 Jua·Pretendard 파생 파일과 라이선스는 과거 영상 재현 자료로 남아 있다.

## 2026-11-08 밀물·썰물 관측 배경
- `tide-foreshore.webp`는 내장 OpenAI `image_gen`으로 생성한 텍스트 없는 마른 해안 배경 1장이다. 원본은 `assets/generated/20261108/tide-foreshore-original.png`, 제작 기록은 `public/assets/tide-foreshore-manifest.json`에 있다.
- 수면·물 높이·기둥·바위·배와 라벨은 기존 SVG로 그려 고정 배경과 함께 표시한다. 학습용 관측 모형이며 생성 계정과 납품 시 이용 조건은 최종 권리 검토 대상이다.

## 캐릭터 목소리 (2026-11-10)
- 부리·짱이·모아·게·이야기 내레이터 대사 39개: 모모(로컬) Qwen3-TTS 프리셋 목소리로 생성한 AI 합성 음성 · Apache-2.0. 실제 사람 목소리를 쓰지 않음.
- 실행 파일 `public/assets/audio/voices/<대사 id>.mp3`(모노 44.1kHz 96kbps, 약 -16 LUFS). 대사 원문·목소리·길이·SHA-256은 `docs/VOICE-PROVENANCE-20261110.json`.
- 이전 환영 음성 `npc-welcome.m4a`(기본 F1 목소리)는 부리 목소리 `welcome.mp3`로 바꾸고 삭제함.

## 공개 배포와 고지 사본

운영 주소는 [푸른행성 조사본부](https://yelmovie.github.io/earth-and-ocean-explorer/)다. 저장소의 `assets/CREDITS.md`와 배포용 `public/assets/CREDITS.md`는 같은 내용을 유지한다. 공개 배포에서는 `assets/CREDITS.md`로 제공한다.

## 2026-11-12 해안과 증발 결과 관찰 그림

- 내장 OpenAI image_gen으로 해안 4종과 그릇 바닥 2종을 개별 생성했다. 원본은 외장 SSD 프로젝트의 assets/generated/20261112/에 보존했다.
- coast-cave·coast-arch·coast-cliff·coast-sand는 960×720 WebP다. residue-salt·residue-clear는 640×640 투명 WebP다. SHA-256, 크기, 바이트 수와 알파 범위는 public/assets/illustrations/manifest.json에 기록했다.
- 해안은 학습용 재현 그림이다. 동굴과 아치의 비교는 표시한 예시의 관찰 특징을 다룬다. 그릇 그림은 이번 가열 실험의 결과를 확대한 예시이며 실제 성분·염분을 정량 측정한 자료가 아니다.
- 새 해안 사진은 photoVersion 2 기록에서 사용한다. 이전 핀 좌표가 있는 기록은 기존 사진을 표시한다.
- 생성 플랫폼과 납품 계정의 이용 조건·권리 증빙은 납품 주체가 확인한다. 제작 범위와 프롬프트 요지는 docs/IMAGE-GENERATION.md에 기록했다.
