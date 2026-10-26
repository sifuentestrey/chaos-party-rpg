/**
 * Catalog bindings for the TV and phone shells.
 *
 * Kit must not import `@party/catalog` — that package already depends on kit
 * for `WebGame`. The app wires the two together once at startup.
 */

import type { WebGame } from "./types.js";

export type GameSceneClass = (new () => import("phaser").Scene) & { KEY: string };

export interface KitCatalog {
  getWebGame: (gameId: string) => WebGame | undefined;
  loadSceneForGame: (gameId: string) => Promise<GameSceneClass | null>;
}

let catalog: KitCatalog | null = null;

export function bindKit(next: KitCatalog): void {
  catalog = next;
}

export function getWebGame(gameId: string): WebGame | undefined {
  if (!catalog) {
    throw new Error("@partyframe/kit: bindKit() must run before routes mount");
  }
  return catalog.getWebGame(gameId);
}

export function loadSceneForGame(gameId: string): Promise<GameSceneClass | null> {
  if (!catalog) {
    throw new Error("@partyframe/kit: bindKit() must run before routes mount");
  }
  return catalog.loadSceneForGame(gameId);
}
