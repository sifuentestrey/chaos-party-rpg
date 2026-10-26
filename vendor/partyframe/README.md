# PartyFrame

TV-plus-phones party-game framework. The shared screen is the game; phones are
the controllers.

This folder is the extractable unit. A later independent repo or npm publish
starts here. Host apps live outside it and depend on `@partyframe/*`.

## Packages

| Package | Role |
| --- | --- |
| `@partyframe/protocol` | Wire types and zod schemas |
| `@partyframe/game-core` | `PartyGame` contract, seeded RNG, registry |
| `@partyframe/runtime` | `PartySessionRoom`, adapters, room codes, rate limits |
| `@partyframe/kit` | `HostRoute`, `JoinRoute`, session client, FuseBar |
| `@partyframe/i18n` | Platform strings and translator |

Games stay in the host app. They depend on these packages and register through
`bindRuntime()` / `bindKit()` so the frame never imports a catalog.

## Host app seam

```ts
// server
bindRuntime({ defaultGameId, maxPlayers, sessionTimeoutMs, sessionMaxAgeMs, devToolsEnabled, log });

// web
bindKit({ getWebGame, loadSceneForGame });
```

## Until this folder is its own repo

Install and build from the parent monorepo root. After a split: `pnpm install`
and `pnpm test` in this directory.

Packages are `private` until you publish.
