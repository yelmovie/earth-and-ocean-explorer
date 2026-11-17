#!/bin/bash
# 3D 탐사길 걷기 그림을 docs/IMAGE-PROMPTS-20261117-run-stage.json 순서대로 한 장씩 만든다.
# 여러 프로젝트 세션이 같은 이미지 도구를 쓰므로 _shared/run-stage-lock.sh로 차례를 기다린다(끝 코드 75면 다시 시도).
# 사용: scripts/generate-run-stage.sh [이름 ...]   이름을 주지 않으면 아직 없는 그림을 모두 만든다.
set -uo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
lock="/Volumes/T7 Shield/iscreammedia_sc34/_shared/run-stage-lock.sh"
tool="/Volumes/T7 Shield/AI-Skills/custom/gpt-imagegen/scripts/gpt-image.sh"
out="$root/assets/generated/20261117-run-stage"
mkdir -p "$out"
names=("$@")
if [[ ${#names[@]} -eq 0 ]]; then
  while IFS= read -r name; do names+=("$name"); done < <(node -e 'for (const i of require(process.argv[1]).images) console.log(i.name)' "$root/docs/IMAGE-PROMPTS-20261117-run-stage.json")
fi
for name in "${names[@]}"; do
  [[ -f "$out/$name.png" ]] && { echo "있음 $name"; continue; }
  prompt=$(node -e 'const i=require(process.argv[1]).images.find(x=>x.name===process.argv[2]); if(!i) process.exit(1); process.stdout.write(i.prompt)' "$root/docs/IMAGE-PROMPTS-20261117-run-stage.json" "$name") || { echo "프롬프트 없음 $name"; continue; }
  ref=$(node -e 'const i=require(process.argv[1]).images.find(x=>x.name===process.argv[2]); process.stdout.write(i.reference||"")' "$root/docs/IMAGE-PROMPTS-20261117-run-stage.json" "$name")
  for try in 1 2 3 4 5 6 7 8; do
    echo "== $name 시도 $try $(date +%T)"
    if [[ -n $ref ]]; then LOCK_WAIT=540 "$lock" image "$tool" -o "$out/$name.png" -i "$root/$ref" "$prompt"; else LOCK_WAIT=540 "$lock" image "$tool" -o "$out/$name.png" "$prompt"; fi
    code=$?
    [[ -f "$out/$name.png" ]] && { echo "완료 $name $(date +%T)"; break; }
    [[ $code -eq 75 ]] && continue
    echo "실패 $name (끝 코드 $code)"; sleep 5
    [[ $try -ge 3 ]] && break
  done
done
echo "끝 $(date +%T)"
