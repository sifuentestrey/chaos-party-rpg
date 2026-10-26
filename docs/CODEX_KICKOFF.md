# Codex kickoff — source recovered and merged

**Current source of truth:** The original Chaos Party v0.2.0 playable prototype is now in the private repository default branch `main`, merged from PR #3. Original unmodified import remains accessible as `work-prototype-import` branch and pull request history. `docs/PROTOTYPE_IMPORT.md` contains provenance, checksums, source ZIP link, setup, and save paths.

## First task: Diagnose and improve the actual playing experience
1. Read `AGENTS.md`, `FOUNDATION_AUDIT.md`, `TEST_REPORT.md`, `docs/SOURCE_CODE_FOUNDATION_AUDIT.md`, `docs/REUSABLE_RENDERING_CODE_MAP.md` and `docs/QUALITY_GATES.md`.
2. Install dependencies with Node 22+ (`npm ci`), start real multiplayer (`npm start`), run tests (`npm test` and `npm run build`), and personally inspect live TV and phone UIs. The hosted solo preview is NOT the actual multiplayer experience.
3. Use browser screenshot/interaction tools to capture 1280x720 TV host and ~390px-wide phone UX. Produce a genuine action/reaction round. Identify **why the screen feels like a generic website rather than an actual game**.
4. Compare, through actual runnable small proofs, preserving the Colyseus backend while adapting licensed existing Phaser rendering/animation patterns from Dungeonz or CC0 Ninja Adventure artwork versus an engine migration. Don't blindly copy incompatible frameworks.
5. Before expanding scope, deliver one truly polished TV **tavern**: game fills 16:9 screen, layered environment, coherent professional pixel-art assets, clearly identifiable customized avatars, actor movement / impact / target reaction / audio, transitions, snappy narration and intuitive phone input.
6. Preserve 20-player Colyseus sessions, authoritative first-declaration, reactions, saves, character identity and class/customization. Avoid adding new gameplay features. No paid APIs, accounts or deployment without authorization.
7. Iterate visual reviews and real browser interactions; tests alone are insufficient. Give playable link or build with actual gameplay screenshots or clips and a short, factual record of what was verified.

## Preserved baseline specifics
- `npm start` runs actual host and phone game server (default port 4747), requiring shared LAN for real phones. `npm run build` creates a solo/browser preview, not the multi-phone host.
- `package.json` uses real Colyseus dependencies and vendored PartyFrame runtime. Don't discard it merely because the home page looks ugly.
- `public/app.js`, `public/render.js`, `public/ninja.js`, `public/assets/` contain current presentation and sprites. `CREDITS.md` and third-party notices document licenses.
- Current narrator is scripted/keyword-based rather than generative AI; do not claim otherwise.
- Work's tests were reported passing but should be rerun in Codex.
- Old Mac target: early-2015 13-inch MacBook Pro, dual-core i5, 8GB, Iris 6100. Real hardware not available to Codex, so don't claim it was tested.
- Existing Mac campaign file `~/Library/Application Support/Chaos Party/campaigns.json` is not in GitHub and should not be touched/reset.

## Tooling
- Codex is primary developer, not ChatGPT Work. GitHub is source of truth.
- REA (https://github.com/morluto/rea) is OPTIONAL for narrow, permitted inspection, not required when complete permissively licensed source exists.
- Use the already available code, licenses, renderers, and automated browser tools. Build incrementally; save work to a separate branch/PR.

## Definition of first acceptable result
A genuine 90-second video/gameplay demo of one family-scale tavern scene with a finished-looking visual presentation, a phone-generated irreversibly committed ridiculous action, clear character animation, consequences, reactions and fun pace. Not another feature list, CSS-only facelift or static mockup.
