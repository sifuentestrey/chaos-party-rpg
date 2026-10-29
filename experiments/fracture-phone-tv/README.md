# Fracture phone-to-TV integration experiment

This is an **isolated one-character experimental bridge**, not a migrated multiplayer Chaos Party game. It does not modify the old Chaos Party world, inventory, saves, or server. It does not activate AI, require any provider keys, or create Fracture user accounts.

Fracture upstream pinned for review: `georgeglarson/Fracture` at `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`. Original license: MPL 2.0 code and CC BY-SA 3.0 content. Preserve upstream notices, credits, and asset provenance. Fracture's character system stores account passwords; create a throwaway test character, never use or copy real Chaos recovery credentials. The adapter copies `server/config.example.json` to ignored `server/config.json` only if the latter is absent; upstream will not boot without a local config.

## What is working now

The local bridge provides paired host/TV/phone URLs, a plain phone text field, a shared eight-second lock, and a tiny recent-action stream. Six Node.js offline tests verify host/phone/TV separation, missing TV behavior, event forwarding and action lock, and cross-origin rejection. This is not proof that the whole Fracture game has booted or executed a live attack.

## One-click Mac trial

On a Mac with Node 22+ installed: double-click `Start_Fracture_Chaos_Test.command` (or run it in Terminal). It will create its own checkout in `~/Fracture-Chaos-Spike`, install/build there, run six offline tests, start ports 8000/4748 and open the host page. It does not alter original Chaos Party. On first use, network download/install may take time. If macOS blocks the downloaded script, inspect it and run from Terminal instead; do not bypass security prompts blindly. Press Control-C in the launcher Terminal to stop.

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
