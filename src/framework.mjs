var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// public/expedition.js
var EXPEDITION_ROUTES = {
  "forest-trail": { name: "Lanternwood Trail", kind: "forest", at: [0, 2], exits: ["ruins", "deep-woods", "woodcutters-camp"], description: "Lantern marks lead north. A woodcutters\u2019 camp lies east." },
  "woodcutters-camp": { name: "Woodcutters\u2019 Camp", kind: "clearing", at: [1, 2], exits: ["forest-trail", "riverbank"], description: "Cut timber and a sheltered spring offer a quieter route to the river." },
  "deep-woods": { name: "The Whispering Woods", kind: "forest", at: [0, 3], exits: ["forest-trail", "riverbank"], description: "Old trail stones point toward the sound of running water." },
  riverbank: { name: "West Riverbank", kind: "marsh", at: [1, 3], exits: ["deep-woods", "woodcutters-camp", "old-bridge", "river-cave"], description: "The fast river divides the valley. Repair the bridge, or seek the cave crossing." },
  "old-bridge": { name: "The Broken Span", kind: "bridge", at: [2, 3], exits: ["riverbank", "east-road"], quest: "restore", patron: "Brin the Bridgekeeper", description: "The bridgekeeper needs help making the crossing safe. Repair the broken span." },
  "river-cave": { name: "The Ferryman\u2019s Cave", kind: "cavern", at: [2, 4], exits: ["riverbank", "east-road"], quest: "rescue", patron: "Pip the Ferryman", description: "An injured ferryman knows a sheltered crossing. Heal him and make the cave safe." },
  "east-road": { name: "Eastbank Road", kind: "road", at: [3, 3], exits: ["old-bridge", "river-cave", "market-square"], description: "Both crossings meet on the road to Bellweather." },
  "market-square": { name: "Bellweather Market", kind: "village", at: [4, 3], exits: ["east-road", "town-inn", "castle-road"], quest: "rescue", patron: "Mayor Tansy", description: "The mayor was hurt when the castle bell vanished. Help her and learn the way into the keep." },
  "town-inn": { name: "The Sleepy Griffin Inn", kind: "interior", at: [4, 4], exits: ["market-square"], description: "A warm rest stop. The innkeeper knows how to make the castle sentries listen." },
  "castle-road": { name: "The King\u2019s Road", kind: "road", at: [4, 2], exits: ["market-square", "castle-gate"], description: "The town gives way to high walls and a watchtower." },
  "castle-gate": { name: "Castle Gatehouse", kind: "village", at: [4, 1], exits: ["castle-road", "castle-yard"], description: "Beyond the gatehouse lies the keep. The mayor\u2019s rescue earns you safe passage." },
  "castle-yard": { name: "Castle Courtyard", kind: "ruins", at: [4, 0], exits: ["castle-gate", "castle-cellar"], description: "A stair beneath the old chapel leads to the missing bell." },
  "castle-cellar": { name: "The Chapel Cellar", kind: "cavern", at: [3, 0], exits: ["castle-yard", "bell-vault"], quest: "restore", patron: "Orin the Lamplighter", description: "Repair the cellar door and make these stairs safe before opening the vault." },
  "bell-vault": { name: "Vault of the Dawn Bell", kind: "cavern", at: [2, 0], exits: ["castle-cellar"], quest: "recover", patron: "Wren the Bellkeeper", description: "Recover the Dawn Bell and return it to its keeper. Force or friendship can clear the way." }
};
function beginExpedition(s) {
  if (s.expedition) return false;
  s.expedition = { version: 1, title: "The Dawn Bell", status: "active", crossings: {}, startedChapter: s.campaign.chapter };
  for (const [id, d] of Object.entries(EXPEDITION_ROUTES)) s.locations[id] = { id, name: d.name, kind: d.kind, exits: [...d.exits], visited: false, at: d.at, description: d.description, danger: ["castle-cellar", "bell-vault"].includes(id) ? 3 : 1, decor: Array.from({ length: 8 }, (_, i) => [90 + i * 137 % 780, 180 + i * 73 % 270, i % 3]) };
  const usedSandbox = Object.values(s.locations).some((l) => l.id.startsWith("wild-") && l.visited);
  s.locations.ruins.exits = s.locations.ruins.exits.filter((id) => id !== "wild-0-0" || usedSandbox);
  if (!s.locations.ruins.exits.includes("forest-trail")) s.locations.ruins.exits.push("forest-trail");
  s.locations.tavern.at = [0, -1];
  s.locations.clearing.at = [0, 0];
  s.locations.ruins.at = [0, 1];
  return true;
}
function expeditionTravelError(s, destination) {
  if (!s.expedition) return null;
  const pair = [s.current, destination], done = (id) => s.campaign.completed.some((q) => q.location === id);
  if (pair.includes("old-bridge") && pair.includes("east-road") && !s.expedition.crossings.bridge) return "The span is broken or unsafe. Talk to the bridgekeeper, make the road safe, and repair the span; or try the ferryman\u2019s cave.";
  if (pair.includes("river-cave") && pair.includes("east-road") && !done("river-cave")) return "The ferryman cannot guide a crossing yet. Speak to him, make the cave safe, and bandage his injury.";
  if (pair.includes("castle-gate") && pair.includes("castle-yard") && !done("market-square")) return "The sentries need the mayor\u2019s word. Return to Bellweather Market and help the injured mayor.";
  if (pair.includes("castle-cellar") && pair.includes("bell-vault") && !done("castle-cellar")) return "The vault stairs are unsafe. Speak to the lamplighter, make the cellar safe, and repair its door.";
  return null;
}
function decorateExpeditionRegion(s, id) {
  const d = EXPEDITION_ROUTES[id], q = s.regions[id]?.quest;
  if (!s.expedition || !d || !q) return;
  const patron = s.creatures[q.patronId], beast = s.creatures[q.threatId], gate = s.items[q.gateId], relic = s.items[q.relicId];
  if (d.quest) {
    q.kind = d.quest;
    q.title = id === "bell-vault" ? "Ring in the morning" : d.quest === "restore" ? "Make the crossing safe" : "A helping hand";
  }
  if (d.patron) patron.name = d.patron;
  patron.goal = d.description;
  patron.routine = { activity: id === "town-inn" ? "tending the hearth" : id === "market-square" ? "watching the market" : "keeping watch", home: [...patron.position] };
  if (q.kind === "restore") {
    gate.condition = "broken";
    gate.hp = 0;
  }
  if (id === "old-bridge") {
    gate.position = [480, 230];
    patron.position = [240, 330];
    patron.routine.home = [240, 330];
    beast.position = [760, 330];
    gate.name = "bridge span";
    q.objective = "Make the road safe and repair the bridge span.";
  } else if (id === "castle-cellar") {
    gate.name = "cellar door";
    q.objective = "Make the stairs safe and repair the cellar door.";
  } else if (q.kind === "rescue") q.objective = "Make the road safe and bandage " + patron.name + ".";
  if (id === "bell-vault") {
    relic.name = "Dawn Bell";
    q.title = "Return the Dawn Bell";
    q.objective = "Make the vault safe and return the Dawn Bell to Wren the Bellkeeper.";
    beast.name = "Cinder the Vault Guardian";
  }
  s.regions[id].rumor = d.description;
}
function advanceExpedition(s) {
  if (!s.expedition) return null;
  if (s.current === "old-bridge") {
    const q = s.regions[s.current]?.quest, gate = s.items[q?.gateId], beast = s.creatures[q?.threatId];
    s.expedition.crossings.bridge = !!gate && gate.condition === "intact" && !!beast && (beast.hp <= 0 || beast.attitude === "friendly");
  }
  if (s.expedition.status === "active" && s.campaign.completed.some((q) => q.location === "bell-vault")) {
    s.expedition.status = "completed";
    s.expedition.ending = "The Dawn Bell rings across Bellweather. The road is open, the town is safe, and the bellkeeper names your unlikely company honorary protectors of the valley.";
    return s.expedition.ending;
  }
  return null;
}

// public/vendor/partyframe-rng.js
var Rng = class {
  constructor(seed) {
    this.state = seed >>> 0;
  }
  /** Chaos Party persistence extension: the exact PRNG state, not a new random seed. */
  snapshot() {
    return this.state;
  }
  restore(state) {
    this.state = state >>> 0;
  }
  /** Uniform float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Uniform integer in [min, max], inclusive on both ends. */
  int(min, max) {
    if (max < min) throw new RangeError(`Rng.int: max ${max} < min ${min}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Uniform float in [min, max). */
  float(min, max) {
    return min + this.next() * (max - min);
  }
  /** True with the given probability. */
  chance(probability) {
    return this.next() < probability;
  }
  /** Uniformly picks one element. Throws on an empty list rather than returning undefined. */
  pick(items) {
    if (items.length === 0) throw new RangeError("Rng.pick: empty list");
    return items[this.int(0, items.length - 1)];
  }
  /** Returns a shuffled copy, leaving the input untouched (Fisher-Yates). */
  shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
};

// public/content/campaign-text.generated.js
var content = {
  "locationPrefixes": [
    "Whispering",
    "Copper",
    "Forgotten",
    "Silver",
    "Thorn",
    "Starfall",
    "Ashen",
    "Winding"
  ],
  "rumors": [
    "Someone has been moving the old boundary stones.",
    "The spring runs clear, even in drought.",
    "Travelers say the next valley remembers every promise."
  ],
  "questTitles": {
    "recover": "A keepsake on the road",
    "rescue": "Shelter on the road",
    "restore": "The broken crossing"
  }
};
Object.freeze(content.locationPrefixes);
Object.freeze(content.rumors);
Object.freeze(content.questTitles);
var CAMPAIGN_TEXT = Object.freeze(content);

// public/campaign.js
var hash = (text) => {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};
var CAMPAIGN_TYPES = {
  bridge: { name: "Bridge", ground: "#466756", accent: "#78968b" },
  road: { name: "Road", ground: "#70634c", accent: "#b79868" },
  interior: { name: "Inn", ground: "#74604d", accent: "#b79868" },
  clearing: { name: "Clearing", ground: "#466756", accent: "#638368" },
  ruins: { name: "Ruins", ground: "#575663", accent: "#91909c" },
  forest: { name: "Forest", ground: "#355646", accent: "#497859" },
  marsh: { name: "Marsh", ground: "#3d5c5d", accent: "#71958b" },
  village: { name: "Village", ground: "#79624e", accent: "#b79868" },
  cavern: { name: "Cavern", ground: "#464355", accent: "#847e9e" }
};
function upgradeCampaign(r, s) {
  if (s.campaign) return;
  s.worldSeed = r.seed;
  s.creatures = {};
  s.regions = {};
  s.campaign = { chapter: 1, renown: 0, day: 1, history: [], completed: [] };
  for (const l of Object.values(s.locations)) l.visited = l.id === "tavern";
  if (!s.locations.ruins.exits.includes("wild-0-0")) s.locations.ruins.exits.push("wild-0-0");
  describeRegion(s, "wild-0-0");
}
function describeRegion(s, id) {
  if (s.locations[id]) return s.locations[id];
  const m = id.match(/^wild-(-?\d+)-(-?\d+)$/);
  if (!m) return null;
  const [x, y] = m.slice(1).map(Number);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || Math.abs(x) > 1e5 || Math.abs(y) > 1e5) return null;
  const rng = new Rng(hash(s.worldSeed + ":" + id)), kind = rng.pick(["clearing", "ruins", "forest", "marsh", "village", "cavern"]);
  const exits = [`wild-${x + 1}-${y}`, `wild-${x}-${y + 1}`, `wild-${x - 1}-${y}`, `wild-${x}-${y - 1}`];
  if (x === 0 && y === 0) exits[2] = "ruins";
  return s.locations[id] = { id, name: rng.pick(CAMPAIGN_TEXT.locationPrefixes) + " " + CAMPAIGN_TYPES[kind].name + " " + Math.abs(hash(id) % 1e3), kind, exits, visited: false, danger: Math.min(5, 1 + Math.floor((Math.abs(x) + Math.abs(y)) / 3)), decor: Array.from({ length: 12 }, () => [rng.int(90, 870), rng.int(170, 470), rng.int(0, 2)]) };
}
function spawnItem(s, location, properties) {
  const id = "item-" + s.nextId++;
  return s.items[id] = { id, name: "object", type: "fragment", material: "wood", condition: "intact", hp: 4, maxHp: 4, ownerId: null, location, position: [480, 390], components: [], contents: [], equipped: false, appearance: { shape: "shard", color: "#b88955" }, history: [], ...properties };
}
var regionStores = /* @__PURE__ */ new WeakMap();
function bindRegionStorage(r, store) {
  regionStores.set(r, store);
}
function unloadRegion(r, s, id) {
  const store = regionStores.get(r);
  if (!store || id === "tavern") return;
  const people = Object.fromEntries(Object.entries(s.creatures).filter(([, c]) => c.location === id));
  const ids = new Set(Object.values(s.items).filter((i) => i.location === id || people[i.ownerId] || people[i.attachedTo]).map((i) => i.id));
  const addChildren = (key) => {
    const i = s.items[key];
    for (const child of [...i?.components || [], ...i?.contents || []]) if (!ids.has(child)) {
      ids.add(child);
      addChildren(child);
    }
  };
  for (const key of [...ids]) addChildren(key);
  const chunk = { version: 1, location: id, region: s.regions[id], creatures: people, items: Object.fromEntries([...ids].map((key) => [key, s.items[key]])) };
  s.regionRefs ||= {};
  s.regionRefs[id] = store.write(chunk);
  for (const key of ids) delete s.items[key];
  for (const key of Object.keys(people)) delete s.creatures[key];
  delete s.regions[id];
}
function enterRegion(r, s, id) {
  const l = describeRegion(s, id);
  if (!l) return false;
  if (s.current !== id) unloadRegion(r, s, s.current);
  s.current = id;
  l.visited = true;
  if (s.regionRefs?.[id] && !s.regions[id]) {
    const store = regionStores.get(r);
    if (!store) throw Error("Saved region storage is unavailable; campaign preserved.");
    const chunk = store.read(s.regionRefs[id]);
    if (chunk.location !== id) throw Error("Saved region identity mismatch");
    Object.assign(s.items, chunk.items);
    Object.assign(s.creatures, chunk.creatures);
    s.regions[id] = chunk.region;
  }
  if (id === "tavern") return true;
  for (const exit of l.exits) describeRegion(s, exit);
  if (s.regions[id]) return true;
  const rng = new Rng(hash(s.worldSeed + ":adventure:" + id)), danger = l.danger || 1;
  if (!Object.values(s.items).some((i) => i.location === id)) for (const [name, material, type3, shape, color] of [["cloth strip", "cloth", "fragment", "shard", "#bd88cf"], ["wood splinter", "wood", "tool", "rod", "#b88955"], ["blue bottle", "glass", "container", "cup", "#7dc7cf"], ["smooth stone", "stone", "fragment", "shard", "#a3adbb"]]) spawnItem(s, id, { name, material, type: type3, position: [240 + s.nextId % 4 * 150, 390], appearance: { shape, color } });
  const patronId = "person-" + id, threatId = "beast-" + id, species = rng.pick(["wolf", "boar", "crow"]);
  s.creatures[patronId] = { id: patronId, name: rng.pick(["Wren", "Tansy", "Rook", "Finch", "Ember"]) + " the Wayfarer", kind: "person", material: "flesh", location: id, position: [240, 245], hp: 6, maxHp: 10, attitude: "wary", injuries: ["sprained arm"], trust: {}, parts: [{ name: "loose hair", material: "fiber", count: 1 }], appearance: { skin: rng.int(0, 5), hair: rng.int(0, 5), color: rng.int(0, 5), outfit: 1 }, history: [] };
  s.creatures[threatId] = { id: threatId, name: rng.pick(["Bristle", "Mottle", "Cinder", "Briar"]) + " " + species[0].toUpperCase() + species.slice(1), kind: "beast", species, material: "flesh", location: id, position: [760, 300], hp: 6 + danger * 2, maxHp: 6 + danger * 2, attitude: "hostile", injuries: [], trust: {}, parts: [{ name: "tuft of fur", material: "fiber", count: 2 }, { name: "small bone", material: "bone", count: 1 }], appearance: { skin: 5, hair: 3, color: 1, outfit: 0, body: "orc" }, history: [] };
  const adventureKind = id.startsWith("wild-") ? rng.pick(["recover", "rescue", "restore"]) : "recover";
  const chest = spawnItem(s, id, { name: "weathered coffer", type: "fixture", material: "wood", portable: false, locked: true, open: false, position: [650, 185], appearance: { shape: "chest", color: "#a77951" }, parts: [{ name: "wood shaving", material: "wood", count: 2 }] });
  const relic = spawnItem(s, id, { name: rng.pick(["silver", "copper", "amber"]) + " keepsake", material: "metal", containerId: chest.id, position: [650, 185], appearance: { shape: "shard", color: "#dfc16e" } });
  chest.contents = [relic.id];
  spawnItem(s, id, { name: "spring", type: "fixture", material: "stone", portable: false, source: "water", position: [115, 395], appearance: { shape: "spring", color: "#7dc7cf" } });
  const gate = spawnItem(s, id, { name: "weathered gate", type: "fixture", material: "wood", portable: false, locked: false, open: false, position: [480, 145], appearance: { shape: "gate", color: "#b88955" }, parts: [{ name: "wood shaving", material: "wood", count: 2 }] });
  if (adventureKind === "restore") {
    gate.condition = "broken";
    gate.hp = 0;
  }
  const objective = adventureKind === "rescue" ? "Make the road safe and bandage the injured wayfarer." : adventureKind === "restore" ? "Make the road safe and repair the broken gate." : "Make the road safe and return the keepsake from the coffer to the wayfarer.";
  s.regions[id] = { quest: { id: "quest-" + id, kind: adventureKind, objective, gateId: gate.id, title: CAMPAIGN_TEXT.questTitles[adventureKind], patronId, threatId, relicId: relic.id, chestId: chest.id, status: "available", reward: 4 + danger, chapter: s.campaign.chapter }, rumor: rng.pick(CAMPAIGN_TEXT.rumors) };
  decorateExpeditionRegion(s, id);
  recordCampaign(r, s, "discovery", `Discovered ${l.name}.`, { location: id });
  return true;
}
function recordCampaign(r, s, type3, text, extra = {}) {
  const entry = { id: r.seq + ":" + r.round + ":" + s.campaign.history.length, type: type3, text, round: r.round, day: s.campaign.day, ...extra };
  s.campaign.history.push(entry);
  if (s.campaign.history.length > 200) s.campaign.history.shift();
}
var localCreatures = (s) => Object.values(s.creatures || {}).filter((c) => c.location === s.current);
function contains(s, item, id, seen = /* @__PURE__ */ new Set()) {
  if (item.id === id) return true;
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return [...item.components || [], ...item.contents || []].some((child) => s.items[child] && contains(s, s.items[child], id, seen));
}
function progressAdventure(r, s) {
  const quest = s.regions[s.current]?.quest;
  if (!quest || quest.status === "completed") return null;
  const beast = s.creatures[quest.threatId], patron = s.creatures[quest.patronId];
  if (quest.status === "available") return null;
  quest.steps = { safe: beast.hp <= 0 || beast.attitude === "friendly", recovered: Object.values(s.items).some((i) => i.ownerId && r.players.some((p) => p.id === i.ownerId) && contains(s, i, quest.relicId)), healed: patron.hp === patron.maxHp, restored: s.items[quest.gateId]?.condition === "intact", returned: Object.values(s.items).some((i) => i.ownerId === patron.id && contains(s, i, quest.relicId)) };
  const solved = quest.kind === "rescue" ? quest.steps.healed : quest.kind === "restore" ? quest.steps.restored : quest.steps.returned;
  if (!quest.steps.safe || !solved) return null;
  quest.status = "completed";
  quest.completedRound = r.round;
  s.campaign.completed.push({ id: quest.id, title: quest.title, location: s.current, chapter: s.campaign.chapter });
  for (const p of r.players) {
    p.gold += quest.reward;
    p.score += 6;
  }
  s.campaign.renown++;
  s.campaign.chapter++;
  patron.attitude = "friendly";
  const text = `${quest.kind === "rescue" ? patron.name + " is healed" : quest.kind === "restore" ? "The crossing is repaired" : patron.name + "\u2019s keepsake is returned"} and the road is safe. Everyone gains ${quest.reward} coins and 6 XP. Chapter ${s.campaign.chapter} begins beyond the next path.`;
  recordCampaign(r, s, "adventure", text, { location: s.current, questId: quest.id });
  return text;
}
function campaignView(r) {
  const s = r.world.expedition;
  if (!s) return void 0;
  const ids = /* @__PURE__ */ new Set([s.current, ...s.locations[s.current]?.exits || []]);
  const locations = Object.fromEntries(Object.entries(s.locations).filter(([id]) => ids.has(id)).map(([id, l]) => [id, id === s.current ? l : { id, name: l.name, kind: l.kind, visited: l.visited, exits: l.exits }]));
  const creatures = Object.fromEntries(localCreatures(s).map((c) => [c.id, c]));
  const keep = new Set(Object.values(s.items).filter((i) => i.location === s.current || r.players.some((p) => p.id === i.ownerId) || creatures[i.ownerId] || creatures[i.attachedTo] || r.players.some((p) => p.id === i.attachedTo)).map((i) => i.id));
  const include = (id) => {
    const i = s.items[id];
    if (!i) return;
    keep.add(id);
    for (const child of [...i.components || [], ...i.contents || []]) if (!keep.has(child)) include(child);
  };
  for (const id of [...keep]) include(id);
  const { regionRefs, ...local } = s;
  return { ...local, routeMap: s.mapFound ? Object.values(s.locations).filter((l) => l.visited || Object.values(s.locations).some((v) => v.visited && v.exits.includes(l.id))).map((l) => ({ id: l.id, name: l.name, visited: !!l.visited, exits: l.exits, at: l.at })) : [], locations, items: Object.fromEntries([...keep].map((id) => [id, s.items[id]])), creatures, regions: s.regions[s.current] ? { [s.current]: s.regions[s.current] } : {}, campaign: { ...s.campaign, history: s.campaign.history.slice(-30), completed: s.campaign.completed.slice(-20) } };
}

// src/framework-entry.ts
import { Schema as Schema2, type as type2, Encoder } from "@colyseus/schema";
import { ServerError as ServerError2 } from "@colyseus/core";
import { randomBytes, randomInt as randomInt2, timingSafeEqual } from "node:crypto";
import { z as z2 } from "zod";

// vendor/partyframe/packages/game-core/src/rng.ts
var Rng2 = class {
  constructor(seed) {
    this.state = seed >>> 0;
  }
  /** Chaos Party persistence extension: the exact PRNG state, not a new random seed. */
  snapshot() {
    return this.state;
  }
  restore(state) {
    this.state = state >>> 0;
  }
  /** Uniform float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Uniform integer in [min, max], inclusive on both ends. */
  int(min, max) {
    if (max < min) throw new RangeError(`Rng.int: max ${max} < min ${min}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Uniform float in [min, max). */
  float(min, max) {
    return min + this.next() * (max - min);
  }
  /** True with the given probability. */
  chance(probability) {
    return this.next() < probability;
  }
  /** Uniformly picks one element. Throws on an empty list rather than returning undefined. */
  pick(items) {
    if (items.length === 0) throw new RangeError("Rng.pick: empty list");
    return items[this.int(0, items.length - 1)];
  }
  /** Returns a shuffled copy, leaving the input untouched (Fisher-Yates). */
  shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
};
function randomSeed() {
  return Math.random() * 4294967295 >>> 0;
}

// vendor/partyframe/packages/game-core/src/registry.ts
var games = /* @__PURE__ */ new Map();
function registerGame(game) {
  if (games.has(game.id)) {
    throw new Error(`Game "${game.id}" is already registered`);
  }
  games.set(game.id, game);
}
function getGame(gameId) {
  return games.get(gameId);
}
function requireGame(gameId) {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(
      `Unknown game "${gameId}". Registered: ${[...games.keys()].join(", ") || "(none)"}`
    );
  }
  return game;
}

// vendor/partyframe/packages/game-core/src/validation.ts
function validateSync(schema, input) {
  const result = schema["~standard"].validate(input);
  if (result instanceof Promise) {
    return { ok: false, issues: ["asynchronous validators are not supported"] };
  }
  if (result.issues) {
    return { ok: false, issues: result.issues.map((issue) => issue.message) };
  }
  return { ok: true, value: result.value };
}

// vendor/partyframe/packages/runtime/src/sessionSchema.ts
import { MapSchema, Schema, type } from "@colyseus/schema";
var PlayerSchema = class extends Schema {
  constructor() {
    super(...arguments);
    this.id = "";
    this.name = "";
    this.avatar = "";
    this.color = "";
    this.isBot = false;
    this.isHost = false;
    this.connected = true;
    this.ready = false;
    this.score = 0;
    this.seat = 0;
    this.joined = false;
  }
};
__decorateClass([
  type("string")
], PlayerSchema.prototype, "id", 2);
__decorateClass([
  type("string")
], PlayerSchema.prototype, "name", 2);
__decorateClass([
  type("string")
], PlayerSchema.prototype, "avatar", 2);
__decorateClass([
  type("string")
], PlayerSchema.prototype, "color", 2);
__decorateClass([
  type("boolean")
], PlayerSchema.prototype, "isBot", 2);
__decorateClass([
  type("boolean")
], PlayerSchema.prototype, "isHost", 2);
__decorateClass([
  type("boolean")
], PlayerSchema.prototype, "connected", 2);
__decorateClass([
  type("boolean")
], PlayerSchema.prototype, "ready", 2);
__decorateClass([
  type("number")
], PlayerSchema.prototype, "score", 2);
__decorateClass([
  type("number")
], PlayerSchema.prototype, "seat", 2);
__decorateClass([
  type("boolean")
], PlayerSchema.prototype, "joined", 2);
var SettingsSchema = class extends Schema {
  constructor() {
    super(...arguments);
    this.maxPlayers = 8;
    this.botCount = 0;
    this.botDifficulty = "medium";
  }
};
__decorateClass([
  type("number")
], SettingsSchema.prototype, "maxPlayers", 2);
__decorateClass([
  type("number")
], SettingsSchema.prototype, "botCount", 2);
__decorateClass([
  type("string")
], SettingsSchema.prototype, "botDifficulty", 2);
var SessionSchema = class extends Schema {
  constructor() {
    super(...arguments);
    this.publicCode = "";
    this.status = "CREATED";
    this.gameId = "";
    this.serverTime = 0;
    this.players = new MapSchema();
    this.settings = new SettingsSchema();
    this.hostPlayerId = "";
    this.hostConnected = false;
    this.gameRevision = 0;
  }
};
__decorateClass([
  type("string")
], SessionSchema.prototype, "publicCode", 2);
__decorateClass([
  type("string")
], SessionSchema.prototype, "status", 2);
__decorateClass([
  type("string")
], SessionSchema.prototype, "gameId", 2);
__decorateClass([
  type("number")
], SessionSchema.prototype, "serverTime", 2);
__decorateClass([
  type({ map: PlayerSchema })
], SessionSchema.prototype, "players", 2);
__decorateClass([
  type(SettingsSchema)
], SessionSchema.prototype, "settings", 2);
__decorateClass([
  type("string")
], SessionSchema.prototype, "hostPlayerId", 2);
__decorateClass([
  type("boolean")
], SessionSchema.prototype, "hostConnected", 2);
__decorateClass([
  type("number")
], SessionSchema.prototype, "gameRevision", 2);
function setIfChanged(target, key, value) {
  if (target[key] !== value) target[key] = value;
}

// vendor/partyframe/packages/runtime/src/adapters.ts
var adapters = /* @__PURE__ */ new Map();
function install(adapter) {
  if (!getGame(adapter.game.id)) {
    registerGame(adapter.game);
  }
  adapters.set(adapter.game.id, adapter);
}
function requireAdapter(gameId) {
  const adapter = adapters.get(gameId);
  if (!adapter) {
    requireGame(gameId);
    throw new Error(`Game "${gameId}" has no network adapter`);
  }
  return adapter;
}

// vendor/partyframe/packages/runtime/src/bind.ts
var EVENT = {
  SERVER_STARTED: "SERVER_STARTED",
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_DISPOSED: "SESSION_DISPOSED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  HOST_ATTACHED: "HOST_ATTACHED",
  HOST_DISCONNECTED: "HOST_DISCONNECTED",
  HOST_RECONNECTED: "HOST_RECONNECTED",
  PLAYER_JOINED: "PLAYER_JOINED",
  PLAYER_LEFT: "PLAYER_LEFT",
  PLAYER_DISCONNECTED: "PLAYER_DISCONNECTED",
  PLAYER_RECONNECTED: "PLAYER_RECONNECTED",
  PLAYER_ACTION: "PLAYER_ACTION",
  ACTION_REJECTED: "ACTION_REJECTED",
  RATE_LIMITED: "RATE_LIMITED",
  BOT_ADDED: "BOT_ADDED",
  BOT_REMOVED: "BOT_REMOVED",
  GAME_STARTED: "GAME_STARTED",
  GAME_ENDED: "GAME_ENDED",
  ROUND_STARTED: "ROUND_STARTED",
  ROUND_ENDED: "ROUND_ENDED",
  STATUS_CHANGED: "STATUS_CHANGED",
  GAME_ERROR: "GAME_ERROR"
};
var host = null;
function bindRuntime(next) {
  host = next;
}
function runtimeHost() {
  if (!host) {
    throw new Error("@partyframe/runtime: bindRuntime() must run before a room is created");
  }
  return host;
}

// vendor/partyframe/packages/runtime/src/PartySessionRoom.ts
import { Room, ServerError, matchMaker } from "@colyseus/core";

// vendor/partyframe/packages/protocol/src/constants.ts
var PARTY_ROOM = "party";
var ROOM_CODE_ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
var ROOM_CODE_LENGTH = 6;
var MAX_MESSAGE_BYTES = 2048;
var PLAYER_NAME_MIN = 1;
var PLAYER_NAME_MAX = 18;
var ABSOLUTE_MAX_PLAYERS = 24;
var PLAYER_RECONNECT_SECONDS = 90;
var HOST_RECONNECT_SECONDS = 180;
var SERVER_TICK_MS = 100;
var CLOCK_BEACON_MS = 5e3;
var AVATARS = [
  "\u{1F98A}",
  "\u{1F43C}",
  "\u{1F419}",
  "\u{1F984}",
  "\u{1F438}",
  "\u{1F427}",
  "\u{1F996}",
  "\u{1F41D}",
  "\u{1F47B}",
  "\u{1F916}",
  "\u{1F428}",
  "\u{1F989}"
];
var PLAYER_COLORS = [
  "#ff5d5d",
  "#ffb020",
  "#ffe14d",
  "#54d66a",
  "#3fc7d4",
  "#5b8cff",
  "#b579ff",
  "#ff6fc4"
];

// vendor/partyframe/packages/protocol/src/messages.ts
import { z } from "zod";
var MSG = {
  /** client -> server: platform-level intent (ready, start, rematch, ...). */
  SESSION_ACTION: "session-action",
  /** client -> server: game-specific intent, shape defined by the game plugin. */
  GAME_ACTION: "game-action",
  /** client -> server: clock synchronisation probe. */
  CLOCK_PING: "clock-ping",
  /** server -> client: reply to `CLOCK_PING`. */
  CLOCK_PONG: "clock-pong",
  /** server -> client: identity assigned at join time. */
  WELCOME: "welcome",
  /** server -> single client: the phone's current controller projection. */
  CONTROLLER_STATE: "controller-state",
  /** server -> all: transient, non-authoritative presentation cue. */
  GAME_EVENT: "game-event",
  /** server -> single client: recoverable failure. */
  ERROR: "error"
};
var UNSAFE_TEXT = new RegExp(
  "[\0-\x7F-\x9F\xAD\u034F\u061C\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]",
  "gu"
);
var RoomCodeSchema = z.string().trim().toUpperCase().length(ROOM_CODE_LENGTH).regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]+$`), "invalid room code");
var PlayerNameSchema = z.string().transform((value) => value.replace(UNSAFE_TEXT, "").trim()).pipe(z.string().min(PLAYER_NAME_MIN).max(PLAYER_NAME_MAX));
var AvatarSchema = z.enum(AVATARS);
var ColorSchema = z.enum(PLAYER_COLORS);
var BotDifficultySchema = z.enum(["easy", "medium", "hard"]);
var JoinOptionsSchema = z.object({
  role: z.enum(["host", "controller"]),
  /** Present when the host creates a session; ignored for controllers. */
  gameId: z.string().min(1).max(40).optional()
});
var SessionSettingsPatchSchema = z.object({
  maxPlayers: z.number().int().min(1).max(ABSOLUTE_MAX_PLAYERS).optional(),
  botCount: z.number().int().min(0).max(ABSOLUTE_MAX_PLAYERS).optional(),
  botDifficulty: BotDifficultySchema.optional(),
  gameOptions: z.record(z.string(), z.unknown()).optional()
});
var SessionActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("set-profile"),
    name: PlayerNameSchema,
    avatar: AvatarSchema,
    color: ColorSchema
  }),
  z.object({ type: z.literal("set-ready"), ready: z.boolean() }),
  z.object({ type: z.literal("leave") }),
  z.object({ type: z.literal("start-game") }),
  z.object({ type: z.literal("rematch") }),
  z.object({ type: z.literal("return-to-lobby") }),
  z.object({ type: z.literal("update-settings"), settings: SessionSettingsPatchSchema }),
  z.object({ type: z.literal("kick-player"), playerId: z.string().min(1).max(64) }),
  /** Developer-mode only; rejected outright when the server is in production. */
  z.object({
    type: z.literal("dev-command"),
    command: z.string().min(1).max(40),
    value: z.number().finite().optional()
  })
]);
var ClockPingSchema = z.object({ t0: z.number().finite() });

// vendor/partyframe/packages/runtime/src/bots.ts
var BOT_NAMES = [
  "Botly",
  "Circuit",
  "Pixel",
  "Widget",
  "Gizmo",
  "Sprocket",
  "Chip",
  "Nova",
  "Echo",
  "Blip",
  "Cogs",
  "Fizz"
];
function makeBotIdentity(index, takenNames, takenColors) {
  const name = BOT_NAMES.find((candidate) => !takenNames.has(candidate.toLowerCase())) ?? `Bot ${index + 1}`;
  const color = PLAYER_COLORS.find((candidate) => !takenColors.has(candidate)) ?? PLAYER_COLORS[index % PLAYER_COLORS.length];
  const avatar = AVATARS[(AVATARS.indexOf("\u{1F916}") + index) % AVATARS.length];
  return { name, avatar, color };
}

// vendor/partyframe/packages/runtime/src/roomCode.ts
import { randomInt } from "node:crypto";
function generateRoomCode() {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}
async function generateUniqueRoomCode(isTaken, attempts = 12) {
  for (let i = 0; i < attempts; i += 1) {
    const code = generateRoomCode();
    if (!await isTaken(code)) return code;
  }
  throw new Error(`Could not find a free room code after ${attempts} attempts`);
}

// vendor/partyframe/packages/runtime/src/rateLimit.ts
var RateLimiter = class {
  constructor(options) {
    this.options = options;
    this.buckets = /* @__PURE__ */ new Map();
  }
  /**
   * Consumes one token for `key`.
   *
   * Returns false when the caller is over budget, in which case the message
   * should be dropped and the sender told, never silently ignored - a silently
   * dropped submission looks like a bug to the player.
   */
  tryConsume(key, now) {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      this.buckets.set(key, { tokens: this.options.capacity - 1, lastRefillAt: now });
      return true;
    }
    const elapsedSeconds = Math.max(0, now - bucket.lastRefillAt) / 1e3;
    bucket.tokens = Math.min(
      this.options.capacity,
      bucket.tokens + elapsedSeconds * this.options.refillPerSecond
    );
    bucket.lastRefillAt = now;
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }
  /** Drops a client's bucket when it disconnects for good. */
  forget(key) {
    this.buckets.delete(key);
  }
  clear() {
    this.buckets.clear();
  }
};
var GAME_ACTION_LIMITS = { capacity: 8, refillPerSecond: 4 };
var SESSION_ACTION_LIMITS = { capacity: 6, refillPerSecond: 2 };
var CLOCK_PING_LIMITS = { capacity: 10, refillPerSecond: 2 };

// vendor/partyframe/packages/runtime/src/PartySessionRoom.ts
var JOIN_ERROR_CODE = 4400;
function rejectJoin(code) {
  throw new ServerError(JOIN_ERROR_CODE, code);
}
var RUNNING_STATUSES = /* @__PURE__ */ new Set(["STARTING", "PLAYING", "ROUND_END"]);
var PartySessionRoom = class extends Room {
  constructor() {
    super(...arguments);
    this.maxClients = ABSOLUTE_MAX_PLAYERS + 2;
    /** Presentation cues queued by the game during the current tick. */
    this.eventQueue = [];
    /** Status the game asked for during the current tick, applied once at the end. */
    this.requestedStatus = null;
    /** Bot strategies, one per difficulty, shared by every bot at that level. */
    this.botStrategies = /* @__PURE__ */ new Map();
    /** A bot's chosen action and the time it should be submitted. */
    this.botPending = /* @__PURE__ */ new Map();
    this.gameLimiter = new RateLimiter(GAME_ACTION_LIMITS);
    this.sessionLimiter = new RateLimiter(SESSION_ACTION_LIMITS);
    this.clockLimiter = new RateLimiter(CLOCK_PING_LIMITS);
    this.createdAt = 0;
    this.lastConnectedAt = 0;
    this.lastBeaconAt = 0;
    this.nextSeat = 0;
    this.controllerRevision = 0;
    /** Last envelope sent to each controller, so unchanged state is not resent. */
    this.lastControllerJson = /* @__PURE__ */ new Map();
  }
  // ---------------------------------------------------------------- lifecycle
  async onCreate(options) {
    const host2 = runtimeHost();
    const gameId = options.gameId ?? host2.defaultGameId;
    this.adapter = requireAdapter(gameId);
    const publicCode = await generateUniqueRoomCode(async (candidate) => {
      const rooms = await matchMaker.query({ name: PARTY_ROOM });
      return rooms.some(
        (room) => room.metadata?.publicCode === candidate
      );
    });
    this.logger = host2.log.child({
      sessionId: this.roomId,
      roomCode: publicCode,
      gameId: this.adapter.game.id
    });
    this.rng = new Rng2(options.seed ?? randomSeed());
    this.gameOptions = this.adapter.game.parseOptions({});
    this.gameState = this.adapter.game.createState(this.gameOptions);
    const state = this.adapter.createState();
    state.publicCode = publicCode;
    state.gameId = this.adapter.game.id;
    state.status = "LOBBY";
    state.serverTime = Date.now();
    state.settings.maxPlayers = Math.min(host2.maxPlayers, this.adapter.game.maxPlayers);
    state.settings.botCount = 0;
    state.settings.botDifficulty = "medium";
    this.setState(state);
    this.registry = this.createRegistry();
    this.autoDispose = false;
    this.createdAt = Date.now();
    this.lastConnectedAt = this.createdAt;
    this.registerMessageHandlers();
    this.setSimulationInterval((deltaMs) => this.tick(deltaMs), SERVER_TICK_MS);
    void this.publishMetadata();
    this.logger.info(EVENT.SESSION_CREATED, { maxPlayers: state.settings.maxPlayers });
  }
  onAuth(_client, rawOptions) {
    const parsed = JoinOptionsSchema.safeParse(rawOptions ?? {});
    if (!parsed.success) rejectJoin("INVALID_PAYLOAD");
    const { role } = parsed.data;
    if (this.state.status === "CLOSED") rejectJoin("ROOM_CLOSED");
    if (role === "host") {
      const hostOnline = this.clients.some(
        (client) => client.userData?.role === "host"
      );
      if (hostOnline) rejectJoin("NOT_ALLOWED");
    } else {
      const seated = [...this.state.players.values()].filter((p) => !p.isBot).length;
      if (seated >= this.state.settings.maxPlayers) rejectJoin("ROOM_FULL");
    }
    return { role, joinedAt: Date.now() };
  }
  onJoin(client, _options, auth) {
    client.userData = auth;
    this.lastConnectedAt = Date.now();
    if (auth.role === "host") {
      this.state.hostConnected = true;
      this.logger.info(EVENT.HOST_ATTACHED, { playerId: client.sessionId });
    } else {
      this.ensurePlayerRow(client.sessionId);
    }
    this.sendWelcome(client);
    void this.publishMetadata();
    this.pushControllerState(client, true);
  }
  async onLeave(client, consented) {
    const data = client.userData;
    const role = data?.role ?? "controller";
    if (role === "host") {
      this.state.hostConnected = false;
      this.logger.warn(EVENT.HOST_DISCONNECTED, { consented });
      if (consented) return;
      try {
        await this.allowReconnection(client, HOST_RECONNECT_SECONDS);
        this.state.hostConnected = true;
        this.sendWelcome(client);
        this.logger.info(EVENT.HOST_RECONNECTED);
      } catch {
        this.logger.info(EVENT.HOST_DISCONNECTED, { recovered: false });
      }
      return;
    }
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    if (consented) {
      this.removePlayer(client.sessionId, "left");
      return;
    }
    player.connected = false;
    this.notifyGameOfPlayer(client.sessionId, "disconnected");
    this.emitPlatformEvent({
      kind: "player-disconnected",
      messageKey: "event.playerDisconnected",
      params: { name: player.name },
      playerId: player.id
    });
    this.logger.info(EVENT.PLAYER_DISCONNECTED, { playerId: client.sessionId });
    try {
      const reconnected = await this.allowReconnection(client, PLAYER_RECONNECT_SECONDS);
      const row = this.state.players.get(client.sessionId);
      if (row) row.connected = true;
      reconnected.userData = data ?? { role: "controller", joinedAt: Date.now() };
      this.lastConnectedAt = Date.now();
      this.notifyGameOfPlayer(client.sessionId, "reconnected");
      this.emitPlatformEvent({
        kind: "player-reconnected",
        messageKey: "event.playerReconnected",
        params: { name: row?.name ?? "" },
        playerId: client.sessionId
      });
      this.sendWelcome(reconnected);
      this.pushControllerState(reconnected, true);
      this.logger.info(EVENT.PLAYER_RECONNECTED, { playerId: client.sessionId });
    } catch {
      this.removePlayer(client.sessionId, "left");
    }
  }
  onDispose() {
    this.gameLimiter.clear();
    this.sessionLimiter.clear();
    this.clockLimiter.clear();
    this.lastControllerJson.clear();
    this.logger.info(EVENT.SESSION_DISPOSED);
  }
  // ------------------------------------------------------------------ players
  /** Creates or revives the row for a controller's seat. */
  ensurePlayerRow(playerId) {
    const existing = this.state.players.get(playerId);
    if (existing) {
      existing.connected = true;
      return existing;
    }
    const player = new PlayerSchema();
    player.id = playerId;
    player.seat = this.nextSeat++;
    player.color = this.pickFreeColor();
    player.avatar = this.pickFreeAvatar();
    player.connected = true;
    player.joined = false;
    this.state.players.set(playerId, player);
    return player;
  }
  pickFreeColor() {
    const taken = new Set([...this.state.players.values()].map((p) => p.color));
    return PLAYER_COLORS.find((c) => !taken.has(c)) ?? PLAYER_COLORS[0];
  }
  pickFreeAvatar() {
    const taken = new Set([...this.state.players.values()].map((p) => p.avatar));
    return AVATARS.find((a) => !taken.has(a)) ?? AVATARS[0];
  }
  removePlayer(playerId, reason) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    this.state.players.delete(playerId);
    this.botPending.delete(playerId);
    this.gameLimiter.forget(playerId);
    this.sessionLimiter.forget(playerId);
    this.clockLimiter.forget(playerId);
    this.lastControllerJson.delete(playerId);
    if (this.state.hostPlayerId === playerId) {
      this.state.hostPlayerId = this.electHostPlayer();
    }
    this.notifyGameOfPlayer(playerId, "left");
    this.emitPlatformEvent({
      kind: "player-left",
      messageKey: "event.playerLeft",
      params: { name: player.name },
      playerId
    });
    this.logger.info(EVENT.PLAYER_LEFT, { playerId, reason });
    void this.publishMetadata();
  }
  /** The longest-seated joined human becomes host when the previous one leaves. */
  electHostPlayer() {
    const candidate = [...this.state.players.values()].filter((p) => !p.isBot && p.joined).sort((a, b) => a.seat - b.seat)[0];
    for (const player of this.state.players.values()) {
      player.isHost = candidate ? player.id === candidate.id : false;
    }
    return candidate?.id ?? "";
  }
  /** Players the game rules operate on: everyone who has completed joining. */
  gamePlayers() {
    return [...this.state.players.values()].filter((p) => p.joined).sort((a, b) => a.seat - b.seat);
  }
  createRegistry() {
    const toGamePlayer = (p) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      connected: p.connected,
      score: p.score,
      seat: p.seat
    });
    return {
      all: () => this.gamePlayers().map(toGamePlayer),
      get: (playerId) => {
        const row = this.state.players.get(playerId);
        return row && row.joined ? toGamePlayer(row) : void 0;
      },
      has: (playerId) => Boolean(this.state.players.get(playerId)?.joined),
      addScore: (playerId, delta) => {
        const row = this.state.players.get(playerId);
        if (row) row.score = Math.max(0, row.score + delta);
      },
      setScore: (playerId, score) => {
        const row = this.state.players.get(playerId);
        if (row) row.score = Math.max(0, score);
      }
    };
  }
  // --------------------------------------------------------------------- bots
  /** Adds or removes bots so the roster matches `settings.botCount`. */
  reconcileBots() {
    const bots = [...this.state.players.values()].filter((p) => p.isBot);
    const humans = [...this.state.players.values()].filter((p) => !p.isBot && p.joined);
    const capacity = Math.max(0, this.state.settings.maxPlayers - humans.length);
    const target = Math.min(this.state.settings.botCount, capacity);
    for (let i = bots.length; i > target; i -= 1) {
      const victim = bots[i - 1];
      if (!victim) break;
      this.state.players.delete(victim.id);
      this.botPending.delete(victim.id);
      this.logger.info(EVENT.BOT_REMOVED, { playerId: victim.id });
    }
    for (let i = bots.length; i < target; i += 1) {
      const takenNames = new Set([...this.state.players.values()].map((p) => p.name.toLowerCase()));
      const takenColors = new Set([...this.state.players.values()].map((p) => p.color));
      const identity = makeBotIdentity(i, takenNames, takenColors);
      const bot = new PlayerSchema();
      bot.id = `bot-${this.roomId}-${i}-${this.nextSeat}`;
      bot.seat = this.nextSeat++;
      bot.name = identity.name;
      bot.avatar = identity.avatar;
      bot.color = identity.color;
      bot.isBot = true;
      bot.connected = true;
      bot.joined = true;
      bot.ready = true;
      this.state.players.set(bot.id, bot);
      this.logger.info(EVENT.BOT_ADDED, { playerId: bot.id });
    }
    this.state.settings.botCount = Math.min(this.state.settings.botCount, capacity);
    void this.publishMetadata();
  }
  botStrategy() {
    const difficulty = this.state.settings.botDifficulty;
    let strategy = this.botStrategies.get(difficulty);
    if (!strategy) {
      strategy = this.adapter.game.createBot(
        difficulty === "easy" || difficulty === "hard" ? difficulty : "medium"
      );
      this.botStrategies.set(difficulty, strategy);
    }
    return strategy;
  }
  /**
   * Drives every bot through the human action path.
   *
   * A bot never mutates game state directly: it produces the same payload a
   * phone would send, and that payload goes through the same validation and the
   * same `handleAction` call.
   */
  tickBots(ctx, now) {
    const strategy = this.botStrategy();
    for (const bot of this.gamePlayers()) {
      if (!bot.isBot) continue;
      const pending = this.botPending.get(bot.id);
      if (pending) {
        if (now < pending.dueAt) continue;
        this.botPending.delete(bot.id);
        this.applyGameAction(bot.id, pending.action, now);
        continue;
      }
      const decision = strategy.decide(ctx, bot.id);
      if (decision) {
        this.botPending.set(bot.id, {
          action: decision.action,
          dueAt: now + Math.max(0, decision.delayMs)
        });
      }
    }
  }
  // ----------------------------------------------------------------- messages
  registerMessageHandlers() {
    this.onMessage(MSG.SESSION_ACTION, (client, payload) => {
      if (!this.checkPayload(client, payload)) return;
      if (!this.sessionLimiter.tryConsume(client.sessionId, Date.now())) {
        this.sendError(client, "RATE_LIMITED");
        this.logger.warn(EVENT.RATE_LIMITED, { playerId: client.sessionId, channel: "session" });
        return;
      }
      const parsed = SessionActionSchema.safeParse(payload);
      if (!parsed.success) {
        this.sendError(client, "INVALID_PAYLOAD");
        return;
      }
      this.handleSessionAction(client, parsed.data);
    });
    this.onMessage(MSG.GAME_ACTION, (client, payload) => {
      if (!this.checkPayload(client, payload)) return;
      const now = Date.now();
      if (!this.gameLimiter.tryConsume(client.sessionId, now)) {
        this.sendError(client, "RATE_LIMITED");
        this.logger.warn(EVENT.RATE_LIMITED, { playerId: client.sessionId, channel: "game" });
        return;
      }
      const data = client.userData;
      if (data?.role !== "controller") {
        this.sendError(client, "NOT_ALLOWED");
        return;
      }
      if (!RUNNING_STATUSES.has(this.state.status)) {
        this.sendError(client, "WRONG_STATE");
        return;
      }
      const player = this.state.players.get(client.sessionId);
      if (!player?.joined) {
        this.sendError(client, "NOT_ALLOWED");
        return;
      }
      const validated = validateSync(this.adapter.game.actionSchema, payload);
      if (!validated.ok) {
        this.sendError(client, "INVALID_PAYLOAD");
        this.logger.debug(EVENT.ACTION_REJECTED, {
          playerId: client.sessionId,
          issues: validated.issues
        });
        return;
      }
      const applied = this.applyGameAction(client.sessionId, validated.value, now);
      if (!applied) this.sendError(client, "WRONG_STATE");
    });
    this.onMessage(MSG.CLOCK_PING, (client, payload) => {
      if (!this.clockLimiter.tryConsume(client.sessionId, Date.now())) return;
      const parsed = ClockPingSchema.safeParse(payload);
      if (!parsed.success) return;
      client.send(MSG.CLOCK_PONG, { t0: parsed.data.t0, t1: Date.now() });
    });
  }
  /**
   * Rejects payloads that are too large before any parsing work happens.
   *
   * Colyseus has already decoded the message by this point, so this is a guard
   * against a client wasting the rules engine's time, not a transport-level
   * defence - the transport's own frame limit handles that.
   */
  checkPayload(client, payload) {
    let size = 0;
    try {
      size = JSON.stringify(payload ?? null).length;
    } catch {
      this.sendError(client, "INVALID_PAYLOAD");
      return false;
    }
    if (size > MAX_MESSAGE_BYTES) {
      this.sendError(client, "INVALID_PAYLOAD");
      this.logger.warn(EVENT.ACTION_REJECTED, { playerId: client.sessionId, size });
      return false;
    }
    return true;
  }
  handleSessionAction(client, action) {
    const data = client.userData;
    const isHostScreen = data?.role === "host";
    const player = this.state.players.get(client.sessionId);
    const isHostPlayer = Boolean(player && player.isHost);
    const canControlSession = isHostScreen || isHostPlayer;
    switch (action.type) {
      case "set-profile": {
        if (!player) return this.sendError(client, "NOT_ALLOWED");
        if (this.state.status === "CLOSED") return this.sendError(client, "ROOM_CLOSED");
        const firstJoin = !player.joined;
        player.name = action.name;
        player.avatar = action.avatar;
        player.color = action.color;
        player.joined = true;
        if (firstJoin) {
          if (this.state.hostPlayerId === "") {
            this.state.hostPlayerId = player.id;
            player.isHost = true;
          }
          this.notifyGameOfPlayer(player.id, "joined");
          this.emitPlatformEvent({
            kind: "player-joined",
            messageKey: "event.playerJoined",
            params: { name: player.name },
            playerId: player.id
          });
          this.logger.info(EVENT.PLAYER_JOINED, { playerId: player.id });
          this.reconcileBots();
        }
        void this.publishMetadata();
        return;
      }
      case "set-ready": {
        if (!player?.joined) return this.sendError(client, "NOT_ALLOWED");
        player.ready = action.ready;
        return;
      }
      case "leave": {
        this.removePlayer(client.sessionId, "left");
        client.leave(1e3);
        return;
      }
      case "start-game": {
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        if (this.state.status !== "LOBBY") return this.sendError(client, "WRONG_STATE");
        this.startGame();
        return;
      }
      case "rematch": {
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        if (this.state.status !== "GAME_OVER") return this.sendError(client, "WRONG_STATE");
        this.startGame();
        return;
      }
      case "return-to-lobby": {
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        if (this.state.status !== "GAME_OVER") return this.sendError(client, "WRONG_STATE");
        this.returnToLobby();
        return;
      }
      case "update-settings": {
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        if (this.state.status !== "LOBBY") return this.sendError(client, "WRONG_STATE");
        this.applySettings(action.settings);
        return;
      }
      case "kick-player": {
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        if (action.playerId === client.sessionId) return this.sendError(client, "NOT_ALLOWED");
        const target = this.clients.find((c) => c.sessionId === action.playerId);
        this.removePlayer(action.playerId, "kicked");
        target?.leave(4001);
        return;
      }
      case "dev-command": {
        if (!runtimeHost().devToolsEnabled) return this.sendError(client, "NOT_ALLOWED");
        if (!canControlSession) return this.sendError(client, "NOT_ALLOWED");
        this.runDevCommand(action.command, action.value);
        return;
      }
    }
  }
  applySettings(patch) {
    const { settings } = this.state;
    if (patch.maxPlayers !== void 0) {
      const humans = [...this.state.players.values()].filter((p) => !p.isBot && p.joined).length;
      settings.maxPlayers = Math.max(
        humans,
        Math.min(patch.maxPlayers, this.adapter.game.maxPlayers, runtimeHost().maxPlayers)
      );
    }
    if (patch.botDifficulty !== void 0) {
      settings.botDifficulty = patch.botDifficulty;
      this.botStrategies.clear();
    }
    if (patch.botCount !== void 0) {
      settings.botCount = Math.max(0, Math.min(patch.botCount, ABSOLUTE_MAX_PLAYERS));
    }
    if (patch.gameOptions !== void 0) {
      this.gameOptions = this.adapter.game.parseOptions(patch.gameOptions);
    }
    this.reconcileBots();
  }
  // ---------------------------------------------------------------- lifecycle
  startGame() {
    this.reconcileBots();
    const joined = this.gamePlayers();
    if (joined.length < this.adapter.game.minPlayers) {
      this.emitPlatformEvent({
        kind: "start-refused",
        messageKey: "host.needMorePlayers",
        params: { count: this.adapter.game.minPlayers }
      });
      return;
    }
    this.gameState = this.adapter.game.createState(this.gameOptions);
    this.botPending.clear();
    for (const player of this.state.players.values()) {
      player.ready = false;
    }
    this.setStatus("STARTING");
    const ctx = this.buildContext(Date.now());
    this.adapter.game.start(ctx);
    this.finishTick(ctx);
    this.logger.info(EVENT.GAME_STARTED, { players: joined.length });
  }
  returnToLobby() {
    this.gameState = this.adapter.game.createState(this.gameOptions);
    this.botPending.clear();
    for (const player of this.state.players.values()) {
      player.ready = false;
      player.score = 0;
    }
    this.setStatus("LOBBY");
    this.projectGameState(Date.now());
  }
  setStatus(status) {
    if (this.state.status === status) return;
    this.state.status = status;
    this.logger.info(EVENT.STATUS_CHANGED, { status });
    void this.publishMetadata();
  }
  /**
   * Applies a status the game asked for, filtered by what the platform allows.
   *
   * The game may move between playing states, but it may not put the session
   * back into the lobby or close it - those are platform decisions.
   */
  applyRequestedStatus() {
    const requested = this.requestedStatus;
    this.requestedStatus = null;
    if (!requested) return;
    if (requested === "PLAYING" || requested === "ROUND_END") {
      if (RUNNING_STATUSES.has(this.state.status)) this.setStatus(requested);
      return;
    }
    if (requested === "GAME_OVER") {
      this.setStatus("GAME_OVER");
      this.botPending.clear();
      this.logger.info(EVENT.GAME_ENDED);
    }
  }
  // -------------------------------------------------------------- game bridge
  buildContext(now) {
    return {
      state: this.gameState,
      options: this.gameOptions,
      players: this.registry,
      rng: this.rng,
      now,
      emit: (event2) => {
        this.eventQueue.push({ ...event2, at: now });
      },
      requestStatus: (status) => {
        this.requestedStatus = status;
      }
    };
  }
  /** Runs one validated action through the rules and settles the resulting tick. */
  applyGameAction(playerId, action, now) {
    const ctx = this.buildContext(now);
    let handled = false;
    try {
      handled = this.adapter.game.handleAction(ctx, playerId, action);
    } catch (error2) {
      this.logger.error(EVENT.GAME_ERROR, {
        playerId,
        message: error2 instanceof Error ? error2.message : String(error2)
      });
      handled = false;
    }
    this.finishTick(ctx);
    if (handled) this.logger.debug(EVENT.PLAYER_ACTION, { playerId });
    return handled;
  }
  notifyGameOfPlayer(playerId, change) {
    const hook = this.adapter.game.onPlayerChanged;
    if (!hook) return;
    const ctx = this.buildContext(Date.now());
    try {
      hook.call(this.adapter.game, ctx, playerId, change);
    } catch (error2) {
      this.logger.error(EVENT.GAME_ERROR, {
        playerId,
        message: error2 instanceof Error ? error2.message : String(error2)
      });
    }
    this.finishTick(ctx);
  }
  /** Broadcasts queued events, applies status requests and republishes state. */
  finishTick(ctx) {
    this.applyRequestedStatus();
    this.flushEvents();
    this.projectGameState(ctx.now);
  }
  projectGameState(now) {
    const ctx = this.buildContext(now);
    try {
      this.adapter.project(this.state, this.adapter.game.getPublicState(ctx));
      this.state.gameRevision += 1;
    } catch (error2) {
      this.logger.error(EVENT.GAME_ERROR, {
        message: error2 instanceof Error ? error2.message : String(error2)
      });
    }
  }
  flushEvents() {
    if (this.eventQueue.length === 0) return;
    const events = this.eventQueue;
    this.eventQueue = [];
    for (const event2 of events) {
      this.broadcast(MSG.GAME_EVENT, event2);
    }
  }
  emitPlatformEvent(event2) {
    this.broadcast(MSG.GAME_EVENT, { ...event2, at: Date.now() });
  }
  // ------------------------------------------------------------ controller io
  controllerMode(player) {
    if (!player?.joined) return "setup";
    switch (this.state.status) {
      case "LOBBY":
        return "lobby";
      case "STARTING":
        return "starting";
      case "PLAYING":
        return "game";
      case "ROUND_END":
        return "round-end";
      case "GAME_OVER":
        return "game-over";
      default:
        return "setup";
    }
  }
  buildEnvelope(playerId) {
    const player = this.state.players.get(playerId);
    const mode = this.controllerMode(player);
    let gamePart = { active: false, game: null };
    if (player?.joined) {
      const ctx = this.buildContext(Date.now());
      try {
        gamePart = this.adapter.game.getControllerState(ctx, playerId);
      } catch (error2) {
        this.logger.error(EVENT.GAME_ERROR, {
          playerId,
          message: error2 instanceof Error ? error2.message : String(error2)
        });
      }
    }
    return {
      mode,
      gameId: this.state.gameId,
      active: gamePart.active,
      score: player?.score ?? 0,
      game: gamePart.game,
      revision: this.controllerRevision
    };
  }
  /** Sends a controller its projection, skipping sends that would change nothing. */
  pushControllerState(client, force = false) {
    const data = client.userData;
    if (data?.role !== "controller") return;
    const envelope = this.buildEnvelope(client.sessionId);
    const { revision: _revision, ...comparable } = envelope;
    const json = JSON.stringify(comparable);
    if (!force && this.lastControllerJson.get(client.sessionId) === json) return;
    this.lastControllerJson.set(client.sessionId, json);
    this.controllerRevision += 1;
    client.send(MSG.CONTROLLER_STATE, { ...envelope, revision: this.controllerRevision });
  }
  pushAllControllerStates() {
    for (const client of this.clients) {
      this.pushControllerState(client);
    }
  }
  sendWelcome(client) {
    const data = client.userData;
    const payload = {
      playerId: client.sessionId,
      role: data?.role ?? "controller",
      roomId: this.roomId,
      roomCode: this.state.publicCode,
      // The client rebuilds the full token from its own room object; this is
      // sent so a client that lost its copy can still recover it.
      reconnectionToken: `${this.roomId}:${client.reconnectionToken}`,
      gameId: this.state.gameId,
      serverTime: Date.now()
    };
    client.send(MSG.WELCOME, payload);
  }
  sendError(client, code) {
    client.send(MSG.ERROR, { code, messageKey: `error.${code}` });
  }
  // --------------------------------------------------------------------- tick
  tick(deltaMs) {
    const now = Date.now();
    if (RUNNING_STATUSES.has(this.state.status)) {
      const ctx = this.buildContext(now);
      try {
        this.adapter.game.update(ctx, deltaMs);
        this.tickBots(ctx, now);
      } catch (error2) {
        this.logger.error(EVENT.GAME_ERROR, {
          message: error2 instanceof Error ? error2.message : String(error2)
        });
      }
      this.finishTick(ctx);
    }
    this.pushAllControllerStates();
    if (now - this.lastBeaconAt >= CLOCK_BEACON_MS) {
      this.lastBeaconAt = now;
      this.state.serverTime = now;
    }
    this.checkExpiry(now);
  }
  /**
   * Reclaims sessions nobody is using.
   *
   * Two independent limits: an idle timeout that starts when the last client
   * leaves, and an absolute age cap so a forgotten room on a TV in an empty
   * office cannot live forever.
   */
  checkExpiry(now) {
    if (this.clients.length > 0) {
      this.lastConnectedAt = now;
      return;
    }
    const idleFor = now - this.lastConnectedAt;
    const age = now - this.createdAt;
    const limits = runtimeHost();
    if (idleFor < limits.sessionTimeoutMs && age < limits.sessionMaxAgeMs) return;
    this.logger.info(EVENT.SESSION_EXPIRED, { idleFor, age });
    this.state.status = "CLOSED";
    void this.disconnect(4002);
  }
  // ----------------------------------------------------------------- metadata
  async publishMetadata() {
    try {
      await this.setMetadata({
        publicCode: this.state.publicCode,
        gameId: this.state.gameId,
        status: this.state.status,
        playerCount: [...this.state.players.values()].filter((p) => p.joined && !p.isBot).length,
        maxPlayers: this.state.settings.maxPlayers
      });
    } catch (error2) {
      this.logger.warn("METADATA_FAILED", {
        message: error2 instanceof Error ? error2.message : String(error2)
      });
    }
  }
  // --------------------------------------------------------------- dev tools
  /**
   * Developer-mode shortcuts.
   *
   * Reachable only when `ENABLE_DEV_TOOLS` is on *and* the build is not
   * production, checked again at the call site. Platform commands are handled
   * here; anything else is delegated to the game plugin.
   */
  runDevCommand(command, value) {
    switch (command) {
      case "add-bot": {
        this.state.settings.botCount = Math.min(
          this.state.settings.botCount + 1,
          ABSOLUTE_MAX_PLAYERS
        );
        this.reconcileBots();
        return;
      }
      case "remove-bot": {
        this.state.settings.botCount = Math.max(0, this.state.settings.botCount - 1);
        this.reconcileBots();
        return;
      }
      case "end-session": {
        this.state.status = "CLOSED";
        void this.disconnect(4002);
        return;
      }
      default: {
        const handler = this.adapter.game.devCommands?.[command];
        if (!handler) return;
        const ctx = this.buildContext(Date.now());
        handler(ctx, value);
        this.finishTick(ctx);
      }
    }
  }
};

// public/vendor/dungeonz.js
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var require_fs = __commonJS({
  "platform:fs"(exports, module) {
    module.exports = { existsSync: () => true, writeFileSync: () => {
    } };
  }
});
var require_settings = __commonJS({
  "platform:settings"(exports, module) {
    module.exports = { IGNORE_WARNINGS: false };
  }
});
var require_Utils = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/Utils.js"(exports, module) {
    var fs = require_fs();
    var settings = require_settings();
    var Utils = class {
      /**
       * @class Creates a counter that will track it's own
       * count and allow the next count to be retrieved.
       * Useful for creating unique IDs.
       */
      Counter = class Counter {
        constructor() {
          this._count = 0;
        }
        getNext() {
          this._count += 1;
          return this._count;
        }
      };
      /**
       * Gets a random number between, and including, min and max.
       * @param {Number} min
       * @param {Number} max
       * @returns {*}
       */
      getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      /**
       * Gets a random element from the given array.
       * @param {Array} array
       * @returns {*}
       */
      getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
      }
      /**
       * Creates an array of all permutations of a given array's elements.
       * @param {Array.<*>} array
       * @returns {Array.<Array.<*>>} An array of arrays.
       */
      getPermutations(array) {
        let result = [];
        const permute = (arr, m = []) => {
          if (arr.length === 0) {
            result.push(m);
          } else {
            for (let i = 0; i < arr.length; i += 1) {
              let curr = arr.slice();
              let next = curr.splice(i, 1);
              permute(curr.slice(), m.concat(next));
            }
          }
        };
        permute(array);
        return result;
      }
      /**
       * @param {Array} array
       * @param {String} nameKey - The name of each property key on the result object.
       * @param {String} valueKey - The name of the property to use as each propety value.
       * @returns {Object} The array as an object.
       */
      arrayToObject(array, nameKey, valueKey) {
        if (Array.isArray(array) === false) return {};
        return array.reduce((obj, item) => {
          obj[item[nameKey]] = item[valueKey];
          return obj;
        }, {});
      }
      /**
       * Push an item into an array multiple times.
       * @param {Array} array - The array to push into.
       * @param {*} item - The item to add.
       * @param {Number} number - How many times the item should be added.
       */
      arrayMultiPush = (array, item, amount) => {
        for (let i = 0; i < amount; i += 1) {
          array.push(item);
        }
      };
      /**
       * Checks the location to write to exists. If not, creates it.
       * @param {String} directory The directory to check for.
       */
      checkDirectoryExists(directory) {
        if (fs.existsSync(directory) === false) {
          fs.mkdirSync(directory);
        }
      }
      /**
       * Checks the client catalogues directory exists. If not, creates it.
       */
      checkClientCataloguesExists() {
        this.checkDirectoryExists("../client/src/catalogues");
      }
      /**
       * Prints a system message in the project format.
       * Wrapper for console.log.
       * @param {*} message
       */
      message(...args) {
        args.unshift("*");
        console.log.apply(console, args);
      }
      /**
       * Prints a warning message.
       * @param {*} message
       */
      warning(...args) {
        if (!settings.IGNORE_WARNINGS) {
          args.unshift("* WARNING:");
          console.log.apply(console, args);
        }
      }
      /**
       * Stops the process and prints an error message.
       * @param {*} message
       */
      error(...args) {
        args.unshift("* ERROR:");
        console.error.apply(console, args);
        console.trace();
        process.exit();
      }
    };
    module.exports = new Utils();
  }
});
var require_Damage = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Damage.js"(exports, module) {
    var Damage = class {
      /**
       * A model of damage to be dealt.
       * @param {Object} config
       * @param {Number} config.amount How much damage to deal.
       * @param {Array.<Number>} [config.types=[Damage.Types.Physical]] The types of damage to deal. A list of Damage.Types.
       * @param {Number} [config.armourPiercing=0] How much armour this damage will ignore. 0 to 1.
       */
      constructor(config) {
        if (config.amount) this.amount = config.amount;
        if (config.types) this.types = config.types;
        if (config.armourPiercing) this.armourPiercing = config.armourPiercing;
      }
      /**
       * Checks if any of the types of this damage are not on a given entitys damage type immunity list.
       * @param {Entity} entity
       */
      canAffectTarget(entity) {
        if (entity.damageTypeImmunities) {
          for (const type3 of this.types) {
            if (entity.damageTypeImmunities.includes(type3)) {
              continue;
            }
            return true;
          }
        } else {
          return true;
        }
        return false;
      }
    };
    module.exports = Damage;
    Damage.Types = {
      /**
       * @type {Number} Solid objects, such as swords, arrows, melee attacks and spike traps.
       */
      Physical: 1,
      /**
       * @type {Number} Magic related things, like fire balls, wind blasts and curses.
       */
      Magical: 2,
      /**
       * @type {Number} Organic related things, such as disease, poison, and possibly
       * environmental effects like heat and cold.
       */
      Biological: 3
    };
    Damage.prototype.amount = 0;
    Damage.prototype.types = [
      Damage.Types.Physical
    ];
    Damage.prototype.armourPiercing = 0;
  }
});
var require_Heal = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Heal.js"(exports, module) {
    var Heal = class {
      /**
       * A model of healing to be done.
       * @param {Object} config
       * @param {Number} config.amount How much hitpoints to restore.
       */
      constructor(amount) {
        this.amount = amount || 0;
      }
      /**
       * Override for same function in Damage. This will heal anything that can be healed.
       */
      canAffectTarget() {
        return true;
      }
    };
    module.exports = Heal;
    Heal.prototype.amount = 0;
  }
});
var require_DayPhases = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/DayPhases.js"(exports, module) {
    module.exports = {
      Dawn: 1,
      Day: 2,
      Dusk: 3,
      Night: 4
    };
  }
});
var require_Directions = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/gameplay/Directions.js"(exports, module) {
    var Utils = require_Utils();
    var UP = "u";
    var DOWN = "d";
    var LEFT = "l";
    var RIGHT = "r";
    module.exports.Directions = {
      UP,
      DOWN,
      LEFT,
      RIGHT
    };
    module.exports.DirectionsValues = [
      UP,
      DOWN,
      LEFT,
      RIGHT
    ];
    module.exports.OppositeDirections = {
      u: DOWN,
      d: UP,
      l: RIGHT,
      r: LEFT
    };
    module.exports.SideDirections = {
      u: [LEFT, RIGHT],
      d: [RIGHT, LEFT],
      l: [DOWN, UP],
      r: [UP, DOWN]
    };
    module.exports.RowColOffsetsByDirection = {
      u: { row: -1, col: 0 },
      d: { row: 1, col: 0 },
      l: { row: 0, col: -1 },
      r: { row: 0, col: 1 }
    };
    module.exports.rowColOffsetToDirection = (rowOffset, colOffset) => {
      if (rowOffset < 0) return UP;
      if (rowOffset > 0) return DOWN;
      if (colOffset < 0) return LEFT;
      if (colOffset > 0) return RIGHT;
      if (rowOffset === 0 && colOffset === 0) return UP;
      Utils.error(`A valid offset wasn't given to rowColOffsetToDirection, row: ${rowOffset}, col: ${colOffset}`);
      return void 0;
    };
    module.exports.getRowColsToSides = (direction, row, col) => {
      if (direction === UP || direction === DOWN) {
        return [
          { row, col: col - 1 },
          { row, col: col + 1 }
        ];
      }
      return [
        { row: row - 1, col },
        { row: row + 1, col }
      ];
    };
    module.exports.DirectionsPermutations = Utils.getPermutations(
      Object.values(module.exports.Directions)
    );
    module.exports.DirectionsPermutationsAsRowColOffsets = module.exports.DirectionsPermutations.map((directions) => directions.map((direction) => module.exports.RowColOffsetsByDirection[direction]));
  }
});
var require_events = __commonJS({
  "platform:events"(exports, module) {
    module.exports = { active_state: "active", inactive_state: "inactive", damage: "damage", heal: "heal" };
  }
});
var require_Entity = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/Entity.js"(exports, module) {
    var Utils = require_Utils();
    var Damage = require_Damage();
    var Heal = require_Heal();
    var DayPhases = require_DayPhases();
    var { Directions } = require_Directions();
    var idCounter = new Utils.Counter();
    var typeNumberCounter = new Utils.Counter();
    var Entity = class {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       */
      constructor(config) {
        this.id = idCounter.getNext();
        this.row = config.row;
        this.col = config.col;
        this.board = config.board;
      }
      static registerEntityType() {
        this.prototype.typeNumber = typeNumberCounter.getNext();
      }
      /**
       * Remove this entity from the game world completely, and allow it to be GCed.
       * Any specific destruction functionality should be added to onDestroy, which is called from this method.
       */
      destroy() {
        if (this._destroyed === true) return;
        this._destroyed = true;
        this.onDestroy();
      }
      /**
       * Specific destruction functionality. If overridden, should still be chained from the overrider up to this.
       */
      onDestroy() {
        this.board = null;
      }
      /**
       * When another entity moves into the same tile as this entity.
       * @param {Entity} otherEntity - The entity that moved.
       */
      onMovedInto(otherEntity) {
      }
      /**
       * Change the hitpoints value of this entity, if it has the hitpoints property set (not null).
       * Calls onDamage or onHeal based on the amount, and also onModHitPoints.
       * @param {Damage|Heal} hitPointModifier - An object that details how much to increase or decrease the HP by.
       * @param {Entity} [source] - The entity that caused this change.
       */
      modHitPoints(hitPointModifier, source) {
        if (this._destroyed === true) return;
        if (this.hitPoints === null) return;
        const amount = Math.floor(hitPointModifier.amount);
        if (Number.isInteger(amount) === false) return;
        if (hitPointModifier instanceof Damage) {
          this.onDamage(hitPointModifier, source);
        } else if (hitPointModifier instanceof Heal) {
          this.onHeal(hitPointModifier);
        } else {
          Utils.warning("Hitpoint modifier passed into Entity.modHitPoints is not an instance of either Damage or Heal. hitPointModifier:", hitPointModifier);
        }
        this.onModHitPoints();
      }
      /**
       *
       * @param {Heal} heal
       * @param {Entity} source
       */
      heal(heal2, source) {
        if (heal2 instanceof Heal === false) {
          Utils.error("Entity.heal must be passed a Heal config object. Value of 'heal':", heal2);
        }
        if (heal2.amount === null) return;
        this.modHitPoints(heal2, source);
      }
      /**
       * Hitpoints are to be added to this entity.
       * If overridden, should still be chained from the overrider up to this.
       * @param {Heal} heal - A heal config object.
       */
      onHeal(heal2) {
        const amount = Math.floor(heal2.amount);
        const original = this.hitPoints;
        this.hitPoints += amount;
        if (this.hitPoints > this.maxHitPoints) {
          this.hitPoints = this.maxHitPoints;
        }
        const difference = this.hitPoints - original;
        this.board.emitToNearbyPlayers(
          this.row,
          this.col,
          this.EventsList.heal,
          { id: this.id, amount: difference }
        );
      }
      /**
       * Deal damage to this entity. Lowers the hitpoints. Used mainly by weapons and melee mobs when attacking.
       * @param {Damage} damage - A damage config object.
       * @param {Entity} [source] - The entity that caused this damage.
       */
      damage(damage, source) {
        if (damage instanceof Damage === false) {
          Utils.error("Entity.damage must be passed a Damage config object. Value of 'damage':", damage);
        }
        this.modHitPoints(damage, source);
      }
      /**
       * Hitpoints are to be subtracted from this entity.
       * If HP goes <0, then onAllHitPointsLost is called.
       * This method does NOT destroy directly.
       * If overridden, should still be chained from the overrider up to this.
       * @param {Damage} damage
       * @param {Entity} [source] - The entity that caused this damage.
       */
      onDamage(damage, source) {
        damage.amount = Math.floor(damage.amount);
        this.hitPoints -= damage.amount;
        if (this.hitPoints <= 0) {
          this.onAllHitPointsLost();
        } else {
          this.board.emitToNearbyPlayers(
            this.row,
            this.col,
            this.EventsList.damage,
            { id: this.id, amount: -damage.amount }
          );
        }
      }
      /**
       * This entity has been taken to or below 0 hitpoints.
       * If overridden, should still be chained from the overrider up to this.
       */
      onAllHitPointsLost() {
      }
      /**
       * This entity has had its hitpoints changed.
       * If overridden, should still be chained from the overrider up to this.
       */
      onModHitPoints() {
      }
      /**
       * Get all of the properties of this entity that can be emitted to clients.
       * This method should be overridden on each subclass (and any further subclasses), and
       * then called on the superclass of every subclass, calling it's way back up to Entity.
       * So if Player.getEmittableProperties is called, it adds the relevant properties from Player, then
       * adds from Character, and so on until Entity, then returns the result back down the stack.
       * @param {Object} properties - The properties of this entity that have been added so far. If this is the start of the chain, pass in an empty object.
       * @returns {{}}
       */
      getEmittableProperties(properties) {
        return properties;
      }
      /**
       * Returns the board tile this entity is currently occupying.
       * Shouldn't have to worry about the tile being valid, as they shouldn't be occupying an invalid tile.
       * @returns {BoardTile}
       */
      getBoardTile() {
        return this.board.grid[this.row][this.col];
      }
      /**
       * Returns a random direction.
       * @returns {String}
       */
      getRandomDirection() {
        const keys = Object.keys(Directions);
        return Directions[keys[keys.length * Math.random() << 0]];
      }
      /**
       * When finished constructing this entity, use this to tell the nearby players to add this entity.
       * @returns {Entity}
       */
      emitToNearbyPlayers() {
        this.board.emitToNearbyPlayers(
          this.row,
          this.col,
          this.EventsList.add_entity,
          this.getEmittableProperties({})
        );
        return this;
      }
      /**
       * Checks if another entity is cardinally adjacent to this one. Does NOT include if they are in the same position.
       * @param {Entity} entity
       * @returns {Boolean}
       */
      isAdjacentToEntity(entity) {
        if (entity.row === this.row - 1 && entity.col === this.col) return true;
        if (entity.row === this.row + 1 && entity.col === this.col) return true;
        if (entity.row === this.row && entity.col === this.col - 1) return true;
        if (entity.row === this.row && entity.col === this.col + 1) return true;
        return false;
      }
      /**
       * Checks if any entity of the given type is cardinally adjacent to this one. Does NOT include if they are in the same position.
       * Useful for checking if a player is next to a bank chest, crafting station, etc. when attempting to bank/craft.
       * @param {Number} typeNumber
       * @returns {Boolean}
       */
      isAdjacentToStaticType(typeNumber) {
        const { grid } = this.board;
        if (grid[this.row - 1][this.col].static !== null) {
          if (grid[this.row - 1][this.col].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row + 1][this.col].static !== null) {
          if (grid[this.row + 1][this.col].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row][this.col - 1].static !== null) {
          if (grid[this.row][this.col - 1].static.typeNumber === typeNumber) {
            return true;
          }
        }
        if (grid[this.row][this.col + 1].static !== null) {
          if (grid[this.row][this.col + 1].static.typeNumber === typeNumber) {
            return true;
          }
        }
        return false;
      }
      /**
       * Checks if another entity is diagonally adjacent to this one. Does NOT include if they are in the same position.
       * @param {Entity} entity
       * @returns {Boolean}
       */
      isDiagonalToEntity(entity) {
        if (entity.row === this.row - 1 && entity.col === this.col - 1) return true;
        if (entity.row === this.row - 1 && entity.col === this.col + 1) return true;
        if (entity.row === this.row + 1 && entity.col === this.col - 1) return true;
        if (entity.row === this.row + 1 && entity.col === this.col + 1) return true;
        return false;
      }
      /**
       * Checks whether this type of entity can be spawned on the given board tile.
       * Useful for checking special criteria, such as time of day for certain creatures.
       * @param {BoardTile} boardTile - The board tile to spawn the entity on.
       * @param {Number} dayPhase - The time of day that the world is currently on.
       * @returns {Boolean}
       */
      checkSpawnCriteria(boardTile, dayPhase) {
        if (!this.spawnableDayPhases[dayPhase]) return false;
        return true;
      }
    };
    module.exports = Entity;
    Entity.abstract = true;
    Entity.prototype.EventsList = require_events();
    Entity.prototype.typeNumber = null;
    Entity.prototype._destroyed = false;
    Entity.prototype.spawnRate = 6e4;
    Entity.prototype.spawnableDayPhases = {
      [DayPhases.Dawn]: true,
      [DayPhases.Day]: true,
      [DayPhases.Dusk]: true,
      [DayPhases.Night]: true
    };
    Entity.prototype.maxHitPoints = null;
    Entity.prototype.hitPoints = null;
    Entity.prototype.taskIdKilled = null;
    Entity.prototype.taskIdFrozen = null;
    Entity.prototype.taskIdBurned = null;
    Entity.prototype.taskIdInteracted = null;
    Entity.prototype.gatherTaskId = null;
    Entity.prototype.taskIdAnimated = null;
  }
});
var require_Static = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/Static.js"(exports, module) {
    var Entity = require_Entity();
    var Utils = require_Utils();
    var Static = class extends Entity {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       */
      constructor(config) {
        super(config);
        config.board.addStatic(this);
        if (this._highBlocked === true) {
          this._lowBlocked = true;
        }
        if (this._lowBlocked !== true && this._lowBlocked !== false) Utils.error("Low blocked is not boolean in Static.constructor:", this._lowBlocked);
        if (this._highBlocked !== true && this._highBlocked !== false) Utils.error("High blocked is not boolean in Static.constructor:", this._highBlocked);
        this.blocking = true;
      }
      onDestroy() {
        this.board.removeStatic(this);
        super.onDestroy();
      }
      /**
       * Whether this static currently low blocking the tile it is on.
       * @returns {Boolean}
       */
      isLowBlocked() {
        if (this.blocking === false) return false;
        return this._lowBlocked;
      }
      /**
       * Whether this static currently high blocking the tile it is on.
       * @returns {Boolean}
       */
      isHighBlocked() {
        if (this.blocking === false) return false;
        return this._highBlocked;
      }
    };
    Static.prototype._lowBlocked = true;
    Static.prototype._highBlocked = true;
    module.exports = Static;
  }
});
var require_Interactable = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/Interactable.js"(exports, module) {
    var Static = require_Static();
    var Interactable = class extends Static {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Number} [config.activeState=true] - Whether this entity is already active when created.
       */
      constructor(config) {
        super(config);
        this.activeState = true;
        if (config.activeState === false) this.activeState = false;
      }
      onDestroy() {
        clearTimeout(this.reactivationTimer);
        super.onDestroy();
      }
      getEmittableProperties(properties) {
        properties.row = this.row;
        properties.col = this.col;
        return properties;
      }
      /**
       * @param {Character} interactedBy
       * @param {Item} toolUsed
       */
      interaction(interactedBy, toolUsed) {
      }
      /**
       * Activate this interactable.
       */
      activate() {
        if (this.getBoardTile().containsAnyDestroyables() === false) {
          this.activeState = true;
          this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.active_state, `${this.row}-${this.col}`);
        } else {
          this.reactivationTimer = setTimeout(
            this.activate.bind(this),
            this.reactivationRate || 5e3
            // Use some time in case it is null.
          );
        }
      }
      /**
       * Deactivate this interactable.
       */
      deactivate() {
        this.activeState = false;
        if (this.reactivationRate !== null) {
          this.reactivationTimer = setTimeout(this.activate.bind(this), this.reactivationRate);
        }
        this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.inactive_state, `${this.row}-${this.col}`);
      }
    };
    module.exports = Interactable;
    Interactable.prototype.activeState = true;
    Interactable.prototype.warningEvent = null;
    Interactable.prototype.interactionEnergyCost = 0;
    Interactable.prototype.toolCategory = null;
    Interactable.prototype.isToolRequired = false;
    Interactable.prototype.reactivationRate = null;
    Interactable.prototype.reactivationTimer = null;
  }
});
var require_Breakable = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/Breakable.js"(exports, module) {
    var Interactable = require_Interactable();
    var Breakable = class extends Interactable {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Number} [config.activeState = true] - Whether this entity is already active when created.
       */
      constructor(config) {
        super(config);
      }
      isLowBlocked() {
        if (this.blocking === false) return false;
        if (this._lowBlocked === true) return true;
        return false;
      }
      isHighBlocked() {
        if (this.blocking === false) return false;
        if (this._highBlocked === true) return true;
        return false;
      }
      /**
       * Hitpoints are to be subtracted from this entity.
       * If HP goes <0, then onAllHitPointsLost is called.
       * Breakables are NEVER destroyed.
       * This is the end of the call chain for breakables. Don't go up to Entity.
       * @param {Number} amount - How much to decrease by.
       * @param {Entity} [source] - The entity that caused this damage.
       */
      /* onDamage (amount, source) {
                    console.log("breakable ondamage:", amount);

                    this.hitPoints += amount;

                    console.log("breakable hp:", this.hitPoints);

                    // Check if this entity is destroyed.
                    if(this.hitPoints <= 0){
                        this.onAllHitPointsLost();
                    }
                    // Entity is still alive. Tell nearby players.
                    else {
                        this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_damaged, {id: this.row + "-" + this.col, amount: amount});
                    }
                } */
      /**
       * All hitpoints have been lost. This breakable is now broken.
       */
      /* onAllHitPointsLost () {
                    console.log("breakable onallHPlost:");
                    // The breakable might be waiting to reactive when broken. Deal with the timeout that would fire.
                    clearTimeout(this.reactivationTimer);

                    // Tell nearby players this entity is now broken.
                    this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_broken, this.row + "-" + this.col);

                    this.activeState = false;

                    // If a repair rate is set, start a timer to reactivate this object.
                    if(this.repairRate !== null){
                        this.repairTimer = setTimeout(this.activate.bind(this), this.repairRate);
                    }

                }

                getEmittableProperties (properties) {
                    properties.brokenState = this.hitPoints <= 0;
                    return super.getEmittableProperties(properties);
                } */
      /**
       * @param {Character} interactedBy
       * @param {Item} toolUsed
       */
      interaction(interactedBy, toolUsed) {
      }
      /**
       * Make this breakable not broken any more.
       */
      /* repair () {
                    // Check there are no obstructions on the object before repairing it.
                    if(this.board.grid[this.row][this.col].containsAnyDestroyables() === false){
                        // Nothing in the way. Repair this object.
                        this.hitPoints = this.maxHitPoints;
                        this.activeState = true;

                        // Tell any nearby players that this object is now repaired.
                        this.board.emitToNearbyPlayers(this.row, this.col, this.EventsList.breakable_repaired, this.row + "-" + this.col);
                    }
                    // Something in the way.
                    else {
                        // Restart the timer to activate this object.
                        this.repairTimer = setTimeout(this.repair.bind(this), this.repairRate);
                    }
                } */
    };
    module.exports = Breakable;
  }
});
var require_WoodDoor = __commonJS({
  "experiments/dungeonz-world/upstream/server/src/entities/classes/statics/interactables/breakables/WoodDoor.js"(exports, module) {
    var Breakable = require_Breakable();
    var WoodDoor = class extends Breakable {
      /**
       * @param {Object} config
       * @param {Number} config.row
       * @param {Number} config.col
       * @param {Board} config.board
       * @param {Clan} config.clan
       */
      constructor(config) {
        super(config);
      }
      interaction(interactedBy) {
        if (this.activeState === false) return;
        if (interactedBy.energy < this.interactionEnergyCost) return;
        interactedBy.modEnergy(-this.interactionEnergyCost);
        this.deactivate();
        this.blocking = false;
      }
      activate() {
        super.activate();
        if (this.activeState === true) this.blocking = true;
      }
    };
    module.exports = WoodDoor;
    WoodDoor.prototype.interactionEnergyCost = 1;
    WoodDoor.prototype.reactivationRate = 5e3;
  }
});
var import_WoodDoor = __toESM(require_WoodDoor());
var import_Damage = __toESM(require_Damage());
var import_Entity = __toESM(require_Entity());
var export_Damage = import_Damage.default;
var export_Entity = import_Entity.default;
var export_WoodDoor = import_WoodDoor.default;

// public/environment.js
var OBJECTS = {};
var add = (id, name, family, x, y, aliases, extra = {}) => OBJECTS[id] = { name, family, position: [x, y], aliases, material: ["window", "bottle"].includes(family) ? "glass" : family === "hearth" ? "stone" : "wood", ...extra };
add("rug", "the tavern rug", "rug", 480, 378, ["rug", "carpet", "runner"], { material: "cloth", portable: true });
for (const [i, [x, y]] of [[245, 335], [715, 335], [245, 445], [715, 445]].entries()) {
  const direction = ["upper left", "upper right", "lower left", "lower right"][i];
  add(i ? "table" + (i + 1) : "table", `the ${direction} table`, "table", x, y, [`${direction} table`, `table ${i + 1}`, ...i === 0 ? ["table"] : []]);
}
for (const [i, [x, y]] of [[846, 165], [885, 180], [95, 170], [92, 403], [868, 401], [173, 182], [768, 185]].entries()) add(i ? "barrel" + (i + 1) : "barrel", `ale barrel ${i + 1}`, "barrel", x, y, [`barrel ${i + 1}`, ...i === 0 ? ["barrel", "keg", "cask"] : []]);
add("door", "the tavern door", "door", 480, 500, ["door", "gate"]);
add("chest", "the locked chest", "chest", 670, 145, ["chest", "treasure", "crown", "box"]);
add("chandelier", "the chandelier", "chandelier", 480, 260, ["chandelier", "hanging light"], { material: "metal", lit: true });
add("hearth", "the fireplace", "hearth", 92, 330, ["fireplace", "hearth", "fire"], { lit: true });
add("sign", "the tavern sign", "sign", 480, 88, ["sign"], { portable: true });
add("counter", "the bar counter", "counter", 480, 160, ["counter", "bar"]);
add("floor", "the floorboards", "floor", 480, 400, ["floor", "floorboards"], { material: "wood" });
add("wall", "the back wall", "wall", 600, 110, ["wall", "back wall"], { material: "stone" });
add("beam", "the oak beam", "beam", 307, 135, ["beam", "beams"], { material: "wood" });
add("bunting", "the hanging bunting", "bunting", 480, 112, ["bunting", "banner", "banners"], { material: "cloth", portable: true });
for (const [i, x] of [105, 851].entries()) add(i ? "window2" : "window", `the ${i ? "right" : "left"} window`, "window", x, 105, [`${i ? "right" : "left"} window`, `window ${i + 1}`, ...i === 0 ? ["window"] : []]);
for (const [i, x] of [194, 770].entries()) add(i ? "shelf2" : "shelf", `the ${i ? "right" : "left"} shelf`, "shelf", x, 90, [`${i ? "right" : "left"} shelf`, `shelf ${i + 1}`, ...i === 0 ? ["shelf", "shelves"] : []]);
for (const [i, x] of [171, 789].entries()) add(i ? "sideboard2" : "sideboard", `the ${i ? "right" : "left"} sideboard`, "sideboard", x, 195, [`${i ? "right" : "left"} sideboard`, ...i === 0 ? ["sideboard"] : []]);
for (const [i, x] of [160, 780].entries()) add(i ? "bottle2" : "bottle", `the ${i ? "right" : "left"} bottle`, "bottle", x, 174, [`${i ? "right" : "left"} bottle`, `bottle ${i + 1}`, ...i === 0 ? ["bottle", "mug"] : []], { portable: true });
for (const [i, x] of [220, 684].entries()) add(i ? "candle2" : "candle", `the ${i ? "right" : "left"} candle`, "candle", x, 315, [`${i ? "right" : "left"} candle`, `candle ${i + 1}`, ...i === 0 ? ["candle"] : []], { portable: true, lit: true });
for (const [i, [x, y]] of [[70, 99], [289, 99], [674, 99], [889, 99], [56, 343], [909, 343]].entries()) add("lamp" + i, `wall lantern ${i + 1}`, "lamp", x, y, [`lantern ${i + 1}`, ...i === 0 ? ["lamp", "lantern", "torch"] : []], { material: "metal", lit: true });
for (const [i, [x, y]] of [[194, 360], [296, 360], [664, 360], [766, 360], [194, 470], [296, 470], [664, 470], [766, 470]].entries()) add("chair" + i, `chair ${i + 1}`, "chair", x, y, [`chair ${i + 1}`, ...i === 0 ? ["chair", "stool", "barstool"] : []], { portable: true });
function environmentTarget(text) {
  const matches = Object.entries(OBJECTS).flatMap(([kind2, o]) => o.aliases.filter((a) => new RegExp("\\b" + a + "\\b", "i").test(text)).map((a) => ({ kind: kind2, name: o.name, length: a.length })));
  matches.sort((a, b) => b.length - a.length);
  if (!matches.length) return null;
  const { kind, name } = matches[0];
  return { kind, name };
}
function exactEnvironmentTarget(text) {
  const norm2 = (s) => String(s).trim().toLowerCase().replace(/^(?:a|an|the)\s+/, "");
  const reference = norm2(text), matches = Object.entries(OBJECTS).filter(([id, o]) => [id, o.name, ...o.aliases].some((name) => norm2(name) === reference));
  if (matches.length === 1) return { kind: matches[0][0], name: matches[0][1].name };
  const unpunctuated = reference.replace(/[.!?]+$/, "");
  return !matches.length && unpunctuated !== reference ? exactEnvironmentTarget(unpunctuated) : null;
}
function objectState(world, id) {
  const o = OBJECTS[id];
  if (!o) return null;
  const legacy = world?.props?.[id];
  return { condition: legacy === false ? "taken" : legacy === "broken" ? "broken" : "intact", lit: !!o.lit, open: false, offset: [0, 0], ...world?.objects?.[id] };
}
function environmentVerb(text, intent) {
  for (const [verb, pattern] of Object.entries({ extinguish: /\b(extinguish|douse|quench|put out|blow out)\b/i, repair: /\b(repair|fix|mend|restore)\b/i, ignite: /\b(ignite|light|burn|fire|flame|fireball|set.*on fire)\b/i, close: /\b(close|shut|lock)\b/i, open: /\b(unlock|pick.*lock|open)\b/i, push: /\b(push|shove|drag|move|pull|flip)\b/i, climb: /\b(sit|stand on|climb|jump on|dance on)\b/i, pour: /\b(pour|spill|empty|drink)\b/i, hide: /\b(hide|duck|crawl under)\b/i })) if (pattern.test(text) && !(verb === "push" && intent === "steal")) return verb;
  return { attack: "break", break: "break", steal: "take" }[intent] || intent;
}
function environmentCheck(world, target, intent, text) {
  const o = OBJECTS[target?.kind];
  if (!o) return null;
  if (intent === "flee") return null;
  if (target.kind === "chest" && intent === "steal") return { verb: "take", automatic: false, dc: 13, ability: "Sleight of hand", advantage: 0 };
  const state = objectState(world, target.kind), verb = environmentVerb(text, intent);
  const impossible = verb === "take" && !o.portable || state.condition === "taken" && verb !== "inspect" || state.condition === "broken" && !["inspect", "repair", "flee"].includes(verb) || verb === "ignite" && ["stone", "metal", "glass"].includes(o.material) && !o.lit;
  return { verb, automatic: impossible || ["inspect", "extinguish", "close", "pour", "hide"].includes(verb) || verb === "open" && o.family === "door", dc: verb === "take" ? o.portable ? 11 : 18 : verb === "open" ? 13 : { glass: 8, cloth: 9, wood: 11, metal: 16, stone: 18 }[o.material], ability: ["take", "open"].includes(verb) ? "Sleight of hand" : ["break", "push", "climb"].includes(verb) ? "Athletics" : verb === "repair" ? "Craft" : verb === "ignite" ? "Arcana" : "Interaction", advantage: state.condition === "burning" && verb === "break" ? 1 : 0 };
}
function interactEnvironment(world, target, intent, success, actor, context = {}) {
  const o = OBJECTS[target.kind];
  if (!o) return null;
  if (intent === "flee") return null;
  if (intent === "heal" && !/\b(drink|pour|spill|empty)\b/i.test(context.text || "")) return null;
  if (target.kind === "chest" && ["steal", "inspect"].includes(intent) && !context.text?.match(/\b(close|repair|extinguish|burn|light)\b/i)) return null;
  if (target.kind === "rug" && intent === "steal") return null;
  const id = target.kind, s = objectState(world, id), verb = environmentVerb(context.text || "", intent), who = typeof actor === "string" ? actor : actor.name;
  const out = { text: "", change: null, verb, success, chaos: 0, damage: 0, cover: false };
  const say = (t) => {
    out.text = `${who} ${t}`;
    return out;
  };
  const change = (key, value, label) => {
    s[key] = value;
    (world.objects ||= {})[id] = s;
    out.change = label;
  };
  const blocked = (t) => {
    out.success = false;
    out.blocked = true;
    return say(t);
  };
  if (verb === "inspect") {
    out.success = true;
    return say(`examines ${o.name}: ${s.condition}${s.lit ? ", lit" : ""}${s.open ? ", open" : ""}. ${o.portable ? "It can be carried." : "It is part of the tavern furniture."}`);
  }
  if (s.condition === "taken") return blocked(`reaches for ${o.name}, but it is already gone.`);
  if (s.condition === "broken" && verb !== "repair") return blocked(`finds ${o.name} already broken. The debris is still there.`);
  if (verb === "take") {
    if (!o.portable) return blocked(`cannot carry ${o.name} intact. Try moving or breaking it.`);
    if (!success) return say(`gets a grip on ${o.name}, but Marnie spots the attempt.`);
    change("condition", "taken", `${id.toUpperCase()} TAKEN`);
    if (typeof actor === "object") actor.inventory.push(o.name);
    out.chaos = 1;
    return say(`takes ${o.name}. Its place in the room is now empty.`);
  }
  if (verb === "open" || verb === "close") {
    if (!["door", "chest", "window", "barrel"].includes(o.family)) return blocked(`cannot ${verb} ${o.name}. Try another approach.`);
    if (!success) return say(`tries the lock on ${o.name}. It holds.`);
    if (o.family === "door" && verb === "open") {
      const door = Object.create(export_WoodDoor.prototype);
      Object.assign(door, { activeState: true, blocking: true, row: 0, col: 0, reactivationRate: null, board: { emitToNearbyPlayers() {
      } } });
      door.interaction({ energy: 1, modEnergy() {
      } });
      s.open = !door.blocking;
    } else s.open = verb === "open";
    change("open", s.open, `${id.toUpperCase()} ${s.open ? "OPEN" : "CLOSED"}`);
    return say(`${s.open ? "opens" : "closes"} ${o.name}.`);
  }
  if (verb === "extinguish") {
    if (!s.lit && s.condition !== "burning") return blocked(`finds no flame on ${o.name}.`);
    s.lit = false;
    if (s.condition === "burning") s.condition = "intact";
    change("lit", false, `${id.toUpperCase()} EXTINGUISHED`);
    out.success = true;
    out.chaos = -1;
    return say(`puts out ${o.name}. The flame and its light disappear.`);
  }
  if (verb === "ignite") {
    if (["stone", "metal", "glass"].includes(o.material) && !o.lit) return blocked(`cannot set ${o.material} on fire.`);
    if (!success) return say(`tries to light ${o.name}. The spark fizzles.`);
    if (o.lit) change("lit", true, `${id.toUpperCase()} LIT`);
    else {
      change("condition", "burning", `${id.toUpperCase()} BURNING`);
      out.chaos = 2;
    }
    return say(`${o.lit ? "lights" : "sets fire to"} ${o.name}.`);
  }
  if (verb === "break") {
    if (!success) {
      out.damage = 1;
      return say(`strikes ${o.name}. It shudders but holds together.`);
    }
    const entity = { hitPoints: 3, board: { emitToNearbyPlayers() {
    } }, onAllHitPointsLost() {
      this.broken = true;
    } };
    export_Entity.prototype.onDamage.call(entity, new export_Damage({ amount: 3 }));
    if (entity.broken) {
      change("condition", "broken", `${id.toUpperCase()} BROKEN`);
      s.lit = false;
      (world.props ||= {})[id] = "broken";
    }
    if (o.family === "barrel") s.spilled = true;
    out.chaos = 2;
    return say(`breaks ${o.name}. ${o.family === "barrel" ? "Ale spills across the floor." : o.material === "glass" ? "Glass scatters into a visible hazard." : "Debris remains where it stood."}`);
  }
  if (verb === "push") {
    if (["hearth", "counter", "shelf", "window", "lamp", "floor", "wall", "beam"].includes(o.family)) return blocked(`finds ${o.name} fixed to the building. It will not slide.`);
    if (!success) return say(`pushes ${o.name}, but cannot shift it.`);
    change("offset", [Math.min(54, s.offset[0] + 27), 0], `${id.toUpperCase()} MOVED`);
    out.chaos = 1;
    return say(`shoves ${o.name} aside. The space it occupied is clear.`);
  }
  if (verb === "repair") {
    if (!success) return say(`tries to repair ${o.name}. It needs another attempt.`);
    change("condition", "intact", `${id.toUpperCase()} REPAIRED`);
    if (world.props) delete world.props[id];
    s.spilled = false;
    s.offset = [0, 0];
    return say(`repairs ${o.name}. It can be used again.`);
  }
  if (verb === "pour") {
    if (!["bottle", "barrel"].includes(o.family)) return blocked(`finds nothing to pour from ${o.name}.`);
    if (s.spilled) return blocked(`finds ${o.name} already empty.`);
    change("spilled", true, `${id.toUpperCase()} SPILLED`);
    out.success = true;
    out.chaos = 1;
    return say(`empties ${o.name}. Ale pools on the floor; footing nearby is slippery.`);
  }
  if (verb === "hide" || verb === "climb") {
    if (!["table", "chair", "barrel", "counter", "sideboard"].includes(o.family)) return blocked(`cannot find a safe foothold or cover on ${o.name}.`);
    out.cover = verb === "hide";
    out.success = out.cover || success;
    if (out.cover) out.chaos = -1;
    return say(`${out.cover ? "takes cover behind" : success ? "climbs onto" : "fails to climb onto"} ${o.name}. ${out.cover ? "The next guard sweep will miss them." : ""}`);
  }
  return blocked(`cannot do that with ${o.name} yet. Try inspect, move, take, break, light, extinguish, open, or repair.`);
}
function advanceEnvironment(world) {
  const changes = [];
  for (const [id, state] of Object.entries(world.objects || {})) if (state.condition === "burning") {
    state.heat = (state.heat || 0) + 1;
    if (state.heat >= 3) {
      state.condition = "broken";
      state.lit = false;
      (world.props ||= {})[id] = "broken";
      changes.push(`${OBJECTS[id]?.name || id} BURNED THROUGH`);
    }
  }
  return changes;
}

// public/tavern-motion.js
var seats = [
  [430, 285],
  [550, 285],
  [190, 225],
  [310, 225],
  [430, 225],
  [550, 225],
  [670, 225],
  [790, 225],
  [190, 285],
  [310, 285],
  [670, 285],
  [790, 285],
  [190, 345],
  [310, 345],
  [430, 345],
  [550, 345],
  [670, 345],
  [790, 345],
  [190, 405],
  [310, 405],
  [430, 405],
  [550, 405],
  [670, 405],
  [790, 405]
];

// public/scene-events.js
var recipes = { attack: ["melee", "hit"], use: ["impact", "hit"], break: ["impact", "slash"], harvest: ["impact", "slash"], ignite: ["fire", "fire"], extinguish: ["smoke", "fire"], treat: ["hearts", "heal"], rest: ["hearts", "heal"], drink: ["hearts", "heal"], pacify: ["hearts", "success"], repair: ["spell", "magic"], craft: ["spell", "magic"], attach: ["spell", "magic"], steal: ["steal", "coin"], take: ["steal", "coin"], give: ["steal", "coin"], equip: ["spell", "success"], unequip: ["smoke", "success"], separate: ["smoke", "slash"], open: ["inspect", "success"], close: ["inspect", "success"], unlock: ["spell", "success"], talk: ["inspect", "success"] };
var ownPosition = (room, id) => seats[Math.max(0, room.players.findIndex((p) => p.id === id)) % seats.length];
function worldEntityPosition(room, entity) {
  return entity?.ownerId ? room.world.expedition.creatures?.[entity.ownerId]?.position || ownPosition(room, entity.ownerId) : entity?.position || ownPosition(room, entity?.id);
}
function createWorldScene(room, actor, plan, outcome, target) {
  const state = room.world.expedition, events = [], effects = [];
  if (plan.previousOwnerId && state.creatures[plan.previousOwnerId]?.hp > 0 && !outcome.blocked) events.push({ type: "witness", entityId: plan.previousOwnerId, at: 0 });
  if (outcome.blocked) return { events, effects };
  const id = plan.targetId || plan.recipientId || plan.itemId || plan.sourceIds?.[0];
  const entity = state.creatures?.[id] || state.items[id] || room.players.find((p) => p.id === id);
  const self = ["craft", "attach", "equip", "unequip", "rest", "drink", "separate"].includes(plan.verb);
  const position = [...self || !outcome.success ? ownPosition(room, actor.id) : plan.previousOwnerId ? worldEntityPosition(room, state.creatures[plan.previousOwnerId]) : entity ? worldEntityPosition(room, entity) : target?.position || ownPosition(room, actor.id)];
  const [verb, clip] = outcome.success ? recipes[plan.verb] || ["inspect", "success"] : ["smoke", null];
  const effect = { verb, actorId: actor.id, target: self ? "self" : "world", entityId: self ? actor.id : entity?.id || null, position, at: 0 };
  effects.push(effect);
  events.push({ type: "animation", ...effect });
  if (clip) events.push({ type: "sound", clip, at: 200 });
  if (outcome.success && ["attack", "use", "break", "harvest"].includes(plan.verb) && entity) events.push({ type: "reaction", entityId: entity.id, position, at: 150, duration: 500 });
  if (outcome.success && plan.verb === "talk") events.push({ type: "speech", entityId: entity?.id || null, text: outcome.text.slice(0, 480), at: 300 });
  if (outcome.change) events.push({ type: "consequence", text: outcome.change.slice(0, 300), at: 0 });
  return { events, effects };
}

// public/dm-memory.js
var clean = (value, max) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
function recordDMMemory(room) {
  const q = room.result;
  if (!q) return;
  const memory = room.dmMemory ||= { version: 1, entries: [], people: {} };
  if (memory.entries.some((e) => e.id === q.id)) return;
  const location = room.world.expedition?.current || "tavern";
  const entry = {
    id: q.id,
    round: room.round,
    location,
    actorId: q.playerId,
    actor: clean(q.name, 18),
    attempt: clean(q.action, 180),
    targetId: q.target?.entityId || q.target?.id || q.target?.kind || "room",
    outcome: q.blocked ? "blocked" : q.success ? "success" : "failure",
    fact: clean(q.narration, 600),
    changes: q.changes.slice(0, 6).map((s) => clean(s, 100))
  };
  const witnesses = [...new Set((q.sceneEvents || []).filter((e) => e.type === "witness").map((e) => e.entityId))];
  if (witnesses.length) entry.witnessIds = witnesses;
  memory.entries.push(entry);
  memory.entries = memory.entries.slice(-120);
  for (const id of /* @__PURE__ */ new Set([entry.targetId, ...witnesses])) {
    const creature = room.world.expedition?.creatures?.[id];
    const name = { bartender: "Marnie", guard: "Captain Brick", goblin: "the goblin fiddler" }[id] || creature?.name;
    if (name) {
      const previous = memory.people[id] || { id, name: clean(name, 50), encounters: [] };
      previous.location = location;
      previous.round = room.round;
      previous.encounters.push(entry);
      previous.encounters = previous.encounters.slice(-4);
      memory.people[id] = previous;
      const keep = Object.values(memory.people).sort((a, b) => b.round - a.round).slice(0, 64);
      memory.people = Object.fromEntries(keep.map((p) => [p.id, p]));
    }
  }
}
function redactDMMemory(room, id) {
  if (!room.dmMemory) return;
  room.dmMemory.entries = room.dmMemory.entries.filter((e) => e.id !== id);
  for (const p of Object.values(room.dmMemory.people)) p.encounters = p.encounters.filter((e) => e.id !== id);
}

// public/entity-rules.js
var MATERIAL_RULES = {
  cloth: { color: "#bd88cf", hardness: 7, burns: true },
  wood: { color: "#b88955", hardness: 10, burns: true },
  glass: { color: "#7dc7cf", hardness: 8, sharp: true },
  stone: { color: "#a3adbb", hardness: 14 },
  metal: { color: "#dfc16e", hardness: 16 },
  fiber: { color: "#c7b69a", hardness: 6, burns: true },
  bone: { color: "#dfd5b5", hardness: 9 },
  flesh: { color: "#bd8b78", hardness: 8 }
};
var normalized = (text) => String(text).trim().toLowerCase().replace(/^(?:a|an|the)\s+/, "");
function available(s, r, item) {
  if (item.parentId || item.condition === "disassembled") return false;
  const seen = /* @__PURE__ */ new Set([item.id]);
  let child = item;
  while (child.containerId) {
    const parent = s.items[child.containerId];
    if (!parent || seen.has(parent.id) || parent.type !== "container" && !(parent.type === "fixture" && Array.isArray(parent.contents)) || parent.parentId || parent.condition === "disassembled") return false;
    seen.add(parent.id);
    if (!parent.open && parent.condition !== "broken") return false;
    child = parent;
  }
  return item.location === s.current || r.players.some((p) => p.id === item.ownerId) || localCreatures(s).some((c) => c.id === item.ownerId);
}
function entityNamed(s, r, text, find, { exactIds = false } = {}) {
  if (exactIds) {
    if (typeof text !== "string") return null;
    return localCreatures(s).find((c) => c.id === text) || r.players.find((p) => p.id === text) || find(s, r, text) || null;
  }
  const norm2 = normalized(text), matches = [...localCreatures(s), ...r.players].filter((c) => c.id === text || normalized(c.name) === norm2);
  if (matches.length === 1) return matches[0];
  if (!matches.length) {
    const titled = [...localCreatures(s), ...r.players].filter((c) => normalized(c.name).endsWith(" the " + norm2));
    if (titled.length === 1) return titled[0];
  }
  const item = find(s, r, text);
  if (item) return item;
  const unpunctuated = text.trim().replace(/[.!?]+$/, "");
  if (unpunctuated !== text.trim()) return entityNamed(s, r, unpunctuated, find, { exactIds });
  if (s.current === "tavern") {
    const legacy = exactEnvironmentTarget(text);
    if (legacy) {
      const o = OBJECTS[legacy.kind], state = objectState(r.world, legacy.kind);
      return { id: "fixture:" + legacy.kind, name: o.name, type: "fixture", material: o.material, portable: o.portable, position: o.position, legacyId: legacy.kind, ...state };
    }
  }
  return null;
}
function parseEntityAttempt(text) {
  text = text.trim().replace(/^I (?:try to |want to |attempt to )?/i, "");
  let m;
  const attempt = (verb, reference, extra = {}) => {
    const requiresCarried = /^(?:my\s+|(?:the\s+)?(?:stolen|carried)\s+)/i.test(reference);
    const target = reference.replace(/^(?:(?:my|the)\s+)?(?:stolen|carried)\s+|^my\s+/i, "").trim();
    return { verb, target, ...requiresCarried ? { requiresCarried: true } : {}, ...extra };
  };
  const patient = (reference) => reference.replace(/[’']s (?:sprained |injured |wounded )?(?:arm|leg|hand|foot|head|wound|injury)\b.*$/i, "").replace(/\s+(?:injury|wound)$/i, "");
  if (voicePacification(text)) {
    m = text.match(/\b(?:calm|soothe|befriend|pacify|tame)\s+(.+?)(?:\s+(?:with|using|by|instead of|rather than|without)\b.*|$)/i) || text.match(/\bwin\s+(.+?)\s+over\b/i) || text.match(/\b(?:to|for|at)\s+(.+?)(?:\s+(?:with|using|by)\b.*|$)/i);
    return { verb: "pacify", target: m?.[1]?.trim() || "" };
  }
  if (m = text.match(/^(?:use|apply) (.+?) to (?:heal|bandage|treat|bind) (.+)$/i)) return { verb: "treat", target: patient(m[2]), item: m[1].replace(/^my /i, "") };
  if (m = text.match(/^(?:heal|bandage|treat|bind|revive|mend) (.+?)(?: (?:using|with) (.+))?$/i)) return { verb: "treat", target: patient(m[1]), item: m[2]?.replace(/^my /i, ""), .../^(?:revive|mend)\b/i.test(text) ? { nativeRecovery: text.split(" ")[0].toLowerCase() } : {} };
  if (m = text.match(/^(?:set|put) (.+?) (?:on fire|ablaze|alight)(.*)$/i)) {
    const suffix = m[2].trim().replace(/[.!?]+$/, "");
    const tool = suffix.match(/^(?:with|using) (.+)$/i);
    return attempt("ignite", m[1], tool ? { item: tool[1] } : suffix ? { error: "Try one ignition action on a displayed target without extra steps." } : {});
  }
  if ((m = text.match(/^set fire to (.+)$/i)) || (m = text.match(/^(?:ignite|burn|light) (.+)$/i))) return attempt("ignite", m[1]);
  if (m = text.match(/^(?:extinguish|douse|quench|put out|blow out) (.+)$/i)) return attempt("extinguish", m[1]);
  if (/^(?:explore|continue (?:the )?(?:story|campaign)|begin (?:the )?campaign)$/i.test(text)) return { verb: "explore" };
  if (m = text.match(/^(?:talk to|ask|negotiate with|pacify|befriend|tame|persuade|calm|soothe) (.+?)(?: about .*)?$/i)) return { verb: /^(talk|ask)/i.test(text) ? "talk" : "pacify", target: m[1] };
  if (m = text.match(/^(?:attack|damage|hit|strike) (.+?)(?: with (.+))?$/i)) return { verb: "attack", target: m[1], item: m[2] };
  if (m = text.match(/^(?:cut|pluck|harvest|separate) (.+?) from (.+)$/i)) return { verb: "harvest", part: m[1], target: m[2] };
  if (m = text.match(/^put (.+?) (?:in|into) (.+)$/i)) return { verb: "put", item: m[1], target: m[2] };
  if (m = text.match(/^attach (.+?) to (.+)$/i)) return { verb: "attachTo", item: m[1], target: m[2] };
  if (m = text.match(/^fill (.+?) from (.+)$/i)) return { verb: "fill", item: m[1], target: m[2] };
  if (m = text.match(/^(inspect|open|close|unlock|repair|ignite|extinguish|drink|move|push) (.+)$/i)) return { verb: m[1].toLowerCase() === "push" ? "move" : m[1].toLowerCase(), target: m[2] };
  return null;
}
var voicePacification = (text) => /\b(soothe|soothing|calm|calming|befriend|pacify|tame|win .+ over)\b/i.test(text) && /\b(voice|song|sing|singing|rap|rapping|music|lullaby|joke|hum|humming)\b/i.test(text) && !/\b(heal|bandage|bind|treat|wound|injury|pain)\b/i.test(text);
function planEntity(r, s, actor, attempt, find, { exactIds = false } = {}) {
  if (!attempt) return null;
  const blocked = (error2) => ({ ...attempt, error: error2, automatic: true, dc: 0, ability: "Interaction" });
  if (attempt.error) return blocked(attempt.error);
  if (attempt.verb === "explore") {
    const next = s.locations[s.current].exits.find((id) => !s.locations[id]?.visited) || s.locations[s.current].exits.find((id) => id !== "tavern");
    return { ...attempt, destination: next, automatic: true, ability: "Exploration", ...!next ? { error: "There are no further paths here." } : expeditionTravelError(s, next) ? { error: expeditionTravelError(s, next) } : {} };
  }
  if (!exactIds && s.current === "tavern" && attempt.verb === "treat" && !attempt.item && /^(?:myself|me|self)[.!?]*$/i.test(attempt.target)) return null;
  const target = entityNamed(s, r, attempt.target, find, { exactIds });
  if (!target) {
    if (s.current === "tavern" && !["harvest", "pacify", "fill", "treat", "ignite", "extinguish"].includes(attempt.verb)) return null;
    return { ...blocked("That entity is not here. Use the displayed name or identity."), unresolvedTarget: true };
  }
  if (attempt.requiresCarried && target.ownerId !== actor.id) return blocked("That carried object is not available in your pockets. Choose an owned item identity.");
  if (attempt.verb === "ignite" && attempt.item) return blocked("Ignition with a selected tool is not supported yet. Try one action on a displayed target.");
  if (target.legacyId && attempt.nativeRecovery === "mend") return null;
  if (target.legacyId && ["treat", "pacify"].includes(attempt.verb)) return blocked("Choose a character here for that action.");
  if (!exactIds && s.current === "tavern" && attempt.nativeRecovery && !attempt.item && r.players.some((p2) => p2.id === target.id)) return null;
  if (target.legacyId && !["harvest", "attack"].includes(attempt.verb)) return null;
  const p = { ...attempt, targetId: target.id, automatic: true, dc: 0, ability: "Interaction" };
  if (attempt.verb === "inspect") return p;
  const creature = !!target.attitude, player = r.players.some((x) => x.id === target.id);
  if (["talk", "pacify"].includes(attempt.verb) && creature && target.hp <= 0) return blocked("That creature is down. Treat it before trying to speak with it.");
  if (["talk", "pacify"].includes(attempt.verb)) return creature ? { ...p, automatic: attempt.verb === "talk" || target.attitude === "friendly", dc: 10 + (s.locations[s.current].danger || 0), ability: "Persuasion" } : blocked("Choose a living character to speak with.");
  if (attempt.verb === "attachTo") {
    if (!creature && !player) return null;
    const item = find(s, r, attempt.item);
    if (!item || item.ownerId !== actor.id || item.type !== "wearable" || item.condition !== "intact") return blocked("Carry an intact wearable to attach.");
    if (player && target.id !== actor.id || creature && target.hp > 0 && target.attitude !== "friendly") return blocked("The recipient must agree. Befriend the creature first, or give another player the item so they can equip it.");
    return { ...p, itemId: item.id };
  }
  if (attempt.verb === "treat") {
    if (exactIds && !attempt.item) return blocked("Typed treatment requires an explicit carried bandage ID.");
    if (!creature && !player) return blocked("Choose an injured creature or adventurer.");
    const carriedMatches = (reference) => Object.values(s.items).filter((i) => i.ownerId === actor.id && available(s, r, i) && (i.id === reference || !exactIds && normalized(i.name) === normalized(reference)));
    let requested = attempt.item ? carriedMatches(attempt.item) : [];
    if (attempt.item && !exactIds && !requested.length) requested = carriedMatches(attempt.item.trim().replace(/[.!?]+$/, ""));
    const candidate = requested.length === 1 ? requested[0] : null;
    const bandage = (attempt.item ? [candidate] : Object.values(s.items)).find((i) => i && i.ownerId === actor.id && available(s, r, i) && ["cloth", "fiber"].includes(i.material) && i.condition === "intact");
    return bandage ? { ...p, itemId: bandage.id, automatic: false, dc: 8, ability: "Medicine" } : blocked("You need a carried cloth or fiber item for a bandage.");
  }
  if (attempt.verb === "harvest") {
    const parts = target.parts || (target.legacyId ? [{ name: target.material + " scrap", material: target.material, count: target.condition === "taken" || target.condition === "broken" ? 0 : 1 }] : []);
    const part = parts.find((part2) => normalized(part2.name) === normalized(attempt.part));
    if (!part || part.count <= 0) return blocked("That part is unavailable. Inspect the entity to see its remaining parts.");
    return { ...p, part: part.name, material: part.material, automatic: false, dc: creature && target.hp > 0 ? 14 : 8, ability: "Craft" };
  }
  if (attempt.verb === "attack") {
    if (target.ownerId && target.ownerId !== actor.id && !creature) return blocked("Ask the owner to drop that object first.");
    if (target.condition === "broken" || creature && target.hp <= 0) return blocked("That target is already down or broken.");
    const tool = attempt.item ? find(s, r, attempt.item) : null;
    if (attempt.item && (!tool || tool.ownerId !== actor.id || tool.condition !== "intact" || tool.type !== "tool")) return blocked("Choose an intact tool in your own pockets.");
    return { ...p, itemId: tool?.id, automatic: false, dc: creature ? 10 + (s.locations[s.current].danger || 1) : MATERIAL_RULES[target.material]?.hardness || 10, ability: "Athletics" };
  }
  if (creature || player) return blocked("This action requires an object.");
  if (target.ownerId && target.ownerId !== actor.id) return blocked("Ask its owner to transfer or drop it first.");
  if (attempt.verb === "put") {
    const item = find(s, r, attempt.item);
    if (!item || item.ownerId !== actor.id || target.type !== "container" || !target.open || target.ownerId !== actor.id || item.id === target.id) return blocked("Choose a carried item and an open container you carry.");
    if (item.containerId === target.id || (target.contents || []).includes(item.id)) return blocked("That item is already in this container.");
    if (item.containerId) {
      const oldParent = s.items[item.containerId];
      if (!oldParent || oldParent.type !== "container" || oldParent.ownerId !== actor.id || !(oldParent.contents || []).includes(item.id)) return blocked("The item has inconsistent or unavailable container ownership.");
    }
    let parent = target;
    const seen = /* @__PURE__ */ new Set();
    while (parent) {
      if (seen.has(parent.id)) return blocked("The container ancestry is invalid.");
      seen.add(parent.id);
      if (parent.id === item.id) return blocked("A container cannot contain itself or its parent.");
      if (parent.containerId && !s.items[parent.containerId]) return blocked("The container ancestry is incomplete.");
      parent = parent.containerId ? s.items[parent.containerId] : null;
    }
    if ((target.contents || []).length >= 8) return blocked("That container is full (eight objects).");
    return { ...p, itemId: item.id };
  }
  if (attempt.verb === "fill") {
    const vessel = find(s, r, attempt.item);
    return target.source === "water" && vessel?.type === "container" && vessel.ownerId === actor.id && vessel.condition === "intact" ? { ...p, itemId: vessel.id } : blocked("Carry an intact container and choose a water source here.");
  }
  if (attempt.verb === "drink") return target.ownerId === actor.id && target.liquid?.amount > 0 ? p : blocked("You need a carried container with liquid in it.");
  if (["open", "close", "unlock"].includes(attempt.verb)) {
    if (target.type !== "container" && target.type !== "fixture") return blocked("That object has no opening.");
    if (target.condition === "broken") return blocked("It is broken open already.");
    return { ...p, automatic: attempt.verb === "close" || !target.locked, dc: 11 + (s.locations[s.current].danger || 0), ability: "Sleight of hand" };
  }
  if (attempt.verb === "move") return target.portable === false ? blocked("That fixture is fixed to the ground.") : { ...p, automatic: false, dc: 8, ability: "Athletics" };
  if (attempt.verb === "ignite") return MATERIAL_RULES[target.material]?.burns ? { ...p, automatic: false, dc: 9, ability: "Arcana" } : blocked("That material will not burn.");
  if (attempt.verb === "extinguish") return target.condition === "burning" ? p : blocked("There is no flame on that object.");
  if (attempt.verb === "repair") return target.condition === "broken" ? { ...p, automatic: false, dc: 11, ability: "Craft" } : blocked("That object is not broken.");
  return blocked("That action is not supported by this entity.");
}
function damageEntity(r, s, actor, target, amount) {
  const armor = Object.values(s.items).some((i) => i.ownerId === target.id && i.equipped && (i.materials || [i.material]).some((m) => ["metal", "stone"].includes(m)));
  amount = Math.max(1, amount - (armor ? 1 : 0));
  target.hp = Math.max(0, (target.hp ?? 4) - amount);
  target.injuries ||= [];
  if (target.hp > 0 && target.hp < (target.maxHp || 4) / 2 && !target.injuries.includes("wounded")) target.injuries.push("wounded");
  if (!target.hp) {
    if (target.attitude) {
      target.attitude = "defeated";
      target.status = "knocked out";
    } else {
      target.condition = "broken";
      target.equipped = false;
      target.open = true;
      target.locked = false;
    }
  }
  target.lastImpact = { round: r.round, actorId: actor.id, amount };
}
function resolveEntity(r, s, actor, p, success) {
  const target = s.items[p.targetId] || s.creatures[p.targetId] || r.players.find((x) => x.id === p.targetId);
  if (p.error) return { success: false, blocked: true, text: p.error };
  const reply = (text2, change) => ({ success, blocked: false, text: text2, change });
  if (!success) {
    if (target?.attitude === "hostile" && ["harvest", "attack"].includes(p.verb)) {
      const protectedByGear = Object.values(s.items).some((i) => i.ownerId === actor.id && i.equipped && (i.materials || [i.material]).some((m) => ["metal", "stone"].includes(m)));
      actor.hp = Math.max(0, actor.hp - (protectedByGear ? 1 : 2));
      actor.injuries ||= [];
      if (!actor.injuries.includes("bruised")) actor.injuries.push("bruised");
    }
    return reply(`${actor.name} cannot ${p.verb} ${target?.name || "that"} this time.${target?.attitude === "hostile" ? " The creature lashes back." : ""}`);
  }
  if (p.targetId?.startsWith("fixture:") && p.verb === "attack") {
    const id = p.targetId.slice(8);
    r.world.objects ||= {};
    r.world.objects[id] = { ...objectState(r.world, id), condition: "broken" };
    r.world.props ||= {};
    r.world.props[id] = "broken";
    return reply(actor.name + " breaks " + OBJECTS[id].name, "BROKEN: " + OBJECTS[id].name);
  }
  switch (p.verb) {
    case "inspect":
      return reply(`${target.name} (${target.id}): ${target.attitude || target.condition}; ${target.material}; ${target.hp ?? 4}/${target.maxHp ?? 4} HP. Parts: ${(target.parts || []).filter((p2) => p2.count > 0).map((p2) => p2.name + " \xD7" + p2.count).join(", ") || "none"}. ${target.locked ? "Locked. " : ""}${target.open ? "Open. " : ""}${target.liquid ? "Contains " + target.liquid.amount + " water. " : ""}${target.injuries?.length ? "Injuries: " + target.injuries.join(", ") : ""}`);
    case "talk": {
      const q = s.regions[s.current]?.quest;
      if (q && target.id === q.patronId) {
        if (q.status === "available") q.status = "active";
        return reply(`${target.name}: \u201C${target.history?.some((h) => h.verb === "theft" && h.actorId === actor.id) ? "I remember your theft attempt. " : ""}${q.status === "completed" ? "You helped us. We remember." : q.objective}\u201D ${s.regions[s.current].rumor}`, "ADVENTURE: " + q.title);
      }
      return reply(`${target.name} ${target.attitude === "hostile" ? "growls a warning. You could try befriending it or fighting." : "shares a story about the road ahead."}`);
    }
    case "pacify":
      target.attitude = "friendly";
      target.trust[actor.id] = (target.trust[actor.id] || 0) + 1;
      break;
    case "attack":
      damageEntity(r, s, actor, target, p.itemId ? 4 + (s.items[p.itemId]?.properties?.sharp ? 1 : 0) : 2);
      break;
    case "treat": {
      const bandage = s.items[p.itemId];
      bandage.parentId = target.id;
      bandage.ownerId = null;
      bandage.location = null;
      bandage.attachedTo = target.id;
      target.hp = Math.min(target.maxHp, target.hp + 4);
      target.injuries = [];
      if (target.status === "knocked out") target.status = "ready";
      if (target.attitude === "defeated") target.attitude = "wary";
      if (target.trust) target.trust[actor.id] = (target.trust[actor.id] || 0) + 1;
      break;
    }
    case "harvest": {
      const legacy = p.targetId.startsWith("fixture:");
      if (legacy) {
        const id = p.targetId.slice(8);
        r.world.objects ||= {};
        r.world.objects[id] = { ...objectState(r.world, id), condition: "broken" };
        r.world.props ||= {};
        r.world.props[id] = "broken";
      } else {
        target.parts.find((x) => x.name === p.part).count--;
        if (target.attitude && target.hp > 0) damageEntity(r, s, actor, target, 2);
      }
      const item = spawnItem(s, null, { name: p.part, material: p.material, ownerId: actor.id, originId: p.targetId, appearance: { shape: "shard", color: MATERIAL_RULES[p.material].color } });
      return reply(`${actor.name} separates ${item.name} (${item.id}) from ${target?.name || OBJECTS[p.targetId.slice(8)]?.name}. It is now a real crafting component.`, "HARVESTED: " + item.name);
    }
    case "put": {
      const item = s.items[p.itemId];
      if (!item || !target || target.type !== "container" || !target.open || target.ownerId !== actor.id || item.ownerId !== actor.id || item.id === target.id || item.containerId === target.id || (target.contents || []).includes(item.id)) return { success: false, blocked: true, text: "The item or container is no longer available for placement." };
      let oldParent = null;
      if (item.containerId) {
        oldParent = s.items[item.containerId];
        if (!oldParent || oldParent.type !== "container" || oldParent.ownerId !== actor.id || !(oldParent.contents || []).includes(item.id)) return { success: false, blocked: true, text: "The item has inconsistent or unavailable container ownership." };
      }
      if ((target.contents || []).length >= 8) return { success: false, blocked: true, text: "That container is full (eight objects)." };
      if (oldParent) oldParent.contents = oldParent.contents.filter((id) => id !== item.id);
      target.contents ||= [];
      target.contents.push(item.id);
      item.containerId = target.id;
      item.ownerId = target.ownerId;
      item.location = target.location;
      item.equipped = false;
      break;
    }
    case "attachTo": {
      const item = s.items[p.itemId];
      for (const other of Object.values(s.items)) if (other.ownerId === target.id && other.slot === item.slot) other.equipped = false;
      item.ownerId = target.id;
      item.location = null;
      item.equipped = true;
      item.attachedTo = target.id;
      break;
    }
    case "fill":
      s.items[p.itemId].liquid = { kind: "water", amount: 3 };
      break;
    case "drink":
      target.liquid.amount--;
      actor.hp = Math.min(actor.maxHp, actor.hp + 1);
      break;
    case "open":
    case "unlock":
      target.locked = false;
      target.open = true;
      break;
    case "close":
      target.open = false;
      break;
    case "move":
      target.position = [Math.min(870, target.position[0] + 35), target.position[1]];
      break;
    case "ignite":
      target.condition = "burning";
      target.heat = 0;
      break;
    case "extinguish":
      target.condition = "intact";
      target.heat = 0;
      break;
    case "repair":
      target.condition = "intact";
      target.hp = target.maxHp || 4;
      break;
  }
  const text = `${actor.name}: ${p.verb} ${target?.name || "the object"}.${p.verb === "attack" ? ` ${target.hp}/${target.maxHp || 4} HP remaining.` : ""}`;
  if (target) {
    target.history ||= [];
    target.history.push({ verb: p.verb, actorId: actor.id, round: r.round, location: s.current });
    target.history = target.history.slice(-12);
  }
  recordCampaign(r, s, "interaction", text, { entityId: p.targetId, location: s.current });
  return reply(text, p.verb.toUpperCase() + ": " + target?.name);
}
function advanceEntities(r, s) {
  const changes = [];
  for (const c of localCreatures(s)) if (c.routine && c.hp > 0 && c.hp === c.maxHp) {
    const home = c.routine.home, step = r.round % 6;
    c.position = [home[0] + (step < 3 ? 0 : 24), home[1]];
    c.activity = step < 3 ? c.routine.activity : "checking the path";
  }
  for (const item of Object.values(s.items)) if ((item.location === s.current || r.players.some((p) => p.id === item.ownerId)) && item.condition === "burning") {
    item.heat = (item.heat || 0) + 1;
    for (const c of localCreatures(s)) if (c.hp > 0 && Math.hypot(c.position[0] - item.position[0], c.position[1] - item.position[1]) < 65) {
      damageEntity(r, s, { id: "fire" }, c, 1);
      changes.push(c.name + " takes fire damage");
    }
    if (item.heat >= 3) {
      item.condition = "broken";
      item.hp = 0;
      item.open = true;
      item.equipped = false;
      changes.push(item.name + " burned through");
    }
  }
  return changes;
}

// public/world-items.js
var ITEM_TYPES = {
  fragment: { portable: true, wearable: false, shape: "shard" },
  wearable: { portable: true, wearable: true, shape: "band" },
  tool: { portable: true, wearable: false, shape: "rod" },
  container: { portable: true, wearable: false, shape: "cup" },
  fixture: { portable: false, wearable: false, shape: "chest" }
};
var MATERIALS = MATERIAL_RULES;
var norm = (s) => s.trim().toLowerCase().replace(/^(?:a|an|the)\s+/, "");
var currentLocation = (r) => r.world.expedition?.current || "tavern";
function ensureItems(r) {
  if (r.world.expedition) {
    upgradeCampaign(r, r.world.expedition);
    return r.world.expedition;
  }
  const rng = new Rng(r.seed), locations = { tavern: { id: "tavern", name: "The Tipsy Wyvern", kind: "tavern", exits: ["clearing"] } };
  for (const [id, kind, exits] of [["clearing", "clearing", ["tavern", "ruins"]], ["ruins", "ruins", ["clearing"]]]) locations[id] = { id, kind, name: rng.pick(["Mossy", "Amber", "Moonlit"]) + " " + (kind === "clearing" ? "Clearing" : "Ruins"), exits, decor: Array.from({ length: 12 }, () => [rng.int(90, 870), rng.int(170, 470), rng.int(0, 2)]) };
  const state = r.world.expedition = { version: 1, current: "tavern", locations, items: {}, nextId: 1 };
  for (const location of Object.keys(locations)) for (const [name, material, type3] of [["cloth strip", "cloth", "fragment"], ["wood splinter", "wood", "tool"], ["blue bottle", "glass", "container"], ["smooth stone", "stone", "fragment"]]) {
    const id = "item-" + state.nextId++;
    state.items[id] = { id, name, type: type3, material, condition: "intact", ownerId: null, location, position: [240 + state.nextId % 4 * 150, 390], components: [], equipped: false, appearance: { shape: ITEM_TYPES[type3].shape, color: MATERIALS[material].color }, history: [] };
  }
  upgradeCampaign(r, state);
  return state;
}
var visibleItems = (r) => Object.values(r.world.expedition?.items || {}).filter((i) => available(r.world.expedition, r, i));
function findItem(s, r, text) {
  const matches = Object.values(s.items).filter((i) => available(s, r, i) && (i.id === text.trim() || norm(i.name) === norm(text)));
  return matches.length === 1 ? matches[0] : null;
}
function visibleCreatures(r) {
  return localCreatures(r.world.expedition || {});
}
function findCarriedItem(s, r, actor, text) {
  const reference = text.trim().replace(/^my /i, "");
  const matches = Object.values(s.items).filter((i) => i.ownerId === actor.id && available(s, r, i) && (i.id === reference || norm(i.name) === norm(reference)));
  return matches.length === 1 ? matches[0] : null;
}
function parseItemAttempt(text) {
  let m;
  if (m = text.match(/^(?:travel|go) to (.+)$/i)) return { verb: "travel", destination: norm(m[1]) };
  if (m = text.match(/^(?:make|craft|create) (.+?) from (.+)$/i)) return { verb: "craft", name: m[1].replace(/^(a|an|the)\s+/i, "").trim(), sources: m[2].replace(/\s+to wear (?:on )?(?:my |the )?(?:head|body|hand)$/i, "").split(/\s+and\s+|\s*\+\s*/i) };
  if (m = text.match(/^attach (.+?) to (.+)$/i)) return { verb: "attach", sources: [m[1], m[2]] };
  if (m = text.match(/^steal (.+?)(?: from (.+))?$/i)) return { verb: "steal", item: m[1], from: m[2] };
  if (m = text.match(/^give (.+?) to (.+)$/i)) return { verb: "give", item: m[1], recipient: m[2] };
  if (m = text.match(/^use (.+?) on (.+)$/i)) return { verb: "use", item: m[1], target: m[2] };
  if (m = text.match(/^(take|drop|equip|wear|unequip|separate|inspect|break|smash) (.+)$/i)) return { verb: { wear: "equip", smash: "break" }[m[1].toLowerCase()] || m[1].toLowerCase(), item: m[2] };
  return null;
}
function itemPlan(r, actor, text) {
  text = text.trim().replace(/^(?:I (?:try to |want to |attempt to )?)/i, "");
  const state = ensureItems(r), nativeAttempt = parseEntityAttempt(text), extended = planEntity(r, state, actor, nativeAttempt, findItem);
  if (extended) return { ...extended, entityAction: true };
  if (currentLocation(r) !== "tavern" && /^(?:rest|rest and heal|heal myself)$/i.test(text.trim())) return { verb: "rest", automatic: false, dc: 6, ability: "Recovery" };
  if (/^(?:find|read|consult|take) (?:the )?(?:tavern )?map$/i.test(text)) return { verb: "map", automatic: true, dc: 0, ability: "Discovery", ...!state.mapFound && state.current !== "tavern" ? { error: "The route map is on the tavern wall. Return there to copy it." } : {} };
  const attempt = parseItemAttempt(text);
  if (!nativeAttempt && !attempt && /\b(?:heal|bandage|bind|treat|revive|mend)\b/i.test(text) && !/\b(?:rest|nap|sleep|drink|eat|snack|potion)\b/i.test(text)) return { verb: "treat", unresolvedTarget: true, error: "That treatment could not be grounded. Name the patient and any carried bandage directly.", automatic: true, dc: 0, ability: "Interaction" };
  if (!nativeAttempt && !attempt && /\bon fire\b|\b(?:ablaze|alight)\b/i.test(text)) return { verb: "ignite", unresolvedTarget: true, error: "That ignition could not be grounded. Name one available target directly.", automatic: true, dc: 0, ability: "Interaction" };
  if (!attempt && /\b(make|craft|create|fashion|weave|sew|build|turn.+into)\b/i.test(text)) return { verb: "unsupported", error: "This creative attempt needs a validated interpretation. Use Make <name> from two carried components, or connect local AI.", automatic: true, dc: 0, ability: "Interaction" };
  if (!attempt) return currentLocation(r) === "tavern" ? null : { verb: "unsupported", error: "Try taking, crafting, equipping, giving, separating, or using an object here, or travel to a connected place.", automatic: true, dc: 0, ability: "Interaction" };
  return planItemAttempt(r, actor, attempt);
}
function planItemAttempt(r, actor, attempt, { exactIds = false } = {}) {
  const isExplicit = ["travel", "craft", "attach", "give", "steal", "use", "equip", "unequip", "separate", "drop"].includes(attempt.verb);
  const s = ensureItems(r);
  const lookup = (text, carried = false) => {
    if (!exactIds) return carried ? findCarriedItem(s, r, actor, text) : findItem(s, r, text);
    const i = typeof text === "string" ? s.items[text] : null;
    return i && available(s, r, i) && (!carried || i.ownerId === actor.id) ? i : null;
  };
  const item = attempt.item ? lookup(attempt.item, ["give", "use", "equip", "unequip", "drop", "separate"].includes(attempt.verb)) : null;
  if (!isExplicit && !item) {
    if (s.current === "tavern" && !/^item-\d+$/i.test(attempt.item || "")) return null;
  }
  const blocked = (message) => ({ ...attempt, itemId: item?.id, error: message, automatic: true, dc: 0, ability: "Interaction" });
  if (attempt.verb === "steal" && !item && s.current === "tavern" && (!attempt.from && exactEnvironmentTarget(attempt.item) || /^(?:the )?crown$/i.test(attempt.item) && (!attempt.from || /^(?:the )?chest(?: behind the bar)?$/i.test(attempt.from)))) return null;
  if (attempt.verb === "travel") {
    const dest = Object.values(s.locations).find((l) => l.id === attempt.destination || !exactIds && norm(l.name) === attempt.destination);
    if (!dest || !s.locations[s.current].exits.includes(dest.id)) return blocked("That place is not connected to this location.");
    const routeError = expeditionTravelError(s, dest.id);
    if (routeError) return blocked(routeError);
    return { ...attempt, destination: dest.id, automatic: true, ability: "Travel" };
  }
  if (["craft", "attach"].includes(attempt.verb)) {
    if (attempt.verb === "craft" && (!attempt.name || attempt.name.length > 48 || /[<>]/.test(attempt.name))) return blocked("Use an item name of 1\u201348 plain characters.");
    const sources = attempt.sources.map((name) => lookup(name, true));
    if (sources.length < 2 || sources.length > 4 || sources.some((i) => !i || i.ownerId !== actor.id || i.containerId || i.condition !== "intact") || new Set(sources.map((i) => i.id)).size !== sources.length) return blocked("Choose two to four different intact items from your own pockets; take them out of containers first. Use item IDs if names repeat.");
    if (Object.values(s.items).filter((i) => i.location === s.current || i.ownerId === actor.id).length >= 256) return blocked("This campaign has reached its 256-object crafting limit.");
    return { ...attempt, sourceIds: sources.map((i) => i.id), automatic: false, dc: 10, ability: "Craft" };
  }
  if (!item) return blocked("No unique item matches that name here. Choose a visible item ID.");
  const plan = { ...attempt, itemId: item.id, automatic: true, dc: 0, ability: "Interaction" };
  if (attempt.verb === "inspect") return plan;
  if (attempt.verb === "steal") {
    const owner = localCreatures(s).find((c) => c.id === item.ownerId);
    if (!owner) return blocked("Steal only an item carried by an NPC here; players must give or drop their own belongings.");
    if (attempt.from && attempt.from !== owner.id && norm(attempt.from) !== norm(owner.name)) return blocked("That NPC does not own this item.");
    if (item.portable === false || ITEM_TYPES[item.type]?.portable === false) return blocked("This fixture cannot be carried intact.");
    return { ...plan, previousOwnerId: owner.id, automatic: owner.hp <= 0, dc: 11 + (s.locations[s.current].danger || 0), ability: "Sleight of Hand" };
  }
  if (attempt.verb === "take") {
    if (item.portable === false || ITEM_TYPES[item.type]?.portable === false) return blocked("This fixture cannot be carried intact.");
    return !item.ownerId || item.ownerId === actor.id && item.containerId ? plan : blocked("That item is already carried; its owner must give or drop it.");
  }
  if (item.ownerId !== actor.id) return blocked("You must carry that item first.");
  if (attempt.verb === "give") {
    const recipient = [...r.players, ...localCreatures(s)].find((p) => (p.id === attempt.recipient || !exactIds && norm(p.name) === norm(attempt.recipient)) && p.id !== actor.id);
    return recipient ? { ...plan, recipientId: recipient.id } : blocked("Choose another adventurer by their full name.");
  }
  if (["equip", "use"].includes(attempt.verb) && item.condition !== "intact") return blocked("That item is broken. Separate its components or use another item.");
  if (attempt.verb === "equip" && !ITEM_TYPES[item.type]?.wearable) return blocked("Only wearable objects can be equipped. Craft a wearable from carried components.");
  if (attempt.verb === "separate" && !item.components.length) return blocked("That item has no attached components to separate.");
  if (attempt.verb === "break") return item.condition === "broken" ? blocked("That item is already broken.") : { ...plan, automatic: false, dc: MATERIALS[item.material].hardness, ability: "Athletics" };
  if (attempt.verb === "use") {
    const target = entityNamed(s, r, attempt.target, (s2, r2, text) => lookup(text), { exactIds });
    if (item.type !== "tool") return blocked("This action needs a tool. Wearables can be equipped; containers can be carried or combined.");
    if (!target || target.id === item.id || target.ownerId && target.ownerId !== actor.id || target.condition && target.condition !== "intact" || target.attitude && target.hp <= 0) return blocked("Choose an intact object here or in your own pockets.");
    return { ...plan, targetId: target.id, automatic: false, dc: Math.max(5, (MATERIALS[target.material]?.hardness || 10) - 2), ability: "Athletics" };
  }
  return plan;
}
function planWorldProposal(r, actor, raw) {
  const s = ensureItems(r), verb = raw.verb;
  const exactItem = (s2, r2, id) => typeof id === "string" && s2.items[id] && available(s2, r2, s2.items[id]) ? s2.items[id] : null;
  const inventory = (attempt2) => planItemAttempt(r, actor, attempt2, { exactIds: true });
  const entity = (attempt2) => planEntity(r, s, actor, attempt2, exactItem, { exactIds: true });
  if (verb === "unsupported") return { verb, error: "This attempt cannot be represented by the available game actions.", automatic: true, dc: 0, ability: "Interaction" };
  if (verb === "rest") return { verb, automatic: false, dc: 6, ability: "Recovery" };
  if (verb === "craft") return inventory({ verb, name: raw.name, sources: raw.sources });
  if (["take", "steal", "drop", "equip", "unequip", "separate"].includes(verb)) return inventory({ verb, item: raw.target });
  if (verb === "travel") return inventory({ verb, destination: raw.target });
  if (verb === "give") return inventory({ verb, item: raw.item, recipient: raw.target });
  if (["use", "put", "fill"].includes(verb)) {
    if (verb === "use") return inventory({ verb, item: raw.item, target: raw.target });
    const result2 = entity({ verb, item: raw.item, target: raw.target });
    return result2 ? { ...result2, entityAction: true } : null;
  }
  if (verb === "attach") {
    const result2 = entity({ verb: "attachTo", item: raw.item, target: raw.target });
    return result2 ? { ...result2, entityAction: true } : inventory({ verb, sources: [raw.item, raw.target] });
  }
  const attempt = { verb, target: raw.target, ...raw.item ? { item: raw.item } : {}, ...verb === "harvest" ? { part: raw.name } : {} };
  const result = entity(attempt);
  return result ? { ...result, entityAction: true } : inventory({ verb, item: raw.target });
}
function remember(item, verb, actor, location) {
  item.history.push({ verb, actorId: actor.id, location });
  item.history = item.history.slice(-12);
}
function resolveItem(r, actor, plan, success) {
  const s = ensureItems(r), item = s.items[plan.itemId];
  const out = { success: success && !plan.error, blocked: !!plan.error, text: "", change: null };
  if (plan.error) return { ...out, text: plan.error };
  if (plan.verb === "map") {
    s.mapFound = true;
    return { ...out, text: "You copy the tavern route map. The party can consult known paths on their controllers; new discoveries are marked as you travel.", change: "PARTY MAP DISCOVERED" };
  }
  if (plan.entityAction && plan.verb !== "explore") return resolveEntity(r, s, actor, plan, success);
  if (plan.verb === "use") return resolveEntity(r, s, actor, { ...plan, verb: "attack" }, success);
  if (plan.verb === "steal") {
    const owner = s.creatures[plan.previousOwnerId];
    if (owner?.hp > 0) {
      owner.trust ||= {};
      owner.trust[actor.id] = Math.max(-10, (owner.trust[actor.id] || 0) - 2);
      owner.attitude = "hostile";
      owner.history ||= [];
      owner.history.push({ verb: "theft", actorId: actor.id, itemId: item.id, success, round: r.round });
      owner.history = owner.history.slice(-12);
      out.change = owner.name + " remembers the theft attempt";
    }
    if (!success) return { ...out, text: actor.name + " is caught trying to steal " + item.name + ". Ownership is unchanged. " + owner.name + " remembers." };
  }
  if (!success) return { ...out, text: plan.verb === "rest" ? `${actor.name} cannot settle down yet. Try resting again.` : `${actor.name} tries, but the materials resist. Nothing is consumed or changed.` };
  if (plan.verb === "rest") {
    s.campaign.day++;
    actor.injuries = [];
    actor.hp = Math.min(actor.maxHp, actor.hp + 4);
    return { ...out, text: `${actor.name} rests and recovers.`, change: "+4 HP (up to maximum)" };
  }
  if (plan.verb === "travel" || plan.verb === "explore") {
    enterRegion(r, s, plan.destination);
    recordCampaign(r, s, "travel", actor.name + " led the party to " + s.locations[s.current].name, { location: s.current });
    return { ...out, text: `The party travels to ${s.locations[s.current].name}. Carried objects come along.`, change: "LOCATION: " + s.locations[s.current].name };
  }
  if (["craft", "attach"].includes(plan.verb)) {
    const sources = plan.sourceIds.map((id2) => s.items[id2]), name = plan.name || `${sources[1].name} with ${sources[0].name}`.slice(0, 48);
    const type3 = plan.creationType || (plan.verb === "attach" ? sources[1].type : /\b(hat|headband|crown|ring|cape|mask|belt|amulet|badge|necklace|helmet|wearable)\b/i.test(name) ? "wearable" : /\b(bottle|cup|bowl|container|flask)\b/i.test(name) ? "container" : "tool");
    const id = "item-" + s.nextId++, material = sources[0].material;
    const slot = plan.creationSlot || (type3 !== "wearable" ? null : plan.verb === "attach" ? sources[1].slot || "head" : /\b(ring)\b/i.test(name) ? "hand" : /\b(cape|belt|amulet|badge|necklace)\b/i.test(name) ? "body" : "head");
    const palette = { red: "#d87878", blue: "#7ea7d4", green: "#83b48a", gold: "#dfc16e", purple: "#bd88cf", white: "#e4dcc8", black: "#484552" };
    const namedColor = Object.keys(palette).find((c) => new RegExp("\\b" + c + "\\b", "i").test(name));
    const materials = [...new Set(sources.flatMap((i) => i.materials || [i.material]))];
    const made = s.items[id] = { id, name, type: type3, material, materials, properties: { sharp: materials.some((m) => MATERIALS[m]?.sharp), combustible: materials.some((m) => MATERIALS[m]?.burns) }, slot, condition: "intact", hp: 4, maxHp: 4, ownerId: actor.id, location: null, position: [480, 390], components: plan.sourceIds, contents: [], equipped: false, appearance: { shape: ITEM_TYPES[type3].shape, color: plan.creationColor || (namedColor ? palette[namedColor] : sources[0].appearance.color), accent: sources[1].appearance.color }, history: [] };
    for (const source of sources) {
      source.parentId = id;
      source.ownerId = null;
      source.location = null;
      source.equipped = false;
      remember(source, "combined", actor, s.current);
    }
    remember(made, "created", actor, s.current);
    return { ...out, text: `${actor.name} creates ${name} (${id}) from ${sources.map((i) => i.name).join(" and ")}.`, change: "CREATED: " + name };
  }
  switch (plan.verb) {
    case "inspect":
      return { ...out, text: `${item.name} (${item.id}): ${item.condition} ${item.material} ${item.type}; ${item.components.length} components. ${item.ownerId ? "Carried by " + [...r.players, ...localCreatures(s)].find((p) => p.id === item.ownerId)?.name : "On the ground"}.` };
    case "steal":
    case "take":
      if (item.containerId) {
        const box = s.items[item.containerId];
        box.contents = box.contents.filter((id) => id !== item.id);
        delete item.containerId;
      }
      item.ownerId = actor.id;
      item.location = null;
      break;
    case "drop":
      item.ownerId = null;
      item.location = s.current;
      item.equipped = false;
      break;
    case "give":
      item.ownerId = plan.recipientId;
      item.equipped = false;
      break;
    case "equip":
      for (const other of Object.values(s.items)) if (other.ownerId === actor.id && other.slot === item.slot) other.equipped = false;
      item.equipped = true;
      break;
    case "unequip":
      item.equipped = false;
      break;
    case "break":
      item.condition = "broken";
      item.equipped = false;
      break;
    case "use": {
      if (plan.targetId.startsWith("fixture:")) return resolveEntity(r, s, actor, { verb: "attack", targetId: plan.targetId, itemId: item.id }, success);
      const target = s.items[plan.targetId] || s.creatures[plan.targetId];
      damageEntity(r, s, actor, target, 4 + (item.properties?.sharp ? 1 : 0));
      remember(target, "hit with " + item.id, actor, s.current);
      break;
    }
    case "separate":
      for (const id of item.components) {
        const part = s.items[id];
        delete part.parentId;
        part.ownerId = actor.id;
        remember(part, "separated", actor, s.current);
      }
      item.components = [];
      item.ownerId = null;
      item.location = null;
      item.condition = "disassembled";
      item.equipped = false;
      break;
  }
  const follow = (parent, seen = /* @__PURE__ */ new Set()) => {
    if (seen.has(parent.id)) return;
    seen.add(parent.id);
    for (const id of parent.contents || []) {
      const child = s.items[id];
      child.ownerId = parent.ownerId;
      child.location = parent.location;
      follow(child, seen);
    }
  };
  follow(item);
  remember(item, plan.verb, actor, s.current);
  if (plan.verb === "steal") {
    const owner = s.creatures[plan.previousOwnerId];
    return { ...out, text: `${actor.name} steals ${item.name} from ${owner.name}.${owner.hp > 0 ? " " + owner.name + " notices and remembers." : ""}`, change: "STOLEN: " + item.name };
  }
  return { ...out, text: `${actor.name}: ${plan.verb} ${item.name}${plan.recipientId ? " \u2192 " + [...r.players, ...localCreatures(s)].find((p) => p.id === plan.recipientId).name : ""}${plan.targetId ? " strikes " + (s.items[plan.targetId] || s.creatures[plan.targetId]).name : ""}.`, change: plan.verb.toUpperCase() + ": " + item.name };
}
function advanceWorld(r) {
  const s = r.world.expedition;
  if (!s) return [];
  const changes = advanceEntities(r, s), done = progressAdventure(r, s);
  if (done) changes.push(done);
  const ending = advanceExpedition(s);
  if (ending) changes.push(ending);
  return changes;
}

// public/vendor/dnd5e-advantage.js
function select() {
  const expansion = this.options.pending?.advantage;
  if (!expansion) return;
  const { count, adv, size } = expansion;
  const sets = Array(count + 1);
  let targetTotal = adv ? -Infinity : Infinity;
  const selectedResults = this.results.filter((r) => r.active);
  for (const index of sets.keys()) {
    const startIndex = size * index;
    sets[index] = { results: selectedResults.slice(startIndex, startIndex + size) };
    sets[index].total = sets[index].results.reduce((total, { result }) => total + result, 0);
    targetTotal = Math[adv ? "max" : "min"](targetTotal, sets[index].total);
  }
  let kept = false;
  for (const { results, total } of sets) {
    if (!kept && total === targetTotal) kept = true;
    else results.forEach((r) => {
      r.discarded = true;
      r.active = false;
    });
  }
  delete this.options.pending.advantage;
}
function selectD20(values, mode) {
  const term = { options: { pending: { advantage: { count: 1, adv: mode > 0, size: 1 } } }, results: values.map((result) => ({ result, active: true })) };
  select.call(term);
  return term.results.find((r) => r.active).result;
}

// public/core.js
var VERSION = "0.3.0-beta.2";
var ROLES = {
  rogue: { name: "Rogue", icon: "\u25C6", description: "Quick hands. Questionable intentions.", skills: ["steal", "sneak"], color: "#ba9dff" },
  bard: { name: "Bard", icon: "\u266B", description: "Every disaster deserves a soundtrack.", skills: ["social", "dance"], color: "#f9bd6c" },
  wizard: { name: "Wizard", icon: "\u2726", description: "A little magic. Very little supervision.", skills: ["magic", "inspect"], color: "#8baaff" },
  knight: { name: "Knight", icon: "\u265C", description: "Armor first. Questions eventually.", skills: ["attack", "break"], color: "#87d6c0" },
  healer: { name: "Healer", icon: "\u271A", description: "Keeping these idiots alive since tonight.", skills: ["heal", "social"], color: "#f299b9" },
  wildcard: { name: "Wildcard", icon: "\u2605", description: "No qualifications. Excellent confidence.", skills: ["weird"], color: "#d5de8e" }
};
var PERKS = {
  lucky: { name: "Lucky-ish", description: "Reroll a natural 1, 2, or 3 once per action." },
  tough: { name: "Thick skin", description: "Start with 3 extra health." },
  charming: { name: "Suspiciously charming", description: "+2 when talking, dancing, or distracting." }
};
var OPENING = "The Duke\u2019s ridiculous golden crown is hidden somewhere in this tavern. Find it, grab it, and get out together before the guards catch on.";
var uid = () => globalThis.crypto?.randomUUID?.() || "id-" + Array.from(globalThis.crypto?.getRandomValues?.(new Uint8Array(18)) || Array.from({ length: 18 }, () => Math.floor(Math.random() * 256)), (x) => x.toString(16).padStart(2, "0")).join("");
var RuleError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
var fail = (code, message) => {
  throw new RuleError(code, message);
};
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var clean2 = (s, n) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
function avatarSafe(a = {}) {
  const out = {};
  for (const [k, max] of Object.entries({ skin: 5, hair: 5, hairColor: 5, outfit: 3, color: 5, accessory: 5 })) out[k] = clamp(Math.floor(Number(a[k]) || 0), 0, max);
  out.body = ["human", "elf", "orc"].includes(a.body) ? a.body : "human";
  return out;
}
function createRoom({ code = "SOLO", seed = 12345, now = Date.now(), reactionMs = 8e3 } = {}) {
  return {
    version: VERSION,
    code,
    createdAt: now,
    updatedAt: now,
    seq: 0,
    revision: 0,
    seed: seed >>> 0 || 12345,
    phase: "lobby",
    paused: false,
    deadline: 0,
    reactionMs: clamp(reactionMs, 4e3, 12e3),
    players: [],
    turn: null,
    result: null,
    events: [],
    requests: {},
    dmMemory: { version: 1, entries: [], people: {} },
    round: 0,
    chaos: 0,
    quest: { clues: 0, crown: false, carrierId: null, escaped: false },
    lastActorId: null,
    priorityUntil: 0,
    world: { bartender: "wary", guards: "bored", facts: ["The Duke has terrible taste in hats."], props: { rug: true } },
    stats: { actions: 0, rolls: 0 }
  };
}
function touch(r, now) {
  r.revision++;
  r.updatedAt = now;
}
function event(r, type3, text, now, extra = {}) {
  const e = { id: ++r.seq, type: type3, text, at: now, ...extra };
  r.events.push(e);
  if (r.events.length > 100) r.events.shift();
  return e;
}
function addPlayer(r, { token, name, avatar, role = "rogue", perk = "lucky", pin }, now = Date.now()) {
  if (!token || typeof token !== "string" || token.length < 16 || token.length > 150) fail("TOKEN", "This device needs a fresh character token.");
  let p = r.players.find((x) => x.token === token);
  if (p) {
    p.connected = true;
    touch(r, now);
    return p;
  }
  if (r.players.length >= 24) fail("FULL", "This tavern is full (24 adventurers).");
  name = clean2(name, 18);
  if (name.length < 1) fail("NAME", "Give your adventurer a name.");
  if (r.players.some((x) => x.name.toLowerCase() === name.toLowerCase())) fail("NAME_TAKEN", "That name is already in the tavern. Try a nickname.");
  const maxHp = perk === "tough" ? 13 : 10;
  p = {
    id: uid(),
    token,
    pin: pin || String(Math.floor(1e5 + Math.random() * 9e5)),
    name,
    avatar: avatarSafe(avatar),
    role: ROLES[role] ? role : "rogue",
    perk: PERKS[perk] ? perk : "lucky",
    hp: maxHp,
    maxHp,
    gold: 3,
    inventory: ["Bent spoon"],
    connected: true,
    muted: false,
    joinedAt: now,
    score: 0,
    actions: 0,
    assists: 0,
    nat20: 0,
    status: "ready"
  };
  r.players.push(p);
  event(r, "join", `${name} has entered the tavern.`, now, { playerId: p.id });
  touch(r, now);
  return p;
}
function editPlayer(r, id, profile, now = Date.now()) {
  const p = r.players.find((x) => x.id === id);
  if (!p) fail("PLAYER", "Character not found.");
  const name = clean2(profile.name, 18);
  if (name && r.players.some((x) => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) fail("NAME_TAKEN", "That name is taken.");
  if (name) p.name = name;
  p.avatar = avatarSafe(profile.avatar || p.avatar);
  if (r.phase === "lobby" || r.phase === "ended") {
    if (ROLES[profile.role]) p.role = profile.role;
    if (PERKS[profile.perk]) {
      p.perk = profile.perk;
      p.maxHp = p.perk === "tough" ? 13 : 10;
      p.hp = p.maxHp;
    }
  }
  touch(r, now);
  return p;
}
function publicRoom(r) {
  if (r.world.expedition) ensureItems(r);
  const { requests, seed, dmMemory, ...s } = r;
  const projected = { ...s, world: { ...s.world, ...s.world.expedition ? { expedition: campaignView(r) } : {} } };
  return { ...structuredClone(projected), players: r.players.map(({ token, pin, ...p }) => structuredClone(p)) };
}
function startGame(r, now = Date.now()) {
  if (r.phase !== "lobby") fail("PHASE", "This story has already started.");
  if (!r.players.length) fail("EMPTY", "At least one adventurer needs to join first.");
  ensureItems(r);
  r.phase = "open";
  r.deadline = 0;
  event(r, "story", OPENING, now);
  touch(r, now);
}
function classify(text) {
  const t = text.toLowerCase();
  if (environmentTarget(t) && /\b(extinguish|douse|quench|put out|blow out|repair|fix|mend|restore|ignite|light|close|shut|unlock|open|push|shove|drag|move|pull|sit|climb|pour|spill|empty)\b/i.test(t)) return "interact";
  if (/\b(heal|bandage|revive|mend|rest|nap|sleep|drink|eat|snack|potion)\b/.test(t)) return "heal";
  if (/\b(leave|escape|flee|run|exit|outside|sprint)\b/.test(t)) return "flee";
  if (/\b(steal|pickpocket|snatch|loot|grab|take|swipe|rob|pocket)\b/.test(t)) return "steal";
  if (/\b(fire|spell|cast|magic|summon|enchant|teleport|wizard|lightning|turn.*into)\b/.test(t)) return "magic";
  if (/\b(punch|hit|kick|fight|stab|attack|slap|suplex|wrestle|tackle|bonk|headbutt)\b/.test(t)) return "attack";
  if (/\b(smash|break|throw|flip|explode|burn|crash|swing)\b/.test(t)) return "break";
  if (/\b(dance|sing|song|music|perform|twerk|backflip|cartwheel)\b/.test(t)) return "dance";
  if (/\b(sneak|hide|crawl|disguise|invisible|tiptoe)\b/.test(t)) return "sneak";
  if (/\b(search|inspect|look|investigate|check|open|read|find|listen|examine)\b/.test(t)) return "inspect";
  if (/\b(talk|ask|flirt|kiss|hug|convince|persuade|bribe|order|compliment|insult|distract|tell|joke|negotiate|toast)\b/.test(t)) return "social";
  return "weird";
}
function targetFor(r, actor, text) {
  const t = text.toLowerCase();
  if (classify(text) === "flee") return { kind: "door", name: "the tavern exit" };
  const attempt = parseEntityAttempt(text);
  if (attempt && ["ignite", "extinguish"].includes(attempt.verb)) {
    const exact = exactEnvironmentTarget(attempt.target);
    if (exact) return exact;
  }
  const aimed = t.match(/\b(?:at|on|against|into|towards?)\s+(?:the\s+)?(.+?)(?:\s+(?:with|using)\b|$)/);
  if (aimed && aimed[1] !== t) return targetFor(r, actor, aimed[1]);
  const other = r.players.find((p) => p.id !== actor.id && t.includes(p.name.toLowerCase()));
  if (other) return { kind: "player", id: other.id, name: other.name };
  const environmental = environmentTarget(text);
  const objectIndex = environmental ? Math.min(...OBJECTS[environmental.kind].aliases.map((a) => t.indexOf(a)).filter((i) => i >= 0)) : Infinity;
  const npcIndex = t.search(/guard|captain|brick|soldier|bartender|marnie|barkeep|barmaid|goblin|fiddler/);
  if (environmental && (npcIndex < 0 || objectIndex < npcIndex)) return environmental;
  if (/guard|captain|brick|soldier/.test(t)) return { kind: "guard", name: "Captain Brick" };
  if (/bartender|marnie|barkeep|barmaid/.test(t)) return { kind: "bartender", name: "Marnie" };
  if (/rug|carpet|mat|runner|tapestry/.test(t)) return { kind: "rug", name: "the tavern rug" };
  if (/crown|chest|box|treasure|drawer/.test(t)) return { kind: "chest", name: "the locked chest" };
  if (/goblin|bard|musician|fiddler/.test(t)) return { kind: "goblin", name: "the goblin fiddler" };
  if (/chandelier|ceiling/.test(t)) return { kind: "chandelier", name: "the chandelier" };
  return environmental || { kind: "room", name: "the tavern" };
}
function submit(r, playerId, input, now = Date.now()) {
  const p = r.players.find((x) => x.id === playerId);
  if (!p) fail("PLAYER", "Rejoin the tavern first.");
  const key = p.id + ":" + clean2(input.requestId, 90);
  if (!input.requestId || typeof input.requestId !== "string" || input.requestId.length > 90) fail("REQUEST", "Please try again with a fresh action.");
  if (r.requests[key]) return { ...r.requests[key], duplicate: true };
  advance(r, now);
  if (r.paused) fail("PAUSED", "The host paused the story.");
  if (p.muted) fail("MUTED", "The host has muted your actions.");
  const text = clean2(input.text, 180);
  if (text.length < 2) fail("TEXT", "Tell us what you try to do (at least 2 characters).");
  if (input.kind === "reaction") {
    if (r.phase !== "react" || !r.turn || input.turnId !== r.turn.id) fail("WINDOW_CLOSED", "That reaction window closed. Your next big idea is up next.");
    if (r.turn.actorId === p.id) fail("ACTOR", "Your action is already locked in. Let the others react.");
    if (r.turn.reactions.some((x) => x.playerId === p.id)) fail("REACTED", "Your reaction is already locked in.");
    const kind = ["assist", "intervene", "flee", "custom"].includes(input.reaction) ? input.reaction : "custom";
    const reaction = { id: ++r.seq, playerId: p.id, kind, text, at: now };
    r.turn.reactions.push(reaction);
    p.status = kind === "flee" ? "hiding" : "reacting";
    const ack2 = { ok: true, accepted: true, kind: "reaction", seq: reaction.id, at: now, turnId: r.turn.id };
    r.requests[key] = ack2;
    touch(r, now);
    return ack2;
  }
  if (r.phase !== "open") fail("BUSY", r.phase === "react" ? "Someone got there first. You can still react!" : "Wait for the next opening.");
  if (r.lastActorId === p.id && now < r.priorityUntil && r.players.filter((x) => x.connected && !x.muted && !x.isBot).length > 1) fail("COOLDOWN", "Give someone else a shot \u2014 your opening returns in a few seconds.");
  const dynamic = itemPlan(r, p, text);
  const intent = dynamic ? dynamic.verb === "rest" ? "heal" : "world" : classify(text);
  if (p.hp <= 0 && intent !== "heal") fail("KNOCKED_OUT", "You\u2019re on the floor. Rest, eat, or drink to get back up.");
  const e = event(r, "declaration", text, now, { playerId: p.id, name: p.name });
  r.round++;
  r.turn = {
    id: uid(),
    seq: e.id,
    actorId: p.id,
    action: text,
    intent,
    target: targetFor(r, p, text),
    at: now,
    deadline: now + r.reactionMs,
    reactions: [],
    travelElectorate: r.players.filter((x) => x.id === p.id || x.connected && !x.muted && !x.isBot).map((x) => x.id)
  };
  if (dynamic) {
    r.turn.worldAction = true;
    r.turn.worldLocked = dynamic.verb !== "unsupported" && !dynamic.unresolvedTarget;
    if (dynamic.unresolvedTarget) r.turn.worldPendingVerb = dynamic.verb;
    const key2 = dynamic.targetId || dynamic.recipientId || dynamic.itemId || dynamic.sourceIds?.[0];
    const item = r.world.expedition.items[key2] || r.world.expedition.creatures?.[key2];
    r.turn.target = { kind: "world", entityId: item?.id, name: item?.name || dynamic.destination || dynamic.target || "materials", position: item ? worldEntityPosition(r, item) : [480, 490] };
  }
  r.phase = "react";
  r.deadline = r.turn.deadline;
  r.result = null;
  p.status = "committed";
  p.cover = false;
  const ack = { ok: true, accepted: true, kind: "action", seq: e.id, at: now, turnId: r.turn.id };
  r.requests[key] = ack;
  const keys = Object.keys(r.requests);
  if (keys.length > 1200) keys.slice(0, 300).forEach((k) => delete r.requests[k]);
  touch(r, now);
  return ack;
}
var randomSources = /* @__PURE__ */ new WeakMap();
function withGameRng(room, rng, run) {
  rng.restore(room.seed);
  randomSources.set(room, rng);
  try {
    return run();
  } finally {
    room.seed = rng.snapshot();
    randomSources.delete(room);
  }
}
function random(r) {
  const rng = randomSources.get(r) || new Rng(r.seed), value = rng.next();
  r.seed = rng.snapshot();
  return value;
}
var pick = (r, a) => a[Math.floor(random(r) * a.length)];
var hurt = (p, n) => {
  const before = p.hp;
  p.hp = clamp(p.hp - n, 0, p.maxHp);
  return before - p.hp;
};
var heal = (p, n) => {
  const before = p.hp;
  p.hp = clamp(p.hp + n, 0, p.maxHp);
  return p.hp - before;
};
function resolve(r, now) {
  const t = r.turn, p = r.players.find((x) => x.id === t.actorId);
  if (!p) return;
  if (t.ai?.status === "thinking") t.ai = { ...t.ai, status: "fallback", reason: "The turn resolved before local AI finished. Game rules were used." };
  const sorted = [...t.reactions].sort((a, b) => a.id - b.id);
  const helpers = sorted.filter((x) => x.kind === "assist" || x.kind === "custom" && !/\b(stop|prevent|block|intervene)\b/i.test(x.text));
  const blockers = sorted.filter((x) => x.kind === "intervene" || x.kind === "custom" && /\b(stop|prevent|block|intervene)\b/i.test(x.text));
  const hostile = t.worldAction || ["attack", "steal", "magic", "break"].includes(t.intent);
  const dynamic = t.worldAction ? t.worldProposal ? planWorldProposal(r, p, t.worldProposal) || { verb: "unsupported", error: "The selected action is no longer available.", automatic: true, dc: 0, ability: "Interaction" } : itemPlan(r, p, t.rulesText || t.action) : null;
  if (dynamic && !dynamic.error && ["travel", "explore"].includes(dynamic.verb)) {
    const electorate = t.travelElectorate || r.players.filter((x) => x.connected && !x.muted && !x.isBot).map((x) => x.id);
    const yes = /* @__PURE__ */ new Set([t.actorId, ...sorted.filter((x) => x.kind === "assist").map((x) => x.playerId)]);
    const votes = electorate.filter((id) => yes.has(id)).length, required = Math.floor(electorate.length / 2) + 1;
    t.travelVote = { yes: votes, required };
    if (votes < required) dynamic.error = `The party stays here: travel received ${votes}/${required} required votes. Choose Help them to vote yes during the reaction window.`;
  }
  if (dynamic && t.worldBlueprint) Object.assign(dynamic, t.worldBlueprint);
  const check = dynamic || environmentCheck(r.world, t.target, t.intent, t.rulesText || t.action);
  const automatic = !!check?.automatic;
  const situation = [];
  let advantage = check?.advantage || 0;
  if (t.intent === "sneak" && r.world.bartender === "friendly") {
    advantage = 1;
    situation.push("Marnie covers for you");
  }
  if (t.intent === "flee" && r.world.guards === "distracted") {
    advantage = 1;
    situation.push("Guards distracted");
  }
  if (t.intent === "flee" && ["open", "broken"].includes(r.world.props?.door)) {
    advantage = 1;
    situation.push("Exit cleared");
  }
  if (t.intent === "steal" && r.world.guards === "distracted") {
    advantage = 1;
    situation.push("Guards distracted");
  }
  if (["sneak", "steal"].includes(t.intent) && Object.entries(r.world.objects || {}).filter(([id, s]) => OBJECTS[id]?.lit && s.lit === false).length >= 3) {
    advantage = 1;
    situation.push("Room dimmed");
  }
  if (["dance", "flee", "attack", "break"].includes(t.intent) && Object.values(r.world.objects || {}).some((s) => s.spilled)) {
    advantage = -1;
    situation.push("Slippery floor");
  }
  if (p.injuries?.length && check?.ability === "Athletics") {
    advantage = -1;
    situation.push("Injured");
  }
  const dice = automatic ? [] : [1 + Math.floor(random(r) * 20)];
  if (!automatic && advantage) dice.push(1 + Math.floor(random(r) * 20));
  let roll = automatic ? 0 : advantage ? selectD20(dice, advantage) : dice[0], rerolled = null;
  if (!automatic && p.perk === "lucky" && roll <= 3) {
    rerolled = roll;
    roll = 1 + Math.floor(random(r) * 20);
  }
  const skill = ROLES[p.role].skills.includes(t.intent) || ["interact", "world"].includes(t.intent) && (check?.ability === "Athletics" && p.role === "knight" || check?.ability === "Arcana" && p.role === "wizard" || check?.ability === "Sleight of hand" && p.role === "rogue") ? 3 : 0;
  const charm = p.perk === "charming" && ["social", "dance"].includes(t.intent) ? 2 : 0;
  const assistance = Math.min(4, helpers.length), interference = hostile ? Math.min(4, blockers.length) : 0;
  const training = Math.min(3, Math.floor((p.level || 1) / 3));
  const modifier = skill + charm + assistance - interference + training;
  const dc = automatic ? 0 : check?.dc ?? { heal: 6, flee: r.quest.crown ? 12 : 8, inspect: 9, social: 10, dance: 9, sneak: 10, steal: 13, magic: 12, attack: 12, break: 11, weird: 10, interact: 10 }[t.intent];
  const critical = roll === 20;
  let success = automatic || critical || roll !== 1 && roll + modifier >= dc;
  const effects = [], changes = [], sceneEvents = [];
  let narration = "", unsupported = false;
  const add2 = (s) => changes.push(s);
  const fx = (verb, target2 = t.target.kind) => effects.push({ verb, actorId: p.id, target: target2, targetId: t.target.id || null });
  const damage = (who, n) => {
    let d = hurt(who, n);
    if (d) add2(`${who.name} \u2212${d} HP`);
  };
  const recovery = (who, n) => {
    let h = heal(who, n);
    if (h) add2(`${who.name} +${h} HP`);
  };
  p.actions++;
  r.stats.actions++;
  if (!automatic) r.stats.rolls++;
  if (critical) p.nat20++;
  const target = r.players.find((x) => x.id === t.target.id);
  const damageNpc = (n) => {
    if (!["guard", "bartender", "goblin"].includes(t.target.kind)) return;
    const npcs = r.world.npcs ||= {}, npc = npcs[t.target.kind] ||= { hp: 8, maxHp: 8 };
    npc.hp = Math.max(0, npc.hp - n);
    add2(`${t.target.name} ${npc.hp}/8 HP`);
    if (!npc.hp) {
      npc.status = "knocked out";
      add2(`${t.target.name} KNOCKED OUT`);
      if (t.target.kind === "guard") r.world.guards = "distracted";
    }
  };
  const props = r.world.props || (r.world.props = { rug: true });
  const environmental = dynamic ? null : interactEnvironment(r.world, t.target, t.intent, success, p, { text: t.rulesText || t.action });
  if (dynamic) {
    const outcome = resolveItem(r, p, dynamic, success);
    success = outcome.success;
    unsupported = outcome.blocked;
    narration = outcome.text;
    if (outcome.change) add2(outcome.change);
    const scene = createWorldScene(r, p, dynamic, outcome, t.target);
    effects.push(...scene.effects);
    sceneEvents.push(...scene.events);
  } else if (environmental) {
    success = environmental.success;
    narration = environmental.text;
    if (environmental.change) add2(environmental.change);
    fx({ break: "impact", ignite: "fire", extinguish: "smoke", take: "steal", repair: "hearts", push: "impact" }[environmental.verb] || "inspect");
    r.chaos += environmental.chaos;
    if (environmental.damage) damage(p, environmental.damage);
    if (environmental.cover) {
      p.status = "hiding";
      p.cover = true;
    }
  } else switch (t.intent) {
    case "heal":
      recovery(target || p, success ? 4 : 2);
      fx("hearts", target ? "player" : "self");
      narration = success ? pick(r, [`${p.name} discovers the ancient healing art of sitting down. It works.`, `${p.name} administers tavern medicine. Marnie refuses to list the ingredients.`, `${p.name} takes a well-earned breather. Even the guards respect snack time.`]) : `${p.name} drops half the remedy. The remaining half does its best.`;
      r.chaos = Math.max(0, r.chaos - 1);
      break;
    case "attack":
      fx("melee");
      r.chaos += success ? 2 : 1;
      if (success) {
        if (target) damage(target, critical ? 3 : 2);
        if (["guard", "bartender", "goblin"].includes(t.target.kind)) {
          const npcs = r.world.npcs ||= {}, npc = npcs[t.target.kind] ||= { hp: 8, maxHp: 8 };
          npc.hp = Math.max(0, npc.hp - (critical ? 4 : 2));
          add2(`${t.target.name} ${npc.hp}/8 HP`);
          if (!npc.hp) {
            npc.status = "knocked out";
            add2(`${t.target.name} KNOCKED OUT`);
            if (t.target.kind === "guard") r.world.guards = "distracted";
          }
        }
        narration = pick(r, [`${p.name} lands it. ${t.target.name} looks personally offended by the physics.`, `${p.name} connects. A barstool rattles.`, `${p.name} wins this exchange. The goblin starts playing fight music.`]);
      } else {
        damage(p, 2);
        fx("hit", "self");
        narration = pick(r, [`${p.name} commits fully. Unfortunately, so does the floor.`, `${p.name} misses. Captain Brick calls it \u201Ca useful demonstration.\u201D`, `${p.name} swings with confidence and lands with a very different sound.`]);
      }
      break;
    case "steal":
      fx("steal");
      r.chaos += 2;
      if (t.target.kind === "rug") {
        if (objectState(r.world, "rug").condition === "taken") {
          success = false;
          unsupported = true;
          narration = `${p.name} reaches for the rug, but the floor is bare. Someone already made off with it.`;
          add2("The rug is already gone");
        } else if (success) {
          props.rug = false;
          (r.world.objects ||= {}).rug = { ...objectState(r.world, "rug"), condition: "taken" };
          p.inventory.push("The Tavern Rug");
          add2("RUG STOLEN");
          narration = `${p.name} pulls the tavern rug free and rolls it under one arm. Bare floorboards remain where it stood.`;
        } else {
          damage(p, 1);
          narration = `${p.name} gets one corner up. The rug snaps back and the tavern keeps its footing.`;
          fx("hit", "self");
        }
      } else if (success) {
        if (r.quest.clues >= 3 && !r.quest.crown && ["chest", "bartender", "room"].includes(t.target.kind)) {
          r.quest.crown = true;
          r.quest.carrierId = p.id;
          p.inventory.push("The Duke\u2019s Crown");
          p.score += 5;
          add2("THE CROWN IS YOURS");
          narration = `${p.name} lifts the ridiculous golden crown. It jingles like cutlery. The guards have definitely noticed. Find a way out!`;
          fx("crown");
        } else {
          p.gold += 2;
          add2(`${p.name} +2 coins`);
          narration = pick(r, [`${p.name} pockets two coins and a deeply unnecessary amount of confidence.`, `${p.name} has very quick hands. The room suddenly checks its pockets.`, `${p.name} makes a clean getaway. The stolen spoons are, technically, treasure.`]);
        }
      } else {
        damage(p, 1);
        narration = `${p.name} gets caught reaching. Marnie produces a wooden spoon with disturbing speed.`;
        fx("hit", "self");
      }
      break;
    case "magic":
      fx("spell");
      r.chaos += 2;
      if (success) {
        const offensive = /\b(fire|fireball|lightning|bolt|blast|zap|freeze)\b/i.test(t.rulesText || t.action);
        narration = offensive ? `${p.name}'s spell strikes ${t.target.name}. The impact leaves a very real mark.` : pick(r, [`${p.name} bends reality just enough to make everyone extremely uncomfortable.`, `${p.name} casts it. The goblin briefly glows. He charges extra for that.`, `${p.name} makes magic happen. Three guards immediately blame each other.`]);
        if (offensive) {
          if (target) damage(target, critical ? 4 : 2);
          else damageNpc(critical ? 4 : 2);
        } else if (target) recovery(target, 1);
        if (t.target.kind === "guard") {
          r.world.guards = "distracted";
          add2("GUARDS DISTRACTED");
        }
      } else {
        damage(p, 2);
        fx("fire", "self");
        narration = pick(r, [`${p.name} summons a very small problem with very large eyebrows. It explodes.`, `${p.name} gets the spell mostly right. \u201CMostly\u201D is doing a lot of work here.`, `${p.name} accidentally enchants their own boots. The boots are furious.`]);
      }
      break;
    case "break":
      fx("impact");
      r.chaos += 2;
      if (success) {
        narration = `${p.name} makes an entrance. Or an exit. The building no longer has an opinion.`;
        p.gold++;
        add2(`${p.name} +1 coin`);
      } else {
        damage(p, 2);
        narration = `${p.name} tests the tavern\u2019s structural integrity. The tavern wins.`;
        fx("hit", "self");
      }
      break;
    case "flee":
      fx("flee", "door");
      if (success && r.quest.crown) {
        r.quest.escaped = true;
        r.quest.escapedBy = p.id;
        p.score += 5;
        narration = `${p.name} kicks open the door. The whole party spills into the night with the crown, the goblin, and a truly impressive bar tab. HEIST COMPLETE.`;
        add2("PARTY VICTORY");
      } else if (success) {
        p.status = "hiding";
        r.chaos = Math.max(0, r.chaos - 2);
        narration = `${p.name} escapes to the doorway. Excellent survival instincts. Unfortunately, the crown is still inside.`;
        add2("Chaos \u22122");
      } else {
        damage(p, 1);
        narration = `${p.name} makes for the door. Captain Brick is already standing in it. Awkward.`;
      }
      break;
    case "dance":
      fx("dance");
      if (success) {
        r.world.guards = "distracted";
        r.chaos = Math.max(0, r.chaos - 2);
        p.gold++;
        add2(`${p.name} +1 coin`);
        add2("GUARDS DISTRACTED");
        narration = pick(r, [`${p.name} steals the show. One guard forgets why he works here.`, `${p.name} performs. The goblin sheds a single professional tear.`, `${p.name} gets the whole tavern involved. Captain Brick has surprisingly good rhythm.`]);
      } else {
        r.chaos++;
        narration = `${p.name} puts on a show. The silence afterward is somehow louder than the music.`;
      }
      break;
    case "social":
      fx("hearts");
      if (success) {
        r.chaos = Math.max(0, r.chaos - 1);
        r.world.bartender = "friendly";
        if (t.target.kind === "guard") {
          r.world.guards = "distracted";
          add2("GUARDS DISTRACTED");
        }
        narration = pick(r, [`${p.name} talks their way into everyone\u2019s good graces. Suspiciously effective.`, `${p.name} says exactly the right thing. Marnie pretends she isn\u2019t impressed.`, `${p.name} wins the room over. The guards lower their guard, which feels redundant.`]);
      } else {
        narration = `${p.name} gives it a shot. Marnie raises one eyebrow and the price of everything.`;
        r.chaos++;
      }
      break;
    case "inspect":
      fx("inspect");
      narration = success ? `${p.name} investigates. Beneath the spilled ale and bad decisions, an actual clue turns up.` : `${p.name} searches thoroughly. This would be more useful if the barrel wasn\u2019t just a barrel.`;
      break;
    case "sneak":
      fx("sneak");
      if (success) {
        r.chaos = Math.max(0, r.chaos - 1);
        narration = `${p.name} slips past unnoticed. The goblin narrates it anyway. Very quietly.`;
      } else {
        narration = `${p.name} steps on the one floorboard with an opinion. Everyone looks over.`;
        r.chaos++;
      }
      break;
    default:
      fx("weird");
      success = false;
      unsupported = true;
      narration = `${p.name} tries \u201C${t.action}\u201D. This attempt is not supported yet. Name a person or object and try inspecting, moving, taking, breaking, talking, hiding, or casting a spell.`;
      break;
  }
  for (const change of advanceWorld(r)) add2(change);
  if (success && !automatic && !environmental?.blocked) p.score += critical ? 5 : 2;
  if (currentLocation(r) === "tavern") for (const change of advanceEnvironment(r.world)) add2(change);
  if (Object.values(r.world.objects || {}).some((s) => s.condition === "burning")) r.chaos++;
  if (!success && ["dance", "flee", "attack", "break"].includes(t.intent) && Object.entries(r.world.objects || {}).some(([id, s]) => s.spilled || OBJECTS[id]?.material === "glass" && s.condition === "broken")) {
    damage(p, 1);
    add2("HAZARD: slippery ale or broken glass");
  }
  if (success && (!environmental || t.intent === "inspect" && t.target.kind === "counter") && !r.quest.crown && ["inspect", "social", "dance", "sneak", "weird", "magic"].includes(t.intent)) {
    if (r.quest.clues < 3) {
      r.quest.clues++;
      const facts = ["Marnie saw the Duke hide something behind the bar.", "The goblin\u2019s song mentions a chest and a golden hat.", "The crown is in the chest behind the bar. Steal it!"];
      const fact = facts[r.quest.clues - 1];
      r.world.facts.push(fact);
      add2(`Clue ${r.quest.clues}/3`);
      narration += " " + fact;
    }
  }
  for (const react of sorted) {
    const rp = r.players.find((x) => x.id === react.playerId);
    if (!rp) continue;
    if (react.kind === "flee") {
      rp.status = "hiding";
      effects.push({ verb: "flee", actorId: rp.id, target: "door" });
      continue;
    }
    rp.assists++;
    if (success) rp.score++;
    if (react.kind === "intervene") r.chaos = Math.max(0, r.chaos - 1);
    if (react.kind === "custom" && classify(react.text) === "heal") recovery(p, 1);
  }
  if (helpers.length) narration += ` ${helpers.length === 1 ? r.players.find((x) => x.id === helpers[0].playerId)?.name : helpers.length + " accomplices"} ${helpers.length === 1 ? "helps" : "help"} sell it.`;
  if (blockers.length) narration += ` ${blockers.length === 1 ? "One voice of reason tries" : "The voices of reason try"} to rein things in.`;
  r.chaos = clamp(r.chaos, 0, 10);
  if (currentLocation(r) === "tavern" && r.chaos >= 10 && !r.quest.escaped) {
    const exposed = r.players.filter((x) => x.connected && x.status !== "hiding");
    for (const rp of exposed) hurt(rp, 1);
    r.chaos = 5;
    r.world.guards = "alert";
    add2("Guard sweep: exposed players \u22121 HP");
    narration += " The guards sweep the room. Anyone who stayed in the open takes a hit.";
    effects.push({ verb: "alarm", actorId: p.id, target: "guard" });
  }
  for (const rp of r.players) {
    const level = Math.min(20, 1 + Math.floor(rp.score / 20));
    if (level > (rp.level || 1)) {
      const gained = level - (rp.level || 1);
      rp.maxHp += gained * 2;
      rp.hp = Math.min(rp.maxHp, rp.hp + gained * 2);
      add2(rp.name + " LEVEL " + level);
    }
    rp.level = level;
  }
  for (const rp of r.players) if (rp.hp === 0) rp.status = "knocked out";
  if (r.quest.crown) r.world.guards = "searching";
  r.lastActorId = p.id;
  r.priorityUntil = now + 12500;
  r.result = {
    id: t.id,
    playerId: p.id,
    name: p.name,
    action: t.action,
    intent: t.intent,
    target: t.target,
    ai: t.ai ? structuredClone(t.ai) : null,
    roll,
    rerolled,
    modifier,
    skill,
    charm,
    assistance,
    interference,
    total: automatic ? 0 : roll + modifier,
    dc,
    success,
    critical: critical && success,
    automatic,
    dice,
    advantage,
    situation,
    check: check?.ability || t.intent,
    blocked: !!environmental?.blocked || unsupported,
    narration,
    changes,
    effects,
    ...dynamic ? { sceneEvents } : {},
    reactions: sorted.map((x) => ({ playerId: x.playerId, kind: x.kind, text: x.text, seq: x.id })),
    at: now
  };
  r.phase = "reveal";
  r.deadline = now + 6500;
  recordDMMemory(r);
  event(r, "outcome", narration, now, { playerId: p.id, success, roll, turnId: t.id });
  touch(r, now);
}
function advance(r, now = Date.now()) {
  if (r.paused) return false;
  if (r.phase === "react" && now >= r.deadline) {
    resolve(r, now);
    return true;
  }
  if (r.phase === "reveal" && now >= r.deadline) {
    r.phase = r.world.expedition?.expedition?.status === "completed" || r.quest.escaped && !r.world.expedition?.campaign?.continuing ? "ended" : "open";
    r.deadline = 0;
    for (const p of r.players) if (p.hp > 0) p.status = p.cover ? "hiding" : "ready";
    touch(r, now);
    return true;
  }
  return false;
}
function hostCommand(r, command, now = Date.now()) {
  if (command.type === "continueCampaign") {
    if (["react", "reveal", "lobby"].includes(r.phase)) fail("PHASE", "Finish the current scene before continuing the campaign.");
    beginExpedition(ensureItems(r));
    if (r.world.expedition.expedition.status === "completed") r.world.expedition.expedition.status = "epilogue";
    ensureItems(r).campaign.heistCompleted = ensureItems(r).campaign.heistCompleted || r.quest.escaped;
    ensureItems(r).campaign.continuing = true;
    r.phase = "open";
    r.quest.escaped = false;
    r.deadline = 0;
    event(r, "story", "The crown job was only the beginning. The road beyond the tavern is open.", now);
    touch(r, now);
    return;
  }
  if (command.type === "start") return startGame(r, now);
  if (command.type === "pause") {
    if (!r.paused) {
      r.remaining = Math.max(0, r.deadline - now);
      r.paused = true;
    } else {
      r.paused = false;
      if (r.deadline) {
        r.deadline = now + (r.remaining || 0);
        if (r.turn && r.phase === "react") r.turn.deadline = r.deadline;
      }
    }
  } else if (command.type === "resolve") {
    if (r.phase !== "react" && r.phase !== "reveal") fail("PHASE", "There is no timer to skip.");
    r.deadline = now;
    if (r.turn) r.turn.deadline = now;
    if (!r.paused) advance(r, now);
  } else if (command.type === "mute") {
    const p = r.players.find((x) => x.id === command.playerId);
    if (!p) fail("PLAYER", "No such player.");
    p.muted = !p.muted;
  } else if (command.type === "resetScene") {
    r.phase = "open";
    r.turn = null;
    r.result = null;
    r.deadline = 0;
    r.chaos = 0;
    r.paused = false;
    r.world.props = { rug: true };
    r.world.objects = {};
    r.world.npcs = {};
    r.world.guards = "bored";
    for (const p of r.players) {
      p.hp = Math.max(p.hp, 4);
      p.status = "ready";
      p.cover = false;
    }
    event(r, "story", "Marnie claps her hands. \u201CEveryone breathe. We\u2019re starting that bit again.\u201D", now);
  } else if (command.type === "redact") {
    const e = r.events.find((x) => x.id === command.eventId);
    if (e) e.text = "[Hidden by the host]";
    if (r.turn) {
      r.turn.action = "[Hidden by the host]";
      r.turn.reactions.forEach((x) => x.text = "[Hidden by the host]");
    }
    if (r.result) {
      redactDMMemory(r, r.result.id);
      r.result.action = "[Hidden by the host]";
      r.result.narration = "The host moved this scene along.";
      r.result.story = { status: "fallback" };
      r.result.reactions.forEach((x) => x.text = "[Hidden by the host]");
    }
    const turnId = e?.turnId || (e?.type === "declaration" ? r.events.find((x) => x.type === "outcome" && x.playerId === e.playerId && x.at >= e.at)?.turnId : null);
    if (turnId) {
      redactDMMemory(r, turnId);
      for (const row of r.events) if (row.turnId === turnId) row.text = "[Hidden by the host]";
    }
  } else if (command.type === "newStory") {
    const fresh = createRoom({ code: r.code, seed: r.seed, now, reactionMs: r.reactionMs });
    const players = r.players.map((p) => ({ ...p, hp: p.maxHp, gold: 3, inventory: ["Bent spoon"], actions: 0, assists: 0, score: 0, nat20: 0, status: "ready", cover: false }));
    Object.assign(r, fresh, { players, seq: r.seq, revision: r.revision, requests: r.requests });
    event(r, "story", "A fresh night. The same terrible judgment.", now);
  } else if (command.type === "window") {
    r.reactionMs = clamp(Number(command.ms) || 8e3, 4e3, 12e3);
  } else fail("COMMAND", "Unknown host action.");
  touch(r, now);
}

// public/world-ai.js
var WORLD_VERBS = ["craft", "attach", "give", "equip", "unequip", "take", "steal", "drop", "separate", "inspect", "use", "travel", "explore", "talk", "pacify", "attack", "harvest", "treat", "fill", "drink", "open", "close", "unlock", "move", "ignite", "extinguish", "repair", "put", "rest", "unsupported"];
var APPEARANCE_PALETTE = { red: "#d87878", blue: "#7ea7d4", green: "#83b48a", gold: "#dfc16e", purple: "#bd88cf", white: "#e4dcc8", black: "#484552", brown: "#b88955", cyan: "#7dc7cf" };
var APPEARANCE_COLORS = Object.values(APPEARANCE_PALETTE);
var WORLD_PLAN_SCHEMA = { type: "object", properties: { domain: { type: "string", enum: ["world"] }, verb: { type: "string", enum: WORLD_VERBS }, target: { type: "string" }, item: { type: "string" }, sources: { type: "array", items: { type: "string" }, maxItems: 4 }, name: { type: "string", maxLength: 48 }, itemType: { type: "string", enum: ["wearable", "tool", "container", "fragment"] }, slot: { type: "string", enum: ["head", "body", "hand"] }, color: { type: "string", enum: APPEARANCE_COLORS }, summary: { type: "string", maxLength: 160 } }, required: ["domain", "verb", "target", "item", "sources", "name", "itemType", "slot", "color", "summary"], additionalProperties: false };
function validateWorldPlan(raw, room, actorId) {
  if (voicePacification(room.turn?.action || "") && !["pacify", "unsupported"].includes(raw.verb)) throw Error("A vocal pacification cannot become a different mechanical action");
  const allowed = Object.keys(WORLD_PLAN_SCHEMA.properties);
  if (Object.keys(raw).some((k) => !allowed.includes(k)) || !WORLD_VERBS.includes(raw.verb) || typeof raw.summary !== "string" || raw.summary.length > 160) throw Error("Invalid world interpretation");
  for (const key of ["target", "item", "name"]) if (raw[key] !== void 0 && (typeof raw[key] !== "string" || raw[key].length > 100)) throw Error("Invalid entity reference");
  if (raw.sources !== void 0 && (!Array.isArray(raw.sources) || raw.sources.length > 4 || raw.sources.some((x) => typeof x !== "string" || x.length > 100))) throw Error("Invalid component references");
  const actor = room.players.find((p) => p.id === actorId);
  if (!actor) throw Error("Unknown actor");
  const s = ensureItems(room), entity = (id) => s.items[id] || s.creatures[id] || room.players.find((p) => p.id === id);
  const itemIds = new Set(visibleItems(room).map((i) => i.id));
  const entityIds = /* @__PURE__ */ new Set([...itemIds, ...visibleCreatures(room).map((c) => c.id), ...room.players.map((p) => p.id)]);
  const owned = new Set(visibleItems(room).filter((i) => i.ownerId === actorId).map((i) => i.id));
  if (raw.verb !== "unsupported") {
    if (raw.verb === "craft") {
      if (!raw.name || raw.name.length > 48 || /[<>\r\n]/.test(raw.name) || !Array.isArray(raw.sources) || raw.sources.length < 2 || raw.sources.some((id) => !owned.has(id))) throw Error("Invalid carried crafting sources");
    } else if (raw.verb === "travel") {
      if (!s.locations[s.current].exits.includes(raw.target)) throw Error("Unknown or disconnected destination");
    } else if (!["rest", "explore"].includes(raw.verb) && !entityIds.has(raw.target)) throw Error("Unknown or unavailable world entity");
    if (raw.item && !owned.has(raw.item)) throw Error("Choose a carried item for this action");
  }
  const plan = planWorldProposal(room, actor, raw), text = raw.verb + " " + (raw.target || raw.name || "");
  if (raw.verb === "unsupported") return { intent: "world", rulesText: text, target: { kind: "world", name: "the surroundings", position: [480, 335] }, worldAction: true, proposal: structuredClone(raw), verb: raw.verb, summary: raw.summary };
  if (!plan || plan.error) throw Error(plan?.error || "Unsupported world primitive");
  if (actor.hp <= 0 && plan.verb !== "rest") throw Error("Knocked out adventurers must recover");
  let blueprint;
  if (raw.verb === "craft") {
    if (!["wearable", "tool", "container", "fragment"].includes(raw.itemType) || !["head", "body", "hand"].includes(raw.slot) || !APPEARANCE_COLORS.includes(raw.color)) throw Error("Unsupported appearance");
    blueprint = { creationType: raw.itemType, creationSlot: raw.slot, creationColor: raw.color };
  }
  const target = entity(plan.targetId || plan.recipientId || plan.itemId || plan.sourceIds?.[0]);
  return { intent: plan.verb === "rest" ? "heal" : "world", rulesText: text, target: { kind: "world", entityId: target?.id, name: target?.name || plan.destination || "the surroundings", position: target ? worldEntityPosition(room, target) : [480, 335] }, worldAction: true, proposal: structuredClone(raw), blueprint, verb: raw.verb, summary: raw.summary.replace(/[\u0000-\u001f\u007f]/g, " ").trim() };
}

// public/ai-plan.js
var AI_VERBS = ["inspect", "take", "break", "open", "close", "push", "ignite", "extinguish", "repair", "hide", "climb", "pour", "attack", "social", "heal", "dance", "sneak", "flee", "magic", "unsupported"];
var names = { guard: "Captain Brick", bartender: "Marnie", goblin: "the fiddler", room: "the tavern" };
var mapping = { inspect: ["inspect", "Inspect"], take: ["steal", "Steal"], break: ["break", "Smash"], open: ["interact", "Open"], close: ["interact", "Close"], push: ["interact", "Push"], ignite: ["interact", "Ignite"], extinguish: ["interact", "Extinguish"], repair: ["interact", "Repair"], hide: ["sneak", "Hide behind"], climb: ["interact", "Climb onto"], pour: ["interact", "Spill"], attack: ["attack", "Attack"], social: ["social", "Talk to"], heal: ["heal", "Heal"], dance: ["dance", "Dance for"], sneak: ["sneak", "Sneak past"], flee: ["flee", "Flee through"], magic: ["magic", "Cast a spell at"], unsupported: ["weird", "Unsupported attempt at"] };
function validateAIPlan(raw, room, actorId) {
  if (raw?.domain === "world") return validateWorldPlan(raw, room, actorId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some((k) => !["verb", "target", "summary"].includes(k))) throw new Error("Invalid interpretation fields");
  if (!AI_VERBS.includes(raw.verb) || typeof raw.target !== "string" || typeof raw.summary !== "string" || raw.summary.length > 160) throw new Error("Invalid interpretation");
  const player = room.players.find((p) => p.id === raw.target || raw.target === "self" && p.id === actorId);
  let target;
  if (player) target = { kind: "player", id: player.id, name: player.name };
  else if (Object.hasOwn(OBJECTS, raw.target)) target = { kind: raw.target, name: OBJECTS[raw.target].name };
  else if (Object.hasOwn(names, raw.target)) target = { kind: raw.target, name: names[raw.target] };
  else throw new Error("Unknown interpretation target");
  let [intent, verb] = mapping[raw.verb];
  if (raw.verb === "ignite" && ["guard", "bartender", "goblin", "player"].includes(target.kind)) {
    intent = "magic";
    verb = "Cast fire at";
  }
  if (raw.verb === "flee" && target.kind !== "door") throw new Error("Escape must target the door");
  if (raw.verb === "heal" && target.kind !== "player") throw new Error("Healing must target a character");
  return { verb: raw.verb, intent, target, rulesText: `${verb} ${target.name}`, summary: raw.summary.replace(/[\u0000-\u001f\u007f]/g, " ").trim() };
}
function applyAIPlan(room, turnId, raw, model, now = Date.now()) {
  const t = room.turn;
  if (room.phase !== "react" || room.paused || !t || t.ai?.status === "applied" || t.worldLocked || t.id !== turnId || now >= t.deadline - 800) return false;
  if (room.world.expedition?.current !== "tavern" && room.world.expedition?.current && raw?.domain !== "world") throw new Error("Tavern interpretations cannot affect remote locations");
  if (t.worldPendingVerb && raw.verb !== t.worldPendingVerb && raw.verb !== "unsupported") throw Error("Interpretation changed the declared action instead of resolving its target");
  const plan = validateAIPlan(raw, room, t.actorId);
  const actor = room.players.find((p) => p.id === t.actorId);
  if (actor.hp <= 0 && plan.intent !== "heal") throw new Error("Knocked out characters must recover");
  t.intent = plan.intent;
  t.target = plan.target;
  t.rulesText = plan.rulesText;
  if (plan.worldAction) {
    t.worldAction = true;
    t.worldBlueprint = plan.blueprint;
    t.worldProposal = plan.proposal;
  } else {
    t.worldAction = false;
    delete t.worldBlueprint;
    delete t.worldProposal;
  }
  if (t.worldPendingVerb) {
    delete t.worldPendingVerb;
    t.worldLocked = true;
  }
  t.ai = { status: "applied", model, summary: plan.summary, verb: plan.verb };
  room.revision++;
  room.updatedAt = now;
  return true;
}

// vendor/partyframe/packages/kit/src/net/clock.ts
var SAMPLE_COUNT = 7;
var WARMUP_INTERVAL_MS = 250;
var WARMUP_PROBES = 5;
var STEADY_INTERVAL_MS = 1e4;
var ClockSync = class {
  constructor(sendPing) {
    this.sendPing = sendPing;
    this.samples = [];
    this.offsetMs = 0;
    this.roundTripMs = 0;
    this.timer = null;
    this.probesSent = 0;
  }
  /** Server time in epoch ms, as best this client can tell. */
  now() {
    return Date.now() + this.offsetMs;
  }
  /** Milliseconds until an absolute server deadline, floored at zero. */
  remaining(serverDeadlineMs) {
    return Math.max(0, serverDeadlineMs - this.now());
  }
  get offset() {
    return this.offsetMs;
  }
  /** Last measured round trip, surfaced in the developer panel. */
  get rtt() {
    return this.roundTripMs;
  }
  get synced() {
    return this.samples.length > 0;
  }
  start() {
    this.stop();
    this.probesSent = 0;
    this.probe();
  }
  stop() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  /** Clears samples so a reconnection re-measures rather than trusting old data. */
  reset() {
    this.samples = [];
    this.probesSent = 0;
  }
  handlePong(t0, t1) {
    const t2 = Date.now();
    const rtt = t2 - t0;
    if (rtt > 4e3) return;
    this.roundTripMs = rtt;
    this.samples.push(t1 - (t0 + rtt / 2));
    if (this.samples.length > SAMPLE_COUNT) this.samples.shift();
    const sorted = [...this.samples].sort((a, b) => a - b);
    this.offsetMs = sorted[Math.floor(sorted.length / 2)] ?? 0;
  }
  probe() {
    this.sendPing(Date.now());
    this.probesSent += 1;
    const interval = this.probesSent < WARMUP_PROBES ? WARMUP_INTERVAL_MS : STEADY_INTERVAL_MS;
    this.timer = setTimeout(() => this.probe(), interval);
  }
};

// src/framework-entry.ts
Encoder.BUFFER_SIZE = 128 * 1024;
var GAME_ID = "chaos-tavern";
var UPSTREAM_COMMIT = "e73cc35bfa561048cd9728991bafeeca5548e953";
var services;
var liveRooms = /* @__PURE__ */ new Map();
var recoverAttempts = /* @__PURE__ */ new Map();
var equal = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
var error = (code, message) => {
  throw new RuleError(code, message);
};
var viewCache = /* @__PURE__ */ new WeakMap();
function projection(room) {
  const previous = viewCache.get(room);
  if (previous?.revision === room.revision) return previous.view;
  const view = publicRoom(room);
  view.framework = { name: "PartyFrame", commit: UPSTREAM_COMMIT, transport: "Colyseus" };
  viewCache.set(room, { revision: room.revision, view });
  return view;
}
function settle(ctx) {
  const state = ctx.state, room = state.room;
  if (!room) return;
  for (const [platformId, id] of Object.entries(state.seatMap)) {
    const p = room.players.find((p2) => p2.id === id);
    if (p && ctx.players.has(platformId)) ctx.players.setScore(platformId, p.score);
  }
  ctx.requestStatus(room.phase === "ended" ? "GAME_OVER" : room.phase === "reveal" ? "ROUND_END" : "PLAYING");
}
var actionSchema = z2.object({ requestId: z2.string().min(1).max(90), text: z2.string().min(2).max(180), kind: z2.enum(["action", "reaction"]).optional(), reaction: z2.enum(["assist", "intervene", "flee", "custom"]).optional(), turnId: z2.string().max(90).optional() });
var chaosGame = {
  id: GAME_ID,
  nameKey: "chaos.name",
  minPlayers: 1,
  maxPlayers: 24,
  actionSchema,
  parseOptions: (raw) => ({ reactionMs: Math.min(12e3, Math.max(4e3, Number(raw?.reactionMs) || 1e4)) }),
  createState: () => ({ room: null, seatMap: {}, receipts: {}, errors: {} }),
  start(ctx) {
    if (ctx.state.room.phase === "lobby") startGame(ctx.state.room, ctx.now);
    settle(ctx);
  },
  handleAction(ctx, platformId, action) {
    const state = ctx.state, id = state.seatMap[platformId];
    if (!id) return false;
    state.errors[platformId] = null;
    try {
      const receipt = withGameRng(state.room, ctx.rng, () => submit(state.room, id, action, ctx.now));
      state.receipts[platformId] = receipt;
      if (!receipt.duplicate) ctx.emit({ kind: receipt.kind === "action" ? "declaration-committed" : "reaction-committed", playerId: platformId, params: { sequence: receipt.seq } });
      settle(ctx);
      return true;
    } catch (e) {
      state.errors[platformId] = { code: e.code || "ACTION", error: e.message };
      settle(ctx);
      return false;
    }
  },
  update(ctx) {
    if (!ctx.state.room) return;
    withGameRng(ctx.state.room, ctx.rng, () => advance(ctx.state.room, ctx.now));
    settle(ctx);
  },
  isFinished: (ctx) => ctx.state.room?.phase === "ended",
  onPlayerChanged(ctx, platformId) {
    const id = ctx.state.seatMap[platformId], p = ctx.state.room?.players.find((p2) => p2.id === id);
    if (!p) return;
    const connected = ctx.players.all().some((row) => ctx.state.seatMap[row.id] === id && row.connected);
    if (p.connected !== connected) {
      p.connected = connected;
      ctx.state.room.revision++;
      ctx.state.room.updatedAt = ctx.now;
    }
  },
  getControllerState(ctx, platformId) {
    return { active: !!ctx.state.seatMap[platformId], game: ctx.state.room ? projection(ctx.state.room) : null };
  },
  getPublicState: (ctx) => ctx.state.room ? projection(ctx.state.room) : null,
  createBot(difficulty) {
    return { difficulty, decide(ctx, botId) {
      const r = ctx.state.room, id = ctx.state.seatMap[botId];
      if (!r || !id || r.phase !== "react" || r.paused || r.turn.actorId === id || r.turn.reactions.some((p) => p.playerId === id)) return null;
      return { action: { requestId: "bot-" + r.turn.id + "-" + botId, kind: "reaction", reaction: "assist", turnId: r.turn.id, text: "I help with an extremely committed distraction." }, delayMs: ctx.rng.int(450, 1200) };
    } };
  }
};
var ChaosGameSchema = class extends Schema2 {
  constructor() {
    super(...arguments);
    this.json = "";
  }
};
__decorateClass([
  type2("string")
], ChaosGameSchema.prototype, "json", 2);
var ChaosSessionSchema = class extends SessionSchema {
  constructor() {
    super(...arguments);
    this.game = new ChaosGameSchema();
  }
};
__decorateClass([
  type2(ChaosGameSchema)
], ChaosSessionSchema.prototype, "game", 2);
function configureChaosRuntime(next) {
  services = next;
  liveRooms.clear();
  recoverAttempts.clear();
  const noop = () => {
  };
  const log = { debug: noop, info: noop, warn: noop, error: (name, extra) => console.error(name, extra?.message || "") };
  bindRuntime({ defaultGameId: GAME_ID, maxPlayers: 24, sessionTimeoutMs: 24 * 60 * 60 * 1e3, sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1e3, devToolsEnabled: false, log: { ...log, child: () => log } });
  install({ game: chaosGame, createState: () => new ChaosSessionSchema(), project(root, pub) {
    setIfChanged(root.game, "json", JSON.stringify(pub));
  } });
}
var currentRooms = () => liveRooms;
var ChaosPartyRoom = class extends PartySessionRoom {
  constructor() {
    super(...arguments);
    this.interpretedTurn = null;
    this.narratedTurn = null;
    this.aiDisposed = false;
    this.savedRevision = -1;
    this.projectedRevision = -1;
    this.lastSaved = null;
  }
  async onCreate(options) {
    if (!equal(options.hostKey, services.store.hostKey)) throw new ServerError2(4400, "NOT_ALLOWED");
    if (options.resumeCode && liveRooms.has(options.resumeCode)) throw new ServerError2(4400, "ROOM_ALREADY_ACTIVE");
    await super.onCreate(options);
    let room;
    if (options.resumeCode) {
      const saved = services.store.rooms[options.resumeCode];
      if (!saved) throw new ServerError2(4400, "ROOM_NOT_FOUND");
      room = structuredClone(saved);
      for (const p of room.players) p.connected = false;
      this.state.publicCode = room.code;
    } else {
      if (services.store.rooms[this.state.publicCode]) this.state.publicCode = await generateUniqueRoomCode(async (code) => !!services.store.rooms[code] || liveRooms.has(code));
      room = createRoom({ code: this.state.publicCode, seed: randomInt2(1, 4294967295), reactionMs: options.reactionMs || 1e4 });
    }
    if (services.store.regionStorage) bindRegionStorage(room, services.store.regionStorage(room.code));
    room.ai = services.ai.status();
    if (room.turn?.ai?.status === "thinking") room.turn.ai = { status: "fallback", reason: "The local model was interrupted by a restart." };
    this.narratedTurn = room.result?.id || null;
    if (room.result?.story?.status === "thinking") room.result.story = { status: "fallback", reason: "Narration was interrupted by a restart." };
    this.gameState = { room, seatMap: {}, receipts: {}, errors: {} };
    this.rng.restore(room.seed);
    this.gameOptions = { reactionMs: room.reactionMs };
    this.setStatus(room.phase === "lobby" ? "LOBBY" : room.phase === "ended" ? "GAME_OVER" : room.phase === "reveal" ? "ROUND_END" : "PLAYING");
    liveRooms.set(room.code, this);
    this.checkpoint();
    this.projectGameState(Date.now());
    await this.publishMetadata();
  }
  onAuth(client, raw, request) {
    const parsed = JoinOptionsSchema.safeParse(raw);
    if (!parsed.success) throw new ServerError2(4400, "INVALID_PAYLOAD");
    if (parsed.data.role === "host") {
      if (!equal(raw.hostKey, services.store.hostKey)) throw new ServerError2(4400, "NOT_ALLOWED");
      return super.onAuth(client, raw);
    }
    const r = this.tavern;
    let profile = { ...raw.profile || {} };
    let recoveredId;
    if (raw.recoveryPin) {
      const key = request?.req?.socket?.remoteAddress || request?.socket?.remoteAddress || request?.ip || "network", now = Date.now();
      let attempts = recoverAttempts.get(key) || { at: now, count: 0 };
      if (now - attempts.at > 6e4) attempts = { at: now, count: 0 };
      attempts.count++;
      recoverAttempts.set(key, attempts);
      if (attempts.count > 5) throw new ServerError2(4400, "RECOVERY_LIMIT");
      const found = r.players.find((p) => equal(p.pin, String(raw.recoveryPin)));
      if (!found) throw new ServerError2(4400, "PIN");
      recoveredId = found.id;
      profile = { ...found, token: randomBytes(24).toString("hex") };
    }
    if (typeof profile.token !== "string" || profile.token.length < 16 || profile.token.length > 150) throw new ServerError2(4400, "TOKEN");
    const known = recoveredId ? r.players.find((p) => p.id === recoveredId) : r.players.find((p) => equal(p.token, profile.token));
    if (!known) {
      const name = PlayerNameSchema.safeParse(profile.name);
      if (!name.success) throw new ServerError2(4400, "NAME");
      profile.name = name.data;
      if (r.players.some((p) => p.name.toLowerCase() === profile.name.toLowerCase())) throw new ServerError2(4400, "NAME_TAKEN");
      if (r.players.length >= 24) throw new ServerError2(4400, "ROOM_FULL");
    }
    return { role: "controller", joinedAt: Date.now(), profile, recoveredId };
  }
  get tavern() {
    return this.gameState?.room;
  }
  onJoin(client, options, auth) {
    super.onJoin(client, options, auth);
    if (auth.role === "controller") {
      if (auth.recoveredId) {
        const p2 = this.tavern.players.find((p3) => p3.id === auth.recoveredId);
        p2.token = auth.profile.token;
      }
      let pin;
      do {
        pin = String(randomInt2(1e5, 1e6));
      } while (this.tavern.players.some((p2) => p2.pin === pin));
      const p = addPlayer(this.tavern, { ...auth.profile, pin });
      this.gameState.seatMap[client.sessionId] = p.id;
      client.userData = { ...auth, characterId: p.id, token: p.token };
      this.handleSessionAction(client, { type: "set-profile", name: p.name, avatar: AVATARS[this.state.players.size % AVATARS.length], color: PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length] });
      this.state.players.get(client.sessionId).score = p.score;
      this.sendWelcome(client);
    }
    this.checkpoint();
    this.projectGameState(Date.now());
    this.pushAllControllerStates();
  }
  onDispose() {
    this.aiDisposed = true;
    this.checkpoint();
    liveRooms.delete(this.state.publicCode);
    super.onDispose();
  }
  handleSessionAction(client, action) {
    if (client.userData?.role === "controller" && client.userData?.characterId) {
      try {
        this.character(client);
      } catch {
        this.sendError(client, "NOT_ALLOWED");
        return;
      }
    }
    if (!["set-profile", "set-ready", "leave"].includes(action.type) && client.userData?.role !== "host") {
      this.sendError(client, "NOT_ALLOWED");
      return;
    }
    if (action.type === "set-profile" && client.userData?.characterId) {
      editPlayer(this.tavern, client.userData.characterId, { name: action.name }, Date.now());
    }
    super.handleSessionAction(client, action);
    this.checkpoint();
    this.projectGameState(Date.now());
  }
  startGame() {
    if (this.tavern.phase !== "lobby") return;
    this.setStatus("STARTING");
    const ctx = this.buildContext(Date.now());
    chaosGame.start(ctx);
    this.finishTick(ctx);
  }
  applyGameAction(platformId, action, now) {
    const row = this.state.players.get(platformId);
    if (!row?.isBot) {
      const client = this.clients.find((c) => c.sessionId === platformId);
      try {
        if (!client) throw new Error("Missing connection");
        this.character(client);
      } catch {
        this.gameState.errors[platformId] = { code: "PLAYER", error: "Your character moved to another device. Rejoin to recover it." };
        return false;
      }
    }
    return super.applyGameAction(platformId, action, now);
  }
  registerMessageHandlers() {
    super.registerMessageHandlers();
    this.onMessage("chaos-rpc", (client, payload) => {
      const reply = (data) => client.send("chaos-reply", { id: payload?.id, ...data });
      try {
        if (!this.checkPayload(client, payload)) return reply({ ok: false, code: "REQUEST", error: "That request is too large." });
        if (!payload || typeof payload.id !== "string") return;
        const name = payload.name, data = payload.data || {}, auth = client.userData || {};
        if (name === "whoami") return reply({ ok: true, ...this.identity(client), room: this.snapshot(), network: services.network() });
        if (name === "room:sync") return reply({ ok: true, room: this.snapshot(), network: services.network() });
        if (name === "host:ai") {
          if (auth.role !== "host") error("HOST", "Only the host can check the local model.");
          if (!this.sessionLimiter.tryConsume(client.sessionId, Date.now())) error("SLOW_DOWN", "Give the local model a moment.");
          void services.ai.check().then((status) => {
            if (!this.aiDisposed && this.tavern) {
              this.tavern.ai = status;
              this.tavern.revision++;
              this.finishTick(this.buildContext(Date.now()));
            }
          }).catch(() => {
          });
          return reply({ ok: true, status: services.ai.status() });
        }
        if (name === "host:command") {
          if (auth.role !== "host") error("HOST", "Only the host can do that.");
          if (!this.sessionLimiter.tryConsume(client.sessionId, Date.now())) error("SLOW_DOWN", "Give the tavern a moment.");
          const command = data.command;
          if (command.type === "start") this.handleSessionAction(client, { type: "start-game" });
          else {
            hostCommand(this.tavern, command, Date.now());
            this.setStatus(this.tavern.phase === "lobby" ? "LOBBY" : this.tavern.phase === "ended" ? "GAME_OVER" : this.tavern.phase === "reveal" ? "ROUND_END" : "PLAYING");
            this.finishTick(this.buildContext(Date.now()));
          }
          return reply({ ok: true, room: this.snapshot() });
        }
        const p = this.character(client);
        if (name === "player:profile") {
          editPlayer(this.tavern, p.id, data.profile || {});
          this.state.players.get(client.sessionId).name = p.name;
          this.finishTick(this.buildContext(Date.now()));
          return reply({ ok: true, room: this.snapshot() });
        }
        if (name === "player:submit") {
          if (!this.gameLimiter.tryConsume(client.sessionId, Date.now())) error("SLOW_DOWN", "One idea at a time. Try again in a moment.");
          const validated = validateSync(actionSchema, data);
          if (!validated.ok) error("TEXT", "Write an attempt between 2 and 180 characters.");
          const handled = this.applyGameAction(client.sessionId, validated.value, Date.now());
          const wrapped = this.gameState;
          if (!handled) return reply({ ok: false, ...wrapped.errors[client.sessionId] || { code: "BUSY", error: "The story is not accepting that action." }, room: this.snapshot() });
          if (!wrapped.receipts[client.sessionId]?.duplicate && wrapped.receipts[client.sessionId]?.kind === "action") {
            services.ai.cancelNarration?.();
            this.interpretAcceptedTurn();
          }
          return reply({ ok: true, ...wrapped.receipts[client.sessionId], room: this.snapshot() });
        }
        error("COMMAND", "Unknown game request.");
      } catch (e) {
        reply({ ok: false, code: e.code || "SERVER", error: e instanceof RuleError ? e.message : "The tavern could not save that change. Please try again." });
      }
    });
  }
  interpretAcceptedTurn() {
    const room = this.tavern, turn = room.turn, status = services.ai.status();
    if (!turn || turn.worldLocked || this.interpretedTurn === turn.id) return;
    this.interpretedTurn = turn.id;
    if (!status.available) {
      turn.ai = { status: "fallback", reason: status.message };
      room.revision++;
      this.finishTick(this.buildContext(Date.now()));
      return;
    }
    turn.ai = { status: "thinking", model: status.model };
    room.revision++;
    this.finishTick(this.buildContext(Date.now()));
    const id = turn.id, budget = Math.min(5500, turn.deadline - Date.now() - 1e3);
    void services.ai.interpret(structuredClone(room), turn.actorId, budget).then(({ plan, model }) => {
      if (this.aiDisposed || this.tavern !== room || room.turn?.id !== id || room.phase !== "react") return;
      if (!applyAIPlan(room, id, plan, model)) throw new Error("Interpretation arrived after its animation deadline");
      room.ai = services.ai.status();
      this.finishTick(this.buildContext(Date.now()));
    }).catch(() => {
      if (this.aiDisposed || this.tavern !== room || room.turn?.id !== id || room.phase !== "react") return;
      turn.ai = { status: "fallback", model: status.model, reason: "AI was unavailable, rate-limited, slow, or returned an unsupported plan. Using the game rules." };
      room.ai = services.ai.status();
      room.revision++;
      this.finishTick(this.buildContext(Date.now()));
    });
  }
  character(client) {
    const auth = client.userData || {}, p = this.tavern.players.find((p2) => p2.id === auth.characterId);
    if (!p || !equal(p.token, auth.token)) error("PLAYER", "Your character moved to another device. Rejoin to recover it.");
    return p;
  }
  narrateResolvedTurn() {
    const room = this.tavern, q = room?.result;
    if (!q || this.narratedTurn === q.id || room.phase !== "reveal") return;
    const status = services.ai.status();
    this.narratedTurn = q.id;
    if (!status.available || !status.narrationEnabled || !services.ai.narrate) return;
    q.story = { status: "thinking", model: status.model };
    room.revision++;
    const snapshot = structuredClone(room), budget = Math.min(5500, room.deadline - Date.now() - 250);
    const current = () => !this.aiDisposed && this.tavern === room && room.result === q && q.story?.status === "thinking";
    void services.ai.narrate(snapshot, budget).then(({ story, model }) => {
      if (!current()) return;
      if (room.phase !== "reveal" || Date.now() >= room.deadline) throw Error("Narration arrived after its turn.");
      q.story = { status: "ready", ...story, model };
      room.events.push({ id: ++room.seq, type: "storyteller", turnId: q.id, text: [story.text, ...story.dialogue.map((d) => d.name + ": \u201C" + d.line + "\u201D")].join(" "), at: Date.now() });
      if (room.events.length > 100) room.events.shift();
      room.ai = services.ai.status();
      room.revision++;
      room.updatedAt = Date.now();
      this.finishTick(this.buildContext(Date.now()));
    }).catch(() => {
      if (!current()) return;
      q.story = { status: "fallback", reason: "Narration was unavailable, slow, or invalid. The dice result is unchanged." };
      room.ai = services.ai.status();
      room.revision++;
      this.finishTick(this.buildContext(Date.now()));
    });
  }
  identity(client) {
    if (client.userData?.role === "host") return { role: "host" };
    const p = this.character(client);
    return { role: "controller", playerId: p.id, token: p.token, recoveryPin: p.pin };
  }
  snapshot() {
    return { ...projection(this.tavern), serverNow: Date.now() };
  }
  checkpoint() {
    if (!this.tavern || this.tavern.revision === this.savedRevision) return;
    try {
      services.store.checkpoint(this.tavern);
      this.savedRevision = this.tavern.revision;
      this.lastSaved = structuredClone(this.tavern);
    } catch (e) {
      if (this.lastSaved) {
        this.gameState.room = structuredClone(this.lastSaved);
        bindRegionStorage(this.gameState.room, services.store.regionStorage(this.lastSaved.code));
      }
      throw e;
    }
  }
  projectGameState(now) {
    if (!this.tavern || this.tavern.revision === this.projectedRevision) return;
    super.projectGameState(now);
    this.projectedRevision = this.tavern.revision;
  }
  finishTick(ctx) {
    this.narrateResolvedTurn();
    this.checkpoint();
    super.finishTick(ctx);
  }
};
export {
  ChaosPartyRoom,
  ClockSync,
  GAME_ID,
  PARTY_ROOM,
  PartySessionRoom,
  RateLimiter,
  Rng2 as Rng,
  UPSTREAM_COMMIT,
  bindRuntime,
  chaosGame,
  configureChaosRuntime,
  currentRooms,
  install
};
