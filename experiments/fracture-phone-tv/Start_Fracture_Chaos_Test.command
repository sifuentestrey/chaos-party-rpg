#!/bin/bash
# Non-destructive first test: separate Fracture checkout and local phone bridge.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${FRACTURE_CHAOS_TARGET:-$HOME/Fracture-Chaos-Spike}"
PIN=642c00a8a2d3a95979e85bbfa3f62deee611a4a6
LOG_DIR="$(mktemp -d /tmp/chaos-fracture-test.XXXXXX)"
FR_PID=''
BRIDGE_PID=''
cleanup() {
  echo ''
  echo "Stopping only the test processes started by this launcher. Logs: $LOG_DIR"
  if [[ -n "$BRIDGE_PID" ]]; then kill "$BRIDGE_PID" 2>/dev/null || true; wait "$BRIDGE_PID" 2>/dev/null || true; fi
  if [[ -n "$FR_PID" ]]; then kill "$FR_PID" 2>/dev/null || true; wait "$FR_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
fail() { echo "ERROR: $*"; echo 'This launcher has not changed your original Chaos Party project.'; read -r -p 'Press Enter to close... ' _ || true; exit 1; }

command -v git >/dev/null || fail 'Git is required. Install Apple Command Line Tools (xcode-select --install).'
command -v node >/dev/null || fail 'Node.js 22+ must be installed and available in Terminal.'
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
NODE_MINOR="$(node -p 'Number(process.versions.node.split(".")[1])')"
[[ "$NODE_MAJOR" -ge 24 || ( "$NODE_MAJOR" -eq 22 && "$NODE_MINOR" -ge 18 ) ]] || fail "Node 22.18+ LTS or 24+ required; found $(node --version)"
command -v curl >/dev/null || fail 'curl is required.'
if lsof -nP -iTCP:8000 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then fail 'Port 8000 is in use. Close only your existing Fracture test session first.'; fi
if lsof -nP -iTCP:4748 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then fail 'Port 4748 is in use. Close only an existing Chaos Fracture bridge first.'; fi
pnpm_cmd() {
  # Fracture's package.json still uses pnpm.onlyBuiltDependencies.
  # pnpm 12 ignores this legacy field and refuses required native builds.
  # Use the same pnpm 10 major version as our passing CI, regardless of
  # whether Mac Corepack has installed pnpm 12 globally.
  if npx --offline --yes pnpm@10.34.9 --version >/dev/null 2>&1; then
    npx --offline --yes pnpm@10.34.9 "$@"
  else
    npx --yes pnpm@10.34.9 "$@"
  fi
}
echo '=== Chaos Party on Fracture: local game-night beta ==='
echo "Fracture goes into: $TARGET"
echo 'No original Chaos Party source, saves, or AI settings will be modified.'
if [[ ! -e "$TARGET" ]]; then
  git clone https://github.com/georgeglarson/Fracture.git "$TARGET"
  git -C "$TARGET" checkout "$PIN"
fi
[[ -d "$TARGET/.git" ]] || fail 'Target exists but is not a Git checkout; refusing overwrite.'
[[ "$(git -C "$TARGET" remote get-url origin)" == *'georgeglarson/Fracture.git' ]] || fail 'Target has an unexpected Git origin; refusing overwrite.'
[[ "$(git -C "$TARGET" rev-parse HEAD)" == "$PIN" ]] || fail 'Existing Fracture checkout is a different version; refusing overwrite.'
# Reapply only the known Chaos-owned adapter, never rewrite upstream gameplay or saves.
# This refreshes directional/STOP handling when the launcher is updated.
node "$HERE/apply-party-overlay.mjs" "$TARGET"
if [[ ! -f "$TARGET/server/config.json" ]]; then
  cp "$TARGET/server/config.example.json" "$TARGET/server/config.json"
fi
cd "$TARGET"
BUILD_ID="$(node "$HERE/build-fingerprint.mjs")"
BUILT_ID="$(cat "$TARGET/dist/.chaos-build-id" 2>/dev/null || true)"
if [[ "$BUILD_ID" != "$BUILT_ID" || ! -f "$TARGET/dist/client/main.js" || ! -f "$TARGET/dist/server/ts/main.js" || ! -d "$TARGET/node_modules" ]]; then
  echo 'Installing pinned dependencies and building the isolated beta (first launch or update)...'
  pnpm_cmd install --frozen-lockfile
  pnpm_cmd run build:server
  pnpm_cmd run build:client
  echo "$BUILD_ID" > "$TARGET/dist/.chaos-build-id"
else
  echo 'Using the existing verified build; no download is needed.'
fi
node --test "$HERE/"*.test.mjs
export FRACTURE_ROOT="$TARGET"
export CHAOS_WORLD_MODULE="$HERE/chaos-world.mjs"
export CHAOS_ACTOR_KEY="${CHAOS_ACTOR_KEY:-$(node -p "require('node:crypto').randomBytes(32).toString('hex')")}"
export CHAOS_TV_KEY="${CHAOS_TV_KEY:-$(node -p "require('node:crypto').randomBytes(32).toString('hex')")}"
# Never activate paid upstream providers from a saved config or environment.
export VENICE_API_KEY=''
export FISH_AUDIO_API_KEY=''
# Match the original free-AI launcher: Node fetch must honor an injected proxy.
if [[ -n "${HTTPS_PROXY:-}${HTTP_PROXY:-}" ]]; then
  export NODE_USE_ENV_PROXY="${NODE_USE_ENV_PROXY:-1}"
  export NO_PROXY="localhost,127.0.0.1,::1,${NO_PROXY:-}"
fi
export NODE_ENV=production
echo 'Starting local Fracture server...'
NO_DEBUG=1 node "$HERE/start-child.mjs" dist/server/ts/main.js > "$LOG_DIR/fracture.log" 2>&1 &
FR_PID=$!
ready=0
for ((i=0;i<45;i++)); do
  if curl -fsS --max-time 2 http://localhost:8000/ -o /dev/null 2>/dev/null; then ready=1; break; fi
  if ! kill -0 "$FR_PID" 2>/dev/null; then break; fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then tail -45 "$LOG_DIR/fracture.log"; fail 'Fracture did not start. See the log above.'; fi
node "$HERE/start-child.mjs" "$HERE/party-bridge.mjs" > "$LOG_DIR/bridge.log" 2>&1 &
BRIDGE_PID=$!
for ((i=0;i<15;i++)); do
  if grep -q '^Chaos Fracture local bridge:' "$LOG_DIR/bridge.log"; then break; fi
  sleep 1
done
HOST_URL="$(sed -n 's/^Chaos Fracture local bridge: //p' "$LOG_DIR/bridge.log" | head -1)"
[[ -n "$HOST_URL" ]] || fail 'Phone bridge failed to start.'
echo ''
echo '=== Local beta ready ==='
echo "Host link: $HOST_URL"
echo 'Open the host page and click Open shared TV. The spectator starts automatically.'
echo 'Use the phone link from that host page on a phone connected to the same Wi-Fi.'
echo 'Try: look around, walk north 3, attack rat, talk to guard, pick up sword2, equip sword2.'
echo 'Each phone controls its own character. This is an experimental beta; physical Mac and party capacity require acceptance.'
echo "Logs: $LOG_DIR"
echo 'Leave this Terminal window open; press Control-C to stop only this test.'
if [[ "${CHAOS_NO_BROWSER:-0}" != 1 ]]; then open "$HOST_URL"; fi
wait "$BRIDGE_PID"
