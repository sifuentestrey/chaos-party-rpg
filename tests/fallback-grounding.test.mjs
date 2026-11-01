import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {spawnItem} from '../public/campaign.js';

function tavern(seed=73825, players=['Jinx']) {
  const room=createRoom({code:'GROUND',seed,now:0});
  const roster=players.map((name,i)=>addPlayer(room,{name,token:`grounding-token-${i}-long`},0));
  startGame(room,0);
  return {room,players:roster};
}
const actionCounts=new WeakMap();
function act(room,player,text) {
  const now=Math.max(1000,(room.updatedAt||0)+1000);
  const requestId=`ground-action-${(actionCounts.get(room)||0)+1}`;
  actionCounts.set(room,(actionCounts.get(room)||0)+1);
  submit(room,player.id,{requestId,text},now);
  advance(room,room.turn.deadline+1);
  return room.result;
}
function finishSetup(prepared) {
  advance(prepared.room,prepared.room.turn.deadline+1);
  advance(prepared.room,prepared.room.updatedAt+7000);
  return prepared;
}

test('an unavailable claimed rug stays the target and cannot ignite the fireplace instead',()=>{
  for(const text of ['Set the stolen rug on fire','Set the stolen rug on fire.','Set the fire dragon on fire']) {
    const {room,players:[actor]}=tavern();
    const worldBefore=structuredClone(room.world);
    const result=act(room,actor,text);
    assert.notEqual(result.target.kind,'hearth',text);
    assert.equal(result.blocked,true,text);
    assert.deepEqual(room.world,worldBefore,text);
  }
});

test('an owned rug ignition remains bound to the actual carried instance',()=>{
  const {room,actor}=finishSetup(prepareAICase({id:'owned-rug-ignition',setup:'craft',text:'Inspect item-1'}));
  const rug=room.world.expedition.items['item-1'];
  rug.name='Tavern rug';rug.material='cloth';rug.materials=['cloth'];rug.properties={combustible:true};
  assert.equal(rug.ownerId,actor.id);
  act(room,actor,'Set my Tavern rug on fire');
  assert.equal(room.result.blocked,false);
  assert.equal(room.result.target.entityId,'item-1');
  assert.equal(room.world.expedition.items['item-1'].condition,'burning');
  assert.equal(room.world.props.rug,true);
});

test('a rug recorded as already gone blocks the ignition without room mutation',()=>{
  const {room,players:[actor]}=tavern();
  room.world.props.rug=false;
  room.world.objects={...(room.world.objects||{}),rug:{condition:'taken'}};
  const before=structuredClone(room.world);
  const result=act(room,actor,'Ignite the rug');
  assert.equal(result.blocked,true);
  assert.notEqual(result.target.kind,'hearth');
  assert.deepEqual(room.world,before);
});

test('a carried rug owned by another player cannot be used or redirected to the fireplace',()=>{
  const {room,players:[actor,owner]}=tavern(73825,['Jinx','Moss']);
  const rug=room.world.expedition.items['item-1'];
  rug.name='Tavern rug';rug.material='cloth';rug.materials=['cloth'];rug.properties={combustible:true};rug.ownerId=owner.id;rug.location=null;
  const before=structuredClone(room.world);
  const result=act(room,actor,'Ignite item-1');
  assert.equal(result.blocked,true);
  assert.notEqual(result.target.kind,'hearth');
  assert.equal(rug.ownerId,owner.id);
  assert.deepEqual(room.world,before);
});

test('native room dance and fireplace actions remain available',()=>{
  for(const text of ['Dance for the tavern','Sing a song for the tavern']) {
    const {room:danceRoom,players:[dancer]}=tavern();
    const first=act(danceRoom,dancer,text);
    assert.equal(first.blocked,false,text);
  }
  const {room,players:[actor]}=tavern();
  const second=act(room,actor,'Ignite the hearth');
  assert.equal(second.blocked,false);
  assert.equal(second.target.kind,'hearth');
  const {room:candleRoom,players:[candleActor]}=tavern();
  const candle=act(candleRoom,candleActor,'Light candle!');
  assert.equal(candle.blocked,false);
  assert.equal(candle.target.kind,'candle');
  const {room:rugRoom,players:[rugActor]}=tavern();
  const rug=act(rugRoom,rugActor,'Burn rug.');
  assert.equal(rug.blocked,false);
  assert.equal(rug.target.kind,'rug');
  assert.ok(rug.changes.some(change=>/rug burning/i.test(change)));
});

test('vocal calming attempts against a missing wolf cannot become dance, clue, coin, or healing',()=>{
  for (const text of ['Rap to calm the wolf','Sing a song to soothe the wolf','Sing a song to calm the wolf!','Sing a calming song to the guard wolf']) {
    const {room,players:[actor]}=tavern();
    const before={score:actor.score,hp:actor.hp,gold:actor.gold,clues:room.quest.clues,inventory:[...actor.inventory]};
    const worldBefore=structuredClone(room.world);
    const result=act(room,actor,text);
    assert.equal(result.blocked,true,text);
    assert.notEqual(result.intent,'dance',text);
    assert.deepEqual({score:actor.score,hp:actor.hp,gold:actor.gold,clues:room.quest.clues,inventory:actor.inventory},before,text);
    assert.deepEqual(room.world,worldBefore,text);
  }
});

test('present creature accepts native song pacification without consuming cloth',()=>{
  const {room,actor}=prepareAICase({id:'native-song-pacify',setup:'creature',text:'Pacify Cinder Wolf with a soothing song'});
  const cloth=structuredClone(room.world.expedition.items['item-1']);
  const creature=room.world.expedition.creatures['beast-clearing'];
  const attitude=creature.attitude;
  assert.equal(room.turn.worldLocked,true);
  advance(room,room.turn.deadline+1);
  assert.equal(room.result.blocked,false);
  assert.equal(room.result.success,true);
  assert.notEqual(creature.attitude,attitude);
  assert.match(room.result.narration,/calm|pacif|sing|song/i);
  assert.deepEqual(room.world.expedition.items['item-1'],cloth);
});

test('absent wayfarer treatment cannot resolve as generic healing or award score',()=>{
  for (const text of ['Bandage the wayfarer injury with my cloth','Treat the injured wayfarer with my cloth strip','Revive Missing','Mend Missing','Heal the fireplace keeper','Bandage the rug','Pacify the fireplace','Sing a song to calm the fireplace']) {
    const {room,players:[actor]}=tavern();
    const before={score:actor.score,hp:actor.hp,gold:actor.gold,inventory:[...actor.inventory],clues:room.quest.clues};
    const result=act(room,actor,text);
    assert.equal(result.blocked,true,text);
    assert.deepEqual({score:actor.score,hp:actor.hp,gold:actor.gold,inventory:actor.inventory,clues:room.quest.clues},before,text);
  }
});

test('a present patient with an explicitly wrong tool is not treated or generically healed',()=>{
  const {room,actor}=prepareAICase({id:'wrong-tool-bandage',setup:'creature',text:'Bandage the wayfarer using my wood splinter'});
  const patient=room.world.expedition.creatures['person-clearing'];
  const hp=patient.hp,injuries=[...patient.injuries],wood=structuredClone(room.world.expedition.items['item-2']);
  advance(room,room.turn.deadline+1);
  assert.equal(room.result.blocked,true);
  assert.equal(patient.hp,hp);
  assert.deepEqual(patient.injuries,injuries);
  assert.deepEqual(room.world.expedition.items['item-2'],wood);
  assert.equal(room.world.expedition.items['item-2'].ownerId,actor.id);
});

test('returning from the clearing cannot make a remote wayfarer available for treatment',()=>{
  const {room,actor}=prepareAICase({id:'remote-wayfarer',setup:'creature',text:'Travel to tavern'});
  advance(room,room.turn.deadline+1);
  assert.equal(room.world.expedition.current,'tavern');
  advance(room,room.updatedAt+7000);
  act(room,actor,'Bandage Tansy the Wayfarer using item-1');
  assert.equal(room.result.blocked,true);
  assert.equal(room.world.expedition.items['item-1'].ownerId,actor.id);
});

test('present injured wayfarer treatment consumes its exact carried cloth only on successful resolution',()=>{
  for(const text of ['Bandage the wayfarer’s sprained arm using my cloth strip','Bandage the wayfarer’s injury with my cloth strip!']) {
  const {room,actor}=prepareAICase({id:'native-bandage',setup:'creature',text});
  const patient=room.world.expedition.creatures['person-clearing'];
  assert.equal(room.turn.worldLocked,true);
  const cloth=room.world.expedition.items['item-1'];
  assert.equal(cloth.ownerId,actor.id);
  patient.hp=Math.max(1,patient.hp-2);
  const injuredHp=patient.hp;
  advance(room,room.turn.deadline+1);
  assert.equal(room.result.blocked,false);
  assert.equal(room.world.expedition.items['item-1'].ownerId,null);
  assert.equal(room.world.expedition.items['item-1'].attachedTo,patient.id);
  assert.ok(patient.hp>injuredHp);
  }
});

test('punctuation in a saved item name binds the named carried cloth, not its similar-name sibling',()=>{
  const {room,actor}=finishSetup(prepareAICase({id:'punctuated-cloth-name',setup:'creature',text:'Inspect item-1'}));
  const items=room.world.expedition.items;
  items['item-1'].name='cloth!';
  const sibling=spawnItem(room.world.expedition,null,{name:'cloth',material:'cloth',ownerId:actor.id});
  assert.equal(items['item-1'].ownerId,actor.id);
  assert.equal(sibling.ownerId,actor.id);
  const patient=room.world.expedition.creatures['person-clearing'];
  act(room,actor,'Bandage the wayfarer’s injury with cloth!');
  assert.equal(room.result.blocked,false);
  assert.equal(items['item-1'].attachedTo,patient.id);
  assert.equal(items['item-1'].ownerId,null);
  assert.equal(sibling.ownerId,actor.id);
});

test('native self healing and player healing remain valid without medical cloth',()=>{
  const {room,players:[actor]}=tavern();
  actor.hp=2;
  const self=act(room,actor,'Heal myself');
  assert.equal(self.blocked,false);
  assert.ok(actor.hp>2);
  const {room:allyRoom,players:[healer,other]}=tavern(73825,['Jinx','Moss']);
  other.hp=0;
  const ally=act(allyRoom,healer,'Revive Moss!');
  assert.equal(ally.blocked,false);
  assert.equal(ally.target.kind,'player');
  assert.equal(ally.target.id,other.id);
  assert.ok(other.hp>0);
});

test('first accepted declaration remains immutable when a duplicate request arrives',()=>{
  const {room,players:[actor]}=tavern();
  submit(room,actor.id,{requestId:'same-native-request',text:'Inspect the bar'},1000);
  const accepted=room.turn.action;
  const repeated=submit(room,actor.id,{requestId:'same-native-request',text:'Set the rug on fire'},1200);
  assert.equal(repeated.duplicate,true);
  assert.equal(room.turn.action,accepted);
});
