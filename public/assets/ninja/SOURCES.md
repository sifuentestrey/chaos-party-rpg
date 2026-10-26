# Ninja Adventure artwork and animation source

These files are actual artwork from the official **Ninja Adventure Asset Pack** by **Pixel-boy and AAA**, downloaded at no cost through its normal itch.io free-download UI on 2026-10-26.

Official pack: https://pixel-boy.itch.io/ninja-adventure-asset-pack

The official download lists the main asset ZIP as updated **2026-03-29 22:07 UTC**; the public page calls this **Update #8, March 30, 2026**. The page says the next goal is reached and another update is being made; that unreleased content is not included.

Downloaded ZIP SHA256: `95a06f4fdcfd1882f061a45ff313b7c905dbe2de1e8512b281d7937df62a7b15`.

Original ZIP is retained in the development workspace under `foundations/Ninja-Adventure-Assets.zip`. Only selected small assets are included in the game. Their original source filenames and exact SHA256 hashes are in `manifest.json`.

## License

**CC0 1.0 Universal**. The original complete `LICENSE.txt` and original author README (`README-source.md`) accompany the art. The authors expressly allow modification, redistribution, and commercial game use. Attribution is appreciated, not required. No account, payment, donation, API key, or billable service was used.

The separate official Godot 4 demo repository is https://github.com/pixel-boy/NinjaAdventure at commit `6ac78232d5aedcc85ce5f27d060ea92366f7c24a` (2024-04-19). It contains only a subset of this later pack. No Godot engine code is included in this asset selection.

## Standard actor sheets

`actors/*.png` are 64x112 pixels: **16x16 frames**, four direction columns, seven animation rows, no spacing.

Direction columns: **down=0, up=1, left=2, right=3**.

- Rows 0,1,2,3: walk cycle; row 0 is the stationary pose. The official Godot demo uses 6 frames per second.
- Row 4: attack pose in each direction.
- Row 5: jump pose in each direction.
- Row 6 is special, not a direction row: column 0 dead, column 1 holding an item, column 2 special/cast, column 3 alternate special/cast.

These are complete characters, not a built-in paper-doll creator. Do not claim the pack supplies separate body/hair/clothing layers. They can be palette-remapped without drawing new images; custom reusable accessory layers can be composited on top.

### Verified color channels for recoloring

`Villager3` and `Villager4` share an outfit/body design, and are useful for controlled palette substitution:

| Channel | Villager3 source colors | Villager4 source colors |
| --- | --- | --- |
| Outline | `#141b1b` | `#141b1b` |
| Hair light / dark | `#4e484a`, `#3b3643` | `#f1c471`, `#d78b4a` |
| Skin light / dark | `#a3754e`, `#965340` | `#ef914f`, `#d14b34` |
| Outfit light / dark | `#a8a129`, `#56864c` | `#e0394c`, `#8f3e56` |
| Boots/details | `#8d977f`, `#abc2bc` | `#8d977f`, `#abc2bc` |

Use exact RGB replacement and retain alpha. Preserve two-tone shading. The complete palettes and pixel counts for all selected characters are recorded in `manifest.json`; shared colors in other actors may serve multiple visual roles, so recolor those carefully.

## Rich animated ninja

`animated/*.png` are the newer NinjaGreen animations, not the simpler standard sheet. Each cell is **32x32**, with the roughly 16x16 visible body centered within padding. Draw the whole cell to preserve attack/hit movement.

- Idle, Walk, Attack: 128x128; direction columns down/up/left/right; four animation frames vertically.
- Hit: 128x64; same direction columns; two vertical frames.
- Roll: 128x96; same direction columns; three vertical frames.
- Dead, Pickup, Item: 32x64; single direction, two vertical frames.

The original Jump sheet has an irregular layout and was deliberately omitted from the selected subset.

## Visual effects

All `fx/*.png` are horizontal strips, with no gaps. `manifest.json` records exact frame width, height, count, and suggested playback speed. Selected strip boundaries were inspected visually against the artwork.

| File | Frame | Count |
| --- | --- | --- |
| slash / claw / cut | 32x32 | 4 |
| smoke | 32x32 | 6 |
| magic-circle | 32x32 | 4 |
| magic-spark | 32x32 | 6 |
| heal | 53x35 | 8 |
| spark | 30x35 | 9 |
| shield | 24x26 | 6 |
| aura | 25x24 | 5 |
| spirit | 32x32 | 5 |
| fire | 25x30 | 8 |
| explosion | 40x40 | 9 |
| thunder | 20x28 | 8 |

`ui/heart.png` is the original 14x12 heart icon. Floating/healing heart motion can use this sprite; the source does not provide a dedicated animated heart effect.

## Environment art

`tiles/*.png` preserve their original whole sheets. They use a 16-pixel grid. Exact useful crop rectangles for tables, stools, a bar counter, barrel, chair, vase, and a drawer chest are in `manifest.json` under `props`. Render with `imageSmoothingEnabled=false`.

## Sound

The seven `audio/*.wav` files are original short CC0 effects from the same pack (slash, hit, magic, heal, coin, fire, success). Playback should wait for a user gesture and respect the game's sound toggle.
