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

// src/framework-entry.ts
import { Schema as Schema2, type as type2 } from "@colyseus/schema";
import { ServerError as ServerError2 } from "@colyseus/core";
import { randomBytes, randomInt as randomInt2, timingSafeEqual } from "node:crypto";
import { z as z2 } from "zod";

// vendor/partyframe/packages/game-core/src/rng.ts
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
    this.rng = new Rng(options.seed ?? randomSeed());
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

// public/vendor/partyframe-rng.js
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

// public/core.js
var VERSION = "0.2.0";
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
var clean = (s, n) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
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
    round: 0,
    chaos: 0,
    quest: { clues: 0, crown: false, carrierId: null, escaped: false },
    lastActorId: null,
    priorityUntil: 0,
    world: { bartender: "wary", guards: "bored", facts: ["The Duke has terrible taste in hats."] },
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
  name = clean(name, 18);
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
  const name = clean(profile.name, 18);
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
  const { requests, seed, ...s } = r;
  return { ...structuredClone(s), players: r.players.map(({ token, pin, ...p }) => structuredClone(p)) };
}
function startGame(r, now = Date.now()) {
  if (r.phase !== "lobby") fail("PHASE", "This story has already started.");
  if (!r.players.length) fail("EMPTY", "At least one adventurer needs to join first.");
  r.phase = "open";
  r.deadline = 0;
  event(r, "story", OPENING, now);
  touch(r, now);
}
function classify(text) {
  const t = text.toLowerCase();
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
  const other = r.players.find((p) => p.id !== actor.id && t.includes(p.name.toLowerCase()));
  if (other) return { kind: "player", id: other.id, name: other.name };
  if (/guard|captain|brick|soldier/.test(t)) return { kind: "guard", name: "Captain Brick" };
  if (/bartender|marnie|barkeep|barmaid/.test(t)) return { kind: "bartender", name: "Marnie" };
  if (/crown|chest|box|treasure|drawer/.test(t)) return { kind: "chest", name: "the locked chest" };
  if (/goblin|bard|musician/.test(t)) return { kind: "goblin", name: "the goblin fiddler" };
  if (/chandelier|ceiling/.test(t)) return { kind: "chandelier", name: "the chandelier" };
  return { kind: "room", name: "the tavern" };
}
function submit(r, playerId, input, now = Date.now()) {
  const p = r.players.find((x) => x.id === playerId);
  if (!p) fail("PLAYER", "Rejoin the tavern first.");
  const key = p.id + ":" + clean(input.requestId, 90);
  if (!input.requestId || typeof input.requestId !== "string" || input.requestId.length > 90) fail("REQUEST", "Please try again with a fresh action.");
  if (r.requests[key]) return { ...r.requests[key], duplicate: true };
  advance(r, now);
  if (r.paused) fail("PAUSED", "The host paused the story.");
  if (p.muted) fail("MUTED", "The host has muted your actions.");
  const text = clean(input.text, 180);
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
  const intent = classify(text);
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
    reactions: []
  };
  r.phase = "react";
  r.deadline = r.turn.deadline;
  r.result = null;
  p.status = "committed";
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
  const rng = randomSources.get(r) || new Rng2(r.seed), value = rng.next();
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
  const sorted = [...t.reactions].sort((a, b) => a.id - b.id);
  const helpers = sorted.filter((x) => x.kind === "assist" || x.kind === "custom" && !/\b(stop|prevent|block|intervene)\b/i.test(x.text));
  const blockers = sorted.filter((x) => x.kind === "intervene" || x.kind === "custom" && /\b(stop|prevent|block|intervene)\b/i.test(x.text));
  const hostile = ["attack", "steal", "magic", "break"].includes(t.intent);
  let roll = 1 + Math.floor(random(r) * 20), rerolled = null;
  if (p.perk === "lucky" && roll <= 3) {
    rerolled = roll;
    roll = 1 + Math.floor(random(r) * 20);
  }
  const skill = ROLES[p.role].skills.includes(t.intent) ? 3 : 0;
  const charm = p.perk === "charming" && ["social", "dance"].includes(t.intent) ? 2 : 0;
  const assistance = Math.min(4, helpers.length), interference = hostile ? Math.min(4, blockers.length) : 0;
  const modifier = skill + charm + assistance - interference;
  const dc = { heal: 6, flee: r.quest.crown ? 12 : 8, inspect: 9, social: 10, dance: 9, sneak: 10, steal: 13, magic: 12, attack: 12, break: 11, weird: 10 }[t.intent];
  const critical = roll === 20, success = critical || roll !== 1 && roll + modifier >= dc;
  const effects = [], changes = [];
  let narration = "";
  const add = (s) => changes.push(s);
  const fx = (verb, target2 = t.target.kind) => effects.push({ verb, actorId: p.id, target: target2, targetId: t.target.id || null });
  const damage = (who, n) => {
    let d = hurt(who, n);
    if (d) add(`${who.name} \u2212${d} HP`);
  };
  const recovery = (who, n) => {
    let h = heal(who, n);
    if (h) add(`${who.name} +${h} HP`);
  };
  p.actions++;
  r.stats.actions++;
  r.stats.rolls++;
  if (critical) p.nat20++;
  if (success) p.score += critical ? 5 : 2;
  const target = r.players.find((x) => x.id === t.target.id);
  switch (t.intent) {
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
        p.gold++;
        add(`${p.name} +1 coin`);
        narration = pick(r, [`${p.name} lands it. ${t.target.name} looks personally offended by the physics.`, `${p.name} connects. A barstool flies past. Nobody admits owning it.`, `${p.name} wins this exchange. The goblin starts playing fight music.`]);
      } else {
        damage(p, 2);
        fx("hit", "self");
        narration = pick(r, [`${p.name} commits fully. Unfortunately, so does the floor.`, `${p.name} misses. Captain Brick calls it \u201Ca useful demonstration.\u201D`, `${p.name} swings with confidence and lands with a very different sound.`]);
      }
      break;
    case "steal":
      fx("steal");
      r.chaos += 2;
      if (success) {
        if (r.quest.clues >= 3 && !r.quest.crown && ["chest", "bartender", "room"].includes(t.target.kind)) {
          r.quest.crown = true;
          r.quest.carrierId = p.id;
          p.inventory.push("The Duke\u2019s Crown");
          p.score += 5;
          add("THE CROWN IS YOURS");
          narration = `${p.name} lifts the ridiculous golden crown. It jingles like cutlery. The guards have definitely noticed. Find a way out!`;
          fx("crown");
        } else {
          p.gold += 2;
          add(`${p.name} +2 coins`);
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
        narration = pick(r, [`${p.name} bends reality just enough to make everyone extremely uncomfortable.`, `${p.name} casts it. The goblin briefly glows. He charges extra for that.`, `${p.name} makes magic happen. Three guards immediately blame each other.`]);
        if (target) recovery(target, 1);
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
        add(`${p.name} +1 coin`);
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
        add("PARTY VICTORY");
      } else if (success) {
        p.status = "hiding";
        r.chaos = Math.max(0, r.chaos - 2);
        narration = `${p.name} escapes to the doorway. Excellent survival instincts. Unfortunately, the crown is still inside.`;
        add("Chaos \u22122");
      } else {
        damage(p, 1);
        narration = `${p.name} makes for the door. Captain Brick is already standing in it. Awkward.`;
      }
      break;
    case "dance":
      fx("dance");
      if (success) {
        r.chaos = Math.max(0, r.chaos - 2);
        p.gold++;
        add(`${p.name} +1 coin`);
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
      if (success) {
        p.gold++;
        add(`${p.name} +1 coin`);
        narration = pick(r, [`${p.name} does something nobody prepared for. Against all good judgment, it works.`, `${p.name} commits to the bit. The universe, briefly, commits back.`, `${p.name} makes an extremely specific choice. The goblin is already writing a song about it.`]);
      } else {
        narration = pick(r, [`${p.name} tries it. The tavern goes quiet. Somewhere, a spoon falls over.`, `${p.name} follows the idea to its natural, deeply inconvenient conclusion.`, `${p.name} discovers a new way to disappoint Captain Brick.`]);
        damage(p, 1);
      }
      break;
  }
  if (success && !r.quest.crown && ["inspect", "social", "dance", "sneak", "weird", "magic"].includes(t.intent)) {
    if (r.quest.clues < 3) {
      r.quest.clues++;
      const facts = ["Marnie saw the Duke hide something behind the bar.", "The goblin\u2019s song mentions a chest and a golden hat.", "The crown is in the chest behind the bar. Steal it!"];
      const fact = facts[r.quest.clues - 1];
      r.world.facts.push(fact);
      add(`Clue ${r.quest.clues}/3`);
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
  if (r.chaos >= 10 && !r.quest.escaped) {
    const exposed = r.players.filter((x) => x.connected && x.status !== "hiding");
    for (const rp of exposed) hurt(rp, 1);
    r.chaos = 5;
    r.world.guards = "alert";
    add("Guard sweep: exposed players \u22121 HP");
    narration += " The guards sweep the room. Anyone who stayed in the open takes a hit.";
    effects.push({ verb: "alarm", actorId: p.id, target: "guard" });
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
    roll,
    rerolled,
    modifier,
    skill,
    charm,
    assistance,
    interference,
    total: roll + modifier,
    dc,
    success,
    critical,
    narration,
    changes,
    effects,
    reactions: sorted.map((x) => ({ playerId: x.playerId, kind: x.kind, text: x.text, seq: x.id })),
    at: now
  };
  r.phase = "reveal";
  r.deadline = now + 6500;
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
    r.phase = r.quest.escaped ? "ended" : "open";
    r.deadline = 0;
    for (const p of r.players) if (p.hp > 0) p.status = "ready";
    touch(r, now);
    return true;
  }
  return false;
}
function hostCommand(r, command, now = Date.now()) {
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
    for (const p of r.players) {
      p.hp = Math.max(p.hp, 4);
      p.status = "ready";
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
      r.result.action = "[Hidden by the host]";
      r.result.narration = "The host moved this scene along.";
      r.result.reactions.forEach((x) => x.text = "[Hidden by the host]");
    }
  } else if (command.type === "newStory") {
    const fresh = createRoom({ code: r.code, seed: r.seed, now, reactionMs: r.reactionMs });
    const players = r.players.map((p) => ({ ...p, hp: p.maxHp, gold: 3, inventory: ["Bent spoon"], actions: 0, assists: 0, score: 0, nat20: 0, status: "ready" }));
    Object.assign(r, fresh, { players, seq: r.seq, revision: r.revision, requests: r.requests });
    event(r, "story", "A fresh night. The same terrible judgment.", now);
  } else if (command.type === "window") {
    r.reactionMs = clamp(Number(command.ms) || 8e3, 4e3, 12e3);
  } else fail("COMMAND", "Unknown host action.");
  touch(r, now);
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
          return reply({ ok: true, ...wrapped.receipts[client.sessionId], room: this.snapshot() });
        }
        error("COMMAND", "Unknown game request.");
      } catch (e) {
        reply({ ok: false, code: e.code || "SERVER", error: e instanceof RuleError ? e.message : "The tavern could not save that change. Please try again." });
      }
    });
  }
  character(client) {
    const auth = client.userData || {}, p = this.tavern.players.find((p2) => p2.id === auth.characterId);
    if (!p || !equal(p.token, auth.token)) error("PLAYER", "Your character moved to another device. Rejoin to recover it.");
    return p;
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
      if (this.lastSaved) this.gameState.room = structuredClone(this.lastSaved);
      throw e;
    }
  }
  projectGameState(now) {
    if (!this.tavern || this.tavern.revision === this.projectedRevision) return;
    super.projectGameState(now);
    this.projectedRevision = this.tavern.revision;
  }
  finishTick(ctx) {
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
  Rng,
  UPSTREAM_COMMIT,
  bindRuntime,
  chaosGame,
  configureChaosRuntime,
  currentRooms,
  install
};
