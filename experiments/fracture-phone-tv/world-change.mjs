/** Only authoritative, visible Chaos world state can trigger room refreshes.
 * Excludes private player inventory and credentials. The event carries no data:
 * phones fetch their own authenticated /state after notification.
 */
export function worldFingerprint(actor){
 const world=actor?.chaos;
 if(!world||typeof world!=='object')return null;
 return JSON.stringify({
  zone:actor.zone??null,
  ground:world.ground??[],
  scenery:world.scenery??[],
  npcs:world.npcs??[],
  story:world.story??[],
  camp:world.camp??null
 });
}
