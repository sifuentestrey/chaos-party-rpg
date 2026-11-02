import {inventoryView} from './phone-items.mjs';
import {STARTERS,BACKGROUNDS,DEFAULT_APPEARANCE} from './character-profile.mjs';
import {appearanceSheet,drawPreview} from './character-appearance.mjs';
export function bootPhone(controller){
 const el=id=>document.getElementById(id);let inventoryKey='',lookKey='',portrait=null,current=null,pacingBusy=false;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function card(item){const root=node('article','item-card');root.dataset.item=item.key;const icon=node('span','item-icon');icon.setAttribute('aria-hidden','true');if(item.asset){icon.classList.add('native-item-icon');icon.style.backgroundImage='url("/controller/assets/'+item.asset+'")';}else icon.textContent=String(item.label).slice(0,1).toUpperCase();root.append(icon);const copy=node('div','item-copy');copy.append(node('small','item-kind',item.category),node('strong','item-name',item.label));root.append(copy);if(item.count>1)root.append(node('span','item-count','×'+item.count));
  for(const action of item.actions){const button=node('button','item-action',action.label);button.type='button';button.setAttribute('aria-label',action.label+' '+item.label);button.disabled=!!current?.actor?.dead||locked();button.onclick=()=>controller.act(action.text);root.append(button);}return root;
 }
 function inventory(actor){const view=inventoryView(actor),key=JSON.stringify([view,!!actor?.dead,locked(),actor?.chaos?.error,actor?.chaos?.assistedBy,actor?.chaos?.hinderedBy]);if(key===inventoryKey)return;inventoryKey=key;el('equipped-items').replaceChildren(...view.equipped.map(card));el('bag-items').replaceChildren(...view.bag.map(card));el('bag-empty').hidden=view.bag.length>0;el('bag-count').textContent=String(view.bag.reduce((n,i)=>n+i.count,0));el('gear-note').textContent=actor?.chaos?.error||[actor?.chaos?.assistedBy?'D20 help: '+actor.chaos.assistedBy:'',actor?.chaos?.hinderedBy?'D20 interference: '+actor.chaos.hinderedBy:''].filter(Boolean).join(' · ');}
 async function look(appearance){const key=JSON.stringify(appearance);if(key===lookKey)return;lookKey=key;try{const next=await appearanceSheet(appearance);if(lookKey===key)portrait=next;}catch{if(lookKey===key)portrait=null;}}
 const locked=()=>current?.pacing?.enabled&&['preparation','action','recap'].includes(current.pacing.phase);
 function paintPacing(){
  const p=current?.pacing,travel=p?.travel,pendingVote=travel?.status==='pending';
  el('pacing-panel').hidden=!p?.enabled||p.phase==='exploration'&&!pendingVote&&!p.outside;
  el('pacing-ready').hidden=!p?.enabled||p.phase!=='planning'||!p.eligible||pendingVote;
  const seconds=Math.max(0,Math.ceil(((pendingVote?travel.deadline:p?.deadline)||0)-Date.now())/1000);
  el('pacing-status').textContent=pendingVote?'Travel '+travel.name+'? '+travel.yes+'/'+travel.required+' yes · '+Math.ceil(seconds)+'s':p?.phase==='planning'?'Choose together · '+Math.ceil(seconds)+'s · '+p.ready+'/'+p.total+' ready':p?.phase==='preparation'?'The party gathers its resolve…':p?.phase==='action'?'Action! '+Math.ceil(seconds)+'s':p?.phase==='recap'?'What happened together':p?.phase==='travel'?'Travelling · '+(travel?.arrived||0)+'/'+(travel?.total||0)+' arrived':'';
  el('pacing-ready').textContent=p?.draft?.ready?'Not ready':p?.draft?.continuation?'Continue & Ready':p?.draft?'Ready':'Ready (hold)';
  el('pacing-ready').disabled=pacingBusy;el('pacing-rejoin').hidden=!p?.enabled||!p.outside;el('pacing-rejoin').disabled=pacingBusy||!!p?.returning;el('pacing-rejoin').textContent=p?.returning?'Returning by the native route…':'Rejoin the party';
  el('pacing-choice').textContent=p?.phase==='planning'?(p.draft?.text||'Choose an action, or tap Ready to hold position.'):'';
  el('pacing-recap').hidden=p?.phase!=='recap';el('pacing-recap').textContent=p?.recap?.text||'';
  el('pacing-travel-buttons').hidden=!pendingVote||!travel.eligible||travel.voted;
  const busy=locked();el('text').disabled=busy;if(busy)el('send-action').disabled=true;else if(!el('send-action').dataset.sending)el('send-action').disabled=false;el('send-action').textContent=p?.phase==='planning'?'Choose action':'Do it';
  if(busy)el('ability-use').disabled=true;
  el('dm-story').hidden=!!p?.enabled&&p.phase!=='exploration';
 }
 async function pace(data){if(pacingBusy)return;pacingBusy=true;paintPacing();try{await controller.api('/pacing',{token:controller.token,instanceId:current?.pacing?.instanceId,...data});await controller.poll();}catch(e){el('log').textContent=e.message;}finally{pacingBusy=false;paintPacing();}}
 el('pacing-rejoin').onclick=()=>pace({command:'rejoin'});
 el('pacing-ready').onclick=()=>pace({command:'ready',roundId:current?.pacing?.roundId,ready:!current?.pacing?.draft?.ready});
 for(const [id,yes] of [['pacing-yes',true],['pacing-no',false]])el(id).onclick=()=>pace({command:'vote',voteId:current?.pacing?.travel?.id,yes});
 window.addEventListener('chaos-state',event=>{current=event.detail;const v=current,playing=v.phase==='playing'&&!controller.editing;document.body.classList.toggle('phone-playing',playing);el('phone-dock').hidden=!playing;el('character-name').textContent=v.name;el('character-class').textContent=STARTERS[v.role]?.name||v.role||'Adventurer';const background=BACKGROUNDS[v.background];const assigned=v.backgroundPoints||{};const bonusText=background?background.checks.map(key=>(key==='dexterity'?'Dexterity':key[0].toUpperCase()+key.slice(1))+' +'+(background.baseBonus+Number(assigned[key]||0))).join(', '):'';el('character-background').textContent=background?background.name+' · '+bonusText:'No background';el('character-place').textContent=v.actor?.zone||'Joining the world…';const a=v.actor,hp=Number(a?.hp),max=Number(a?.maxHp),known=Number.isFinite(hp)&&Number.isFinite(max)&&max>0;el('health-value').textContent=a?.dead?'Knocked out':known?hp+'/'+max:'Connecting';const percent=known?Math.max(0,Math.min(100,a.dead?0:hp/max*100)):0;el('health-meter').hidden=!known;el('health-meter').setAttribute('aria-valuenow',String(percent));el('health-meter').setAttribute('aria-valuetext',a?.dead?'Knocked out':hp+' of '+max+' health');el('health-fill').style.width=percent+'%';el('health-meter').dataset.low=String(percent<=25);el('quick-stop').disabled=!a?.ready;el('phone-dm-state').textContent=v.dm?.enabled?(v.dm.state==='connected'?'Live AI':v.dm.state==='busy'?'AI thinking':v.dm.state==='ready'?'AI ready':'AI unavailable'):'Offline DM';el('phone-dm-state').dataset.state=v.dm?.enabled?v.dm.state:'off';el('phone-dm-state').title=v.dm?.message||'Offline rules are available';paintPacing();inventory(a);void look(v.appearance||DEFAULT_APPEARANCE);});
 document.querySelectorAll('[data-open-wardrobe]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.remove('phone-playing');el('phone-dock').hidden=true;}));
 el('quick-stop').onclick=()=>controller.act('stop');
 const dock=el('phone-dock');
 const measureDock=()=>{if(!dock.hidden&&!document.body.classList.contains('phone-typing'))document.documentElement.style.setProperty('--dock-height',dock.getBoundingClientRect().height+'px');};
 if(window.ResizeObserver)new ResizeObserver(measureDock).observe(dock);else window.addEventListener('resize',measureDock);
 document.addEventListener('focusin',e=>{if(e.target.matches('textarea,input,select'))document.body.classList.add('phone-typing');});
 document.addEventListener('focusout',()=>requestAnimationFrame(()=>{document.body.classList.toggle('phone-typing',!!document.activeElement?.matches('textarea,input,select'));measureDock();}));
 window.visualViewport?.addEventListener('resize',()=>{if(document.activeElement===el('text')&&window.innerHeight-window.visualViewport.height>120)el('text').scrollIntoView({block:'center'});});
 el('text').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();el('form').requestSubmit();}});
 el('phone-dock').querySelectorAll('a').forEach(a=>a.onclick=()=>{document.activeElement?.blur();});
 const portraitTimer=setInterval(()=>{paintPacing();if(document.hidden||!document.body.classList.contains('phone-playing')||!portrait)return;drawPreview(el('controller-avatar').getContext('2d'),portrait,{time:Date.now(),scale:2});},450);
 window.addEventListener('pagehide',event=>{if(!event.persisted)clearInterval(portraitTimer);});
}
