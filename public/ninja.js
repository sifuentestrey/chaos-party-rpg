/**
 * Reusable Ninja Adventure sprite compositor.
 * Original artwork: Pixel-boy and AAA, Ninja Adventure Update 8, CC0-1.0.
 * Full license, original README, exact source hashes, and frame contracts:
 * ./assets/ninja/{LICENSE.txt,SOURCES.md,manifest.json}
 *
 * The visible face, body, clothing crops, hair texture, animation poses, and
 * effects are actual licensed sprites. Small ears/accessories are reusable
 * pixel overlays. No generated image, service, key, or framework is involved.
 */
import { SKIN, HAIR, CLOTHES, DEFAULT_AVATAR } from './core.js';

const hasDOM = typeof document !== 'undefined' && typeof Image !== 'undefined';
const pictures = new Map();
const frameCache = new Map();
const rawFrames = new Map();
const failures = [];
const FRAME_CACHE_LIMIT = 384;
const INK = '#141b1b';
const BASE_Y = 5;
const ACTORS = ['Villager', 'Villager3', 'Noble', 'SorcererOrange', 'Knight'];

const EFFECTS = {
  slash: [32, 32, 4, 12], claw: [32, 32, 4, 12], cut: [32, 32, 4, 12],
  smoke: [32, 32, 6, 10], 'magic-circle': [32, 32, 4, 10],
  'magic-spark': [32, 32, 6, 10], heal: [53, 35, 8, 12],
  spark: [30, 35, 9, 12], shield: [24, 26, 6, 15],
  aura: [25, 24, 5, 12], spirit: [32, 32, 5, 10],
  fire: [25, 30, 8, 12], explosion: [40, 40, 9, 14],
  thunder: [20, 28, 8, 15]
};

export let ninjaReady = false;

function load(key, relative) {
  return new Promise(resolve => {
    if (!hasDOM) return resolve(false);
    const img = new Image();
    img.onload = () => { pictures.set(key, img); resolve(true); };
    img.onerror = () => { failures.push(relative); resolve(false); };
    img.src = new URL(`./assets/ninja/${relative}`, import.meta.url).href;
  });
}

/** Resolves after all attempts; failed optional effects never stop the game. */
export const ninjaAssetsReady = Promise.all([
  ...ACTORS.map(name => load(name, `actors/${name}.png`)),
  ...Object.keys(EFFECTS).map(name => load(`fx:${name}`, `fx/${name}.png`)),
  load('heart', 'ui/heart.png')
]).then(() => {
  ninjaReady = pictures.has('Villager') && pictures.has('Villager3');
  return { avatar: ninjaReady, effects: Object.keys(EFFECTS).filter(n => pictures.has(`fx:${n}`)), failed: [...failures] };
});

export function ninjaAssetStatus() {
  return { avatar: pictures.has('Villager') && pictures.has('Villager3'), failed: [...failures] };
}

function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

const rgb = hex => {
  const s = hex.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, n) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * (1 - n) + y[i] * n)); };
const darken = (a, n = .28) => mix(a, INK, n);
const lighten = (a, n = .17) => mix(a, '#fff3d6', n);
const colorKey = (r, g, b) => (r << 16) | (g << 8) | b;

function frame(name, row, column) {
  const key = `${name}:${row}:${column}`;
  if (rawFrames.has(key)) return rawFrames.get(key);
  const img = pictures.get(name);
  if (!img) return null;
  const c = canvas(16, 16), g = c.getContext('2d');
  g.drawImage(img, column * 16, row * 16, 16, 16, 0, 0, 16, 16);
  const data = g.getImageData(0, 0, 16, 16);
  rawFrames.set(key, data);
  return data;
}

function paletteCanvas(source, swaps, only = null) {
  const c = canvas(16, 16), g = c.getContext('2d');
  const out = g.createImageData(16, 16), input = source.data;
  const replacements = new Map(Object.entries(swaps).map(([from, to]) => {
    const f = rgb(from); return [colorKey(...f), rgb(to)];
  }));
  for (let i = 0; i < input.length; i += 4) {
    const k = colorKey(input[i], input[i + 1], input[i + 2]);
    if (!input[i + 3] || (only && !only.has(k))) continue;
    const target = replacements.get(k);
    out.data[i] = target ? target[0] : input[i];
    out.data[i + 1] = target ? target[1] : input[i + 1];
    out.data[i + 2] = target ? target[2] : input[i + 2];
    out.data[i + 3] = input[i + 3];
  }
  g.putImageData(out, 0, 0);
  return c;
}

function selection(a) {
  const safe = { ...DEFAULT_AVATAR, ...a };
  for (const [key, max] of Object.entries({ skin: 5, hair: 5, hairColor: 5, outfit: 3, color: 5, accessory: 5 })) {
    safe[key] = Math.max(0, Math.min(max, Math.floor(Number(safe[key]) || 0)));
  }
  safe.body = ['human', 'elf', 'orc'].includes(safe.body) ? safe.body : 'human';
  return safe;
}

function pose(animation, timeMs, avatar) {
  const parts = String(animation || 'idle').toLowerCase().split(/[:\-]/);
  const kind = parts[0];
  const direction = parts[1] || avatar.direction || 'down';
  let col = ({ down: 0, up: 1, left: 2, right: 3 })[direction] ?? 0;
  let row = 0, flash = false;
  const time = Math.max(0, Number(timeMs) || 0);
  if (['walk', 'move', 'flee', 'dance'].includes(kind)) row = Math.floor(time / 145) % 4;
  else if (kind === 'idle') row = [0, 0, 0, 2][Math.floor(time / 460) % 4];
  else if (['attack', 'melee', 'steal'].includes(kind)) row = 4;
  else if (['hit', 'hurt', 'recoil'].includes(kind)) { row = 5; flash = Math.floor(time / 90) % 2 === 0; }
  else if (['cast', 'spell', 'magic', 'heal'].includes(kind)) { row = 6; col = Math.floor(time / 220) % 2 ? 3 : 2; }
  else if (['dead', 'down', 'ko'].includes(kind)) { row = 6; col = 0; }
  else if (['item', 'pickup', 'crown'].includes(kind)) { row = 6; col = 1; }
  else if (kind === 'jump') row = 5;
  return { kind, row, col, flash, direction, dead: ['dead', 'down', 'ko'].includes(kind) };
}

const HAIR_CHANNELS = new Set([0x4e484a, 0x3b3643]);

function hairLayer(source, hair) {
  return paletteCanvas(source, { '#4e484a': hair, '#3b3643': darken(hair, .35) }, HAIR_CHANNELS);
}

// These parts reuse the stock hair's two-tone texture. Their geometry is shared
// across every avatar, and follows the source actor's actual animation frame.
function drawHair(g, stock, style, behind, dead) {
  if (dead) { if (!behind) g.drawImage(stock, 0, BASE_Y); return; }
  if (behind) {
    if (style === 2) {
      g.drawImage(stock, 1, 4, 3, 6, 0, BASE_Y + 4, 3, 13);
      g.drawImage(stock, 12, 4, 3, 6, 13, BASE_Y + 4, 3, 13);
    } else if (style === 4) {
      g.drawImage(stock, 11, 3, 4, 6, 12, BASE_Y + 6, 4, 11);
    }
    return;
  }
  if (style === 1 || style === 2) g.drawImage(stock, 0, BASE_Y);
  else if (style === 0 || style === 4) g.drawImage(stock, 0, 1, 16, 7, 0, BASE_Y + 2, 16, 5);
  else if (style === 3) g.drawImage(stock, 6, 2, 4, 6, 6, BASE_Y - 3, 4, 10);
  else if (style === 5) g.drawImage(stock, 2, 2, 12, 4, 2, BASE_Y + 3, 12, 2);
}

function bodyPalette(skin, cloth) {
  return {
    '#f2ad7d': lighten(skin, .18), '#ef914f': skin, '#d14b34': darken(skin, .28),
    '#548789': darken(cloth, .14), '#79b8ce': lighten(cloth, .14),
    '#4e484a': '#35323f'
  };
}

function drawOutfit(g, a, p, skin, cloth) {
  if (p.dead) return;
  const names = ['Villager3', 'Noble', 'SorcererOrange', 'Knight'];
  const source = frame(names[a.outfit], p.row, p.col);
  if (!source) return;
  let swaps;
  if (a.outfit === 0) swaps = {
    '#a3754e': skin, '#965340': darken(skin), '#a8a129': lighten(cloth, .1), '#56864c': darken(cloth, .12)
  };
  else if (a.outfit === 1) swaps = {
    '#ef914f': skin, '#f2ad7d': lighten(skin), '#965340': darken(cloth, .28),
    '#3b3643': cloth, '#4e484a': darken(cloth, .23)
  };
  else if (a.outfit === 2) swaps = {
    '#ef914f': skin, '#f2ad7d': lighten(skin), '#cf736d': darken(skin),
    '#e46d3a': cloth, '#4e484a': darken(cloth, .3)
  };
  else swaps = {
    '#ef914f': skin, '#d14b34': darken(skin),
    '#8d977f': mix(cloth, '#d5dee1', .60), '#5f7160': mix(cloth, '#73858d', .48),
    '#4e484a': darken(cloth, .36), '#3b3643': darken(cloth, .46)
  };
  const garment = paletteCanvas(source, swaps);
  // Lower actor crop retains the original pose, hand placement, and details.
  if (a.outfit === 2) {
    g.fillStyle = INK; g.fillRect(3, BASE_Y + 13, 10, 5);
    g.fillStyle = cloth; g.fillRect(4, BASE_Y + 13, 8, 4);
    g.fillStyle = darken(cloth); g.fillRect(10, BASE_Y + 14, 2, 3);
  }
  g.clearRect(0, BASE_Y + 12, 16, 4);
  g.drawImage(garment, 0, 12, 16, 4, 0, BASE_Y + 12, 16, 4);
}

function ears(g, body, skin, faceY, behind) {
  if (body === 'human') return;
  if (behind) {
    g.fillStyle = INK;
    g.fillRect(0, faceY + 7, 3, 4); g.fillRect(13, faceY + 7, 3, 4);
    g.fillStyle = darken(skin, .2);
    g.fillRect(0, faceY + 7, 2, 2); g.fillRect(14, faceY + 7, 2, 2);
    g.fillStyle = skin;
    g.fillRect(1, faceY + 8, 2, 2); g.fillRect(13, faceY + 8, 2, 2);
  } else if (body === 'orc') {
    g.fillStyle = '#fff0ce';
    g.fillRect(5, faceY + 10, 1, 2); g.fillRect(10, faceY + 10, 1, 2);
  }
}

function accessory(g, a, p, cloth) {
  if (p.dead) return;
  const y = BASE_Y + (p.row === 4 || p.row === 5 ? -1 : 0);
  const r = (x, yy, w, h, color) => { g.fillStyle = color; g.fillRect(x, yy, w, h); };
  switch (a.accessory) {
    case 1:
      r(1, y + 2, 14, 2, INK); r(4, y - 3, 9, 5, darken(cloth, .18));
      r(5, y - 3, 7, 1, lighten(cloth, .4)); r(4, y + 1, 9, 1, '#e9ba62'); break;
    case 2:
      r(3, y + 1, 10, 2, '#efbd5d'); r(3, y - 2, 2, 4, '#d99537');
      r(7, y - 1, 2, 3, '#ffe5a0'); r(11, y - 2, 2, 4, '#d99537');
      r(7, y + 1, 2, 1, '#d14b59'); break;
    case 3:
      if (p.direction === 'up' && p.row < 6) break;
      r(3, y + 7, 4, 4, INK); r(9, y + 7, 4, 4, INK); r(7, y + 8, 2, 1, INK);
      r(4, y + 8, 2, 1, '#a8dfe1'); r(10, y + 8, 2, 1, '#a8dfe1'); break;
    case 4:
      r(12, y + 1, 3, 3, '#d97caa'); r(13, y, 1, 5, '#f4b2ce');
      r(13, y + 2, 1, 1, '#ffe4a1'); r(14, y + 4, 2, 2, '#80b07a'); break;
    case 5:
      r(1, y - 3, 2, 5, '#e7dabf'); r(2, y + 1, 2, 2, '#c0ae94');
      r(13, y - 3, 2, 5, '#e7dabf'); r(12, y + 1, 2, 2, '#c0ae94'); break;
  }
}

/**
 * Returns a cached transparent 20x28 canvas, or null until required art loads.
 * animation: idle/walk/attack/hit/cast/dead/item; optional ':left/right/up'.
 * timeMs is an absolute clock for idle/walk and an elapsed clock for a pose.
 * Treat returned cached canvases as read-only.
 */
export function ninjaAvatarFrame(avatar = DEFAULT_AVATAR, animation = 'idle', timeMs = 0) {
  if (!hasDOM || !pictures.has('Villager') || !pictures.has('Villager3')) return null;
  const a = selection(avatar), p = pose(animation, timeMs, avatar || {});
  const key = [a.body, a.skin, a.hair, a.hairColor, a.outfit, a.color, a.accessory, p.row, p.col, p.flash ? 1 : 0, p.dead ? 1 : 0].join(':');
  if (frameCache.has(key)) {
    const cached = frameCache.get(key); frameCache.delete(key); frameCache.set(key, cached); return cached;
  }
  const skin = a.body === 'orc' ? mix(SKIN[a.skin], '#7caa65', .68) : SKIN[a.skin];
  const cloth = CLOTHES[a.color], hair = HAIR[a.hairColor];
  const base = paletteCanvas(frame('Villager', p.row, p.col), bodyPalette(skin, cloth));
  const stockHair = hairLayer(frame('Villager3', p.row, p.col), hair);
  const native = canvas(16, 22), n = native.getContext('2d');
  drawHair(n, stockHair, a.hair, true, p.dead);
  if (!p.dead) ears(n, a.body, skin, BASE_Y, true);
  n.drawImage(base, 0, BASE_Y);
  drawOutfit(n, a, p, skin, cloth);
  drawHair(n, stockHair, a.hair, false, p.dead);
  if (!p.dead) ears(n, a.body, skin, BASE_Y, false);
  accessory(n, a, p, cloth);
  if (p.flash) {
    n.save(); n.globalCompositeOperation = 'source-atop'; n.fillStyle = '#fff4da66';
    n.fillRect(0, 0, 16, 22); n.restore();
  }
  const out = canvas(20, 28), g = out.getContext('2d');
  // Uniform nearest-neighbor scaling retains the original chibi proportions.
  g.drawImage(native, 0, 0, 16, 22, 0, 0, 20, 27.5);
  frameCache.set(key, out);
  if (frameCache.size > FRAME_CACHE_LIMIT) frameCache.delete(frameCache.keys().next().value);
  return out;
}

function strip(g, name, x, y, ageMs, scale, opacity = 1) {
  const img = pictures.get(`fx:${name}`), spec = EFFECTS[name];
  if (!img || !spec) return false;
  const [w, h, count, fps] = spec;
  const index = Math.floor(ageMs / (1000 / fps));
  if (index < 0 || index >= count) return true;
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha *= opacity;
  g.drawImage(img, index * w, 0, w, h, Math.round(x - w * scale / 2), Math.round(y - h * scale / 2), Math.round(w * scale), Math.round(h * scale));
  g.restore(); return true;
}

/**
 * Draw an actual licensed effect centered on (x,y). ageMs is elapsed time.
 * Returns false for an unrecognized/unloaded recipe, true when handled (also
 * after its finite animation completes). It never changes caller canvas state.
 */
export function drawNinjaEffect(ctx, verb, x, y, ageMs, scale = 2) {
  const age = Math.max(0, Number(ageMs) || 0);
  const s = Math.max(.25, Math.min(8, Number(scale) || 2));
  const v = String(verb || '').toLowerCase();
  if (v === 'hearts') {
    const heart = pictures.get('heart');
    if (!heart) return false;
    strip(ctx, 'heal', x, y, age, s * .8, .65);
    if (age > 1500) return true;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 3; i++) {
      const t = age - i * 160; if (t < 0 || t > 1100) continue;
      const alpha = Math.min(1, t / 100) * Math.max(0, 1 - t / 1100);
      const xx = x + (i - 1) * 14 * s + Math.sin(t / 190 + i) * 3 * s;
      const yy = y - t / 24 - i * 6;
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.drawImage(heart, Math.round(xx - 7 * s), Math.round(yy - 6 * s), 14 * s, 12 * s); ctx.restore();
    }
    ctx.restore(); return true;
  }
  if (v === 'fire') {
    if (!pictures.has('fx:fire')) return false;
    strip(ctx, 'fire', x, y - 4 * s, age, s);
    strip(ctx, 'explosion', x, y, age - 350, s * .85, .8);
    return true;
  }
  if (['spell', 'magic', 'cast'].includes(v)) {
    if (!pictures.has('fx:magic-spark')) return false;
    strip(ctx, 'magic-spark', x, y, age, s);
    strip(ctx, 'spirit', x, y - 8 * s, age - 250, s * .9);
    return true;
  }
  if (v === 'melee' || v === 'attack') {
    if (!pictures.has('fx:slash')) return false;
    strip(ctx, 'slash', x, y, age, s);
    strip(ctx, 'cut', x, y, age - 200, s * .85);
    return true;
  }
  if (v === 'impact' || v === 'hit') {
    if (!pictures.has('fx:cut')) return false;
    strip(ctx, 'cut', x, y, age, s);
    strip(ctx, 'smoke', x, y + 4 * s, age - 170, s * .75, .75);
    return true;
  }
  const recipe = {
    heal: 'heal', steal: 'spark', smoke: 'smoke', flee: 'smoke', sneak: 'smoke',
    dance: 'aura', inspect: 'magic-circle', weird: 'magic-spark',
    shield: 'shield', intervene: 'shield', alarm: 'thunder',
    crown: 'magic-circle', thunder: 'thunder', explosion: 'explosion',
    slash: 'slash', claw: 'claw', spark: 'spark', aura: 'aura', spirit: 'spirit'
  }[v];
  return recipe ? strip(ctx, recipe, x, y, age, s) : false;
}
