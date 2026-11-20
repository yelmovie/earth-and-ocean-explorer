# 권리 장부 — 푸른행성 조사본부 (2026-11-21)

운영 빌드(`_scratch/deploy-20261118/wt/10/dist`, 약 65MB)에 들어가는 그림·영상·음악·효과음·목소리·글꼴을 묶음별로 적었다. 근거는 저장소의 `public/assets/CREDITS.md`·`docs/`·생성 원본 폴더·커밋 기록과 `_shared`의 출처 문서에서만 찾았고, 못 찾은 것은 「출처 미확인」으로 두었다(추측으로 채우지 않음).

상태: **확인됨** = 만든 도구·날짜·원본(또는 라이선스 원문)이 기록에 있음 / **근거 약함** = 일부만 있음(도구나 계정·이용권 증빙이 빠짐) / **출처 미확인** = 만든 곳 기록을 찾지 못함.

## 그림

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 기존 제공 배경 8장 `home`·`terrace`·`ending`·`tide`·`observatory`·`mudflat`·`coast`·`lab.webp` | 제공된 생성형 AI 그림(제공자·도구 기록 없음) | 기존 프로젝트에서 받음. PNG 원본 보존 후 WebP 변환 | 최초 생성 계정·상업 이용권 확인 필요(CREDITS 「남은 확인」) | `public/assets/CREDITS.md` 「도구·라이선스 검토」·「이미지」 | 근거 약함 |
| 모아 `moa.webp`·`moa-map.webp` | 내장 image_gen | 2026-10-22, 원본 `assets/moa-original.png` | 생성 계정 이용 조건 | `docs/EXPERIENCE-20261022.md` 48행 | 확인됨 |
| 탐사 섬 지도 `expedition-map.webp` | 내장 image_gen | 2026-10-22, 원본 `assets/source-png/expedition-map.png` | 생성 계정 이용 조건 | CREDITS 「이미지」 | 확인됨 |
| 시설 5종 `facility-1~5.webp` | 내장 image_gen(시설 시트에서 분리) | 원본 `references/generated/facilities-atlas.png`, 자르기 `public/assets/facilities-manifest.json` | 생성 계정 이용 조건 | CREDITS 「이미지」 | 확인됨 |
| 부리·짱이 일러스트 `illustrations/buri·buri-map·jjang.webp`, 갯벌 생물 `crab·skipper·reed.webp` | 내장 image_gen | 2026-10-28, `assets/generated/20261028/` | 생성 계정 이용 조건 | CREDITS 「이미지」 | 확인됨 |
| 시작 배경 `home-deck.jpg`(공유 미리보기 그림 겸용) | Canva 이미지 생성 | 2026-10-29, 원본 `assets/generated/20261029/home-seaside-deck.jpg` | Canva AI 생성물 이용 조건 확인 필요 | CREDITS 「이미지」 | 확인됨 |
| 밀물·썰물 배경 `tide-foreshore.webp` | 내장 image_gen | 2026-11-08, 원본 `assets/generated/20261108/`, `public/assets/tide-foreshore-manifest.json` | 생성 계정 이용 조건 | CREDITS 「2026-11-08」 | 확인됨 |
| 해안 4종 `coast-*.webp`, 그릇 2종 `residue-*.webp` | 내장 image_gen | 2026-11-12, `assets/generated/20261112/`, 해시 `illustrations/manifest.json` | 생성 계정 이용 조건 | CREDITS 「2026-11-12」, `docs/IMAGE-GENERATION.md` | 확인됨 |
| 도전 장면 9장 `illustrations/challenge-*.webp` | Codex 내장 이미지 도구(GPT 이미지) | 2026-11-16, `assets/generated/20261116/` | 생성 계정 이용 조건 | CREDITS 「이미지」 | 확인됨 |
| 실험·관측 소품 `tide-rock·tide-pole·tide-boat·lab-*.webp`, `challenge-earth-layers.webp`, 장 배지 `badge-1~5.webp`, 인증서 도장 `seal.webp` | Codex 내장 이미지 도구(GPT 이미지) | 2026-11-17, `assets/generated/20261117/`(배지·도장 원본 포함), 커밋 `1f25de4` | 생성 계정 이용 조건 | CREDITS 「이미지」(배지·도장은 커밋 설명과 원본 폴더로 확인) | 확인됨 |
| 3D 탐사길 그림 21장 `illustrations/run-stage/*.webp` | Codex 내장 이미지 도구(GPT 이미지) | 2026-11-17, 원본 `assets/generated/20261117-run-stage/`, 프롬프트 `docs/IMAGE-PROMPTS-20261117-run-stage.json` | 생성 계정 이용 조건 | CREDITS 「이미지」 | 확인됨 |
| 성취 카드 10장 `reward-cards/card-*·thumb-*.webp` | Codex 내장 이미지 도구(GPT 이미지) | 2026-11-18, 원본 `_scratch/reward-cards-20261118/gen/10/` | 생성 계정 이용 조건 | CREDITS 「2026-11-18 성취 카드」 | 확인됨 |
| 지도 전투 그림 `map-encounter/map-villain-poses-left·map-hero-reaction·map-ally-reaction.webp` | 「새로 그린 시트」라고만 기록(도구 이름 없음) | 2026-11-14, 커밋 `034a6b5`·`f9feb75`, `_scratch/map-redraw-20261114/README.md` | 확인 필요 | 위 README·`docs/MAP-VILLAIN-HANDOFF-20261114.md` | 근거 약함 |
| 시작 화면 제목 그림 `home-deck-title.webp`, 제목 로고 `logo-title.webp` | 기록 없음(커밋 `f431628` 「Use lighter artwork」만 있음) | 2026-11-14 | 모름 | 없음 | **출처 미확인** |
| 대화창 초상 4장 `dialogue/buri·jjang·moa·crab.webp` | 기록 없음(커밋 `99ba142`에 그림만 추가) | 2026-11-13 | 모름 | 없음(CREDITS에는 성취 카드의 화풍 참고로만 나옴) | **출처 미확인** |
| 파비콘 `favicon.svg` | 코드로 그린 SVG(지구 모양 도형 3개) | 저장소 파일 | 자체 제작 | `public/favicon.svg` | 확인됨 |
| 육지 경계 `land.geojson` | Natural Earth 1:110m | — | Public Domain | CREDITS 「교육 내용·지리 출처」 | 확인됨 |

## 영상

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 개념 영상 5편 `concepts/chapter-1~5.mp4·webm·webp` | HyperFrames 자체 도해(효과음 포함) | 2026-11-09, 소스 `films/earth-sea-concepts/`, 자막 `src/concept-data.js` | 자체 제작(안에 쓴 효과음은 아래 CC0 묶음과 같은지 기록 없음) | CREDITS 「이번 개선의 추가 에셋」 | 확인됨(효과음 출처는 근거 약함) |
| 지도 피날레 영상 `map-encounters/map-finale.mp4` | 기록 없음 | 2026-11-14, 커밋 `8515107`·`6630e36` | 모름 | 없음 | **출처 미확인** |

## 음악·효과음·목소리

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 배경음 2곡 `audio/bgm/main-theme·final-theme.mp3` | Suno 생성(사용자 제공) | 2026-11-17, 프롬프트 `_shared/music-prompts-10-16.html`, 원본 `references/suno` | Suno Premier 유료 요금제 상업 이용(2026-11-18 사용자 확인) | CREDITS 「도구·라이선스 검토」 | 확인됨(요금제 화면 증빙은 사용자 자료) |
| Kenney 효과음 9종 `audio/*.mp3`(버튼·정답 등) | Kenney Interface Sounds | 원래 이름 `audio/sources.json` | CC0 1.0, `audio/Kenney-License.txt` 동봉 | CREDITS | 확인됨 |
| 공통 라이브러리 효과음 17종 `audio/map-*`(8)·`card-*`(5)·`step-*`(2)·`map-open*`(2) | Freesound·OpenGameArt·Kenney 제작자(표에 이름·주소) | 2026-11-17~19, `_shared/sfx-library-20261117/` | CC0 1.0(원본 페이지 재확인) | CREDITS 세 표 | 확인됨 |
| 캐릭터 목소리 `audio/voices/el-*.mp3` | ElevenLabs eleven_v4 AI 합성(실제 사람 흉내 없음) | 2026-11-12·11-18, voiceId·generationId·SHA-256 `docs/VOICE-FILL-20261118.json`·`docs/NPC-DIALOGUE-20261112.json`, `_shared/voice-provenance-20261118.md` | 유료 요금제 상업 이용 | CREDITS 「캐릭터 목소리(2026-11-18)」 | 확인됨(요금제 화면 증빙은 사용자 자료) |
| 옛 목소리 `audio/voices/<대사 id>.mp3`(Qwen3-TTS, 앱에서 재생 안 함) | 모모 로컬 Qwen3-TTS | 2026-11-10, `docs/VOICE-PROVENANCE-20261110.json` | Apache-2.0 | CREDITS 「캐릭터 목소리(2026-11-10)」 | 확인됨(배포에서 빼도 됨) |

## 글꼴·코드 라이브러리

| 파일(묶음) | 만든 곳 | 기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 나눔스퀘어 네오 3종 `fonts/NanumSquareNeoTTF-*.woff2` | 네이버 공식 배포 원본 | `public/assets/fonts/SOURCE.md` | SIL OFL 1.1(전문 동봉) | 같은 폴더 `NanumSquareNeo-OFL.txt` | 확인됨 |
| 제목 글꼴 3종 `fonts/title-400·700·800.woff2`(「Blue Planet Title」) | 기록 없음(커밋 `f431628`에서 추가) | 없음. `_shared/OBSIDIAN-RULES-AUDIT-PROPOSAL-20261117.md` 162행에도 「출처 문서에 이름이 없다」 | 모름 | 없음 | **출처 미확인** |
| Three.js·Vite | 패키지 | `THIRD-PARTY-NOTICES.txt` | MIT | 같은 파일 | 확인됨 |

## 요약

- 출처 미확인 **4줄**: 시작 화면 제목 그림 2장, 대화창 초상 4장, 지도 피날레 영상 1편, 제목 글꼴 3종.
- 근거 약함 3줄: 기존 제공 배경 8장(생성 계정·이용권 증빙), 지도 전투 그림 3장(도구 이름), 개념 영상 안의 효과음 출처.

## 사용자가 줘야 하는 자료

1. 기존 제공 배경 8장(`home`·`terrace`·`ending`·`tide`·`observatory`·`mudflat`·`coast`·`lab`)을 만든 계정·도구와 이용 조건(업체에서 받았다면 받은 메일·계약).
2. 시작 화면 제목 그림·제목 로고(`home-deck-title.webp`·`logo-title.webp`), 대화창 초상 4장, 지도 피날레 영상을 만든 도구와 날짜(기억나는 도구 이름만이라도). 없으면 3-3단계에서 새로 만들어 바꾼다.
3. 제목 글꼴 「Blue Planet Title」의 원래 글꼴 이름(어느 글꼴을 줄여 만든 것인지).
4. 생성 도구 요금제 화면: ChatGPT(내장 image_gen·Codex 이미지), Canva, Suno Premier, ElevenLabs 유료 요금제의 상업 이용 조건 캡처.
5. 지도 전투 그림을 그린 도구 이름(2026-11-14 「다시 그리기」 작업).
