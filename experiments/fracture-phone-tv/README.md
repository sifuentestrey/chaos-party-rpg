# Fracture phone-to-TV integration experiment

This is an **isolated one-character experimental bridge**, not a migrated multiplayer Chaos Party game. It does not modify the old Chaos Party world, inventory, saves, or server. It does not activate AI, require any provider keys, or create Fracture user accounts.

Fracture upstream pinned for review: `georgeglarson/Fracture` at `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`. Original license: MPL 2.0 code and CC BY-SA 3.0 content. Preserve upstream notices, credits, and asset provenance. Fracture's character system stores account passwords; create a throwaway test character, never use or copy real Chaos recovery credentials. The adapter copies `server/config.example.json` to ignored `server/config.json` only if the latter is absent; upstream will not boot without a local config.

## What is working now

The local bridge provides paired host/TV/phone URLs, a plain phone text field, a shared eight-second lock, and a tiny recent-action stream. Six Node.js offline tests verify host/phone/TV separation, missing TV behavior, event forwarding and action lock, and cross-origin rejection. This is not proof that the whole Fracture game has booted or executed a live attack.

## One-click Mac trial

On a Mac with Node 22+ installed: double-click `Start_Fracture_Chaos_Test.command` (or run it in Terminal). The launcher intentionally invokes `npx --yes pnpm@10`, which respects the upstream Fracture `pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3` and `esbuild`; pnpm 12 ignores this legacy field and produces `ERR_PNPM_IGNORED_BUILDS`. No global pnpm installation or blanket build-script approval is required. It will create its own checkout in `~/Fracture-Chaos-Spike`, install/build there, run six offline tests, start ports 8000/4748 and open the host page. It does not alter original Chaos Party. On first use, network download/install may take time. If macOS blocks the downloaded script, inspect it and run from Terminal instead; do not bypass security prompts blindly. Press Control-C in the launcher Terminal to stop.

## Run a one-character trial on a Mac with Node 22+ and pnpm

1. Open Terminal in this `experiments/fracture-phone-tv` folder. Run `node --test bridge.test.mjs`.
2. Clone Fracture **outside** your Chaos Party checkout: `git clone https://github.com/georgeglarson/Fracture.git ~/Fracture-Chaos-Spike` and `cd ~/Fracture-Chaos-Spike` then `git checkout 642c00a8a2d3a95979e85bbfa3f62deee611a4a6`.
3. Install with `pnpm install --frozen-lockfile` (use `corepack enable` or an existing pnpm installation, if necessary).
4. Back in this folder: `node apply-overlay.mjs ~/Fracture-Chaos-Spike`.
5. In Fracture checkout: `pnpm run build:server && pnpm run build:client && pnpm start` (Fracture listens on port 8000).
6. In a second Terminal: `node bridge.mjs`. It prints a **private host link**; open it on the Mac. Launch Fracture via the link, sign into a throwaway character, and use the phone join link while connected to the same Wi-Fi. Don't share the host link, TV link, or expose port 4748 to the Internet.
7. Try `attack the rat`, `talk to the guard`, and `look around`. Check whether the character genuinely moves/attacks. Current adapter uses Fracture's real interaction controller and client pathfinder; actual gameplay has **not** been validated until this manual run.

## Known limits / stop conditions

- **Only the TV account character is controlled.** Multiple phones do not yet have individual Fracture characters; the eight-second action lock serializes their actions. This is the first technical slice only, not a viable 12–20-player release.
- Only a small, explicit action grammar is supported. Natural language AI has not been connected. No claim of universal free-form control.
- The current Fracture renderer/HUD may not be a clean full-screen TV experience; evaluate before committing to this base.
- The original game may use native SQLite modules that require building on your Intel Mac. This has not been verified.
- **Do not** integrate entire Fracture trees into the original Chaos Party code, mix Colyseus with Socket.IO, or disable movement/range validation to make a demo pass.
- This script intentionally refuses repeated patches or targeting a non-Fracture checkout.

After an actual attack-and-response demo passes and visual quality satisfies the owner, evaluate an authenticated headless character-per-phone architecture and spectator camera. Otherwise stop and change foundation instead of spending more effort on poor fit.


## macOS error: `ERR_PNPM_IGNORED_BUILDS` from pnpm 12

The original launcher selected Corepack's latest pnpm (12.16.1 on the first physical Mac test), which ignores Fracture's version-10 `pnpm.onlyBuiltDependencies` field. The pinned-major launcher above fixes that and reuses the existing `~/Fracture-Chaos-Spike` clone. Do **not** approve all arbitrary install scripts or alter the original Chaos Party checkout.

If you previously downloaded a ZIP, replace **only** the launcher script in the unpacked folder using the current branch copy:

```sh
cd ~/Downloads/chaos-fracture-spike
curl -fsSL https://raw.githubusercontent.com/sifuentestrey/chaos-party-rpg/spike/fracture-phone-tv/experiments/fracture-phone-tv/Start_Fracture_Chaos_Test.command -o Start_Fracture_Chaos_Test.command
bash Start_Fracture_Chaos_Test.command
```

This keeps the sibling scripts from the ZIP and may reinstall dependency artifacts if pnpm 10 cannot reuse the modules initially created by pnpm 12. That reinstall affects only `~/Fracture-Chaos-Spike/node_modules`, never original Chaos saves. If pnpm reports an incompatible modules store, stop and share the exact error; do not delete any unrelated folder.

## October 29: directional/STOP test refresh (still one TV actor)

The owner confirmed the original phone **`attack the rat`** triggered an action but reported that `stop`, `move left` and `move the tent` did not work. The experiment now provides:

- `stop`, `halt`, `cancel`, `stop attacking` to interrupt local navigation/combat; a stop request bypasses the placeholder global eight-second action lock
- `move left/right/up/down`, `walk left`, `go north/east/south/west` for one collision-checked tile using Fracture's native movement controller
- Grounded rejection for unavailable movable scenery rather than pretending a tent moved
- Phone distinguishes `Received/Waiting` from the TV interpreter's `STARTED/BLOCKED/COMPLETED` acknowledgment; `STARTED` is **not proof that a target lost HP or died**

**Important:** This is not independent character-per-phone yet. It uses one shared phone token and TV actor, so the special STOP lock bypass must be replaced with actor-scoped authorization before multi-player release.

### Updating an already installed Mac test

Stop the old launcher with Control-C. From Terminal, execute these commands to replace only the named files in your unzipped test folder with the latest GitHub experimental copies:

```sh
cd ~/Downloads/chaos-fracture-spike
BASE=https://raw.githubusercontent.com/sifuentestrey/chaos-party-rpg/spike/fracture-phone-tv/experiments/fracture-phone-tv
for f in bridge.mjs bridge.test.mjs chaos-remote.ts apply-overlay.mjs apply-overlay.test.mjs Start_Fracture_Chaos_Test.command; do
  curl -fSL "$BASE/$f" -o "$f" || exit 1
done
bash Start_Fracture_Chaos_Test.command
```

The launcher now refreshes **only the already identified Chaos-owned `client/ts/chaos-remote.ts`** in the pinned sibling Fracture checkout, refuses to overwrite other source files, keeps `server/config.json` unchanged, and uses pnpm 10. Existing character saves in Fracture and original Chaos are untouched. The rebuilt TV tab receives a **new private host/phone pairing link**; use the new link rather than a link from a previous run.

Full game-night ambition and the remaining acceptance gates are tracked in [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12) and [release tracker](../../docs/FRACTURE_GAME_NIGHT_RELEASE.md). No one-character bridge build should be presented as a finished 12–20 player game.
