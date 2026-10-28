# 푸른행성 조사본부 — 에셋·도구 고지

검토일: 2026-10-22. 앱의 설정 > 이미지·소리·저작권 고지에서도 핵심 정보를 볼 수 있다.

## 도구·라이선스 검토
| 대상 | 사용 범위 | 확인 결과 | 남은 확인 |
|---|---|---|---|
| Vite8.3.4 | 개발·정적 빌드 | 설치 패키지 MIT | 의존 라이선스 고지 보존 |
| Three.js0.186.1 | 지구 관찰 패널 | 설치 패키지 MIT | 원저작자 고지 보존 |
| Web Audio / Kenney Interface Sounds | 자체 합성 BGM + CC0 효과음 9종 | Kenney 공식 배포 ZIP의 License.txt 보존, MP3 변환 | 실제 기기 음량 확인 |
| BluePlanetDisplay / BluePlanetBody | Jua / Pretendard 파생 글꼴 | SIL OFL 1.1, 부분집합·내부 이름 변경, 원문 동봉 | 새 문구 추가 시 subset-fonts.py 재실행 |
| 제공된 배경·로고·캐릭터10종 | 기존 프로젝트의 학습·메인·엔딩 그림 | 제공된 생성형AI 이미지로 기록되어 있음 | 최초 생성 계정·상업 이용권 증빙은 제공자 확인 필요 |
| 새 섬·시설5종 | 이 요청에서 생성·적용 | 내장 image_gen 사용, 원본·이력 보존 | 납품 주체의 계정/약관·최종 권리 증빙 확인 |
| Pillow | 전달 포맷 변환·스프라이트 추출 | 설치된 Python 라이브러리, 서비스에 배포하지 않음 | Pillow 배포 라이선스에 따른 도구 사용 |
| Natural Earth | 로컬 육지 경계 | Public Domain | 출처 고지 유지 |

상업 납품 판정: 외부 공개 배포는 하지 않았다. 제공 이미지의 최초 생성·사용권 증빙을 확인하기 전에는 상업 이용권이 전부 검증됐다고 선언하지 않는다. 비상업 전용 사진·유료 폰트·Remotion은 추가하지 않았다.

## 이미지
- 기존 PNG: logo, terrace, ending, tide, home, observatory, characters, mudflat, coast, lab. 원본을 보존하고 동일 크기 WebP를 실행 화면에서 사용한다.
- expedition-map.webp: 2026-10-22 내장 image_gen 생성 섬, 원본 expedition-map.png 보존. 학습용 가상 탐사 지도다.
- facility-1~5.webp: 새 생성 시설 시트에서 분리한 관측소·실험실·해안 초소·수위 관측탑·생태 시설. 원본 references/generated/facilities-atlas.png, sourceCrop과 pivot은 public/assets/facilities-manifest.json.
- 지도 부리와 홈·이야기·최종 미션·엔딩의 부리/짱이: 2026-10-28 내장 image_gen으로 개별 생성한 투명 일러스트. 기존 캐릭터 시트를 정체성 참고로 사용했다. 지도 수달 모아는 기존 생성 이미지를 유지한다.
- 게·짱뚱어·갈대 관찰 그림: 2026-10-28 내장 image_gen 생성. 실제 사진이나 종 동정 자료가 아닌 학습용 관찰 일러스트다. UI·수치와 연동되는 과학 도해는 프로젝트 자체 CSS/SVG/Canvas다.
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
- 개념 영상 5종: 프로젝트 자체 SVG 도해를 sharp + FFmpeg로 렌더. 각 9초 / 1280×720 / 24fps, 무음 MP4·WebM와 끝 장면 WebP. Remotion 미사용, 렌더 도구는 배포하지 않음.
- 효과음: https://kenney.nl/assets/interface-sounds · Kenney · CC0 1.0. 원본 `License.txt`를 `public/assets/audio/Kenney-License.txt`에 보존. 원래 파일명과 사용처는 `sources.json`. MP3 변환과 음량 정규화 수행.
- 글꼴: Google Fonts Jua / orioncactus Pretendard v1.3.9 · SIL OFL 1.1. 원본은 assets/font-sources, 파생물은 BluePlanetDisplay/BluePlanetBody로 내부 이름까지 변경. Jua-OFL.txt와 Pretendard-OFL.txt 동봉. 폰트 단독 판매나 소유권 주장은 하지 않음.
