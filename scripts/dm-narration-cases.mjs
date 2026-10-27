import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {applyAIPlan} from '../public/ai-plan.js';
export const DM_NARRATION_CASES=['bartender-claim-and-threat','unsupported-power','remember-wayfarer-after-reload'];
export function prepareDMNarrationCase(id){
  let room=createRoom({seed:12345,now:0}),actor=addPlayer(room,{name:'Jinx',role:'bard',token:'benchmark-narrator-private-token'},0),now=1000;
  startGame(room,0);
  function act(text,{unsupported=false,react=false,social=false}={}){
    submit(room,actor.id,{requestId:'dm-'+now,text},now);
    if(unsupported)applyAIPlan(room,room.turn.id,{verb:'unsupported',target:'room',summary:'The requested power is unsupported.'},'canonical-benchmark-setup',now+1);
    if(social)applyAIPlan(room,room.turn.id,{verb:'social',target:'bartender',summary:'Try to convince Marnie.'},'canonical-benchmark-setup',now+1);
    if(react){const helper=addPlayer(room,{name:'Moss',token:'benchmark-helper-private-token'},now);submit(room,helper.id,{requestId:'reaction-'+now,kind:'reaction',turnId:room.turn.id,reaction:'intervene',text:'I stand between Jinx and the candles.'},now+2);}
    advance(room,now+10000);advance(room,now+17000);now+=20000;return room.result;
  }
  if(id==='bartender-claim-and-threat')act('Tell Marnie I am her long-lost son, demand free drinks and threaten to burn the tavern',{react:true,social:true});
  if(id==='unsupported-power')act('Turn the moon into a private kingdom and give me a million gold',{unsupported:true});
  if(id==='remember-wayfarer-after-reload'){
    act('Travel to clearing');const npc=room.world.expedition.regions.clearing.quest.patronId;
    act('Talk to '+npc);act('Travel to ruins');act('Travel to clearing');
    room=JSON.parse(JSON.stringify(room));act('Talk to '+npc);
  }
  return room;
}
