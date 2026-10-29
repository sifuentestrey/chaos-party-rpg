# Game-night checkpoint — October 29, 2026

Canonical branch: luna/visual-game-night-release. Original Mac ZIP unavailable.

Implemented this session: server-authoritative strict-majority shared travel using existing reaction window; electorate captured before reactions, explicit assists only, no duplicate/late-join quorum inflation. Solo supported. Tavern wall map discovery persists; controller route chart shows explored locations and real connections, with unexplored routes marked. Compact idle TV story panel leaves actors visible.

Working foundation retained: PartyFrame/Colyseus, character customization, action locking, dice, crown-heist ending, procedural regional quests, crafting/inventory, persistence and reconnect. No copied Anywhere RPG material; its source/report and permission scope were not present in this checkout.

Validation: baseline offline verification passed. Updated offline suite: 189 tests, including real 20-client concurrency/recovery/restart and new travel/map checks. Two-browser regional adventure/revisit/restart passed before final map/presentation changes; final rerun and package checks recorded in delivery report. No live family saves used.

AI blocker: live qualification preflight refused absent existing shared ai-free-usage.json ledger. No inference requests sent, no ledger replacement/reset. Key binding alone does not qualify AI. Narration stays off. At 100 requests/day and 4/minute, continuous interpretation+narration cannot cover a normal multi-hour high-turn-rate game night; selective use with native fallback remains necessary.

Next: complete final browser run, commit clean source, package with checksum-verified official Node 22.16.0 Intel/ARM runtimes, standalone smoke. Record source/checksum in delivery report. Then hardware acceptance: 2015 Intel Mac/macOS compatibility, TV readability/audio, Wi-Fi, two phones, larger family session.

Remaining scope: creative real-model accuracy/truthfulness/latency not qualified; world still uses existing procedural geography rather than finished bounded river/bridge/town/dungeon campaign. Route chart is a map of actual connections, not an illustrated geographical map. NPC routines and a general validated scene queue remain existing limited implementations. Do not call this the fully completed requested game.
