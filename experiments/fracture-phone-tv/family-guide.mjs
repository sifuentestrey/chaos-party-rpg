/** Grounded suggestions, not outcomes. Every button submits a normal action. */
import {EXPEDITION_WAYPOINTS} from './party-rally.mjs';
export function familyGuide(actor,adventure){
 if(!actor?.ready)return {hint:'Your character is joining the world…',actions:[]};
 if(actor.dead)return {hint:'You were knocked out. Respawn to rejoin your friends.',actions:[{label:'Respawn',text:'respawn'}]};
 const c=actor.chaos||{},bag=c.bag||[],objects=[...(c.ground||[]),...(c.scenery||[])];
 const distance=t=>t?Math.abs(actor.x-t.x)+Math.abs(actor.y-t.y):Infinity;
 const closest=list=>[...list].sort((a,b)=>distance(a.tile||a)-distance(b.tile||b))[0];
 const npc=closest(c.npcs||[])||closest((actor.nearby||[]).filter(n=>n.type==='npc'));
 const mob=closest((actor.nearby||[]).filter(n=>n.type==='mob'&&n.hp>0));
 const tree=closest((c.scenery||[]).filter(o=>o.kind==='tree'&&o.condition!=='broken'));
 const fire=closest(objects.filter(o=>o.condition==='burning'));
 const repair=closest((c.ground||[]).filter(o=>o.condition==='broken'&&(!o.owner||o.visual==='table')));
 const actions=[],add=(label,text)=>{if(text&&!actions.some(a=>a.text===text))actions.push({label,text});};
 if(fire)add('Put out '+fire.name,'extinguish '+fire.id);
 let hint='Explore together. Tap an action below, or type anything you want to try.';
 if(adventure?.status==='completed')hint='Adventure complete! Keep exploring, or ask the host to start another trial.';
 else if(adventure?.status==='active'){
  const steps=adventure.steps||[];
  if(!steps[0]?.done)hint='Meet a local. Talk to someone nearby to begin the trial.';
  else if(!steps[1]?.done)hint=adventure.choice==='combat'?'The party chose a fight. Find and defeat a monster.':adventure.choice==='craft'?'The party chose crafting. Combine two materials into something useful.':'Prove your resourcefulness: defeat a monster or craft something new.';
  else if(!steps[2]?.done){hint='Your next stop is Glitch Woods. Gather your friends, then head north.';const route=EXPEDITION_WAYPOINTS.woods;add('Head to Glitch Woods',`walk to ${route.end.x}, ${route.end.y}`);}
  else if(!steps[3]?.done){hint='Return to The Refuge to finish your adventure.';const route=EXPEDITION_WAYPOINTS.refuge;add('Return to The Refuge',`walk to ${route.end.x}, ${route.end.y}`);}
 }
 if(npc)add(npc.trust<0?'Make amends with '+npc.name:'Talk to '+npc.name,npc.trust<0?'apologize to '+npc.id:'talk to '+npc.id);
 if(mob)add('Fight '+mob.name,'attack '+mob.id);
 const cloth=bag.find(i=>i.material==='cloth'&&i.condition==='intact'),wood=bag.find(i=>i.material==='wood'&&i.condition==='intact');
 if(cloth&&wood)add('Craft a party badge',`make party badge from ${cloth.id} and ${wood.id}`);
 if(tree){add('Chop nearby tree','chop '+tree.id);if(tree.condition!=='burning')add('Set tree alight','ignite '+tree.id);}
 if(repair)add('Repair '+repair.name,'repair '+repair.id);
 return {hint,actions:actions.slice(0,6)};
}
