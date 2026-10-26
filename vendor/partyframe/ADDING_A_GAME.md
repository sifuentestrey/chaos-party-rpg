# Adding a game to PartyFrame

PartyFrame itself lives in `partyframe/`. Games live in this host repo under
`packages/` and depend on `@partyframe/*`.

This walks through everything a second game has to provide, and — more usefully —
everything it does **not**.

## What you get for free

Session creation, public room codes, QR joining, the lobby, player identity,
avatars and colours, ready state, host election, capacity limits, kicking,
reconnection for players and the shared screen, bot scheduling, scoring storage,
rate limiting, payload validation, clock synchronisation, the session lifecycle
(lobby → play → results → rematch), error screens, localisation, logging, the
health endpoint, the developer panel and deployment.

## What you provide

Five files, none of which touch the platform.

---

## 1. The rules — `packages/your-game/`

The `.` export has no framework dependency. It may depend on `@partyframe/game-core`,
`@partyframe/protocol` and a validation library, and nothing else. Side-load adapters
as `./server`, `./web`, `./scene` and `./i18n`.

```ts
import type { PartyGame, GameContext } from "@partyframe/game-core";

export const yourGame: PartyGame<State, Options, Action, Controller, Public> = {
  id: "your-game",
  nameKey: "game.your-game.name",
  minPlayers: 2,
  maxPlayers: 8,

  actionSchema: YourActionSchema,   // any Standard Schema; zod works
  parseOptions: (raw) => YourOptionsSchema.parse(raw ?? {}),
  createState: (options) => makeState(options),

  start(ctx) { /* called once when the session enters PLAYING */ },
  handleAction(ctx, playerId, action) { /* return false if not allowed now */ },
  update(ctx, deltaMs) { /* server tick: own all your timing here */ },
  isFinished(ctx) { return ctx.state.phase === "finished"; },

  getControllerState(ctx, playerId) { /* what THIS phone renders */ },
  getPublicState(ctx) { /* what the shared screen renders */ },
  createBot(difficulty) { return makeBot(difficulty); },
};
```

### The three rules that matter

**Take all time from `ctx.now`.** Never call `Date.now()`. The platform pins
`ctx.now` for the duration of a call, which is what makes a match replayable.

**Take all randomness from `ctx.rng`.** Never call `Math.random()`. Prompt
selection, timers, bot decisions — all of it. The generator is seeded per
session, so a bug is reproducible from its seed.

**Score through `ctx.players`, not your own state.** Scores live on the platform
so the lobby, scoreboard, results screen and rematch flow work identically for
every game.

### Requesting status changes

Your game does not set the session status; it asks.

```ts
ctx.requestStatus("PLAYING");     // a round has begun
ctx.requestStatus("ROUND_END");   // pause between rounds
ctx.requestStatus("GAME_OVER");   // the match is over
```

The platform decides whether to honour it. It will not let a game put the
session back into the lobby or close it.

> Bomb Party learned this the hard way: for a while `beginRound` did not request
> `PLAYING`, so the session stayed in `STARTING` and every phone sat on the "get
> ready" screen through the whole first round.

### Emitting presentation cues

```ts
ctx.emit({ kind: "thing-happened", messageKey: "event.thing", params: { name } });
```

Cues are broadcast to everyone and drive the event feed, sound and animation.
They are **not** state: if one is dropped nothing breaks. Never put information
in a cue that a client would be wrong without.

---

## 2. The wire schema — `packages/your-game/src/server/`

PartyFrame syncs a Colyseus schema. Your game's public state is a projection
onto it. Export `createState` and `project` from `./server`.

```ts
import { MapSchema, Schema, type } from "@colyseus/schema";
import { SessionSchema, setIfChanged } from "@partyframe/runtime";

export class YourGameSchema extends Schema {
  @type("string") phase = "";
  @type("number") round = 0;
  @type({ map: YourRowSchema }) players = new MapSchema<YourRowSchema>();
}

export class YourSessionSchema extends SessionSchema {
  // The field MUST be called `game`. The client's generic snapshot code reads
  // it without knowing which game is running.
  @type(YourGameSchema) game = new YourGameSchema();
}

export function projectYourGame(root: SessionSchema, publicState: unknown): void {
  const state = root as YourSessionSchema;
  const pub = publicState as YourPublicState;
  setIfChanged(state.game, "phase", pub.phase);
  // ...
}
```

Two things to copy from `@party/bomb-party/server`:

- **Assign only when the value differs.** Colyseus marks a field dirty on
  assignment even when the value is identical, so a naive per-tick copy puts a
  patch on the wire ten times a second for nothing.
- **Name the root field `game`.** That is the whole contract that lets the
  client stay game-agnostic.

---

## 3. Catalog registration — `packages/catalog/src/`

Append the id to `ids.ts`, then one line in each catalog entry. Do not add
game-named branches to `PartySessionRoom` (`@partyframe/runtime`), `HostRoute` or
`JoinRoute` (`@partyframe/kit`). The landing page already lists `/api/config` games
and the shared screen reads a generic `?game=` query param.

```ts
// server.ts
install({
  game: yourGame,
  createState: createYourSessionSchema,
  project: projectYourGame,
});

// web.ts
const games = new Map<string, WebGame>([
  [bombPartyWeb.id, bombPartyWeb],
  [yourWebGame.id, yourWebGame],
]);

// scenes.ts
"your-game": async () => {
  const { YourScene, YOUR_SCENE_KEY } = await import("@party/your-game/scene");
  return Object.assign(YourScene, { KEY: YOUR_SCENE_KEY });
},
```

`tests/unit/catalog.test.ts` fails if the three id lists drift.

---

## 4. The controller panel — `packages/your-game/src/web/`

A React component receiving `ControllerPanelProps` from `@partyframe/kit`:

```ts
export function YourController({ envelope, send, serverNow, t }: ControllerPanelProps) {
  const game = envelope.game as YourControllerState;
  // render; call send({ ... }) to submit an intention
}
```

The shell around it — identity, connection badge, mode switching, the leave
button — is the platform's. You render only the panel.

Use `serverNow()` for any countdown, and drive it from a `requestAnimationFrame`
loop writing to a ref rather than from React state. `FuseBar` from `@partyframe/kit`
is the pattern.

Export a `WebGame` from `./web`. The normaliser is not optional: the wire
delivers Colyseus collections, and fields can be missing on the first patch.

---

## 5. The shared-screen scene — `packages/your-game/src/scene/`

A `Phaser.Scene` that reads from the `StageBridge` (`@partyframe/kit`) and renders.
The catalog registers it as a **dynamic import** so the phone never downloads
Phaser.

Dynamic because Phaser is 1.4 MB and the phone controller shares this bundle. A
static import would make every player download a renderer they never use.

Inside the scene:

- Read `this.bridge.game`, `this.bridge.players`, `this.bridge.serverNow()`.
- Drain `drainEvents(this.bridge)` each frame for one-shot reactions.
- Never mutate anything, never decide anything, never call the server.

---

## Testing your game

Copy the shape of `tests/unit/bombPartyRules.test.ts`. `GameHarness` gives you a
`GameContext` with a clock you control:

```ts
const h = new GameHarness(createState(), options, players, new Rng(7));
h.advance(1000);
tick(h.ctx());
expect(h.state.phase).toBe("...");
```

Because your rules take time and randomness from the context, a whole match runs
in microseconds with no sockets and no browser. Assert on scores via
`h.score(id)` and on cues via `h.eventKinds()`.

Add integration coverage by extending `tests/integration/gameplay.test.ts` — the
`seatTable` helper is game-agnostic.

---

## Checklist

- [ ] Rules package has no import of Colyseus, Phaser, React or the DOM
- [ ] No `Date.now()` and no `Math.random()` anywhere in the rules
- [ ] Scores go through `ctx.players`
- [ ] Every action has a runtime schema, and `handleAction` returns `false` for
      moves that are well formed but not legal right now
- [ ] `update()` owns all timing and publishes absolute deadlines
- [ ] The schema root field is named `game`
- [ ] The projection assigns only changed fields
- [ ] The Phaser scene is behind a dynamic import
- [ ] A bot exists at all three difficulties and is beatable
- [ ] Translation keys exported from `./i18n` and merged by `@party/catalog/i18n`
- [ ] Unit tests replay a full match deterministically
