# Pinned PartyFrame adaptation

Upstream: https://github.com/msynk/bomb-party
Commit: e73cc35bfa561048cd9728991bafeeca5548e953
License: MIT; the full original notice is in LICENSE.

- `runtime/src/PartySessionRoom.ts`: extension points/fields changed from `private` to `protected`; game and platform logic retained.
- `protocol/src/constants.ts`: 24-player ceiling, six-character room codes, 18-character names.
- `game-core/src/rng.ts`: `snapshot()` / `restore()` expose exact deterministic state for durable campaigns.
- `kit/src/net/SessionConnection.ts`: additional authenticated game join options, host rejoin by room code, durable-character fallback after an expired framework token, correlated request acknowledgments/retries, and a connection getter. Existing reconnect/backoff/subscription/clock behavior is reused.
- `kit/src/net/endpoint.ts`: same-origin deployment; the separate Vite-to-server port fallback is disabled for the one-process release.

Game-specific work is outside this folder, in `src/framework-entry.ts` and `public/party-client.js`. See FOUNDATION_AUDIT.md for limits and validation.
