# Meshy 말뚝 원본 (2026-11-21)

3D 갯벌 탐사길(`src/tide-walk.js`)의 나무 말뚝(탐사길·끝 전망대·데크 기둥 32개)을 그리는 모형의 원본 기록. 지침 `_shared/MESHY-3D-UPGRADE-20261121.md` 10번 줄.

| 항목 | 값 |
|---|---|
| 입력 그림 | `post.png` (887×1774, 투명 배경, gpt-imagegen, 참고 그림 `public/assets/illustrations/run-stage/prop-crate.webp`), sha256 `e6f934f14943f444d70e1934446b0cfc543a36a7820f0d10afd18485a8d1533d` |
| Meshy 작업 | `01a1fd80-2a44-7231-ae3d-ffaf54a565de` 「Weathered Wooden Post」, Meshy 7.1·표준·텍스처 Meshy 7 2K·포즈 끔, 30크레딧, 72,924삼각형 |
| 라이선스 | 비공개(비공식적인). CC BY 아님 |
| 원본 GLB | `post-meshy71-std-tex2k.glb` 10,515,916B, sha256 `9ff6824f306c5280a4a6690829d5288f3a0c55b2845378b77dc117f4cf7edaf8` (Git 제외, 외장 SSD에만 보관. 받기: `_shared/meshy/downloads/10-post.glb`) |
| 앱용 GLB | `public/assets/models/tide-post.glb` 30,536B, 501삼각형, 텍스처 512px JPEG, meshopt, sha256 `cebc2f9dd6437bfd15b0d5d760a6f5a5f362bb6ee186ee44bb9297b70a6fd3b6` |

## 만든 순서

1. `_shared/meshy/pack.mjs <원본> base.glb 0.03 0.006`로 텍스처를 1024px로 줄인 중간본(`base-tex.tmp.glb`)을 얻는다. gltfpack 단순화는 UV 이음매 때문에 약 3,800~4,600삼각형에서 멈췄고(말뚝 32개면 약 15만), `-sa`는 나뭇결이 조각나서 쓰지 않았다.
2. `bake-low.py`(이 폴더): Blender 5.2에서 정점을 붙인 뒤 Decimate 0.008 → 501삼각형, 새 UV(Smart UV)에 원본 색을 512px로 굽는다(Cycles, selected to active).
   `TMPDIR=<외장> Blender -b --factory-startup -P bake-low.py -- base-tex.tmp.glb low.glb 0.008 512`
3. `pack.mjs low.glb tide-post.glb 1 0.001`로 JPEG·meshopt 압축 → `public/assets/models/tide-post.glb`.

화면에서는 InstancedMesh 하나(32개, 약 1.6만 삼각형)로 그리고, 불러오지 못하면 예전 상자 말뚝이 그대로 보인다. 물 높이 눈금·판정·충돌은 바뀌지 않는다.
