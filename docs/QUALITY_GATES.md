# Quality gates — gameplay first, not tests alone

## Gate 0: baseline
- [ ] Original Work ZIP and SHA-256 archived without modifications
- [ ] Dependencies, real licenses, safe sources and reproducible launch recorded
- [ ] Two real devices verified to connect; failure accurately reported
- [ ] Actual TV/phone screenshots and a 60–90-second demo captured

## Gate 1: genuine game presentation
- [ ] Fullscreen 16:9 continuous pixel-art tavern, NOT dashboard cards
- [ ] Consistent licensed art, pixel scale, layering, colors and atmospheric sound
- [ ] At least 12 identifiable sprites; clothing/hair/appearance updates are visual
- [ ] Action includes physical motion, target reaction, impact effects and sound
- [ ] Phone controller is intuitive and responsive, with large legible controls
- [ ] A 90-second action sequence looks enjoyable after visual review
- [ ] GPU/CPU/memory/framerate benchmark on the actual 2015 Mac is measured if available

## Gate 2: accurate multiplayer and narrative behavior
- [ ] 20 simulated phones joined with consistent session state
- [ ] Two actual phones complete first-declare -> reaction -> outcome
- [ ] Race-safe first declaration and no-takeback attempts, with fair cooldown
- [ ] Immediate animation even with slow/offline AI
- [ ] Dice / game code, not AI hallucination, authoritatively updates world state
- [ ] Save/rejoin works after restart; basic moderation/host pause available

**Stop rule:** If the playable look is poor, do not add features. Prototype a better established render/game foundation and compare it side-by-side before changing architecture.
