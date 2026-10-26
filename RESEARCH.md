# Research record

The authoritative foundation audit and actual reuse record is **FOUNDATION_AUDIT.md**. It includes pinned versions, licenses, code paths, asset hashes, compatibility limits, adaptations and why RPGJS is excluded.

The initial working vertical slice used a small custom Socket.IO host and CC0 Kenney assets. That transport was replaced, after source inspection, by the actual PartyFrame/Colyseus runtime and client. The tested rules, UI, saves and moderation were preserved. Ninja Adventure artwork now supplies actor layers and animation/VFX frames. The earlier code was checkpointed before adaptation.

Additional inspected references: Socket.IO delivery guarantees (https://socket.io/docs/v4/delivery-guarantees/) informed the preserved request-id/receipt semantics; boardgame.io (https://boardgame.io/) was inspected as a turn-based alternative. Neither is an active runtime dependency.

There is one live networking authority, PartyFrame/Colyseus, and one lightweight Canvas presentation. No RPGJS engine, React shell or Phaser renderer is unnecessarily combined with it. No paid AI generation, Studio account or cloud multiplayer service was created.
