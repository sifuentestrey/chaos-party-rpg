import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,startGame,submit,advance,hostCommand} from '../public/core.js';
import {OBJECTS,objectState,environmentTarget} from '../public/environment.js';
import {approachPath} from '../public/navigation.js';
import {selectD20} from '../public/vendor/dnd5e-advantage.js';
function game(){const r=createRoom({seed:73825,now:0});const p=addPlayer(r,{token:'beta-test-token-long',name:'Jinx',role:'knight'},0);startGame(r,0);return {r,p,now:1000};}
function act(g,text){submit(g.r,g.p.id,{requestId:'beta-'+g.now,text},g.now);advance(g.r,g.now+9000);const result=structuredClone(g.r.result);advance(g.r,g.now+16000);g.now+=17000;return result;}
test('every registered object has a unique target phrase and can be inspected without rolling',()=>{
  const g=game();for(const [id,o] of Object.entries(OBJECTS)){
    assert.equal(environmentTarget(o.name)?.kind,id,o.name);
    const seed=g.r.seed,rolls=g.r.stats.rolls;const result=act(g,'Inspect '+o.name);
    assert.equal(result.target.kind,id);assert.equal(result.automatic,true);assert.equal(g.r.stats.rolls,rolls);assert.equal(g.r.seed,seed);
  }
});
test('door uses deterministic open/close state, and large furniture cannot be pocketed for rewards',()=>{
  const g=game();assert.equal(act(g,'Open the tavern door').success,true);assert.equal(objectState(g.r.world,'door').open,true);
  assert.equal(act(g,'Close the tavern door').success,true);assert.equal(objectState(g.r.world,'door').open,false);
  const score=g.p.score,gold=g.p.gold,result=act(g,'Steal the table');assert.equal(result.blocked,true);assert.equal(result.success,false);assert.equal(g.p.score,score);assert.equal(g.p.gold,gold);
});
test('flames, spills, disadvantage and cover survive JSON reload; scene reset restores them',()=>{
  const g=game();act(g,'Extinguish the fireplace');assert.equal(objectState(g.r.world,'hearth').lit,false);
  act(g,'Spill the barrel');assert.equal(objectState(g.r.world,'barrel').spilled,true);
  g.r=JSON.parse(JSON.stringify(g.r));g.p=g.r.players[0];const result=act(g,'Dance for the guards');assert.equal(result.advantage,-1);assert.equal(result.dice.length,2);
  act(g,'Hide behind the table');assert.equal(g.r.result.success,true);
  // Verify cover while a second player's turn triggers the guard sweep.
  const p2=addPlayer(g.r,{token:'other-beta-player-token',name:'Moss'},g.now);
  const hp=g.p.hp;g.r.chaos=9;assert.equal(g.p.status,'hiding');
  submit(g.r,p2.id,{requestId:'guard-sweep',text:'Punch Captain Brick'},g.now);advance(g.r,g.now+9000);assert.equal(g.p.hp,hp);assert.equal(g.p.status,'hiding');
  hostCommand(g.r,{type:'resetScene'},g.now+10000);assert.equal(objectState(g.r.world,'hearth').lit,true);assert.equal(objectState(g.r.world,'barrel').spilled,undefined);assert.ok(p2.id);
});
test('Foundry advantage selection keeps correct die including ties',()=>{assert.equal(selectD20([3,17],1),17);assert.equal(selectD20([3,17],-1),3);assert.equal(selectD20([12,12],1),12);});
test('crown theft remains a risky check, not the automatic impossible-furniture path',()=>{const g=game();g.r.quest.clues=3;const r=act(g,'Steal the crown from the chest');assert.equal(r.automatic,false);assert.equal(r.dc,13);assert.ok(r.roll>=1&&r.roll<=20);assert.equal(r.check,'Sleight of hand');});
test('unknown attempts cannot award imaginary coins, XP or clues',()=>{const g=game(),gold=g.p.gold,score=g.p.score;const r=act(g,'Contemplate quantum bureaucracy');assert.equal(r.success,false);assert.equal(r.blocked,true);assert.equal(g.p.gold,gold);assert.equal(g.p.score,score);assert.equal(g.r.quest.clues,0);});
test('a legacy campaign gains object state without replacing its character or inventory',()=>{const g=game();g.r.version='0.2.0';delete g.r.world.props;delete g.r.world.objects;g.p.inventory.push('Old campaign keepsake');const id=g.p.id,pin=g.p.pin;act(g,'Open the tavern door');const loaded=JSON.parse(JSON.stringify(g.r));const rejoined=addPlayer(loaded,{token:g.p.token,name:'Ignored rename'},g.now);assert.equal(rejoined.id,id);assert.equal(rejoined.pin,pin);assert.ok(rejoined.inventory.includes('Old campaign keepsake'));assert.equal(objectState(loaded.world,'door').open,true);});
test('ROT path routes around intact tables instead of crossing their footprint',()=>{
  const path=approachPath([190,285],[310,405],{props:{rug:true}});assert.ok(path.length>1);
  for(const [x,y] of path.slice(1))assert.equal(Math.abs(x-245)<51&&y>307&&y<373,false,`${x},${y}`);
});
