#!/usr/bin/env bash
# Build, threshold, and verify the weather display design exports.
#
#   ./build.sh          canonical frames only (5 normal + 6 states); verify must print PASS
#   ./build.sh --all    also regenerate the historical renders under design/exports/archive/
#
# Prerequisites: Node with `sharp` (cd design && npm install) and Python 3 with Pillow
# (python3 -m pip install -r design/requirements.txt). See README.md.
set -euo pipefail
cd "$(dirname "$0")"
if [ -z "${NODE_PATH:-}" ] && [ -d design/node_modules ]; then
  export NODE_PATH="$PWD/design/node_modules"
fi
PY=python3
if [ -x design/.venv/bin/python ]; then PY=design/.venv/bin/python; fi
# A Rosetta shell can launch a universal Python as x86_64 while the venv's Pillow is arm64.
PY_CMD=("$PY")
if [ "$(uname -s)" = Darwin ] && /usr/bin/arch -arm64 "$PY" -c 'import PIL' >/dev/null 2>&1; then
  PY_CMD=(/usr/bin/arch -arm64 "$PY")
fi
node design/build.js "$@"
"${PY_CMD[@]}" design/threshold.py
"${PY_CMD[@]}" design/verify.py "$@"
