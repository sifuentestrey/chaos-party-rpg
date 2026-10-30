/** Chaos-owned actor lifecycle regressions, run by pinned upstream Vitest. */
import {describe,it,expect,vi,afterEach} from 'vitest';
import {EventEmitter} from 'node:events';
const shared=vi.hoisted(()=>({route:vi.fn(async()=>true)}));
vi.mock('../player/message-router',()=>({MessageRouter:class {route=shared.route;}}));
import {Inventory} from '../inventory/inventory';
import {Types} from '../../../shared/ts/gametypes';
import {handleInventoryUse} from '../player/inventory.handler';
import {installChaosActor} from '../chaos-actor';
afterEach(()=>{vi.useRealTimers();shared.route.mockReset();shared.route.mockImplementation(async()=>true);delete process.env.CHAOS_ACTOR_KEY;delete process.env.CHAOS_TV_KEY;});
function fixture(auth:any={chaosActorKey:'test-actor-key'}){
 process.env.CHAOS_ACTOR_KEY='test-actor-key';process.env.CHAOS_TV_KEY='test-tv-key';
 const socket:any=new EventEmitter();socket.connected=true;socket.handshake={auth};
 const world={entities:{},mobs:{},zoneManager:{getZoneAt:()=>null},getStorageService:()=>({}),isValidPosition:()=>true};
 const player:any={id:123,name:'Test',hasEnteredGame:true,x:10,y:10,hitPoints:100,maxHitPoints:100,weapon:60,armor:21,getWorld:()=>world,getInventory:()=>({getSlots:()=>[]}),clearTarget:vi.fn(),broadcast:vi.fn(),resetTimeout:vi.fn(),saveToStorage:vi.fn()};
 const connection:any={_connection:socket,clientIp:'127.0.0.1',listenCallback:vi.fn(),close:vi.fn()};installChaosActor(player,connection);return {socket,player,world,connection};
}
describe('authenticated actor lifecycle',()=>{
 it('expired TV credentials never create a normal ghost player',()=>{const {connection}=fixture({chaosTVKey:'expired'});expect(connection.close).toHaveBeenCalledWith(expect.stringMatching(/pairing expired/));});
 it('native idle deadline is refreshed by valid custom activity, not invalid keys',()=>{vi.useFakeTimers();const {socket,player}=fixture();let expired=false,timer:any;player.resetTimeout.mockImplementation(()=>{clearTimeout(timer);timer=setTimeout(()=>expired=true,1000);});player.resetTimeout();vi.advanceTimersByTime(800);const ack=vi.fn();socket.emit('chaos:state',{key:'wrong'},ack);expect(ack.mock.calls[0][0].error).toBeTruthy();expect(player.resetTimeout).toHaveBeenCalledTimes(1);socket.emit('chaos:state',{key:'test-actor-key'},ack);vi.advanceTimersByTime(400);expect(expired).toBe(false);vi.advanceTimersByTime(700);expect(expired).toBe(true);socket.emit('disconnect');});
 it('empty authenticated TV lobby refreshes native timeout without a party actor',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:watch',{key:'test-tv-key',actorId:null},ack);expect(player.resetTimeout).toHaveBeenCalledTimes(1);expect(ack).toHaveBeenCalledWith({ok:true,lobby:true});socket.emit('disconnect');});
 it('save acknowledgment follows the native save method',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:save',{key:'test-actor-key'},ack);expect(player.saveToStorage).toHaveBeenCalledTimes(1);expect(ack).toHaveBeenCalledWith({ok:true});socket.emit('disconnect');});
 it('expired or cross-actor actions do not execute or become cancellable work',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:action',{key:'test-actor-key',actorId:123,id:'old',issuedAt:Date.now()-4000,intent:{verb:'cancel'}},ack);expect(ack.mock.calls[0][0].error).toMatch(/Stale/);expect(player.clearTarget).not.toHaveBeenCalled();socket.emit('chaos:action',{key:'test-actor-key',actorId:999,id:'other',issuedAt:Date.now(),intent:{verb:'cancel'}},ack);expect(player.clearTarget).not.toHaveBeenCalled();socket.emit('disconnect');});
 it('a cancelled in-flight move never finishes or moves a replacement action',async()=>{
  const {socket,player}=fixture();
  player.isDead=false;
  const receipts:any[]=[];socket.on('chaos:receipt',r=>receipts.push(r));
  let releaseMove:(()=>void)|undefined;
  let firstMove=false;
  shared.route.mockImplementation(async(_player:any,msg:any[])=>{
   // Delay only the first native MOVE. New commands must not inherit its result.
   if(msg.length===3 && typeof msg[1]==='number' && typeof msg[2]==='number'){
    if(!firstMove){firstMove=true;await new Promise<void>(r=>{releaseMove=r;});}
    _player.x=msg[1];_player.y=msg[2];
   }
   return true;
  });
  const send=(id:string,intent:any)=>{const ack=vi.fn();socket.emit('chaos:action',{key:'test-actor-key',actorId:123,id,issuedAt:Date.now(),intent},ack);return ack;};
  const slow=send('old-move',{verb:'move',dx:1,dy:0,steps:1});
  expect(slow).toHaveBeenCalledWith({ok:true});
  await new Promise(r=>setTimeout(r,350));
  expect(releaseMove).toBeTypeOf('function');
  const stop=send('stop-now',{verb:'cancel'});
  expect(stop).toHaveBeenCalledWith({ok:true});
  const fresh=send('new-move',{verb:'move',dx:-1,dy:0,steps:1});
  expect(fresh).toHaveBeenCalledWith({ok:true});
  releaseMove!();
  await new Promise(r=>setTimeout(r,650));
  expect(receipts.filter(r=>r.id==='old-move').map(r=>r.status)).toEqual(['started','cancelled']);
  expect(receipts.some(r=>r.id==='new-move'&&r.status==='succeeded')).toBe(true);
  expect(receipts.filter(r=>r.id==='new-move'&&r.status==='failed')).toHaveLength(0);
  socket.emit('disconnect');
 });

 it('directional controls stop at the first wall instead of walking around it',async()=>{
  const {socket,player,world}=fixture();player.isDead=false;
  const receipts:any[]=[];socket.on('chaos:receipt',r=>receipts.push(r));
  (world as any).isValidPosition=(x:number,y:number)=>!(x===11&&y===10);
  shared.route.mockImplementation(async(_player:any,msg:any[])=>{
    if(msg.length===3&&typeof msg[1]==='number'&&typeof msg[2]==='number'){
      _player.x=msg[1];_player.y=msg[2];
    }
    return true;
  });
  const ack=vi.fn();
  socket.emit('chaos:action',{key:'test-actor-key',actorId:123,id:'walk-wall',issuedAt:Date.now(),intent:{verb:'move',dx:1,dy:0,steps:3}},ack);
  expect(ack).toHaveBeenCalledWith({ok:true});
  await new Promise(r=>setTimeout(r,400));
  expect(player.x).toBe(10);
  expect(player.y).toBe(10);
  expect(receipts.some(r=>r.id==='walk-wall'&&r.status==='blocked')).toBe(true);
  expect(shared.route.mock.calls.some(([,msg])=>msg.length===3&&typeof msg[1]==='number')).toBe(false);
  socket.emit('disconnect');
 });

});

describe('native consumable integration',()=>{
 it('uses native inventory/health rules and preserves food at full health',async()=>{
  const {socket,player,world}=fixture();const inventory=new Inventory();inventory.addItem(Types.Entities.FLASK,null,2);player.getInventory=()=>inventory;player.hitPoints=50;
  player.hasFullHealth=()=>player.hitPoints===player.maxHitPoints;player.regenHealthBy=(amount:number)=>player.hitPoints=Math.min(player.maxHitPoints,player.hitPoints+amount);player.health=()=>[];player.send=vi.fn();(world as any).pushToPlayer=vi.fn();
  shared.route.mockImplementation(async(p:any,m:any)=>{expect(m[0]).toBe(Types.Messages.INVENTORY_USE);handleInventoryUse(p,m[1]);return true;});
  const receipts:any[]=[];socket.on('chaos:receipt',(r:any)=>receipts.push(r));
  const action=(id:string)=>new Promise(resolve=>socket.emit('chaos:action',{key:'test-actor-key',actorId:123,id,issuedAt:Date.now(),intent:{verb:'use_item',target:'flask'}},resolve));
  await action('heal');expect(player.hitPoints).toBeGreaterThan(50);expect(inventory.getSlot(0)?.count).toBe(1);expect(receipts.at(-1).status).toBe('succeeded');
  player.hitPoints=player.maxHitPoints;await action('full');expect(inventory.getSlot(0)?.count).toBe(1);expect(receipts.at(-1).status).toBe('blocked');socket.emit('disconnect');
 });
});
