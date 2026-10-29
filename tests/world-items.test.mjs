import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {ensureItems,visibleItems,itemPlan} from '../public/world-items.js';
import {applyAIPlan} from '../public/ai-plan.js';
import {openCampaignStore} from '../src/campaign-store.mjs';
function game(){const r=createRoom({seed:73825,now:0}),p=addPlayer(r,{token:'world-test-token-long',name:'Jinx'},0),q=addPlayer(r,{token:'other-world-token-long',name:'Moss'},0);q.connected=false;startGame(r,0);return {r,p,q,now:1000};}
function act(g,text,p=g.p){submit(g.r,p.id,{requestId:'world-'+g.now,text},g.now);if(/^Travel to /i.test(text))for(const voter of g.r.players.filter(x=>x.id!==p.id&&x.connected))submit(g.r,voter.id,{requestId:'approve-'+g.now,kind:'reaction',reaction:'assist',text:'Travel together',turnId:g.r.turn.id},g.now+1);advance(g.r,g.now+9000);const result=g.r.result;advance(g.r,g.now+16000);g.now+=17000;return result;}
function craft(g,name='Ridiculous hat'){
 assert.equal(act(g,'Take item-1').success,true);assert.equal(act(g,'Take item-2').success,true);
 for(let n=0;n<30;n++){if(act(g,`Make a ${name} from item-1 and item-2`).success)return Object.values(g.r.world.expedition.items).find(i=>i.name===name);}
 assert.fail('Craft never succeeded');
}
test('arbitrary wearable identity, real components, transfer, restart, travel and reuse',()=>{
 const g=game(),made=craft(g,'interstellar tax collector hat'),world=g.r.world.expedition;
 assert.equal(made.type,'wearable');assert.deepEqual(made.components,['item-1','item-2']);assert.equal(world.items['item-1'].parentId,made.id);
 assert.equal(act(g,'Equip '+made.id).success,true);assert.equal(made.equipped,true);
 assert.equal(act(g,'Give '+made.id+' to Moss').success,true);assert.equal(made.ownerId,g.q.id);assert.equal(made.equipped,false);
 assert.equal(act(g,'Equip '+made.id).blocked,true);
 assert.equal(act(g,'Equip '+made.id,g.q).success,true);
 assert.equal(act(g,'Travel to clearing',g.q).success,true);assert.equal(made.ownerId,g.q.id);assert.equal(made.equipped,true);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-items-save-'));
 try{openCampaignStore(dir).checkpoint(g.r);g.r=openCampaignStore(dir).rooms[g.r.code];g.p=g.r.players[0];g.q=g.r.players[1];const saved=g.r.world.expedition.items[made.id];assert.deepEqual(saved,made);
  assert.equal(act(g,'Travel to ruins',g.q).success,true);assert.equal(act(g,'Drop '+made.id,g.q).success,true);
  assert.equal(act(g,'Travel to clearing').success,true);assert.equal(visibleItems(g.r).some(i=>i.id===made.id),false);
  assert.equal(act(g,'Travel to ruins').success,true);assert.equal(act(g,'Take '+made.id).success,true);
  assert.equal(act(g,'Separate '+made.id).success,true);assert.equal(g.r.world.expedition.items['item-1'].ownerId,g.p.id);assert.equal(g.r.world.expedition.items['item-2'].parentId,undefined);
  for(let i=0;i<30;i++)if(act(g,'Use item-2 on smooth stone').success)break;
  assert.equal(Object.values(g.r.world.expedition.items).find(i=>i.location==='ruins'&&i.material==='stone').condition,'broken');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('failed craft consumes nothing; repeated request cannot create twice; model cannot overwrite',()=>{
 const g=game();act(g,'Take item-1');act(g,'Take item-2');
 let failed=false;
 for(let i=0;i<30;i++){
  const requestId='once-'+g.now,now=g.now;submit(g.r,g.p.id,{requestId,text:'Make a quantum turnip mask from item-1 and item-2'},now);
  assert.equal(applyAIPlan(g.r,g.r.turn.id,{verb:'take',target:'chest',summary:'Cheat'},'fake',now+1),false);
  assert.equal(submit(g.r,g.p.id,{requestId,text:'Steal the crown'},now+1).duplicate,true);
  advance(g.r,now+9000);if(!g.r.result.success){failed=true;assert.equal(g.r.world.expedition.items['item-1'].ownerId,g.p.id);assert.equal(g.r.world.expedition.items['item-1'].parentId,undefined);break;}
  const item=Object.values(g.r.world.expedition.items).find(i=>i.ownerId===g.p.id&&i.components.length);advance(g.r,now+16000);g.now+=17000;act(g,'Separate '+item.id);
 }
 assert.equal(failed,true);
});
test('ownership, unknown targets, repeated sources, remote access and non-adjacent travel are blocked',()=>{
 const g=game();act(g,'Take item-1');
 for(const text of ['Make a hat from item-1 and item-1','Make a hat from item-1 and item-5','Travel to ruins','Give item-1 to Missing','Equip item-1','Use item-1 on item-2'])assert.equal(act(g,text).blocked,true,text);
 assert.equal(act(g,'Take item-1',g.q).blocked,true);
 assert.equal(act(g,'Travel to clearing').success,true);
 const before=structuredClone(g.r.quest);assert.equal(act(g,'Punch Captain Brick').blocked,true);assert.deepEqual(g.r.quest,before);
 assert.equal(act(g,'Take item-3').blocked,true);
});
test('old campaigns initialize additively and seeded locations remain stable',()=>{
 const g=game();delete g.r.world.expedition;g.p.inventory.push('Old keepsake');const seed=g.r.seed,avatar=structuredClone(g.p.avatar),pin=g.p.pin;
 const s=ensureItems(g.r);assert.equal(g.r.seed,seed);assert.equal(g.p.pin,pin);assert.deepEqual(g.p.avatar,avatar);assert.ok(g.p.inventory.includes('Old keepsake'));
 const h=game();assert.deepEqual(h.r.world.expedition.locations,s.locations);
 assert.equal(itemPlan(g.r,g.p,'Make a surprise tool from missing and imaginary').error.includes('own pockets'),true);
});
test('appearance follows a bounded named palette and knocked-out explorers can recover',()=>{
 const g=game(),made=craft(g,'red moon hat');assert.equal(made.appearance.color,'#d87878');assert.equal(made.appearance.shape,'band');
 act(g,'Travel to clearing');g.p.hp=0;for(let n=0;n<25&&!g.p.hp;n++)act(g,'Rest');assert.ok(g.p.hp>0);
 assert.equal(act(g,'Take item-999').blocked,true);
});
test('attachments preserve nested identities and separate without duplicating components',()=>{
 const g=game(),made=craft(g,'blue traveler hat');act(g,'Take item-3');
 let combined;
 for(let n=0;n<30;n++)if(act(g,'Attach item-3 to '+made.id).success){combined=Object.values(g.r.world.expedition.items).find(i=>i.components.includes(made.id));break;}
 assert.ok(combined);assert.equal(combined.type,'wearable');assert.equal(combined.slot,'head');assert.equal(made.parentId,combined.id);
 assert.equal(visibleItems(g.r).some(i=>i.id===made.id),false);
 act(g,'Separate '+combined.id);assert.equal(made.ownerId,g.p.id);assert.deepEqual(made.components,['item-1','item-2']);assert.equal(g.r.world.expedition.items['item-1'].parentId,made.id);
 act(g,'Separate '+made.id);assert.equal(g.r.world.expedition.items['item-1'].ownerId,g.p.id);
 const before=Object.keys(g.r.world.expedition.items).length;assert.equal(act(g,'Separate '+made.id).blocked,true);assert.equal(Object.keys(g.r.world.expedition.items).length,before);
});
