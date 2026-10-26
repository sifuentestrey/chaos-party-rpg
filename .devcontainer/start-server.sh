#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if curl -fsS http://127.0.0.1:4747/health >/dev/null 2>&1; then
  exit 0
fi

nohup npm start > /tmp/chaos-party.log 2>&1 &

for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:4747/health >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

echo "Chaos Party did not start on port 4747. Recent log:"
tail -60 /tmp/chaos-party.log || true
exit 1
