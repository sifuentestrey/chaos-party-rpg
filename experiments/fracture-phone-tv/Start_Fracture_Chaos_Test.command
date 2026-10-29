#!/bin/bash
# Non-destructive first test: separate Fracture checkout and local phone bridge.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/Fracture-Chaos-Spike"
PIN=642c00a8a2d3a95979e85bbfa3f62deee611a4a6
LOG_DIR="$(mktemp -d /tmp/chaos-fracture-test.XXXXXX)"
FR_PID=''
BRIDGE_PID=''
cleanup() {
  echo ''
  echo "Stopping only the test processes started by this launcher. Logs: $LOG_DIR"
  if [[ -n "$BRIDGE_PID" ]]; then kill "$BRIDGE_PID" 2>/dev/null || true; fi
  if [[ -n "$FR_PID" ]]; then kill "$FR_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
fail() { echo "ERROR: $*"; echo 'This launcher has not changed your original Chaos Party project.'; read -r -p 'Press Enter to close... ' _ || true; exit 1; }

command -v git >/dev/null || fail 'Git is required. Install Apple Command Line Tools (xcode-select --install).'
command -v node >/dev/null || fail 'Node.js 22+ must be installed and available in Terminal.'
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
[[ "$NODE_MAJOR" -ge 22 ]] || fail "Node 22+ required; found $(node --version)"
command -v curl >/dev/null || fail 'curl is required.'
if lsof -nP -iTCP:8000 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then fail 'Port 8000 is in use. Close only your existing Fracture test session first.'; fi
if lsof -nP -iTCP:4748 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then fail 'Port 4748 is in use. Close only an existing Chaos Fracture bridge first.'; fi
pnpm_cmd() {
  if command -v pnpm >/dev/null; then pnpm "$@"
  elif command -v corepack >/dev/null; then corepack pnpm "$@"
  else npx --yes pnpm@10 "$@"; fi
}
echo '=== Chaos Party on Fracture: separate first test ==='
echo "Fracture goes into: $TARGET"
echo 'No original Chaos Party source, saves, or AI settings will be modified.'
if [[ ! -e "$TARGET" ]]; then
  git clone https://github.com/georgeglarson/Fracture.git "$TARGET"
  git -C "$TARGET" checkout "$PIN"
fi
[[ -d "$TARGET/.git" ]] || fail 'Target exists but is not a Git checkout; refusing overwrite.'
[[ "$(git -C "$TARGET" remote get-url origin)" == *'georgeglarson/Fracture.git' ]] || fail 'Target has an unexpected Git origin; refusing overwrite.'
[[ "$(git -C "$TARGET" rev-parse HEAD)" == "$PIN" ]] || fail 'Existing Fracture checkout is a different version; refusing overwrite.'
if ! grep -q 'startChaosRemote(game)' "$TARGET/client/ts/main.ts"; then
  node "$HERE/apply-overlay.mjs" "$TARGET"
fi
cd "$TARGET"
echo 'Installing Fracture dependencies and building client/server...'
pnpm_cmd install --frozen-lockfile
pnpm_cmd run build:server
pnpm_cmd run build:client
node --test "$HERE/bridge.test.mjs" "$HERE/apply-overlay.test.mjs"
echo 'Starting local Fracture server...'
NO_DEBUG=1 node dist/server/ts/main.js > "$LOG_DIR/fracture.log" 2>&1 &
FR_PID=$!
ready=0
for ((i=0;i<45;i++)); do
  if curl -fsS --max-time 2 http://localhost:8000/ -o /dev/null 2>/dev/null; then ready=1; break; fi
  if ! kill -0 "$FR_PID" 2>/dev/null; then break; fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then tail -45 "$LOG_DIR/fracture.log"; fail 'Fracture did not start. See the log above.'; fi
node "$HERE/bridge.mjs" > "$LOG_DIR/bridge.log" 2>&1 &
BRIDGE_PID=$!
for ((i=0;i<15;i++)); do
  if grep -q '^Chaos Fracture local bridge:' "$LOG_DIR/bridge.log"; then break; fi
  sleep 1
done
HOST_URL="$(sed -n 's/^Chaos Fracture local bridge: //p' "$LOG_DIR/bridge.log" | head -1)"
[[ -n "$HOST_URL" ]] || fail 'Phone bridge failed to start.'
echo ''
echo '=== Ready for your test ==='
echo "Host link: $HOST_URL"
echo 'Open host page, click the TV game link, and sign in as a NEW THROWAWAY Fracture character.'
echo 'Use the phone link from that host page on a phone connected to the same Wi-Fi.'
echo 'Try: attack the rat, talk to the guard, look around.'
echo 'This only controls ONE TV character and is NOT a multiplayer release.'
echo "Logs: $LOG_DIR"
echo 'Leave this Terminal window open; press Control-C to stop only this test.'
open "$HOST_URL"
wait "$BRIDGE_PID"
