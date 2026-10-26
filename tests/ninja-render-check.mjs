/**
 * Reproducible pixel-render checks for the actual Ninja Adventure compositor.
 *
 * Run from the project directory:
 *   node tests/ninja-render-check.mjs
 *
 * Test-only dependency supplied by the Codex primary runtime (not by the game):
 * /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js
 *
 * CODEX_PRIMARY_RUNTIME_NODE_MODULES selects the runtime's module directory.
 * To run elsewhere without modifying the game package, set CHAOS_CANVAS_MODULE
 * to the absolute path of an installed @napi-rs/canvas/index.js. This script
 * deliberately fails with a useful message if that dependency is unavailable;
 * it does not skip checks or download/install anything.
 *
 * This is real Canvas rendering against the shipped PNGs. It is not a browser,
 * physical phone, or 2015 Mac performance test. The contact sheet is an internal
 * QA artifact. Set CHAOS_QA_OUTPUT to choose its destination.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ||
  '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const canvasModule = process.env.CHAOS_CANVAS_MODULE ||
  path.join(runtimeModules, '@napi-rs/canvas/index.js');
if (!fs.existsSync(canvasModule)) {
  throw new Error(`Canvas verification requires the test-only @napi-rs/canvas module. Set CHAOS_CANVAS_MODULE to its absolute index.js path. Tried: ${canvasModule}`);
}
const { createCanvas, Image: NativeImage } = await import(pathToFileURL(canvasModule).href);

// The compositor uses normal browser Image/canvas APIs. These adapters load
// exactly the same local PNG bytes and run the canvas operations in Skia.
globalThis.document = {
  createElement(name) {
    assert.equal(name, 'canvas');
    return createCanvas(1, 1);
  }
};
globalThis.Image = class extends NativeImage {
  set src(value) { super.src = fs.readFileSync(fileURLToPath(value)); }
};

const renderer = await import(new URL('../public/ninja.js', import.meta.url));
const ready = await renderer.ninjaAssetsReady;
assert.equal(ready.avatar, true, 'Required professional actor sheets load');
assert.equal(ready.failed.length, 0, 'Every selected rendering asset loads');

const hash = canvas => createHash('sha256').update(
  canvas.getContext('2d').getImageData(0, 0, 20, 28).data
).digest('hex');
const base = {
  body: 'human', skin: 2, hair: 0, hairColor: 1,
  outfit: 0, color: 0, accessory: 0
};
let customizationCases = 0, poseCases = 0, effectCases = 0;
const options = {
  body: ['human', 'elf', 'orc'], skin: [0, 1, 2, 3, 4, 5],
  hair: [0, 1, 2, 3, 4, 5], hairColor: [0, 1, 2, 3, 4, 5],
  outfit: [0, 1, 2, 3], color: [0, 1, 2, 3, 4, 5],
  accessory: [0, 1, 2, 3, 4, 5]
};

// A creator control must have a visible effect, not merely update app state.
for (const [key, values] of Object.entries(options)) {
  const hashes = values.map(value => {
    const sprite = renderer.ninjaAvatarFrame({ ...base, [key]: value });
    assert.equal(sprite.width, 20, `${key}: compatible sprite width`);
    assert.equal(sprite.height, 28, `${key}: compatible sprite height`);
    customizationCases++;
    return hash(sprite);
  });
  assert.equal(new Set(hashes).size, values.length, `${key}: every choice changes the rendered artwork`);
}
assert.equal(renderer.ninjaAvatarFrame(base), renderer.ninjaAvatarFrame(base), 'Repeated frames use the cache');
assert.notEqual(hash(renderer.ninjaAvatarFrame(base, 'walk', 0)),
  hash(renderer.ninjaAvatarFrame(base, 'walk', 150)), 'Walk uses different original animation frames');
assert.notEqual(hash(renderer.ninjaAvatarFrame(base, 'idle', 0)),
  hash(renderer.ninjaAvatarFrame(base, 'idle', 1400)), 'Idle uses different original animation frames');

for (const animation of ['idle', 'walk', 'attack', 'hit', 'cast', 'dead', 'item']) {
  for (const direction of ['down', 'up', 'left', 'right']) {
    const sprite = renderer.ninjaAvatarFrame(base, `${animation}:${direction}`, 150);
    const pixels = sprite.getContext('2d').getImageData(0, 0, 20, 28).data;
    assert.ok(pixels.some((value, index) => index % 4 === 3 && value > 0),
      `${animation}:${direction} produces a visible sprite`);
    poseCases++;
  }
}

const sheet = createCanvas(960, 650), g = sheet.getContext('2d');
g.fillStyle = '#242634'; g.fillRect(0, 0, 960, 650); g.imageSmoothingEnabled = false;
let i = 0;
for (const key of ['hair', 'outfit', 'accessory']) {
  for (const value of options[key]) {
    const sprite = renderer.ninjaAvatarFrame({ ...base, [key]: value });
    const x = 20 + (i % 8) * 118, y = 20 + Math.floor(i / 8) * 160;
    g.drawImage(sprite, x, y, 80, 112);
    g.fillStyle = '#ffffff'; g.font = '12px sans-serif';
    g.fillText(`${key} ${value}`, x, y + 128); i++;
  }
}

const verbs = ['spell', 'fire', 'heal', 'hearts', 'melee', 'impact', 'steal',
  'smoke', 'sneak', 'dance', 'alarm', 'inspect', 'crown'];
for (const [j, verb] of verbs.entries()) {
  const c = createCanvas(160, 160), ctx = c.getContext('2d');
  ctx.globalAlpha = .8; ctx.fillStyle = '#143050'; ctx.imageSmoothingEnabled = true;
  assert.equal(renderer.drawNinjaEffect(ctx, verb, 80, 80, 200, 2), true,
    `${verb}: licensed effect recipe is handled`);
  assert.equal(ctx.globalAlpha, .8, `${verb}: caller alpha is restored`);
  assert.equal(ctx.fillStyle, '#143050', `${verb}: caller style is restored`);
  assert.equal(ctx.imageSmoothingEnabled, true, `${verb}: caller smoothing is restored`);
  assert.ok(ctx.getImageData(0, 0, 160, 160).data.some((v, k) => k % 4 === 3 && v > 0),
    `${verb}: recipe draws actual sprite pixels`);
  g.drawImage(c, 10 + (j % 8) * 118, 340 + Math.floor(j / 8) * 150, 112, 112);
  g.fillStyle = '#ffffff'; g.fillText(verb, 20 + (j % 8) * 118, 465 + Math.floor(j / 8) * 150);
  effectCases++;
}

const outputPath = path.resolve(process.env.CHAOS_QA_OUTPUT || path.join(os.tmpdir(), 'chaos-ninja-render-qa.png'));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sheet.toBuffer('image/png'));
console.log(JSON.stringify({
  passed: customizationCases + poseCases + effectCases,
  customizationCases, poseCases, effectCases, canvasModule,
  ready, contactSheet: outputPath,
  scope: 'Original PNG bytes rendered in Canvas/Skia; not a physical-device or browser performance test.'
}, null, 2));
