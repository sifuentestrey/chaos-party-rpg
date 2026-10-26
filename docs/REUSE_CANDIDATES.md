# Existing game foundation audit — provisional

**No engine migration has been selected.** Existing Work ZIP and actual screenshots still missing. Validate real running software before final decision.

| Foundation | Known reusable work | Biggest caveat | Proof needed |
| --- | --- | --- | --- |
| [PartyFrame](https://github.com/msynk/bomb-party) | Phone joining/QR, reconnection, Colyseus authoritative server, Phaser animated TV games, tests; repository MIT LICENSE verified | Party framework, NOT a finished pixel RPG; default eight-player assumptions and no persistent RPG characters upstream | Run full project and inspect actual code; reuse proven networking and load-test 20 |
| [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 animated pixel art, effects, tiles, sound; example Godot project | Asset library / game example, not directly interchangeable with Phaser; verify Godot example code license separately | Render sprite frames in a playable scene, confirm skin/outfit flexibility |
| [Dungeonz](https://github.com/Gamessystem/dungeonz) | An actual browser-based multiplayer RPG with Node/JavaScript architecture and MIT code | Custom game architecture, not a TV-and-phone declaration game; individual contributed assets must be reviewed | Run reference game and a minimal hosting spike |
| [Source of Mana](https://github.com/sourceofmana/sourceofmana) | Playable Godot-based multiplayer RPG, combat and NPCs; MIT code | Artwork is CC BY-SA 4.0 / attribution; Godot does not plug into Phaser | Run as visual quality benchmark, review asset relicense implications |
| [RPGJS](https://rpgjs.dev/) | RPG map/dialogue, character state and conventional combat foundations | Could conflict with existing networking/rendering; not a ready-made shared TV party game | Choose as basis only after runnable comparison |
| [REA](https://github.com/morluto/rea) | Tool-assisted static/dynamic inspection of existing programs; integrates with coding agents | Understanding mechanics is not a license to copy proprietary source and assets | Use only when it answers a narrow, lawful engineering question |

**Recommendation pending tests:** keep verified phone-room networking; prioritize adapting a complete, well-designed RPG scene/animation and character creator instead of cosmetic CSS tweaks. A playable visual proof is the deciding evidence.
