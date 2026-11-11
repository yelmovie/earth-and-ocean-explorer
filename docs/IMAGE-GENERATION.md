# 생성 이미지 기록

## 2026-10-28 — 캐릭터와 갯벌 관찰 그림 고도화

- 도구: 내장 `image_gen`. CLI/API 폴백은 사용하지 않았다.
- 부리·짱이: 기존 `characters.webp`를 정체성 참고로 사용해 각각 단독 생성했다. 이름표·테두리·다른 포즈가 섞인 시트는 실행 화면에서 사용하지 않는다.
- 게·짱뚱어·갈대: 각각 독립된 자연 관찰 일러스트로 생성했다. 집게와 다리, 머리 위 눈과 지느러미, 갈대의 깃털 모양 꽃차례·줄기·잎·뿌리를 확인했다. 학습용 재현 그림이며 종 동정 자료로 사용하지 않는다.
- 최종 원본: `assets/generated/20261028/{buri,jjang,crab,skipper,reed}.png`.
- 실행 파일: `public/assets/illustrations/{buri,jjang,crab,skipper,reed}.webp`, 지도용 `buri-map.webp`.
- 전체 프롬프트: `docs/IMAGE-PROMPTS-20261028.json`.
- 검수·패키징: 생성 파일의 실제 알파·투명 모서리를 검사했다. `scripts/prepare-illustrations.py`는 투명 여백만 잘라 원본 알파를 유지하고 WebP로 축소한다. 원본 SHA256·크기·추출 범위·실행 용량은 `public/assets/illustrations/manifest.json`에 남긴다.
- 연결: 홈·지도·이야기 팝업·최종 미션·엔딩의 공통 캐릭터와 갯벌 관찰·도감·확장 문제·보고서의 공통 생물 이미지. 지구·실험·조석·면적 비율처럼 정확한 상태와 연동되는 과학 도해는 코드로 유지한다.
- 지도 도형 캐릭터를 제거하고 이미지의 방향 전환·접지·걷기 반응을 연결했다. 이미지 로딩 실패 시 다시 불러오기를 제공한다.

아래는 이전 에셋의 생성 기록이다.

2026-10-22. 도구: 내장 image_gen. CLI/API 폴백을 사용하지 않았다. 생성된 파일은 D: 프로젝트 안으로 복사했다. 기존 제공 이미지와 원본을 덮어쓰지 않았다.

## 1. 탐사 섬
- 생성 원본: public/assets/expedition-map.png (1672×941)
- 실행 파일: public/assets/expedition-map.webp (같은 해상도)
- 용도: 스테이지 선택 전용 2.5D 픽셀 RPG 배경. 시설/인물/버튼은 별도.
- 프롬프트:

> Production game background, no UI. Beautiful detailed 16-bit pixel-art 2.5D isometric coastal expedition island, welcoming and professionally art directed for an elementary science learning RPG. Fixed diagonal overhead about30degrees, lush grass cliffs, golden sand, tidal pools, reeds, footbridges, carefully placed pixels. Five empty building clearings around a central square, connected by wide winding sand paths. Upper forest, right rocky shore, lower-left mudflat, sunny central plaza. Sage greens, warm cream earth, deep teal shadows, turquoise sea, apricot/gold details. No buildings, characters, text, labels, numbers, icons, watermark or UI.

- 입력 좌표 지시는 대략 배치만 정했다. 생성 결과를 실제 확인한 뒤 src/hub-world.js 도로·문 좌표를 그 그림에 맞춰 작성했다. 배경을 생성한 대로 충돌맵으로 간주하지 않았다.

## 2. 시설 시트
- 원본: references/generated/facilities-atlas.png (1536×1024, RGBA)
- 실행: public/assets/facility-1.webp ~ facility-5.webp (512×512, 실제 알파)
- 프롬프트:

> Five production game building sprites on a true transparent background, three columns by two rows. Same fixed30degree isometric 2.5D view and crisp16-bit pixel grid, cozy coastal science RPG, warm cream walls, teal/apricot/sage roofs, golden wood. Full facility exterior with visible front door and small attached science props, no ground landscape. Row1: blue-dome Earth observatory with telescope/globe; apricot water science lab with clear tanks/flasks; sage coastal ranger field station with camera/photo board/veranda. Row2: teal tide lighthouse with water-height pole; thatched mudflat ecology hut with reeds/nature board/shells; empty last cell. Generous transparent margins, no people, text, numbers, borders, checkerboard, watermark or UI.

- 검수 결과: 알파 범위는 0~254다. 투명 픽셀에도 RGB 값이 들어 있지만 실제 배경 알파는0이다. 투명도를 유지해 지도 위에 합성한다.
- 생성 결과의 행 경계가 정확히512px가 아니며 등대 지붕이 위쪽으로 넘어왔다. scripts/prepare-facilities.py에서 각 시설의 빈틈을 눈으로 확인한 개별 영역을 추출해 다른 시설의 픽셀이 섞이지 않게 했다. 원본은 보존한다.
- 접지 기준은 전체 시설 공통512×512/pivot(256,440)다. 140worldpx로 문 앞에 발끝을 맞춘다. 추출 영역·alphaBounds·용량은 facilities-manifest.json에 기록한다.

## 確認範囲
生成直後の全体、アルファ、切り出し境界、実際の地図合成を確認する。生成絵は学習用再現であり実際の海岸位置・施設・潮時を示さない。商業利用権の最終確認は assets/CREDITS.mdを参照。

## 2026-11-12 관찰 자료 6종

내장 image_gen을 사용했다. 그림 안에 글자·라벨·로고를 넣지 않고 UI에서 별도로 표시했다. 생성 결과를 열어 동굴의 안쪽 공간, 아치 너머 바다, 절벽의 경사, 모래 표면, 흰 결정의 양과 두 용기의 일치를 확인했다.

### 제작 지시 요지

공통으로 기존 프로젝트와 어울리는 따뜻한 자연 관찰 일러스트, 세부 특징을 읽을 수 있는 구도, 글자·로고·워터마크 없음, 해안 그림은 4대3 비율을 요청했다. 아래는 실제 생성에 사용한 지시의 요약이며 원문 전문을 재구성한 기록으로 보지 않는다.

- **coast-cave**. 해안 동굴의 입구와 안쪽 공간. 이 그림은 어두운 끝벽이 보이고 너머 바다가 비치지 않는 예시.
- **coast-arch**. 가운데가 뚫려 반대편의 밝은 바다와 하늘이 보이는 해안 아치.
- **coast-cliff**. 바닷가의 가파르고 단단한 바위 면. 모래사장과 구분할 표면과 모양.
- **coast-sand**. 모래 알갱이로 이루어진 완만한 해변과 얕은 물의 경계.
- **residue-salt**. 같은 유리 그릇 바닥에 흰 결정이 뚜렷하게 남은 확대 관찰 그림.
- **residue-clear**. residue-salt 원본을 참조해 용기 형태를 유지하고 결정 더미를 제거한 관찰 그림. 이번 표본의 남은 물질이 적음.

### 실행 연결과 변환

- 해안 4종은 새 사진 앨범·기록·보고서에 연결했다. 아치와 절벽은 확장 문제 관찰 자료에도 사용한다. 보너스 해안 전시는 같은 학습용 그림을 사용한다.
- 그릇 바닥 2종은 실험 확장 문제의 가열 뒤 확대 관찰에 사용한다. 동적 실험의 물 높이·가열 조건·증발 과정은 상태와 연동한 도해로 표현한다.
- 원본 경로는 assets/generated/20261112/{coast-cave,coast-arch,coast-cliff,coast-sand,residue-salt,residue-clear}.png다. 브라우저 Canvas로 크기를 맞추고 품질0.86 WebP로 변환했다. 투명 이미지의 알파를 유지했다.
- 실행 경로는 public/assets/illustrations/의 같은 이름 WebP다. manifest.json에 실제 파일 크기·SHA-256·알파 범위를 검증해 기록했다.
- 생성 도구의 임시 내부 원본은 프로젝트 상위 AGENTS.md의 이미지 임시 저장 예외에 따라 외장 원본과 복사 일치를 확인한 후 해당 생성 파일만 삭제했다.
- 새 사진의 버전은2다. 기존 버전1의 사진과 핀 위치를 보존한다.
