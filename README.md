# Chaos Party

Chaos Party is a private family fantasy party game for one shared TV and individual phone controllers.

The game-night product is the native **Fracture** world, beginning in the **Refuge** village. The old tavern web prototype remains preserved in the repository, but it is not the current game.

## What players do

Each phone controls a distinct persistent character. Players explore the Refuge and its native surroundings, talk to NPCs, fight real enemies, manipulate supported existing objects, and type open-ended intentions. The TV shows the shared world and short confirmed story events; phones show personal mechanics and dice.

The server is authoritative. The first valid action locks, server-owned dice determine outcomes, and real consequences persist. The AI Dungeon Master interprets and narrates grounded possibilities, but the engine decides what actually happens. Discovery comes from NPCs, observation, and the DM; there are no waypoints, route markers, tracker hand-holding, or fast travel.

Live Groq is optional. When configured, it uses the approved free connection. If it is unavailable, the game continues with a clearly labeled offline fallback. No API key belongs in this repository or in a packaged build.

## Run the current game-night build

Use Node 22.18+ LTS or Node 24+, Git, and a local network. On the Mac, run:

```sh
./experiments/fracture-phone-tv/Start_Fracture_Chaos_Test.command
```

The launcher keeps the pinned Fracture checkout and its data separate from the original Chaos Party project. It opens one local start page; press **Start game** and the shared TV opens automatically. Scan the QR code or enter the short room code on phones connected to the same Wi-Fi.

`npm start` launches the preserved legacy tavern prototype on port 4747. It is not the current Fracture/Refuge game-night entrypoint.

## Source and release rules

`main` is the only active source of truth. Work on `main`; do not revive superseded branches or treat old PRs and packages as current source. Preserve `luna/visual-game-night-release` and all original saves as historical material.

Read [AGENTS.md](AGENTS.md) for development rules, [START_HERE.md](START_HERE.md) for the document map, and [docs/FRACTURE_GAME_NIGHT_RELEASE.md](docs/FRACTURE_GAME_NIGHT_RELEASE.md) for the current acceptance checklist.

The software evidence is useful, but physical 2015 Intel Mac, family Wi-Fi, real-phone, and human game-night acceptance must be verified separately. Do not claim those gates from automated tests alone.
