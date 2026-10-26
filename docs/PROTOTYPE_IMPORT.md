# Original playable prototype import

This is a preservation import of Chaos Party v0.2.0. No game code, presentation, rules, or assets were redesigned or expanded.

## Provenance and completeness

Recovered the complete tracked source from the existing private Site source repository at commit 0c0dfed0571b1697e0a8541adaa83d50470b1c66. It contained 229 tracked files; all 228 game/source/documentation files are imported. The only excluded tracked file is .openai/hosting.json, which binds the old hosted Site and is unnecessary to run the game. Existing GitHub README.md, AGENTS.md, and docs are retained unchanged. The original prototype README and .gitignore are retained as docs/ORIGINAL_PROTOTYPE_README.md and docs/ORIGINAL_PROTOTYPE_GITIGNORE.txt. The root ignore file combines the existing protections with the original runtime/build exclusions.

ORIGINAL_PROTOTYPE_MANIFEST.json lists every imported original file, original and destination paths, byte count, SHA-256 and Git blob SHA. Application code, generated browser/server bundles, PNG/WAV assets, vendored PartyFrame code, package files and tests match the recovered source byte for byte.

## Run and build

Use Node.js 22 or newer:

```sh
npm ci
npm test
npm run build
npm start
```

npm start serves the real multiplayer application, default port 4747. npm run build creates the separate browser-local solo preview in dist; it does not provide a hosted multiplayer server. Read the original README for LAN play, setup and recovery.

Optional PNG rendering checks: node tests/ninja-render-check.mjs. These need the test-only @napi-rs/canvas package; set CHAOS_CANVAS_MODULE to its absolute index.js path outside the Codex runtime. This dependency was already external to the original game package and was not added to gameplay dependencies.

## Release archive

The unmodified existing Mac release was recovered, its ZIP integrity checked, and its hash matched the original delivery:

- File: Chaos_Party_Mac.zip, 92,281,267 bytes, 157 entries.
- SHA-256: ecc54f4d858a34393a55997d56743f8f71ec53027428dab3d8a0a59eafcc1f1e
- Preserved download: https://chatgpt.com/library?file_id=libfile_0792c5ead8a88191ba08a868ff9d0c23&account_id=personal

The ZIP includes the original launcher, bundled server, and Intel/Apple Silicon Node 22.23.4 runtimes. Runtime binaries and node_modules are distribution/dependency artifacts, not copied into this source repository. To regenerate the Mac release, provide the original runtime layout expected by scripts/package-release.mjs via CHAOS_RUNTIME_DOWNLOADS (darwin-x64/node, darwin-arm64/node, darwin-x64/LICENSE), run npm ci, npm run build, then node scripts/package-release.mjs. The preserved ZIP supplies those unchanged binaries/license if required. The release smoke test expects release/Chaos_Party_Mac/server.cjs and its public directory; extract the preserved ZIP into release/ before running node tests/release-smoke.mjs.

## Saves and credentials

Campaign persistence, character identity, local browser profiles, PIN recovery, rejoining and save/restart behavior are preserved in code and tests. Runtime campaigns.json and host-key were intentionally excluded from the original Git source and release. No live campaign save was recovered, and none is fabricated or reset by this import. Existing saves on the player's Mac remain at ~/Library/Application Support/Chaos Party/campaigns.json; browser tokens remain in their original browser localStorage. Do not commit either. Back up that directory privately before later development.

A scan of all original tracked files found no private key blocks, GitHub tokens, AWS access keys, OpenAI-style API keys or literal high-entropy password/secret assignments. No .env files, credentials, host keys, actual campaign records, development node_modules, or deployment credentials are imported. Test fixture tokens are deliberately synthetic.

## Verification on 2026-10-26

- Clean npm ci succeeded against the pinned package-lock.
- npm test: all 18 tests passed, including 20 real Colyseus clients, first-declaration race, reactions, authorization, reconnection, PIN recovery, and server save/restart.
- npm run build succeeded; rebuilt tracked artifacts remained byte-identical to the recovered source.
- node tests/ninja-render-check.mjs: 78 original-asset Canvas checks passed.
- node tests/release-smoke.mjs: unmodified archived release passed outside the repository without development node_modules, including host plus two real controllers, action/reaction/roll, assets, authorization and campaign persistence.

These checks establish preservation and buildability. They do not establish visual polish, usability, physical phone/TV behavior, or performance on an older Mac. No new visual-quality claim is made.

## Licenses

See CREDITS.md, FOUNDATION_AUDIT.md, vendor/partyframe/LICENSE, public/assets/ninja/LICENSE.txt, public/assets/kenney/*LICENSE.txt, asset provenance manifests, package.json/package-lock.json, and licenses/THIRD_PARTY_NOTICES.txt (copied unchanged from the original release). PartyFrame is MIT; Ninja Adventure and Kenney artwork are CC0. RPGJS was audited but is not included in this prototype. Do not infer rights to unrelated proprietary game artwork.
