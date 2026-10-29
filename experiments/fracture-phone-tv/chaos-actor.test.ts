/** Chaos-owned actor lifecycle regressions, run by pinned upstream Vitest. */
import {describe,it,expect,vi,afterEach} from 'vitest';
import {EventEmitter} from 'node:events';
vi.mock('../player/message-router',()=>({MessageRouter:class {route=vi.fn(async()=>true);}}));
import {installChaosActor} from '../chaos-actor';
afterEach(()=>{vi.useRealTimers();delete process.env.CHAOS_ACTOR_KEY;delete process.env.CHAOS_TV_KEY;});
function fixture(auth:any={chaosActorKey:'test-actor-key'}){
 process.env.CHAOS_ACTOR_KEY='test-actor-key';process.env.CHAOS_TV_KEY='test-tv-key';
 const socket:any=new EventEmitter();socket.connected=true;socket.handshake={auth};
 const world={entities:{},mobs:{},zoneManager:{getZoneAt:()=>null},getStorageService:()=>({})};
 const player:any={id:123,name:'Test',hasEnteredGame:true,x:10,y:10,hitPoints:100,maxHitPoints:100,weapon:60,armor:21,getWorld:()=>world,getInventory:()=>({getSlots:()=>[]}),clearTarget:vi.fn(),broadcast:vi.fn(),resetTimeout:vi.fn(),saveToStorage:vi.fn()};
 const connection:any={_connection:socket,clientIp:'127.0.0.1',listenCallback:vi.fn(),close:vi.fn()};installChaosActor(player,connection);return {socket,player,world,connection};
}
describe('authenticated actor lifecycle',()=>{
 it('expired TV credentials never create a normal ghost player',()=>{const {connection}=fixture({chaosTVKey:'expired'});expect(connection.close).toHaveBeenCalledWith(expect.stringMatching(/pairing expired/));});
 it('native idle deadline is refreshed by valid custom activity, not invalid keys',()=>{vi.useFakeTimers();const {socket,player}=fixture();let expired=false,timer:any;player.resetTimeout.mockImplementation(()=>{clearTimeout(timer);timer=setTimeout(()=>expired=true,1000);});player.resetTimeout();vi.advanceTimersByTime(800);const ack=vi.fn();socket.emit('chaos:state',{key:'wrong'},ack);expect(ack.mock.calls[0][0].error).toBeTruthy();expect(player.resetTimeout).toHaveBeenCalledTimes(1);socket.emit('chaos:state',{key:'test-actor-key'},ack);vi.advanceTimersByTime(400);expect(expired).toBe(false);vi.advanceTimersByTime(700);expect(expired).toBe(true);socket.emit('disconnect');});
 it('empty authenticated TV lobby refreshes native timeout without a party actor',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:watch',{key:'test-tv-key',actorId:null},ack);expect(player.resetTimeout).toHaveBeenCalledTimes(1);expect(ack).toHaveBeenCalledWith({ok:true,lobby:true});socket.emit('disconnect');});
 it('save acknowledgment follows the native save method',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:save',{key:'test-actor-key'},ack);expect(player.saveToStorage).toHaveBeenCalledTimes(1);expect(ack).toHaveBeenCalledWith({ok:true});socket.emit('disconnect');});
 it('expired or cross-actor actions do not execute or become cancellable work',()=>{vi.useFakeTimers();const {socket,player}=fixture(),ack=vi.fn();socket.emit('chaos:action',{key:'test-actor-key',actorId:123,id:'old',issuedAt:Date.now()-4000,intent:{verb:'cancel'}},ack);expect(ack.mock.calls[0][0].error).toMatch(/Stale/);expect(player.clearTarget).not.toHaveBeenCalled();socket.emit('chaos:action',{key:'test-actor-key',actorId:999,id:'other',issuedAt:Date.now(),intent:{verb:'cancel'}},ack);expect(player.clearTarget).not.toHaveBeenCalled();socket.emit('disconnect');});
});
