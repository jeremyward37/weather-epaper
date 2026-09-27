#!/usr/bin/env bash
# Build the seven canonical frames in the pinned renderer and compare them to HEAD.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null || { echo "error: docker is required" >&2; exit 2; }
docker info >/dev/null 2>&1 || { echo "error: the Docker daemon is not running" >&2; exit 2; }

SHARP_VERSION="$(sed -n 's/.*"sharp": "\([^"]*\)".*/\1/p' design/package.json)"
PILLOW_VERSION="$(sed -n 's/^Pillow==//p' design/requirements.txt)"
case "$SHARP_VERSION:$PILLOW_VERSION" in
  (*[!0-9.:]*) echo "error: renderer dependencies must use exact versions" >&2; exit 2 ;;
esac

IMAGE_KEY="$(git hash-object tools/render.Dockerfile design/package.json design/requirements.txt | git hash-object --stdin | cut -c1-12)"
IMAGE="weather-epaper-render:${IMAGE_KEY}"
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker build \
    --build-arg "SHARP_VERSION=$SHARP_VERSION" \
    --build-arg "PILLOW_VERSION=$PILLOW_VERSION" \
    --file tools/render.Dockerfile \
    --tag "$IMAGE" \
    .
fi

REFERENCE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/weather-epaper-reference.XXXXXX")"
trap 'rm -rf "$REFERENCE_DIR"' EXIT

FRAMES=(
  design/exports/normal/normal-summer.png
  design/exports/normal/normal-winter.png
  design/exports/normal/normal-spring.png
  design/exports/normal/normal-widths.png
  design/exports/normal/normal-night.png
  design/exports/states/state-setup.png
  design/exports/states/state-low-battery.png
)
for frame in "${FRAMES[@]}"; do
  mkdir -p "$REFERENCE_DIR/$(dirname "$frame")"
  git show "HEAD:$frame" > "$REFERENCE_DIR/$frame"
done

DOCKER_RUN=(docker run --rm --user "$(id -u):$(id -g)" --volume "$ROOT:/work" \
  --tmpfs /work/design/node_modules --workdir /work)
"${DOCKER_RUN[@]}" "$IMAGE" python3 -m unittest discover -s tools -p 'test_*.py'
set +e
"${DOCKER_RUN[@]}" "$IMAGE" ./build.sh
build_status=$?
set -e

printf '\n%-28s %18s\n' "Frame" "Differing pixels"
printf '%-28s %18s\n' "----------------------------" "------------------"
overall=$build_status
for frame in "${FRAMES[@]}"; do
  set +e
  output="$("${DOCKER_RUN[@]}" --volume "$REFERENCE_DIR:/reference:ro" "$IMAGE" \
    python3 tools/framediff.py "/reference/$frame" "$frame")"
  status=$?
  set -e
  if [ "$status" -gt 1 ]; then
    printf '%s\n' "$output" >&2
    exit "$status"
  fi
  count="$(printf '%s\n' "$output" | sed -n 's/^Differing pixels: //p')"
  printf '%-28s %18s\n' "$(basename "$frame")" "$count"
  if [ "$status" -ne 0 ]; then overall=1; fi
done
exit "$overall"
