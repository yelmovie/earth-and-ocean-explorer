# TRD — 푸른행성 조사본부

- **Project:** Blue Planet Research HQ
- **Repository:** `blue-planet-research-hq`
- **Target:** Tablet-first Web / PWA-ready
- **Structure:** 5 Stages / 10 Screens
- **Primary stack:** Vite + TypeScript + Phaser 3 + Three.js + HTML/CSS/SVG
- **Persistence:** IndexedDB 우선 + localStorage 폴백
- **Architecture:** Screen 단위 Runtime 전환 + DOM Overlay + EventBus
- **3D Screens:** 01, 02, 03, 10
- **Core 3D Learning Screen:** 03
- **문서 버전:** 1.0
- **작성일:** 2026-08-25

---

## 1. 기술 목표

1. Phaser, Three.js, DOM을 역할별로 분리하고 현재 Screen에 필요한 렌더러만 활성화한다.
2. 3D는 공간 관찰 가치가 높은 P01·P02·P03·P10에만 사용한다.
3. P03을 핵심 3D 학습 장면으로 두고 P01/P02/P10은 경량화한다.
4. P02와 P10은 동일 HQ scene을 재사용하여 다운로드와 메모리를 줄인다.
5. 물 표본 증발, 밀물·썰물 변화는 무거운 실제 물리엔진 대신 **검수 가능한 결정론적 상태 모델**로 구현한다.
6. 과학 내용과 정답/허용 근거는 코드에 하드코딩하지 않고 JSON으로 분리한다.
7. 모든 한글 UI는 DOM/SVG로 구현하고 3D 텍스처/mesh에 굽지 않는다.
8. 학생의 스캔 표본, 실험 기록, 해안 사진 메타데이터, A/B 타임 스냅, 생태 증거를 serializable state로 저장한다.
9. 백엔드 없이도 이어하기가 가능해야 한다.
10. Science World 허브와는 `MissionResult` 계약으로 연결한다.
11. Android 학교 태블릿과 iPad Safari에서 핵심 경로를 안정적으로 실행한다.
12. Screen 전환 시 WebGL context, RAF, EventBus listener, AnimationMixer 누수를 방지한다.

---

## 2. 권장 기술 스택

```text
Vite
TypeScript (strict: true)

Phaser 3
  - P05, P06, P08, P09
  - 2D/2.5D, pointer interaction, timeline, camera, evidence pin

Three.js
  - P01, P02, P03, P10
  - HQ diorama, 3D Earth viewer, limited orbit/raycast

HTML / CSS / SVG
  - 모든 한글 UI
  - HUD / MissionPanel / ResearchNotebook
  - 표본 카드 / 그래프 / 실험 컨트롤
  - Timeline / EvidenceBoard / FinalBriefing

Canvas 2D
  - P07 조사 앨범
  - P10 결과 카드 PNG

IndexedDB
  - 진행 상태 / 조사 기록 / 실험 로그 / 스냅 메타데이터

localStorage
  - 설정
  - IndexedDB 실패 시 작은 상태 폴백

MediaRecorder API
  - P10 선택적 10초 음성 브리핑
  - 지원되지 않아도 완주 가능
```

별도 강체·유체 물리 엔진이나 대형 UI 프레임워크는 필수 의존성으로 추가하지 않는다.

---

## 3. Runtime Architecture

```text
Science World Hub
       │ portal enter
       ▼
BluePlanetTopicHost
 ├─ TopicStateMachine
 ├─ TopicEventBus
 ├─ RuntimeCoordinator
 ├─ DOMOverlayManager
 ├─ BluePlanetStore
 ├─ AssetManager
 ├─ AudioManager
 ├─ PhaserRuntime
 └─ ThreeRuntime
       │
       ├─ P01 Three
       ├─ P02 Three
       ├─ P03 Three
       ├─ P04 DOM/SVG
       ├─ P05 Phaser/DOM
       ├─ P06 Phaser 2.5D/DOM
       ├─ P07 DOM/SVG/Canvas
       ├─ P08 Phaser 2.5D/DOM
       ├─ P09 Phaser/DOM
       └─ P10 Three + DOM
       ▼
MissionResultAdapter
       ▼
Science World Hub resume
```

### 렌더링 수명주기

1. Screen 진입 전 해당 manifest만 lazy load
2. 이전 runtime pause
3. 이전 Screen `serialize()`
4. store 저장
5. 이전 runtime unmount/dispose
6. 새 runtime mount
7. DOMOverlay는 공통 shell 유지
8. Screen 종료 시 geometry/material/texture/mixer/listener cleanup
9. 다음 Screen 시작

Three.js와 Phaser RAF는 불필요하게 동시에 상시 실행하지 않는다.

---

## 4. Scene Mode Matrix

| Page | Page ID | Runtime | Camera/Input | 핵심 기술 |
|---|---|---|---|---|
| 01 | `blue-planet-intro-3d` | Three.js + DOM | fixed 3/4 + limited orbit | anomaly raycast |
| 02 | `research-hq-3d` | Three.js + DOM | fixed presets | terminal raycast + progress binding |
| 03 | `earth-scan-3d` | Three.js + DOM/SVG | object orbit + zoom clamp | globe raycast + atmosphere overlay |
| 04 | `surface-data-compare` | DOM/SVG | fixed | classification + chart + evidence validator |
| 05 | `water-sample-lab` | Phaser + DOM/SVG | fixed lab | equal-condition validator + deterministic evaporation |
| 06 | `coast-field-scan` | Phaser 2.5D + DOM | horizontal travel | capture anchors + feature annotation |
| 07 | `coast-research-album` | DOM/SVG/Canvas | fixed | evidence-card matching + compare notebook |
| 08 | `tide-time-scan` | Phaser 2.5D + DOM | fixed wide coast | deterministic timeline + A/B snapshot |
| 09 | `mudflat-ecology-scan` | Phaser + DOM | pan/zoom zones | clue state machine + species evidence |
| 10 | `final-briefing-3d` | Three.js + DOM/Canvas | P02 scene reuse | claim-evidence authoring + restore + export |

---

## 5. 권장 디렉터리 구조

```text
blue-planet-research-hq/
├─ public/
│  ├─ assets/
│  │  └─ blue-planet/
│  │     ├─ 2d/
│  │     │  ├─ bg/
│  │     │  ├─ props/
│  │     │  ├─ ui/
│  │     │  ├─ coast/
│  │     │  ├─ mudflat/
│  │     │  └─ fx/
│  │     ├─ 3d/
│  │     │  ├─ blue_planet_intro.glb
│  │     │  ├─ blue_planet_hq.glb
│  │     │  ├─ earth_globe.glb
│  │     │  └─ data_core.glb
│  │     ├─ audio/
│  │     └─ data/
│  ├─ config/
│  │  └─ blue-planet/
│  │     ├─ pages.json
│  │     ├─ missions.json
│  │     ├─ standards.json
│  │     ├─ asset-manifest.json
│  │     ├─ earth-samples.json
│  │     ├─ water-sample-lab.json
│  │     ├─ coast-landforms.json
│  │     ├─ tide-timeline.json
│  │     ├─ mudflat-species.json
│  │     ├─ mudflat-values.json
│  │     ├─ hints.json
│  │     └─ copy.ko.json
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ BluePlanetTopicHost.ts
│  │  ├─ TopicStateMachine.ts
│  │  ├─ RuntimeCoordinator.ts
│  │  └─ lifecycle.ts
│  ├─ core/
│  │  ├─ TopicEventBus.ts
│  │  ├─ AssetManager.ts
│  │  ├─ AudioManager.ts
│  │  ├─ DeviceCapabilities.ts
│  │  └─ MissionResultAdapter.ts
│  ├─ state/
│  │  ├─ BluePlanetState.ts
│  │  ├─ BluePlanetStore.ts
│  │  ├─ PersistenceService.ts
│  │  └─ migrations.ts
│  ├─ pages/
│  │  ├─ p01_blue_planet_intro_3d/
│  │  ├─ p02_research_hq_3d/
│  │  ├─ p03_earth_scan_3d/
│  │  ├─ p04_surface_data_compare/
│  │  ├─ p05_water_sample_lab/
│  │  ├─ p06_coast_field_scan/
│  │  ├─ p07_coast_research_album/
│  │  ├─ p08_tide_time_scan/
│  │  ├─ p09_mudflat_ecology_scan/
│  │  └─ p10_final_briefing_3d/
│  ├─ phaser/
│  │  ├─ PhaserTopicRuntime.ts
│  │  ├─ BaseLearningScene.ts
│  │  └─ systems/
│  │     ├─ EvidencePinSystem.ts
│  │     ├─ CameraCaptureSystem.ts
│  │     ├─ TimelineSystem.ts
│  │     ├─ LensSystem.ts
│  │     └─ AnnotationSystem.ts
│  ├─ three/
│  │  ├─ ThreeTopicRuntime.ts
│  │  ├─ scenes/
│  │  ├─ controls/
│  │  ├─ loaders/
│  │  └─ systems/
│  │     ├─ GlobeRaycastSystem.ts
│  │     ├─ AtmosphereLensSystem.ts
│  │     └─ HQStateBindingSystem.ts
│  ├─ components/
│  │  ├─ ProgressBar/
│  │  ├─ MissionPanel/
│  │  ├─ ResearchNotebook/
│  │  ├─ SampleTray/
│  │  ├─ CompareChart/
│  │  ├─ ExperimentToolbar/
│  │  ├─ TimelineScrubber/
│  │  ├─ EvidencePanel/
│  │  ├─ HintPanel/
│  │  ├─ RewardModal/
│  │  ├─ Toast/
│  │  └─ BottomBar/
│  ├─ domain/
│  │  ├─ standards.ts
│  │  ├─ earthObservation.ts
│  │  ├─ waterComparison.ts
│  │  ├─ coastLandform.ts
│  │  ├─ tideObservation.ts
│  │  ├─ mudflatEcology.ts
│  │  └─ finalBriefing.ts
│  └─ styles/
│     ├─ tokens.css
│     ├─ layout.css
│     └─ accessibility.css
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ package.json
└─ README.md
```

---

## 6. Screen Runtime Contract

```ts
export interface TopicScreenRuntime {
  mount(ctx: ScreenContext): Promise<void>;
  pause?(): void;
  resume?(): void;
  serialize(): unknown;
  unmount(): Promise<void>;
}
```

규칙:
- Phaser/Three 내부에서 DOM 직접 수정 금지
- DOM은 store/EventBus만 구독
- 학습 검증은 renderer가 아니라 domain validator 담당
- Screen 종료 시 `serialize()` 후 저장

---

## 7. EventBus 계약

```ts
type BluePlanetEvent =
  | { type: "NAVIGATE"; screen: ScreenId }
  | { type: "SCREEN_COMPLETED"; screen: ScreenId }
  | { type: "STAGE_COMPLETED"; stage: StageId }
  | { type: "HINT_USED"; screen: ScreenId; level: number }
  | { type: "EARTH_SAMPLE_ADDED"; sampleId: string }
  | { type: "SAMPLE_CLASSIFIED"; sampleId: string; classId: "land" | "sea" }
  | { type: "LAB_TRIAL_STARTED"; trialId: string }
  | { type: "LAB_TRIAL_FINISHED"; trialId: string }
  | { type: "COAST_CAPTURED"; captureId: string }
  | { type: "ANNOTATION_ADDED"; targetId: string; annotationId: string }
  | { type: "TIDE_SNAPSHOT_SAVED"; slot: "A" | "B"; timeKey: string }
  | { type: "TIDE_EVIDENCE_ADDED"; evidenceId: string }
  | { type: "SPECIES_EVIDENCE_ADDED"; speciesId: string; evidenceId: string }
  | { type: "BRIEFING_UPDATED"; payload: unknown }
  | { type: "OPEN_REWARD"; stage: StageId };
```

---

## 8. State Model

```ts
type StageId = "stage1" | "stage2" | "stage3" | "stage4" | "stage5";
type StandardCode = "4과06-01" | "4과06-02" | "4과06-03";

interface BluePlanetState {
  version: 1;
  currentScreen: number;
  completedScreens: number[];
  completedStages: StageId[];
  restoredData: {
    surface: boolean;
    water: boolean;
    coast: boolean;
    tide: boolean;
    mudflat: boolean;
  };
  earthScan: {
    atmosphereChecks: number;
    samples: EarthSampleRecord[];
    conclusion?: "sea_wider" | "land_wider" | "same";
  };
  waterLab: {
    trials: WaterTrialRecord[];
    selectedEvidenceIds: string[];
  };
  coast: {
    captures: CoastCaptureRecord[];
    albumCompleted: boolean;
  };
  tide: {
    cursor: number;
    snapshotA?: TideSnapshot;
    snapshotB?: TideSnapshot;
    evidenceIds: string[];
    term?: "밀물" | "썰물";
  };
  mudflat: {
    speciesRecords: SpeciesRecord[];
    valueEvidenceIds: string[];
  };
  briefing: {
    claim?: string;
    evidenceIds: string[];
    valueId?: string;
    action?: string;
    audioBlobKey?: string;
  };
  hints: Record<string, number>;
  badges: string[];
  settings: {
    muted: boolean;
    reducedMotion: boolean;
  };
}
```

개인정보는 state에 포함하지 않는다.

---

## 9. P01/P02/P10 HQ 3D

- P02/P10은 `blue_planet_hq.glb` 재사용
- fixed camera preset
- pan off
- 필요 시 limited rotation
- 3D text mesh 금지
- core 상태는 emissive/animation으로 표현

```ts
interface HQWorldState {
  surface: "lost" | "restored";
  water: "lost" | "restored";
  coast: "lost" | "restored";
  tide: "lost" | "restored";
  mudflat: "lost" | "restored";
}
```

P10은 P02 scene에 restored state만 바인딩한다.

---

## 10. P03 3D 지구 관측

### Three.js
- object-centered OrbitControls
- rotate enabled
- pan disabled
- zoom clamp
- double tap reset optional
- Earth mesh + atmosphere shell
- globe raycast hit zones

```text
EarthRoot
├─ EarthSurface
├─ AtmosphereShell
├─ ScanMarkerGroup
└─ AnnotationAnchorGroup
```

### Atmosphere Lens
- lens가 지구 가장자리 영역에 진입하면 atmosphere shell opacity/emissive 증가
- 실제 대기층 두께를 정밀 비율로 제시하지 않음
- 목표는 “지구가 대기로 둘러싸임”의 시각적 확인

### Surface Sample
- pointer raycast → 검수된 zone id
- zone metadata에서 `land|sea`
- seed 기반 결정론적 표본 가능
- sampling coverage rule로 한쪽 지역 반복 방지

---

## 11. P04 표본 비교

DOM/SVG:
- sample cards
- two-column classification
- SVG bar chart
- evidence selection

```ts
interface SurfaceCompareResult {
  reviewed: number;
  classifiedCorrectly: number;
  hasLandAndSea: boolean;
  evidenceCount: number;
  conclusion: "sea_wider" | "land_wider" | "same" | null;
}
```

완료는 결론 클릭 하나가 아니라 **표본 검토 + 근거 + 결론**으로 판정한다.

---

## 12. P05 물 표본 실험

실제 유체·열역학 시뮬레이션을 하지 않는다.

```text
idle
→ volume_match
→ safety_ready
→ heating
→ evaporating
→ residue_observation
→ compare
→ complete
```

### Equal-condition validator
- A/B 액체량 normalized 0~1
- 예: `abs(A-B) <= 0.03`
- 조건이 다르면 heating 잠금

### residue
- 바닷물 쪽에 흰색 고체 흔적을 sprite/mask로 표현
- “순수 소금 결정” 정량 모델처럼 표현하지 않음
- 맛보기 interaction 금지

---

## 13. P06 해안 현장 조사

Phaser 2.5D:
- wide side-scroll coast
- landform zones
- camera frame pointer 이동
- 실제 device camera가 아니라 game scene capture

```ts
interface CoastCaptureRecord {
  id: string;
  zoneId: string;
  normalizedFrame: { x: number; y: number; w: number; h: number };
  featureAnchorIds: string[];
  capturedAt: number;
}
```

- 정밀 pixel 판정 금지
- 넓은 polygon hotspot
- capture마다 feature anchor 2개 이상

---

## 14. P07 해안 조사 앨범

- DOM/SVG/Canvas
- P06 capture metadata를 카드로 재구성
- 최소 4개 조사 카드
- 비교 1쌍 필수
- 잘못 연결 시 P06 해당 지점으로 deep link
- 가능하면 대형 screenshot 저장보다 zoneId + frame metadata 재렌더

---

## 15. P08 밀물·썰물 Time Scan

실제 조석 예측 엔진이 아니라 **교육용 결정론적 타임라인**.

```ts
interface TideFrame {
  t: number;               // 0..1
  waterLevel: number;      // visual state only
  beachReveal: number;
  roadVisible: boolean;
  rockVisible: boolean;
  boatHeight: number;
  pillarSubmerge: number;
}
```

- `t`를 TimelineScrubber로 조작
- water mask/plane + props 상태를 preset curve로 보간
- 실제 지역의 조위·시각과 연결하지 않음
- A/B snapshot은 `t + visualState`
- evidence: road / beach / boat / rock / pillar 중 2개 이상
- 증거 제출 뒤 밀물/썰물 용어 활성화
- 달/인력/조석 원인 UI 없음

---

## 16. P09 갯벌 생태 조사

```text
hidden_clue
→ clue_detected
→ zoom_observed
→ feature_1
→ feature_2
→ candidate_compare
→ species_recorded
```

### Lens
- circular mask 또는 DOM clip-path
- 고해상도 sprite atlas
- AI 자동 판별 없음
- 검수된 hotspot/metadata 기반

```ts
interface MudflatSpecies {
  id: string;
  displayName: string;
  category: "animal" | "plant" | "bird";
  clueAnchors: string[];
  requiredFeatureIds: string[];
  copyKey: string;
  sourceRef?: string;
}
```

이름만 클릭해서 등록 불가. `requiredFeatureIds` 최소 2개 필요.

---

## 17. P10 최종 브리핑

```ts
interface FinalBriefing {
  claim: string;
  evidenceIds: string[];
  valueId: string;
  action: string;
  optionalAudioKey?: string;
}
```

Validator:
- evidence 2개 이상
- value evidence 1개 이상
- action 1개 이상
- claim 존재

### Audio
- MediaRecorder 지원 시만 활성
- 최대 10초
- 권한 거부 시 비활성
- 완주 조건 아님

### PNG export
- Canvas 2D
- 외부 CDN 의존 최소화
- 학생 이름은 저장 직전에 직접 입력 가능하되 기본 state에는 포함하지 않음

---

## 18. 콘텐츠 데이터 분리

```text
standards.json
earth-samples.json
water-sample-lab.json
coast-landforms.json
tide-timeline.json
mudflat-species.json
mudflat-values.json
hints.json
copy.ko.json
```

검수자가 JSON만 보고 확인할 수 있어야 하는 것:
- 성취기준
- 허용 근거
- 완료 조건
- 금지 개념
- 피드백
- 생물 특징
- 밀물·썰물 변화 증거
- 바닷물 비교 결과 표현

---

## 19. 과학 Guardrail

예시 forbidden scan:

```ts
const forbiddenContent = [
  "달의 인력 때문에 밀물이",
  "조석의 원인은",
  "맛을 직접 보세요",
  "바닷물을 마셔 보세요"
];
```

추가 검수:
- P03 대기 표현이 정량 두께 모델처럼 보이지 않는가
- P05 잔류물을 “순수 소금 100%”처럼 표현하지 않는가
- P06 지형 형성 원인 심화가 핵심 평가가 아닌가
- P08 조석 원인이 노출되지 않는가
- P09 생물 특징이 검수 자료와 맞는가
- P10 갯벌 가치가 과장·단정되지 않는가

---

## 20. 카메라 규칙

### P01
- fixed 3/4
- limited orbit
- zoom clamp

### P02/P10
- fixed preset
- zone focus transition
- 자유 회전 불필요
- restored transition만 cinematic

### P03
- object-centered orbit
- pan off
- zoom clamp
- scan placement mode에서는 orbit 잠금 가능

---

## 21. Gesture 정책

- Pointer Events 중심
- hover 전용 기능 금지
- tap/drag threshold
- pinch는 보조
- 멀티터치 필수 완료 금지
- long press 핵심 완료 금지
- drag 대체 입력
- annotation undo/clear
- P08 timeline 큰 손잡이 + keyboard arrow fallback
- P03 camera mode / scan mode 분리

---

## 22. 저장

```ts
const STORAGE_KEY = "science-world:blue-planet-research-hq:v1";
```

저장 시점:
- Screen/Stage 완료
- P03 sample 추가 debounce
- P05 trial 완료
- P06 capture 완료
- P08 A/B snapshot 저장
- P09 species record 등록
- P10 briefing update debounce
- settings 변경
- `visibilitychange`
- topic exit

IndexedDB stores:
```text
progress
earthSamples
waterTrials
coastRecords
tideEvidence
mudflatRecords
briefings
optionalAudio
```

---

## 23. MissionResult

```ts
interface MissionResult {
  topicId: "topic-06-earth-sea";
  attemptId: string;
  completed: boolean;
  completedStages: StageId[];
  standardEvidence: Record<StandardCode, {
    completed: boolean;
    evidenceCount: number;
    retryCount: number;
  }>;
  restoredData: string[];
  badges: string[];
  hintCount: number;
  durationSec: number;
  finishedAt: string;
}
```

개인정보는 포함하지 않는다.

---

## 24. 자산 정책

### 3D
- GLB/GLTF
- Draco/Meshopt는 공통 정책에 맞춰 선택
- Earth texture 1024~2048 device profile
- P01/P02/P10 material 수 최소화
- 실시간 그림자 0~1개
- 3D 한글 texture 금지

### 2D
- WebP 우선
- 알파 필요 시 WebP/PNG
- HUD text는 이미지로 만들지 않음
- 화면당 핵심 foreground asset 10개 이하 권장
- 갯벌 확대 이미지는 구역 진입 시 lazy load

### Audio
- OGG + MP3 fallback
- Screen별 lazy load

---

## 25. 성능 목표

- logical 1280×720
- DPR clamp: `Math.min(devicePixelRatio, 1.5)`
- 2D 목표 60fps
- 3D 최소 30fps
- WebGL context 1개 active
- initial JS gzip 2.5~3MB 이하 목표
- 대형 GLB Screen 단위 로드
- Service Worker 전체 대용량 precache 금지
- Three post-processing 기본 off
- Phaser offscreen animation pause / texture atlas / object pooling

---

## 26. 접근성

- 최소 터치 44px, 권장 48px
- keyboard fallback
- focus visible
- reduced motion
- mute/captions
- 색상+형태+텍스트
- drag alternative
- 3D reset view
- timeline step buttons
- annotation undo
- 음성 optional

---

## 27. 힌트

단계:
1. 관찰 위치 강조
2. 도구 강조
3. 질문형 힌트
4. 부분 시범

예:
- P03: “지구를 조금 돌려 다른 지역도 스캔해 봐.”
- P05: “두 접시의 물 양이 같은지 먼저 비교해 봐.”
- P06: “바닥의 재료와 경사를 따로 살펴봐.”
- P08: “A와 B에서 길이 물에 잠긴 정도가 달라졌어.”
- P09: “이름을 고르기 전에 특징을 하나 더 확대해 봐.”

정답 전체를 즉시 노출하지 않는다.

---

## 28. 오디오

BGM:
- `main_hq`
- `stage1_earth_scan`
- `stage2_water_lab`
- `stage3_coast`
- `stage4_tide`
- `stage5_mudflat_final`

SFX:
- scan / confirm / data_restore
- pipette / heater / evaporate
- shutter / annotation
- timeline_tick / wave
- bio_scan / badge

첫 사용자 제스처 이후 오디오 활성화.

---

## 29. 테스트

### Unit
- surface sample coverage
- sample classification validator
- equal-condition water lab validator
- coast capture/annotation validator
- tide snapshot difference validator
- species evidence validator
- final briefing validator
- persistence migration

### Integration
- EventBus cleanup
- Three → store
- Phaser → store
- DOM → store
- P02/P10 HQ scene reuse
- Stage unlock
- reload restore
- optional audio permission failure

### E2E
1. 신규 시작
2. P01 오류 탐색
3. P02 Stage 1 진입
4. P03 sample 확보
5. P04 결론 제출
6. reload 후 복귀
7. P05 조건 불일치 → 수정 → 완료
8. P06 촬영 → P07 앨범
9. P08 A/B snapshot + evidence
10. P09 species evidence
11. P10 claim-evidence briefing
12. MissionResult 생성
13. reset

Tablet QA:
- Galaxy Tab Chrome
- Samsung Internet
- iPad Safari
- Windows touch Chrome/Edge
- mouse fallback

---

## 30. 검증 체크리스트

### 교육
- [ ] [4과06-01] 대기·육지·바다 관찰/비교
- [ ] [4과06-02] 바닷물/육지 물 비교 + 바닷가 지형 조사
- [ ] [4과06-03] 밀물/썰물 비교 + 갯벌 가치/보전 설득·홍보
- [ ] 밀물·썰물 원인 설명 없음
- [ ] 바닷물 잔류물을 순수 소금 하나로 과도하게 단정하지 않음
- [ ] 맛보기 상호작용 없음
- [ ] 갯벌 이름 암기만으로 완료 불가

### UX
- [ ] 5 Stages / 10 Screens
- [ ] P01·02·03·10 3D
- [ ] P03 핵심 3D 관측
- [ ] 각 Stage 조작 문법 다름
- [ ] OX/객관식 반복 없음
- [ ] 증거 없이 정답 버튼만 눌러 완료 불가
- [ ] 힌트 후 재관찰 가능

### 성능
- [ ] 3D 30fps 목표
- [ ] inactive renderer pause/dispose
- [ ] listener leak 없음
- [ ] lazy load
- [ ] large texture fallback

---

## 31. 배포

권장:
- GitHub Repository: `blue-planet-research-hq`
- Vercel 또는 Science World 통합 빌드

```bash
npm run build
npm run test
npm run verify
```

`verify` 최소 구성:
- TypeScript
- lint
- unit tests
- JSON schema validation
- asset manifest missing-file check
- forbidden content scan
- build

---

## 32. GitHub

**Repository Name**

`blue-planet-research-hq`

**Description**

`Interactive Grade 3 science game for investigating Earth's surface, seawater, coastal landforms, tides, and mudflat ecosystems through observation, experiments, time-based comparison, and evidence-based missions.`
