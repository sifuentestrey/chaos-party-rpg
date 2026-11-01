import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRoom,addPlayer,startGame,submit,advance,publicRoom,hostCommand} from '../public/core.js';
import {visibleItems} from '../public/world-items.js';
import {bindRegionStorage} from '../public/campaign.js';
import {openCampaignStore} from '../src/campaign-store.mjs';
import {applyAIPlan,validateAIPlan} from '../public/ai-plan.js';
function game(){const r=createRoom({seed:73825,now:0}),p=addPlayer(r,{token:'campaign-test-long-token',name:'Jinx',role:'rogue'},0);startGame(r,0);return {r,p,now:1000};}
function act(g,text){submit(g.r,g.p.id,{requestId:'campaign-'+g.now,text},g.now);advance(g.r,g.now+9000);const result=g.r.result;advance(g.r,g.now+16000);g.now+=17000;return result;}
function succeed(g,text,condition){for(let n=0;n<40;n++){g.p.hp=g.p.maxHp;const result=act(g,text);assert.equal(result.blocked,false,text+': '+result.narration);if(result.success&&(!condition||condition()))return result;}assert.fail('No success: '+text);}
test('persistent adventure accepts a returned keepsake inside an arbitrary player creation; reward only once',()=>{
 const g=game();act(g,'Travel to clearing');const s=g.r.world.expedition,q=s.regions.clearing.quest;
 assert.equal(act(g,'Talk to '+q.patronId).success,true);assert.equal(q.status,'active');
 succeed(g,'Befriend '+q.threatId);assert.equal(s.creatures[q.threatId].attitude,'friendly');
 succeed(g,'Open '+q.chestId);act(g,'Take '+q.relicId);act(g,'Take item-5');
 succeed(g,`Make a ridiculous keepsake hat from ${q.relicId} and item-5`);const hat=Object.values(s.items).find(i=>i.components.includes(q.relicId));assert.ok(hat);
 act(g,'Equip '+hat.id);act(g,'Give '+hat.id+' to '+q.patronId);assert.equal(q.status,'completed');assert.equal(s.campaign.chapter,2);assert.equal(s.campaign.renown,1);assert.equal(s.items[q.relicId].parentId,hat.id);
 const gold=g.p.gold;act(g,'Talk to '+q.patronId);assert.equal(g.p.gold,gold);assert.equal(s.campaign.completed.length,1);
 assert.ok(s.campaign.history.some(h=>h.type==='adventure'));
});
test('parts, healing, visible damage, material traits, fire and containers compose across entities',()=>{
 const g=game();act(g,'Travel to clearing');const s=g.r.world.expedition,q=s.regions.clearing.quest,npc=s.creatures[q.patronId],beast=s.creatures[q.threatId];
 act(g,'Take item-5');succeed(g,'Bandage '+npc.id);assert.equal(npc.hp,npc.maxHp);assert.deepEqual(npc.injuries,[]);assert.equal(s.items['item-5'].attachedTo,npc.id);
 succeed(g,'Befriend '+beast.id);succeed(g,'Cut tuft of fur from '+beast.id);const fur=Object.values(s.items).find(i=>i.originId===beast.id);assert.ok(fur);assert.equal(beast.parts[0].count,1);
 act(g,'Take item-6');succeed(g,'Make a fur mask from '+fur.id+' and item-6');const mask=Object.values(s.items).find(i=>i.name==='fur mask');assert.ok(mask.properties.combustible);
 act(g,'Attach '+mask.id+' to '+beast.id);assert.equal(mask.ownerId,beast.id);assert.equal(mask.equipped,true);
 act(g,'Take item-7');act(g,'Open item-7');act(g,'Take item-8');assert.equal(act(g,'Put item-8 into item-7').success,true);act(g,'Close item-7');assert.equal(visibleItems(g.r).some(i=>i.id==='item-8'),false);assert.equal(act(g,'Take item-8').blocked,true);act(g,'Open item-7');act(g,'Take item-8');assert.equal(s.items['item-8'].containerId,undefined);
 const spring=Object.values(s.items).find(i=>i.source==='water');assert.equal(act(g,'Fill item-7 from '+spring.id).success,true);g.p.hp=4;act(g,'Drink item-7');assert.equal(g.p.hp,5);assert.equal(s.items['item-7'].liquid.amount,2);
 const gate=Object.values(s.items).find(i=>i.name==='weathered gate');succeed(g,'Ignite '+gate.id);act(g,'Inspect '+gate.id);act(g,'Inspect '+gate.id);assert.equal(gate.condition,'broken');assert.equal(gate.open,true);
});
test('many explored regions unload to checksummed disk chunks and restore after restart without losing carried objects',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-campaign-chunks-'));try{
  const g=game(),store=openCampaignStore(dir);bindRegionStorage(g.r,store.regionStorage(g.r.code));act(g,'Take item-2');act(g,'Travel to clearing');const coffer=g.r.world.expedition.regions.clearing.quest.chestId;succeed(g,'Open '+coffer);act(g,'Travel to ruins');act(g,'Travel to wild-0-0');
  for(let x=1;x<=30;x++)assert.equal(act(g,`Travel to wild-${x}-0`).success,true);
  const s=g.r.world.expedition;assert.ok(Object.keys(s.regionRefs).length>=30);assert.ok(Object.keys(s.items).length<35);assert.ok(Object.keys(s.creatures).length<=2);assert.ok(Object.keys(publicRoom(g.r).world.expedition.locations).length<=5);
  store.checkpoint(g.r);const again=openCampaignStore(dir);g.r=structuredClone(again.rooms[g.r.code]);g.p=g.r.players[0];bindRegionStorage(g.r,again.regionStorage(g.r.code));
  for(let x=29;x>=0;x--)act(g,`Travel to wild-${x}-0`);act(g,'Travel to ruins');act(g,'Travel to clearing');assert.equal(g.r.world.expedition.items[coffer].open,true);assert.equal(g.r.world.expedition.items['item-2'].ownerId,g.p.id);
  const ref=g.r.world.expedition.regionRefs['wild-20-0'];fs.writeFileSync(path.join(dir,'regions',ref+'.json'),'bad data');assert.throws(()=>again.regionStorage(g.r.code).read(ref),/checksum/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('one model can propose a novel identity and appearance while server owns sources, dice and mutations',()=>{
 const g=game();act(g,'Take item-1');act(g,'Take item-2');const now=g.now;
 submit(g.r,g.p.id,{requestId:'creative',text:'I weave my scraps into an absurd purple raincatcher'},now);assert.equal(g.r.turn.worldLocked,false);
 const raw={domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name:'absurd raincatcher',itemType:'wearable',slot:'body',color:'#bd88cf',summary:'Weave the carried components into a wearable raincatcher.'};
 const seed=g.r.seed;assert.equal(applyAIPlan(g.r,g.r.turn.id,raw,'test-fixture',now+1),true);assert.equal(g.r.seed,seed);assert.equal(g.r.world.expedition.items['item-1'].ownerId,g.p.id);assert.equal(g.r.turn.action,'I weave my scraps into an absurd purple raincatcher');advance(g.r,now+9000);assert.equal(g.r.stats.rolls,1);
 for(const bad of [{...raw,hp:999},{...raw,sources:['item-1','unicorn']},{...raw,color:'url(evil)'},{...raw,slot:'invincible'}])assert.throws(()=>validateAIPlan(bad,g.r,g.p.id));
});
test('an ended heist can continue as the same campaign with characters and inventory preserved',()=>{const g=game();g.r.phase='ended';g.r.quest.escaped=true;g.p.inventory.push('Keepsake');hostCommand(g.r,{type:'continueCampaign'},g.now);assert.equal(g.r.phase,'open');assert.equal(g.r.world.expedition.campaign.continuing,true);assert.ok(g.p.inventory.includes('Keepsake'));assert.equal(act(g,'Explore').success,true);});
test('procedural adventures include recovery, rescue and repair with authoritative objectives',()=>{
 const g=game();act(g,'Travel to clearing');act(g,'Travel to ruins');act(g,'Travel to wild-0-0');const seen=new Set();
 for(let x=0;x<40&&seen.size<3;x++){
  const s=g.r.world.expedition,q=s.regions[s.current].quest;seen.add(q.kind);act(g,'Talk to '+q.patronId);succeed(g,'Befriend '+q.threatId);
  if(q.kind==='rescue'){const cloth=Object.values(s.items).find(i=>i.location===s.current&&i.material==='cloth');act(g,'Take '+cloth.id);succeed(g,'Bandage '+q.patronId);}
  else if(q.kind==='restore')succeed(g,'Repair '+q.gateId);
  else{succeed(g,'Open '+q.chestId);act(g,'Take '+q.relicId);act(g,'Give '+q.relicId+' to '+q.patronId);}
  assert.equal(q.status,'completed');act(g,`Travel to wild-${x+1}-0`);
 }
 assert.deepEqual([...seen].sort(),['recover','rescue','restore']);assert.ok(g.r.world.expedition.campaign.chapter>=4);
});
test('remote tavern plans and fabricated creative outcomes cannot mutate a generated region',()=>{
 const g=game();act(g,'Travel to clearing');const seed=g.r.seed;
 submit(g.r,g.p.id,{requestId:'creative-outside',text:'I build a castle out of pure imagination'},g.now);
 assert.throws(()=>applyAIPlan(g.r,g.r.turn.id,{verb:'take',target:'chest',summary:'Steal the crown remotely'},'fixture',g.now+1),/remote/);
 advance(g.r,g.now+9000);assert.equal(g.r.result.blocked,true);assert.equal(g.r.result.success,false);assert.equal(g.r.seed,seed);assert.equal(g.r.quest.crown,false);
});
test('older dynamic-object saves project safely before a new action',()=>{
 const g=game();delete g.r.world.expedition.campaign;delete g.r.world.expedition.regions;delete g.r.world.expedition.creatures;const original=g.p.id;
 const view=publicRoom(g.r);assert.equal(view.world.expedition.campaign.chapter,1);assert.equal(view.players[0].id,original);assert.equal(view.world.expedition.items['item-1'].name,'cloth strip');
});
