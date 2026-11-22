# 권리 장부 — 푸른행성 조사본부 (2026-11-21)

운영 빌드(`_scratch/deploy-20261118/wt/10/dist`, 약 65MB)에 들어가는 그림·영상·음악·효과음·목소리·글꼴을 묶음별로 적었다. 근거는 저장소의 `public/assets/CREDITS.md`·`docs/`·생성 원본 폴더·커밋 기록과 `_shared`의 출처 문서에서만 찾았고, 못 찾은 것은 「출처 미확인」으로 두었다(추측으로 채우지 않음).

상태: **확인됨** = 만든 도구·날짜·원본(또는 라이선스 원문)이 기록에 있음 / **근거 약함** = 일부만 있음(도구나 계정·이용권 증빙이 빠짐) / **출처 미확인** = 만든 곳 기록을 찾지 못함.

## 그림

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 기존 배경 8장 `home`·`terrace`·`ending`·`tide`·`observatory`·`mudflat`·`coast`·`lab.webp` | Codex 내장 이미지 도구(GPT 이미지) — 사용자 확인(2026-11-21 「이미지는 다 코덱스로 만들었어」) | 기존 프로젝트 때 생성. 이 맥의 Codex 세션 기록(2026-10-28~)보다 앞이라 생성 로그는 없음. PNG 원본 보존 후 WebP 변환 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「다 유료 요금제」) | `public/assets/CREDITS.md`, 이 장부 | 확인됨(사용자 확인) |
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
| 지도 전투 그림 `map-encounter/map-villain-poses-left·map-hero-reaction·map-ally-reaction.webp` | Codex 내장 이미지 도구(`image_gen`) | 2026-11-13~14, Codex 세션 `~/.codex/sessions/2026/11/13·14`의 `image_gen.generation` 기록(예: 11-13 16:58 UTC 「Draw a production sprite sheet of the exact two attached game characters: Buri, the white spoonbill…」, 6×4 스프라이트 아틀라스들), 커밋 `034a6b5`·`f9feb75`, `_scratch/map-redraw-20261114/README.md` | ChatGPT 유료 요금제(사용자 확인) | 세션 기록 추출 `.tmp/score-fix-20261121/codex-images.json` | 확인됨 |
| 시작 화면 제목 그림 `home-deck-title.webp`, 제목 로고 `logo-title.webp` | 새로 만든 그림이 아니라 기존 그림을 줄여 다시 압축한 파일: `home-deck-title.webp` = `home-deck.jpg`(Canva)를 1440px·품질 .86으로, `logo-title.webp` = `logo.webp`(기존 그림, Codex)를 960px·품질 .87로 | 2026-11-13~14, Codex 세션 `rollout-2026-11-13T21-43-10-01a1d4ee…`의 변환 스크립트, 커밋 `f431628` | 원본 그림과 같음 | 세션 기록 | 확인됨 |
| 대화창 초상 4장 `dialogue/buri·jjang·moa·crab.webp` | Codex 내장 이미지 도구(GPT 이미지) | 2026-11-12, `_scratch/npc-dialogue-plan-20261112/HANDOFF-5-16.md` 39행 「10~13: GPT 이미지 시트 4장, 캐릭터 8명 × 2프레임 분리」, Codex 세션 `rollout-2026-11-12T21-49-36-01a1cfce…`의 `image_gen.generation`(「dialogue portrait spritesheet」, 「NPC portrait sprite pair for Moa, a cheerful young Korean river otter」), 커밋 `99ba142` | ChatGPT 유료 요금제(사용자 확인) | 위 문서·세션 기록 | 확인됨 |
| 파비콘 `favicon.svg` | 코드로 그린 SVG(지구 모양 도형 3개) | 저장소 파일 | 자체 제작 | `public/favicon.svg` | 확인됨 |
| 육지 경계 `land.geojson` | Natural Earth 1:110m | — | Public Domain | CREDITS 「교육 내용·지리 출처」 | 확인됨 |

## 영상

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 개념 영상 5편 `concepts/chapter-1~5.mp4·webm·webp` | HyperFrames 자체 도해(효과음 포함) | 2026-11-09, 소스 `films/earth-sea-concepts/`, 자막 `src/concept-data.js` | 자체 제작. 안의 효과음 5종(drop·heat·camera·scan·success)은 Kenney CC0(`films/earth-sea-concepts/SPEC.md` 17행) | CREDITS 「이번 개선의 추가 에셋」, `films/earth-sea-concepts/SPEC.md` | 확인됨 |
| 지도 피날레 영상 `map-encounters/map-finale.mp4` | Gemini 영상 생성 — 사용자 확인(2026-11-21 「영상은 제미나이」) | 2026-11-14, 커밋 `8515107`·`6630e36` | Gemini 유료 요금제(사용자 확인 「다 유료 요금제」) | 이 장부 | 확인됨(사용자 확인) |
| 인트로·파이널 영상 `story/intro.mp4·jpg`, `story/finale.mp4·jpg`(각 약 27.8초) | 장면 그림 6장은 Codex 내장 이미지 도구(GPT 이미지, `gpt-image.sh`), 장면 영상 6편은 Google Flow(Omni 1.2 Flash, 기본 계정 PRO 표시, 시작·끝 장면 지정, 8초씩)로 만들고 ffmpeg로 0.4초 겹쳐 이음. Flow가 붙인 소리는 버리고 앱 목소리(아래 「이야기 영상 대사」)만 넣음. 자막·끝 카드(제목 로고 `logo-title.webp`, 인증 도장 `illustrations/seal.webp`, 꽃가루·반짝임)는 자체 합성(`scripts/story-films/compose.py`, 공용 `burn.py`, 주아체 OFL) | 2026-11-21, 원본 `assets/generated/20261121-story/`(그림·클립·프롬프트 txt·목소리), 큐 `scripts/story-films/` | 생성 계정 이용 조건(ChatGPT 유료, Google AI Pro — 사용자 확인 「다 유료 요금제」) | 이 장부, `docs/FILM-VOICE-20261121.json` | 확인됨 |

## 음악·효과음·목소리

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 배경음 2곡 `audio/bgm/main-theme·final-theme.mp3` | Suno 생성(사용자 제공) | 2026-11-17, 프롬프트 `_shared/music-prompts-10-16.html`, 원본 `references/suno` | Suno Premier 유료 요금제 상업 이용(2026-11-18 사용자 확인) | CREDITS 「도구·라이선스 검토」 | 확인됨(요금제 화면 증빙은 사용자 자료) |
| Kenney 효과음 9종 `audio/*.mp3`(버튼·정답 등) | Kenney Interface Sounds | 원래 이름 `audio/sources.json` | CC0 1.0, `audio/Kenney-License.txt` 동봉 | CREDITS | 확인됨 |
| 공통 라이브러리 효과음 17종 `audio/map-*`(8)·`card-*`(5)·`step-*`(2)·`map-open*`(2) | Freesound·OpenGameArt·Kenney 제작자(표에 이름·주소) | 2026-11-17~19, `_shared/sfx-library-20261117/` | CC0 1.0(원본 페이지 재확인) | CREDITS 세 표 | 확인됨 |
| 캐릭터 목소리 `audio/voices/el-*.mp3` | ElevenLabs eleven_v4 AI 합성(실제 사람 흉내 없음) | 2026-11-12·11-18, voiceId·generationId·SHA-256 `docs/VOICE-FILL-20261118.json`·`docs/NPC-DIALOGUE-20261112.json`, `_shared/voice-provenance-20261118.md` | 유료 요금제 상업 이용 | CREDITS 「캐릭터 목소리(2026-11-18)」 | 확인됨(요금제 화면 증빙은 사용자 자료) |
| 이야기 영상 대사 12줄(인트로·파이널 영상 안 소리 트랙) | ElevenLabs eleven_v4 AI 합성, 앱과 같은 목소리(부리 Jusen, 짱이 Bee, 모아 Taek, 내레이터 Mina, 물때 교란 부표 Harry). 새로 10줄, 앱 음원 다시 씀 2줄(`el-story-1`·`el-ending-buri`) | 2026-11-21, 요청 ID·SHA-256·받아쓰기 `docs/FILM-VOICE-20261121.json`, 원본 `assets/generated/20261121-story/voice/` | ElevenLabs Creator 유료 요금제 상업 이용 | `docs/FILM-VOICE-20261121.json` | 확인됨 |
| 옛 목소리 `audio/voices/<대사 id>.mp3`(Qwen3-TTS, 앱에서 재생 안 함) | 모모 로컬 Qwen3-TTS | 2026-11-10, `docs/VOICE-PROVENANCE-20261110.json` | Apache-2.0 | CREDITS 「캐릭터 목소리(2026-11-10)」 | 확인됨(배포에서 빼도 됨) |

## 글꼴·코드 라이브러리

| 파일(묶음) | 만든 곳 | 기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| 나눔스퀘어 네오 3종 `fonts/NanumSquareNeoTTF-*.woff2` | 네이버 공식 배포 원본 | `public/assets/fonts/SOURCE.md` | SIL OFL 1.1(전문 동봉) | 같은 폴더 `NanumSquareNeo-OFL.txt` | 확인됨 |
| 제목 글꼴 3종 `fonts/title-400·700·800.woff2`(「Blue Planet Title」) | 나눔스퀘어 네오 Regular·Bold·ExtraBold를 fontTools로 제목 글자만 남겨 줄이고 이름을 바꾼 파생 글꼴 | 2026-11-13~14, Codex 세션 `rollout-2026-11-13T21-43-10-01a1d4ee…`의 `subset.Subsetter` 스크립트(`NanumSquareNeoTTF-*.woff2` → 이름표 바꿔 저장), 커밋 `f431628` | SIL OFL 1.1(원본과 같음, 이름을 바꾼 파생본) | 세션 기록, `fonts/NanumSquareNeo-OFL.txt` | 확인됨 |
| Three.js·Vite | 패키지 | `THIRD-PARTY-NOTICES.txt` | MIT | 같은 파일 | 확인됨 |

## 요약

- 출처 미확인 **0줄**(2026-11-21 1차 조사 때 4줄 → Codex 세션 기록과 사용자 확인으로 모두 찾음).
  - 시작 화면 제목 그림·로고: 기존 그림을 줄인 파일(세션 변환 스크립트).
  - 대화창 초상 4장: GPT 이미지 시트(인계 문서·세션 `image_gen` 기록).
  - 지도 피날레 영상: Gemini(사용자 확인).
  - 제목 글꼴: 나눔스퀘어 네오 파생(세션 fontTools 스크립트).
- 사용자 확인으로 채운 줄: 기존 배경 8장(Codex, 로그는 이 맥 기록보다 앞), 지도 피날레 영상(Gemini), 모든 생성 도구 유료 요금제(2026-11-21 「다 유료 요금제고」).
- 근거 약함 0줄(개념 영상 효과음은 `films/earth-sea-concepts/SPEC.md` 17행에 Kenney CC0로 적혀 있음).

## 사용자가 줘야 하는 자료 (있으면 좋은 것)

1. 요금제 화면 캡처(ChatGPT·Gemini·Canva·Suno·ElevenLabs): 업체에 넘길 때 증빙으로 붙이면 좋다. 사용자 확인으로 장부는 채웠다.

## 2026-11-22 추가: 3D 말뚝 모형 (위 표를 고치지 않고 덧붙임)

운영 빌드에 실리는 3D 모형 한 개의 줄이 장부에 없어 추가한다(커밋 `cd79090`, 2026-11-21 19:18).

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `models/tide-post.glb` (3D 갯벌 탐사길 나무 말뚝 32개를 그리는 모형 하나, 501삼각형) | Meshy Image to 3D(Meshy 7.1, 표준, 텍스처 2K, 작업 「Weathered Wooden Post」). 입력 그림 `assets/meshy-20261121/post.png`는 `gpt-imagegen`(Codex GPT 이미지)으로 생성. 원본 GLB를 Blender로 줄이고 512px 색을 새로 구운 뒤 meshopt로 압축 | 2026-11-21. 작업 ID·크레딧·SHA-256·만든 순서는 `assets/meshy-20261121/README.md`, 굽기 스크립트 `bake-low.py`. 원본 GLB(10.5MB)는 Git 제외, 외장 SSD 보관 | 기록상 Meshy 라이선스 「비공개(비공식적인)」, CC BY 아님. 입력 그림은 Codex 유료 요금제 생성(사용자 확인). 같은 계정의 Meshy 요금제는 9번 장부 기록상 Premium 연간이나 이 저장소에는 요금제 기록이 없음. **Meshy 약관 원문과 요금제 화면은 확인하지 않음** | `assets/meshy-20261121/README.md`, `HANDOFF.md` 첫 절 | 근거 약함(Meshy 약관 원문 미확인) |

- 요약 보정: 전체 30줄, 확인됨 29줄, 근거 약함 1줄, 출처 미확인 0줄. 앞의 「근거 약함 0줄」은 이 줄이 생기기 전 기록이다.
- 사용자 자료 대기: Meshy 요금제 화면과 상업 이용 약관 확인(위 「사용자가 줘야 하는 자료」에 하나 더).

## 인증서 그림 추가 · 2026-11-22

| 파일 | 제작 도구·소재 | 원본·기록 | 상태 |
|---|---|---|---|
| `public/assets/certificate-frame-20261122.webp` | Codex 기본 imagegen(GPT 이미지), 부리·파도·조개·갯벌 게·등대·지구본 수채 테두리, 글자 없음. 1회 생성, 1800×1273, 207,582 bytes | 2026-11-22. 원본 `assets/source-png/certificate-20261122.png`, 프롬프트 `assets/source-png/PROMPT-10.txt` | 도구 생성·파일 직접 확인. 기존 Codex 사용자 확인(2026-11-21), 요금제 증빙 대기는 유지 |

- 요약: 전체31줄, 확인됨30줄, 근거 약함1줄(기존 Meshy), 출처 미확인0줄.
