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
var VERSION = "0.3.0-beta.1";
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
  const check = environmentCheck(r.world, t.target, t.intent, t.action);
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
  const dice = automatic ? [] : [1 + Math.floor(random(r) * 20)];
  if (!automatic && advantage) dice.push(1 + Math.floor(random(r) * 20));
  let roll = automatic ? 0 : advantage ? selectD20(dice, advantage) : dice[0], rerolled = null;
  if (!automatic && p.perk === "lucky" && roll <= 3) {
    rerolled = roll;
    roll = 1 + Math.floor(random(r) * 20);
  }
  const skill = ROLES[p.role].skills.includes(t.intent) || t.intent === "interact" && (check?.ability === "Athletics" && p.role === "knight" || check?.ability === "Arcana" && p.role === "wizard" || check?.ability === "Sleight of hand" && p.role === "rogue") ? 3 : 0;
  const charm = p.perk === "charming" && ["social", "dance"].includes(t.intent) ? 2 : 0;
  const assistance = Math.min(4, helpers.length), interference = hostile ? Math.min(4, blockers.length) : 0;
  const modifier = skill + charm + assistance - interference;
  const dc = automatic ? 0 : check?.dc ?? { heal: 6, flee: r.quest.crown ? 12 : 8, inspect: 9, social: 10, dance: 9, sneak: 10, steal: 13, magic: 12, attack: 12, break: 11, weird: 10, interact: 10 }[t.intent];
  const critical = roll === 20;
  let success = automatic || critical || roll !== 1 && roll + modifier >= dc;
  const effects = [], changes = [];
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
  const environmental = interactEnvironment(r.world, t.target, t.intent, success, p, { text: t.action });
  if (environmental) {
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
        const offensive = /\b(fire|fireball|lightning|bolt|blast|zap|freeze)\b/i.test(t.action);
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
  if (success && !automatic && !environmental?.blocked) p.score += critical ? 5 : 2;
  for (const change of advanceEnvironment(r.world)) add2(change);
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
  if (r.chaos >= 10 && !r.quest.escaped) {
    const exposed = r.players.filter((x) => x.connected && x.status !== "hiding");
    for (const rp of exposed) hurt(rp, 1);
    r.chaos = 5;
    r.world.guards = "alert";
    add2("Guard sweep: exposed players \u22121 HP");
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
    for (const p of r.players) if (p.hp > 0) p.status = p.cover ? "hiding" : "ready";
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
      r.result.action = "[Hidden by the host]";
      r.result.narration = "The host moved this scene along.";
      r.result.reactions.forEach((x) => x.text = "[Hidden by the host]");
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
