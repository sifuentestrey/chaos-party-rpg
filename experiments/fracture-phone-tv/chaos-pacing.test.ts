/** Chaos-owned native pause boundaries. No game state or successes are fabricated. */
import {describe,it,expect,vi} from 'vitest';
import {Entity} from '../entity';
import {Types} from '../../../shared/ts/gametypes';
import {GameLoop} from '../world/game-loop';
import {MessageRouter} from '../player/message-router';
import {handleHit,handleHurt} from '../player/combat.handler';
describe('Hybrid native pause boundaries',()=>{
 it('blocks real entity movement while paused, while TV observation and ordinary worlds remain usable',()=>{
  const mob:any=new Entity(1,'mob',Types.Entities.RAT,10,10);mob.chaosWorld={chaosPacing:{paused:true}};mob.setPosition(11,10);expect(mob.x).toBe(10);
  const player:any=new Entity(2,'player',Types.Entities.WARRIOR,10,10);player.hasEnteredGame=true;player.getWorld=()=>mob.chaosWorld;player.setPosition(11,10);expect(player.x).toBe(10);
  player.chaosSpectator=true;player.setPosition(11,10);expect(player.x).toBe(11);
  mob.chaosWorld={};mob.setPosition(12,10);expect(mob.x).toBe(12);
 });
 it('continues message delivery while actual regeneration and aggro ticks are paused',()=>{
  const loop:any=new GameLoop(),broadcast=vi.fn(),regen=vi.fn(),aggro=vi.fn();loop.setBroadcasterContext({processQueues:broadcast});loop.onRegen(regen);loop.onAggro(aggro);loop.updateCount=999;loop.aggroUpdateCount=999;loop.chaosCanSimulate=()=>false;loop.tick();expect(broadcast).toHaveBeenCalledOnce();expect(regen).not.toHaveBeenCalled();expect(aggro).not.toHaveBeenCalled();
  loop.chaosCanSimulate=()=>true;loop.tick();expect(regen).toHaveBeenCalledOnce();expect(aggro).toHaveBeenCalledOnce();
 });
 it('rechecks the phase after asynchronous rate limiting before applying a queued native hit',async()=>{
  let paused=false;const getEntityById=vi.fn(),world={chaosPacing:{enabled:true,allowMessage:()=>!paused},getEntityById};
  const player:any={id:1,hasEnteredGame:true,isDead:false,getWorld:()=>world};const router:any=new MessageRouter({},{},{},class {});
  router.checkRateLimit=async()=>{paused=true;return {allowed:true};};
  expect(await router.route(player,[Types.Messages.HIT,5])).toBe(false);expect(getEntityById).not.toHaveBeenCalled();
 });
 it('rejects direct native damage while paused as well as routed messages',()=>{
  const getEntityById=vi.fn(),world={chaosPacing:{paused:true},getEntityById},player:any={hitPoints:100,getWorld:()=>world};handleHit(player,[Types.Messages.HIT,5]);handleHurt(player,[Types.Messages.HURT,5]);expect(getEntityById).not.toHaveBeenCalled();expect(player.hitPoints).toBe(100);
 });
});
