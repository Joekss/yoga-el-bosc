#!/usr/bin/env bash
# Arrenca un servidor local temporal i passa les proves de fum.
# Ús: npm test            (o DIR=dist PORT=5001 bash tests/run.sh)
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-5000}"; DIR="${DIR:-.}"
python3 -m http.server "$PORT" --directory "$DIR" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
until curl -s "localhost:$PORT" >/dev/null; do sleep 0.2; done
BASE="http://localhost:$PORT/" node tests/smoke.spec.js
