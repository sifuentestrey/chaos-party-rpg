/**
 * Chaos Party -> Fracture experimental TV-side adapter.
 * Loaded ONLY when a private, local TV pairing URL is present.
 * One TV game account = one controlled character in this first spike.
 * No AI outcomes, combat damage, passwords, or world state are set here.
 */
import { Mob } from './entity/character/mob/mob';
import { Npc } from './entity/character/npc/npc';

// Fracture's legacy BubbleManager inserts HTML, so never pass unescaped phone text.
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));

function entityLabel(entity: any): string {
  return String(entity.name || entity.getSpriteName?.() || entity.constructor?.name || '').toLowerCase();
}
function selectEntity(game: any, kind: 'mob'|'npc', words: string): any|null {
  const list=Object.values(game.entities || {}).filter((e: any) =>
    kind==='mob' ? e instanceof Mob && !e.isDead && !e.isDying : e instanceof Npc);
  const phrase=words.toLowerCase().replace(/^(?:the|a|an)\s+/, '').trim();
  const matches=list.filter((e:any) => {
    const label=entityLabel(e);
    return label===phrase || label.includes(phrase) || phrase.includes(label);
  });
  const position=game.player;
  matches.sort((a:any,b:any)=>
    (Math.abs(a.gridX-position.gridX)+Math.abs(a.gridY-position.gridY))-
    (Math.abs(b.gridX-position.gridX)+Math.abs(b.gridY-position.gridY)));
  return matches[0]||null;
}

export function interpretFractureCommand(game: any, raw: string): string {
  const text=String(raw||'').trim().slice(0,180);
  const controller=game.interactionController;
  if(!game.started||!game.player||!controller)return 'Character is not in the game yet.';
  if(game.player.isDead)return 'Character is knocked out.';
  // Show the actual action, not a generic "Idea locked" banner.
  game.showBubbleFor(game.player,escapeHtml(text.slice(0,52)));
  let match=text.match(/^(?:i\s+)?(?:try to\s+)?(?:attack|tackle|hit|fight|strike|punch|kick)\s+(.+)$/i);
  if(match){
    const mob=selectEntity(game,'mob',match[1]);
    if(!mob)return `No nearby enemy named ${match[1]} is visible.`;
    controller.makePlayerAttack(mob); // Fracture's existing pathing, attack animation and server HIT check.
    return `Attacking ${entityLabel(mob)}.`;
  }
  match=text.match(/^(?:i\s+)?(?:try to\s+)?(?:talk to|speak to|ask|approach)\s+(.+)$/i);
  if(match){
    const npc=selectEntity(game,'npc',match[1]);
    if(!npc)return `No nearby person named ${match[1]} is visible.`;
    game.makePlayerTalkTo(npc); // Fracture walks to NPC and requests real dialogue.
    return `Approaching ${entityLabel(npc)}.`;
  }
  match=text.match(/^(?:i\s+)?(?:try to\s+)?(?:walk|go|move|run)\s+to\s+(\d{1,4})\s*[, ]\s*(\d{1,4})$/i);
  if(match){
    const x=Number(match[1]),y=Number(match[2]);
    if(x>=game.map.width||y>=game.map.height||game.map.isColliding(x,y))return 'That location is blocked.';
    game.makePlayerGoTo(x,y); // Uses original collision-checked pathfinder, not raw MOVE/TELEPORT messages.
    return `Walking to ${x}, ${y}.`;
  }
  if(/^look around\.?$/i.test(text)){
    const labels=Object.values(game.entities||{}).filter((e:any)=>e instanceof Mob||e instanceof Npc).slice(0,8).map(entityLabel);
    return labels.length?`Nearby: ${labels.join(', ')}.`:'No nearby characters are visible.';
  }
  return `Not yet supported: ${text}. Try attack, talk to, look around, or walk to x,y.`;
}

export function startChaosRemote(game: any): void {
  const params=new URLSearchParams(window.location.search);
  const base=params.get('chaosBridge'),key=params.get('tvKey');
  if(!base||!key)return; // Ordinary Fracture play stays unchanged.
  if(game.__chaosRemoteStarted)return; // Fracture may invoke game-start again after reconnect.
  let endpoint:URL;
  try{
    endpoint=new URL(base);
    if(endpoint.protocol!=='http:'||endpoint.hostname!==window.location.hostname||endpoint.port!=='4748')throw new Error('Bridge must be on this Mac/LAN host at port 4748');
  }catch(e){console.error('[Chaos Party] Invalid bridge origin',e);return;}
  game.__chaosRemoteStarted=true;
  const panel=document.createElement('div');
  panel.id='chaos-party-recent-events';
  Object.assign(panel.style,{position:'fixed',left:'12px',bottom:'12px',maxWidth:'min(370px, 42vw)',zIndex:'10000',padding:'9px 12px',background:'rgba(5,10,18,.7)',color:'#f6f7fa',borderRadius:'8px',font:'13px system-ui',pointerEvents:'none'});
  const title=document.createElement('div'); title.textContent='Chaos Party';title.style.fontWeight='bold';panel.append(title);
  const rows=document.createElement('div');panel.append(rows);document.body.append(panel);
  const add=(text:string)=>{const row=document.createElement('div');row.textContent=text;rows.prepend(row);while(rows.children.length>3)rows.lastElementChild?.remove();};
  const url=new URL('/events',endpoint);url.searchParams.set('key',key);
  const source=new EventSource(url.toString());
  source.addEventListener('ready',()=>add('Phone controller connected.'));
  source.addEventListener('action',(event:Event)=>{
    try{
      const data=JSON.parse((event as MessageEvent).data);
      if(typeof data?.text!=='string')return;
      const result=interpretFractureCommand(game,data.text);
      add(result);
      game.showNotification?.(escapeHtml(result));
    }catch(e){console.warn('[Chaos Party] Action error',e);add('Action could not be completed.');}
  });
  source.onerror=()=>add('Phone controller disconnected; trying to reconnect.');
  window.addEventListener('beforeunload',()=>source.close(),{once:true});
}
