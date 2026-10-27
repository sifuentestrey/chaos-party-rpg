# Luna polish marathon results

Completed October 27, 2026 on `luna/polish-and-accessibility`. Implementation baseline: `79ccd7c8565f51d06d9ccec343bf204189e0f95c`.

## Item dispositions

1. **Done:** primary phone actions, quick actions, creator tabs and link controls meet the 44px mobile target; reaction buttons already exceed it.
2. **Done:** browser check confirms keyboard focus is visible; global `:focus-visible` covers controls and summaries.
3. **Done:** selected, hovered, pressed, disabled and focus states have distinct presentation; disabled behavior is preserved.
4. **Done:** long creator names are entered at both phone widths without horizontal overflow; item, player and quest text wrap.
5. **Done:** recovery dialog captured at 320×568 and landscape 568×320; narrow-screen dialog bounds and scrolling are styled.
6. **Done:** inputs use readable mobile text sizing and declaration controls remain reachable by scrolling.
7. **Done:** reduced-motion browser check confirms decorative animation is reduced; deadlines and scene feedback are unchanged.
8. **Done:** existing pocket and item groups retain hierarchy and receive consistent mobile spacing.
9. **Done:** empty pockets and empty item lists display guidance only when their actual arrays are empty.
10. **Done:** existing `worn`/equipped status remains visible; item detail labels wrap on phones.
11. **Done:** condition/material text wraps without inferring additional properties.
12. **Done:** existing item actions have larger, consistently spaced mobile targets; command strings and gates are unchanged.
13. **Done:** existing location heading and path buttons remain easy to find; phone screen contains only controller controls.
14. **Done:** controller copy says the whole party travels together; existing destination actions stay unchanged.
15. **Done:** people, creatures and object controls wrap and space consistently without changing order or visibility.
16. **Done:** regional quest styling provides readable objective and progress contrast on the TV.
17. **Done:** existing saved quest status/step logic and disclosure conditions are retained and exercised through completion.
18. **Done:** regional title and objective text wrap with clearer spacing.
19. **Done:** TV overlays and quest cards remain legible over inspected clearing/ruins backgrounds.
20. **Done:** room code, QR and joining instructions are visible in the TV evidence; no QR/address changes.
21. **Done:** roster names wrap within a bounded width; roster order and moderation controls are unchanged.
22. **Done:** canvas name fitting measures using the exact font size used by its label.
23. **Done:** name fitting counts Unicode code points and preserves the canonical name.
24. **Done:** existing host instructions already explain TV, Wi-Fi, join code/QR and recovery PIN; no flow change needed.
25. **Done:** the existing submit/reaction/result states were confirmed in the two-controller browser flow.
26. **Done:** HP, coins and experience values have explicit accessible labels without changing values.
27. **Done:** icon controls in assigned markup already have accessible names; retained.
28. **Done:** host canvas description now names the current saved location and player count, with escaped dynamic text.
29. **Done:** existing labels and input associations were inspected; no ID or validation changes were needed.
30. **Done:** connection and recovery copy wraps on narrow screens; no token or private connection data is rendered.
31. **Done:** two independent phone pages submit quest actions in one clearing campaign; both contribute accepted actions to the complete generated quest.
32. **Done:** after completion, the same party travels to ruins and back; canonical consequence and quest UI are checked after the browser receives its snapshot.
33. **Done:** same disposable campaign survives server restart; existing host/player helpers resume it and rejoin Jinx by the saved identity token. Quest, friendly creature and keepsake ownership are rechecked. The token is not logged.
34. **Done:** captured and visually inspected TV clearing, ruins, completed quest and revisit at 1280×720; phones at 320×568 and 390×844; original landscape dialog evidence is retained. Recovery PIN areas are masked. Screenshots are under ignored `artifacts/luna-polish-marathon/`.
35. **Done:** browser assertions cover focus visibility, long names at both phone sizes and reduced-motion behavior.
36. **Done:** final diff review found only allowed app presentation markup, renderer label fitting, CSS, assigned browser runner and this report. No command/event, networking, save schema, identity, rules, provider or generated output was changed.
37. **Done:** checks below passed. Browser scripts ran sequentially, AI was disabled, and the failure reruns followed diagnosed fixture/flow issues.
38. **Done:** this is the single delivery report; evidence files and logs stay ignored.
39. **Done:** committed and pushed to the assigned branch; remote head confirmed below.

## Checks

- `npm run verify`: passed, 184 tests across 29 files, seven generated outputs checked, static build passed; AI disabled.
- `tests/luna-game-night-browser.mjs`: passed, 18 layout/overflow checks, failed-boot handling, two independent phone controllers, full generated quest, revisit, restart and identity rejoin, focus/reduced-motion/long-name checks; no browser errors.
- `tests/campaign-browser.mjs`: passed the existing keepsake quest, crafting, travel, restart and character rejoin.
- `tests/world-items-browser.mjs`: passed item creation/equipment/transfer/drop/take, travel, restart and identity rejoin.
- `node --check` passed on the edited JavaScript files; `git diff --check` passed.

No live model, paid service, new asset or physical device was used. Live AI qualification, original Mac archive provenance, physical game-night acceptance and Mac performance remain separate open gates.
