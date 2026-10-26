import { seats as slots, landmarks as npcPositions, targetPosition, actorPosition, recoil } from './tavern-motion.js';
import { SKIN, HAIR, CLOTHES, DEFAULT_AVATAR } from './core.js';
import { ninjaAvatarFrame, drawNinjaEffect, ninjaAssetsReady } from './ninja.js';
ninjaAssetsReady.then(()=>document.dispatchEvent(new CustomEvent('ninja-assets-ready')));

const sprites=new Image(); sprites.src='/assets/kenney/dungeon.png';
const town=new Image(); town.src='/assets/kenney/town.png';
const avatarCache=new Map();
export function avatarCanvas(avatar=DEFAULT_AVATAR,animation='idle',timeMs=0) {
  const professional=ninjaAvatarFrame(avatar,animation,timeMs);if(professional)return professional;
  const a={...DEFAULT_AVATAR,...avatar},key=JSON.stringify(a);
  if(avatarCache.has(key))return avatarCache.get(key);
  const c=document.createElement('canvas');c.width=20;c.height=28;
  const g=c.getContext('2d'),skin=a.body==='orc'?'#91aa71':SKIN[a.skin],hair=HAIR[a.hairColor],cloth=CLOTHES[a.color];
  const r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const ink='#292337',dark='#393044',boot='#443044',light='#fff0d1';
  // Boots and a reusable silhouette; every appearance option is a separate layer.
  r(5,21,4,5,ink);r(11,21,4,5,ink);r(4,25,5,2,boot);r(11,25,5,2,boot);
  r(4,14,12,9,ink);r(5,14,10,8,cloth);r(3,15,2,6,ink);r(15,15,2,6,ink);
  r(3,16,3,4,cloth);r(14,16,3,4,cloth);r(3,20,3,2,skin);r(14,20,3,2,skin);
  r(6,21,3,3,dark);r(11,21,3,3,dark);r(8,13,4,3,skin);
  if(a.outfit===0){r(5,19,10,2,'#685048');r(9,19,2,2,'#e5bf75');r(7,14,1,4,'#ffffff44');}
  if(a.outfit===1){r(8,14,4,7,'#ead6b2');r(8,14,1,7,ink);r(11,14,1,7,ink);r(5,14,2,3,light);}
  if(a.outfit===2){r(5,20,10,6,cloth);r(7,21,1,4,'#ffffff33');r(12,21,1,4,'#00000022');r(9,16,2,2,'#e5bf75');}
  if(a.outfit===3){r(5,15,10,6,'#a8b4c3');r(6,16,8,2,'#dae0dd');r(9,18,2,3,cloth);r(3,14,3,3,'#8393a7');r(14,14,3,3,'#8393a7');}
  // Rounded pixel head, with elf/orc ears in the base layer.
  r(5,5,10,9,ink);r(4,7,12,5,ink);r(6,5,8,9,skin);r(5,7,10,5,skin);
  if(a.body==='elf'){r(2,8,3,2,skin);r(15,8,3,2,skin);r(1,7,2,2,skin);r(17,7,2,2,skin);}
  if(a.body==='orc'){r(3,8,3,4,skin);r(14,8,3,4,skin);r(7,12,1,2,light);r(12,12,1,2,light);}
  r(6,9,2,2,ink);r(12,9,2,2,ink);r(7,9,1,1,light);r(13,9,1,1,light);r(9,12,2,1,'#8d5351');r(5,11,2,1,'#d6827144');r(13,11,2,1,'#d6827144');
  // Hair: crop, bob, long, mohawk, ponytail, buzz.
  if(a.hair===0){r(5,4,10,3,hair);r(4,6,3,3,hair);r(7,6,2,2,hair);r(13,6,3,2,hair);}
  if(a.hair===1){r(4,4,12,4,hair);r(3,7,3,8,hair);r(14,7,3,8,hair);r(6,7,3,1,hair);}
  if(a.hair===2){r(4,4,12,3,hair);r(3,6,3,13,hair);r(14,6,3,13,hair);r(6,6,5,2,hair);r(4,17,3,3,hair);r(13,17,3,3,hair);}
  if(a.hair===3){r(8,1,4,6,hair);r(7,3,6,3,hair);r(8,1,1,2,'#ffffff44');}
  if(a.hair===4){r(5,4,10,3,hair);r(4,6,3,3,hair);r(14,6,4,7,hair);r(16,11,3,7,hair);r(15,10,3,2,cloth);}
  if(a.hair===5){r(6,4,8,2,hair);r(5,6,1,2,hair);r(14,6,1,2,hair);}
  if(a.accessory===1){r(3,5,14,2,ink);r(6,0,9,5,cloth);r(7,0,7,1,'#ffffff55');r(6,4,9,1,'#edc16a');}
  if(a.accessory===2){r(5,4,10,2,'#edc16a');r(5,1,2,4,'#e2af51');r(9,2,2,3,'#ffe5a0');r(13,1,2,4,'#e2af51');r(9,4,2,1,'#d75c6b');}
  if(a.accessory===3){r(5,8,4,4,ink);r(11,8,4,4,ink);r(9,9,2,1,ink);r(6,9,2,1,'#a5d8d6');r(12,9,2,1,'#a5d8d6');}
  if(a.accessory===4){r(13,4,4,3,'#d986a5');r(14,3,2,5,'#e5a9bf');r(14,5,2,1,'#f3cf75');r(16,6,2,2,'#91b17b');}
  if(a.accessory===5){r(3,1,2,5,'#e4d6b8');r(4,4,2,3,'#e4d6b8');r(15,1,2,5,'#e4d6b8');r(14,4,2,3,'#e4d6b8');}
  if(avatarCache.size>200)avatarCache.clear();avatarCache.set(key,c);return c;
}
export function drawPortrait(canvas,avatar,large=false) {
  if(!canvas)return;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,canvas.width,canvas.height);
  const sprite=avatarCanvas(avatar),s=Math.floor(Math.min(canvas.width/24,canvas.height/30));
  g.fillStyle='#080b1433';g.beginPath();g.ellipse(canvas.width/2,canvas.height-5,s*7,s*2,0,0,Math.PI*2);g.fill();
  g.drawImage(sprite,Math.floor((canvas.width-20*s)/2),canvas.height-28*s-7,20*s,28*s);
}

function tile(g,id,x,y,size=32,img=sprites) {
  if(!img.complete||!img.naturalWidth)return;
  g.drawImage(img,(id%12)*16,Math.floor(id/12)*16,16,16,Math.round(x),Math.round(y),size,size);
}
export class TavernScene {
  constructor(){this.canvas=null;this.state=null;this.lastFrame=0;this.resultId=null;this.fxAt=0;this.declarationId=null;this.declareAt=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.on=true;this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);}
  attach(canvas){if(this.canvas===canvas)return;this.canvas=canvas;if(canvas){canvas.width=960;canvas.height=540;}}
  setState(state){
    this.state=state;
    if(state?.result&&state.result.id!==this.resultId){this.resultId=state.result.id;this.fxAt=performance.now();}
    if(state?.turn?.id!==this.declarationId){this.declarationId=state?.turn?.id;this.declareAt=performance.now();}
  }
  loop(t){requestAnimationFrame(this.loop);if(document.hidden||!this.canvas||t-this.lastFrame<33)return;this.lastFrame=t;this.draw(t);}
  draw(t){
    const g=this.canvas.getContext('2d');g.imageSmoothingEnabled=false;const r=this.state;
    const second=this.reduced?0:t/1000;
    // Background is composed at native pixel scale. No physics engine or WebGL required.
    g.fillStyle='#201b25';g.fillRect(0,0,960,540);
    g.fillStyle='#69483c';g.fillRect(46,112,868,403);g.save();g.beginPath();g.rect(46,112,868,403);g.clip();
    for(let y=112;y<516;y+=20)for(let x=46;x<914;x+=80){
      const shift=(Math.floor(y/20)%2)*40;g.fillStyle=['#765042','#714b3e','#7c5444'][((x+y)%7)%3];g.fillRect(x+shift,y,79,19);g.fillStyle='#56382f';g.fillRect(x+shift,y+18,79,2);
      g.fillStyle='#8b6049';g.fillRect(x+shift+12,y+5,29,1);g.fillStyle='#49382f';g.fillRect(x+shift+4,y+4,2,2);
    }
    g.restore();for(let x=24;x<936;x+=32){tile(g,14,x,21);tile(g,40,x,53);tile(g,14,x,85);}
    for(let y=113;y<514;y+=32){tile(g,14,22,y);tile(g,14,906,y);}
    g.fillStyle='#35252b';g.fillRect(24,16,912,9);g.fillRect(20,22,8,499);g.fillRect(930,22,9,499);
    // Back wall shelves, bottles, and framed tavern sign.
    for(const sx of [124,700]){g.fillStyle='#34242b';g.fillRect(sx,38,140,52);g.fillStyle='#9d7150';g.fillRect(sx-4,83,148,7);for(let n=0;n<5;n++)tile(g,113+(n%4),sx+n*27,49,28);}
    g.fillStyle='#261d29';g.fillRect(350,34,260,53);g.strokeStyle='#a87c50';g.lineWidth=3;g.strokeRect(351,35,258,51);
    g.font='bold 16px monospace';g.textAlign='center';g.fillStyle='#e0bd80';g.fillText('THE TIPSY WYVERN',480,57);g.font='10px monospace';g.fillStyle='#a48e7a';g.fillText('EST. BEFORE GOOD JUDGMENT',480,74);
    // Tall oak beams, moonlit windows and a hearth give the room a lived-in silhouette.
    for(const x of [48,302,650,900]){g.fillStyle='#30232a';g.fillRect(x,22,10,114);g.fillStyle='#916044';g.fillRect(x+2,22,3,110);}
    for(const x of [76,822]){g.fillStyle='#211c30';g.fillRect(x,40,58,64);g.fillStyle='#675976';g.fillRect(x+5,45,48,52);g.fillStyle='#333c5a';g.fillRect(x+8,48,42,46);g.fillStyle='#b8c9b8';g.fillRect(x+36,51,8,8);g.fillStyle='#4f3840';g.fillRect(x+27,45,5,52);g.fillRect(x+5,70,48,5);g.fillStyle='#b18156';g.fillRect(x-3,100,64,6);}
    g.fillStyle='#28222a';g.fillRect(54,260,76,87);g.fillStyle='#62515a';g.fillRect(50,252,84,12);g.fillRect(54,264,12,76);g.fillRect(118,264,12,76);g.fillStyle='#1f1922';g.fillRect(66,272,52,62);
    for(let n=0;n<7;n++){g.fillStyle=n%2?'#f5bf66':'#c76c43';const h=18+Math.sin(second*7+n*2)*8;g.fillRect(70+n*6,328-h,5,h);}
    g.fillStyle='#624333';g.fillRect(62,329,60,7);
    const warmth=g.createRadialGradient(92,318,8,92,318,145);warmth.addColorStop(0,'#efa05235');warmth.addColorStop(1,'#efa05200');g.fillStyle=warmth;g.fillRect(30,200,220,240);
    // Bunting and hanging ironwork are kept above the walkable floor.
    g.strokeStyle='#30232b';g.lineWidth=2;g.beginPath();g.moveTo(320,25);g.quadraticCurveTo(480,34,640,25);g.stroke();
    for(let n=0;n<11;n++){const x=330+n*29,y=16+Math.sin(n/10*Math.PI)*5;g.fillStyle=n%2?'#98704e':'#6c5961';g.beginPath();g.moveTo(x,y);g.lineTo(x+12,y+2);g.lineTo(x+5,y+16);g.fill();}
    // Rugs and tables leave walkable gaps for a large party.
    const rug=(x,y,w,h)=>{g.fillStyle='#44334d';g.fillRect(x,y,w,h);g.fillStyle='#6d4762';g.fillRect(x+5,y+4,w-10,h-8);g.strokeStyle='#ae8263';g.lineWidth=2;g.strokeRect(x+10,y+8,w-20,h-16);};
    rug(346,290,270,175);
    for(let y=309;y<453;y+=18){g.fillStyle='#9a705f';g.fillRect(358,y,4,4);g.fillRect(600,y,4,4);}
    for(const [x,y] of [[74,367],[850,365],[155,146],[750,149]]){tile(g,82,x,y,36);tile(g,113,x+7,y-9,24);}
    // Small candlelit sideboards and scattered mugs break up the empty floor.
    for(const x of [140,758]){g.fillStyle='#3d2a2b';g.fillRect(x,175,62,20);g.fillStyle='#ad7951';g.fillRect(x-3,171,68,7);tile(g,114,x+9,151,27);tile(g,113,x+33,155,23);}
    for(const x of [218,682]){g.fillStyle='#37262b';g.fillRect(x,305,5,17);g.fillStyle='#f3d497';g.fillRect(x,301,5,12);g.fillStyle='#ffd98a';g.fillRect(x+1,297+Math.round(Math.sin(second*6)),3,5);}
    const table=(x,y)=>{g.fillStyle='#00000033';g.fillRect(x-42,y+24,84,16);g.fillStyle='#36262a';g.fillRect(x-36,y-9,72,46);g.fillStyle='#ae7850';g.fillRect(x-40,y-16,80,40);g.fillStyle='#bf8759';g.fillRect(x-36,y-16,72,5);g.fillStyle='#85563d';g.fillRect(x-36,y+3,72,2);tile(g,113,x-27,y-27,27);tile(g,114,x+7,y-25,27);g.fillStyle='#dec19b';g.fillRect(x+2,y+6,12,3);};
    const furniture=[[245,335],[715,335],[245,445],[715,445]];
    const layers=furniture.map(([x,y])=>({y,draw:()=>{tile(g,73,x-67,y+3,32);tile(g,73,x+35,y+3,32);table(x,y);}}));
    // Counter and the crown chest, all from reusable licensed tiles.
    for(let x=306;x<664;x+=32){tile(g,63,x,132);g.fillStyle='#bc885a';g.fillRect(x,130,32,6);}
    tile(g,89,650,113,40);tile(g,82,824,121,44);tile(g,82,865,143,40);tile(g,82,73,135,44);




    // Doorway and a warm patch of light spilling out.
    g.fillStyle='#35252e';g.fillRect(435,510,90,30);g.fillStyle='#cda374';g.fillRect(441,514,78,26);g.fillStyle='#9c7355';g.fillRect(449,518,62,22);
    this.label(g,'EXIT',480,533,'#ebc998',10);
    const lamp=(x,y)=>{
      const flicker=1+Math.sin(second*4+x)*.035;const glow=g.createRadialGradient(x,y,3,x,y,118*flicker);glow.addColorStop(0,'#f6b66c30');glow.addColorStop(1,'#f6b66c00');g.fillStyle=glow;g.fillRect(x-125,y-125,250,250);
      g.fillStyle='#3d2a2b';g.fillRect(x-7,y-15,14,24);g.fillStyle='#d99855';g.fillRect(x-5,y-11,10,15);g.fillStyle='#ffe3a3';g.fillRect(x-2,y-9,4,12);
    };
    lamp(70,99);lamp(289,99);lamp(674,99);lamp(889,99);lamp(56,343);lamp(909,343);
    // Render all 24 possible player slots; labels are separate from their sprite.
    const players=r?.players||[];
    if(!players.length){
      const previews=[{skin:2,hair:0,color:0,accessory:1},{skin:0,hair:2,color:1,accessory:4},{skin:4,hair:3,color:4,accessory:0}];
      previews.forEach((a,i)=>this.person(g,{id:'preview'+i,avatar:{...DEFAULT_AVATAR,...a},name:['YOUR NEXT','BAD IDEA','STARTS HERE'][i],hp:10,connected:true},[380+i*100,367],second,i,t));
    }else players.forEach((p,i)=>{const pos=this.position(p,i,t);layers.push({y:pos[1],draw:()=>this.person(g,p,pos,second,i,t)});});
    const npcs=[{id:'bartender',name:'MARNIE',avatar:{...DEFAULT_AVATAR,skin:3,hair:1,outfit:1,color:2}}, {id:'guard',name:'CAPTAIN BRICK',avatar:{...DEFAULT_AVATAR,outfit:3,hair:5,color:4,accessory:0}}, {id:'goblin',name:'THE FIDDLER',avatar:{...DEFAULT_AVATAR,body:'elf',hair:2,color:3,accessory:1}}];
    for(const npc of npcs){const pos=[...npcPositions[npc.id]];const hit=r?.result?.success&&r.result.target?.kind===npc.id&&['attack','magic','break'].includes(r.result.intent);if(hit)pos[0]+=recoil(t-this.fxAt,this.reduced);layers.push({y:pos[1],draw:()=>this.person(g,{...npc,hp:10,connected:true,npc:true,hit:hit&&t-this.fxAt<650},pos,second,0,t)});}
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    // Foreground framing adds depth without hiding the central action.
    for(const x of [28,920]){g.fillStyle='#261e27';g.fillRect(x,114,12,410);g.fillStyle='#946246';g.fillRect(x+3,114,3,410);}

    const elapsed=t-this.fxAt;
    if(r?.result&&elapsed<3400)this.effects(g,r.result,elapsed);
    if(r?.phase==='react'&&r.turn&&t-this.declareAt<3000){
      const i=players.findIndex(p=>p.id===r.turn.actorId),pos=this.position(players[i],Math.max(0,i),t);
      g.fillStyle='#f5dc9a';const w=130;g.fillRect(pos[0]-w/2,pos[1]-115,w,25);g.fillRect(pos[0]-3,pos[1]-91,6,7);g.font='bold 10px monospace';g.textAlign='center';g.fillStyle='#332836';g.fillText('IDEA LOCKED IN!',pos[0],pos[1]-99);
    }
    if(r?.quest.crown){const i=players.findIndex(p=>p.id===r.quest.carrierId);if(i>=0){const pos=slots[i];this.crown(g,pos[0],pos[1]-97+Math.sin(second*3)*3,1.2);}}
    if(r?.paused){g.fillStyle='#100f1cbf';g.fillRect(0,0,960,540);g.fillStyle='#f1d7a4';g.font='bold 32px monospace';g.textAlign='center';g.fillText('THE TAVERN TAKES A BREATHER',480,262);g.font='16px monospace';g.fillText('The host has paused the story.',480,295);}
    // Subtle vignette uses one gradient instead of a full-screen image filter.
    const vignette=g.createRadialGradient(480,280,200,480,280,570);vignette.addColorStop(0,'#130e2000');vignette.addColorStop(1,'#130e2070');g.fillStyle=vignette;g.fillRect(0,0,960,540);
  }
  position(p,i,t){
    const home=slots[i%slots.length];if(!p)return home;
    const r=this.state,turn=r?.turn;
    if(turn?.actorId!==p.id)return home;
    const target=targetPosition(turn.target,r.players,home);
    return actorPosition(home,target,t-this.declareAt,r.result?.id===turn.id?t-this.fxAt:null,this.reduced);
  }
  label(g,text,x,y,color='#f3e7cb',size=11){g.font=`bold ${size}px monospace`;g.textAlign='center';g.fillStyle='#1a1728';g.fillText(text,x+1,y+1);g.fillStyle=color;g.fillText(text,x,y);}
  person(g,p,pos,second,i,t){
    let [x,y]=pos;const r=this.state;const active=r?.turn?.actorId===p.id&&['react','reveal'].includes(r.phase);const reaction=r?.turn?.reactions.find(q=>q.playerId===p.id);
    const elapsed=t-this.fxAt;
    if(!p.npc&&r?.result?.success&&r.result.target?.id===p.id)y-=recoil(elapsed,this.reduced)*.4;
    const bob=this.reduced||p.hp===0?0:Math.floor(Math.sin(second*2+i)*1.4);
    g.globalAlpha=p.connected===false?.48:1;
    g.fillStyle=active?'#dab97a55':'#100e203d';g.beginPath();g.ellipse(x,y-2,23,7,0,0,Math.PI*2);g.fill();
    if(active){g.strokeStyle='#f3c975';g.lineWidth=2;g.beginPath();g.ellipse(x,y-2,27,9,0,0,Math.PI*2);g.stroke();}
    const resultActor=r?.result?.playerId===p.id&&elapsed<1500;
    const intent=r?.result?.intent;
    const approaching=r?.phase==='react'&&r.turn?.actorId===p.id&&t-this.declareAt<850;
    const pose=p.hit?'hit':p.hp===0?'dead':approaching?'walk':resultActor?({attack:'attack',break:'attack',magic:'cast',heal:'heal',steal:'steal',dance:'dance',flee:'flee',sneak:'walk'}[intent]||'item'):'idle';
    const sprite=avatarCanvas(p.avatar,pose,this.reduced?0:resultActor?elapsed:t+i*150);
    const crowded=(this.state?.players.length||0)>12&&!p.npc;
    const scale=crowded?2:2.5;
    g.drawImage(sprite,Math.round(x-10*scale),Math.round(y-28*scale+bob),20*scale,28*scale);
    this.label(g,p.name?.slice(0,crowded&&!active?12:16)||'Adventurer',x,p.id==='guard'?y-77:y+14,active?'#ffe4a2':p.isBot?'#bdb4cb':'#f5e7cf',crowded?9:11);
    if(p.maxHp&&p.hp<p.maxHp){g.fillStyle='#261e2e';g.fillRect(x-17,y+19,34,3);g.fillStyle=p.hp<4?'#d96d7e':'#86b89b';g.fillRect(x-17,y+19,34*p.hp/p.maxHp,3);}
    if(reaction){const glyph={assist:'+',intervene:'!',flee:'»',custom:'?'}[reaction.kind];g.fillStyle='#221b30';g.fillRect(x+17,y-69,18,18);this.label(g,glyph,x+26,y-55,'#c2afe9',14);}
    g.globalAlpha=1;
  }
  crown(g,x,y,s=1){g.fillStyle='#5f3e31';g.fillRect(x-11*s,y+5*s,22*s,4*s);g.fillStyle='#edc46e';g.fillRect(x-10*s,y,20*s,6*s);g.fillRect(x-10*s,y-6*s,4*s,8*s);g.fillRect(x-2*s,y-4*s,4*s,7*s);g.fillRect(x+6*s,y-6*s,4*s,8*s);g.fillStyle='#fbebad';g.fillRect(x-9*s,y+1*s,18*s,2*s);}
  effects(g,res,elapsed){
    const players=this.state?.players||[],i=players.findIndex(p=>p.id===res.playerId);const pos=this.position(players[i],Math.max(0,i),this.fxAt+elapsed);const f=Math.max(0,1-elapsed/3400);
    for(const effect of res.effects){
      const j=players.findIndex(p=>p.id===effect.actorId),from=this.position(players[j],Math.max(0,j),this.fxAt+elapsed);
      const target=effect.target==='self'?from:effect.targetId?slots[Math.max(0,players.findIndex(p=>p.id===effect.targetId))]:(npcPositions[effect.target]||pos);
      const [x,y]=target;
      const licensed=drawNinjaEffect(g,effect.verb,x,y-35,elapsed,1.8);
      if(licensed&&!['crown','alarm','flee'].includes(effect.verb))continue;
      if(['melee','impact','spell','steal','weird','inspect'].includes(effect.verb)){
        const progress=Math.min(1,elapsed/700),xx=from[0]+(x-from[0])*progress,yy=from[1]-45+(y-from[1])*progress;
        g.strokeStyle=effect.verb==='spell'?'#bd9cff':effect.verb==='steal'?'#edc76e':'#f1d6b2';g.lineWidth=4*f;
        if(elapsed<850){g.beginPath();g.moveTo(from[0],from[1]-40);g.lineTo(xx,yy);g.stroke();}
        for(let n=0;n<12;n++){const a=n*2.4,rad=elapsed/22+n*2;g.fillStyle=n%2?'#edc76e':'#d4b0ff';g.globalAlpha=f;g.fillRect(x+Math.cos(a)*rad*.6,y-35+Math.sin(a)*rad*.4,4,4);}g.globalAlpha=1;
      }
      if(effect.verb==='hearts'){for(let n=0;n<4;n++){g.font='22px sans-serif';g.fillStyle='#ed96ad';g.globalAlpha=f;g.fillText('♥',x-30+n*19,y-45-elapsed/35-n*5);}g.globalAlpha=1;}
      if(effect.verb==='dance'){for(let n=0;n<4;n++){g.font='24px serif';g.fillStyle='#edc76e';g.globalAlpha=f;g.fillText('♪',from[0]-40+n*24,from[1]-60-elapsed/35+Math.sin(n)*10);}g.globalAlpha=1;}
      if(effect.verb==='fire'||effect.verb==='hit'){for(let n=0;n<8;n++){g.fillStyle=n%2?'#ecb367':'#d97870';g.globalAlpha=f;g.fillRect(x-22+n*6,y-38-Math.sin(n+elapsed/200)*14-elapsed/70,5,7);}g.globalAlpha=1;}
      if(effect.verb==='crown')this.crown(g,pos[0],pos[1]-120-elapsed/80,2);
      if(effect.verb==='alarm'){g.fillStyle=`rgba(196,78,85,${.13*f*(1+Math.sin(elapsed/120))})`;g.fillRect(0,0,960,540);}
      if(effect.verb==='flee'&&elapsed<1600){g.strokeStyle='#b7d7b9';g.setLineDash([8,12]);g.lineWidth=2;g.beginPath();g.moveTo(from[0],from[1]);g.lineTo(480,520);g.stroke();g.setLineDash([]);}
      if(effect.verb==='sneak'){g.globalAlpha=f*.3;g.fillStyle='#c2c0dc';g.beginPath();g.ellipse(from[0],from[1]-25,35,30,0,0,Math.PI*2);g.fill();g.globalAlpha=1;}
    }
    if(elapsed<2800){g.globalAlpha=f;this.label(g,res.critical?'NATURAL 20!':res.success?'SUCCESS':'BAD LUCK',pos[0],pos[1]-87-elapsed/120,res.success?'#b7e5bb':'#f1b8b4',17);g.globalAlpha=1;}
  }
}
