#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
scratch="$(mktemp -d "$ROOT/server/.fixture-check.XXXXXX")"
trap 'rm -rf "$scratch"' EXIT
out="server/$(basename "$scratch")/frame"

for id in summer winter spring widths night; do
  ./tools/render.sh server --fixture "design/fixtures/normal-$id.json" --out "$out" >/dev/null
  printf '%s: ' "normal-$id"
  python3 tools/framediff.py "design/exports/normal/normal-$id.png" "$out/frame.png" | sed -n 's/^Differing pixels: /Differing pixels: /p'
  cmp "design/exports/normal/normal-$id.png" "$out/frame.png"
done

./tools/render.sh server --fixture design/fixtures/normal-night.json --low-battery --out "$out" >/dev/null
printf '%s: ' state-low-battery
python3 tools/framediff.py design/exports/states/state-low-battery.png "$out/frame.png" | sed -n 's/^Differing pixels: /Differing pixels: /p'
cmp design/exports/states/state-low-battery.png "$out/frame.png"
