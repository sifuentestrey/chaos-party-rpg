import { ROLES, PERKS, SKIN, HAIR, CLOTHES, DEFAULT_AVATAR, uid, createRoom, addPlayer, editPlayer, startGame, submit, advance, publicRoom, hostCommand } from './core.js';
import { TavernScene, drawPortrait } from './render.js';
import { PartyClient } from './party-client.js';

const root=document.getElementById('app');
const scene=new TavernScene();
const config=window.CHAOS_CONFIG||{standalone:true};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('This browser couldn’t save your character. Keep your recovery PIN.');}};
const names=['Jinx','Sir Snacks','Moss','Lady Mayhem','Goblin Mode','Velvet','Oops','Pickles','Thistle','Waffles'];
const savedProfile=read('chaos.profile',null);
const M={ screen:'home',mode:config.standalone?'solo':'party',room:null,playerId:null,pin:null,network:null,
  profile:savedProfile||{name:names[Math.floor(Math.random()*names.length)],role:'rogue',perk:'lucky',avatar:{...DEFAULT_AVATAR}},
  creatorTab:'look',creatorPurpose:'solo',code:'',draft:'',reactDraft:'',error:'',busy:false,connected:true,
  hostKey:null,savedRooms:[],offset:0,showLog:false,lastResult:null,editing:false,sound:read('chaos.sound',false),
  cooldownBlocked:false,accepted:null,downloadUrl:'',devices:read('chaos.devices',{}),solo:null,socket:null,screenBeforeCreate:'home' };
let toastTimer,soloTimer,reconnectBusy=false,audioCtx;
const icon=(name,size=18)=>{
  const paths={arrow:'M5 12h14m-6-6 6 6-6 6',back:'M19 12H5m6-6-6 6 6 6',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m17-1v-1a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m11-4a4 4 0 0 1-3 3.87',star:'m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z',volume:'m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',mute:'m11 5-6 4H2v6h3l6 4V5Zm6 4 5 6m0-6-5 6',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',pause:'M8 5v14M16 5v14',play:'m6 3 15 9-15 9V3Z',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',check:'m5 12 4 4L20 5',lock:'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4',copy:'M9 9h12v12H9V9ZM3 15V3h12',refresh:'M20 7a9 9 0 1 0 1 9M20 2v6h-6',info:'M12 11v6m0-10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',spark:'m12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z'};
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;
};
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);}
function announce(text){document.getElementById('announcer').textContent=text;}
function sound(type='click'){
  if(!M.sound)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();
    const notes=type==='success'?[392,494,587,784]:type==='fail'?[262,220,175]:type==='commit'?[330,440]:[440];
    notes.forEach((freq,i)=>{const o=audioCtx.createOscillator(),gain=audioCtx.createGain(),at=audioCtx.currentTime+i*.09;o.type='triangle';o.frequency.value=freq;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.18);o.connect(gain);gain.connect(audioCtx.destination);o.start(at);o.stop(at+.2);});
  }catch{}
}
const effectAudio=new Map();
function impactSound(result){
  const clip=({attack:'hit',break:'slash',magic:'magic',heal:'heal',steal:'coin',dance:'success'})[result.intent];
  if(!clip||!M.sound)return;
  setTimeout(()=>{if(!M.sound)return;let audio=effectAudio.get(clip);if(!audio){audio=new Audio('/assets/ninja/audio/'+clip+'.wav');audio.volume=.32;effectAudio.set(clip,audio);}audio.currentTime=0;audio.play().catch(()=>{});},220);
}
const brand=()=>`<button class="brand" data-action="home" aria-label="Chaos Party home"><img src="/assets/dice.svg" alt=""><span class="brand-name">CHAOS PARTY<small>Good company. Bad ideas.</small></span></button>`;
function header(){return `<header class="topbar">${brand()}<div class="toplinks"><button class="link-button desktop" data-action="how">How to play</button><span class="tag purple">${M.mode==='solo'&&M.screen==='solo'?'SOLO · SCRIPTED DM':'PLAYABLE PROTOTYPE'}</span><button class="icon-button ${M.sound?'active':''}" data-action="sound" aria-label="${M.sound?'Mute':'Enable'} game sound">${icon(M.sound?'volume':'mute')}</button></div></header>`;}
function home(){
  const soloExists=!!read('chaos.solo',null);
  return `${header()}<main class="home"><div class="hero-grid"><section class="hero-copy"><div class="chapter-chip">CHAPTER 01 · THE TIPSY WYVERN</div><h1>A room full of friends.<br><em>One very bad idea.</em></h1><p>Build your character. Walk into a tavern. Say the first thing that comes to mind.<br>Your friends get ten seconds to make it worse.</p><div class="hero-actions">${config.standalone?`<button class="button gold" data-action="solo">${icon('play')} ${soloExists?'Continue solo':'Enter the tavern'} ${icon('arrow')}</button><button class="button secondary" data-action="partyInfo">Play with friends</button>`:`<button class="button gold" data-action="host">Host a party ${icon('arrow')}</button><button class="button secondary" data-action="join">Join a room</button>`}</div><div class="hero-meta"><span>${icon('users',13)} 1–24 adventurers</span><span>${icon('spark',13)} No rules to study</span><span>${icon('heart',13)} No accounts</span></div>${config.standalone?`<p class="practice-note">This private web build has a playable solo story with five clearly labeled bot companions. The Mac party build connects real phones on your Wi-Fi.</p>`:`<button class="link-button" style="margin-top:19px" data-action="solo">Just looking? Try a solo adventure →</button>`}</section><section class="hero-art" aria-label="Animated pixel tavern"><div class="hero-note">What could possibly go wrong?</div><div class="scene-frame"><canvas class="scene" data-scene aria-label="The Tipsy Wyvern pixel tavern"></canvas><div class="scene-plaque"><strong>The Tipsy Wyvern</strong><span>A perfectly respectable place to start trouble.</span></div></div></section></div><div class="home-rules"><div class="rule"><span class="rule-number">1</span><div><h3>Be whoever you want.</h3><p>A charming rogue? A suspicious wizard? Dress your pixel alter ego for the occasion.</p></div></div><div class="rule"><span class="rule-number">2</span><div><h3>First to declare. No takebacks.</h3><p>Type your attempt. The first valid idea locks in. The rest of the room can help, stop you, or run.</p></div></div><div class="rule"><span class="rule-number">3</span><div><h3>Let the dice do their worst.</h3><p>Watch the consequences unfold on TV. Find the crown. Escape together. Probably apologize.</p></div></div><footer class="footer-note"><span>v0.2 · One tavern, one heist, unlimited questionable decisions.</span><span><button class="link-button tiny" data-action="credits">Ninja Adventure + Kenney · Credits</button></span></footer></main>`;
}
const choose=(key,value,label)=>`<button type="button" class="choice ${M.profile.avatar[key]===value?'selected':''}" aria-pressed="${M.profile.avatar[key]===value}" data-action="avatar" data-key="${key}" data-value="${value}">${label}</button>`;
const swatches=(key,colors)=>`<div class="choice-row">${colors.map((c,i)=>`<button type="button" class="swatch ${M.profile.avatar[key]===i?'selected':''}" style="--swatch:${c}" aria-label="${key} color ${i+1}" aria-pressed="${M.profile.avatar[key]===i}" data-action="avatar" data-key="${key}" data-value="${i}"></button>`).join('')}</div>`;
function creator(){
  const p=M.profile,a=p.avatar;
  const tab=M.creatorTab;
  const options=tab==='look'?`<div class="creator-section"><label class="field-label" for="character-name">YOUR ADVENTURER’S NAME</label><input id="character-name" name="name" value="${esc(p.name)}" maxlength="18" autocomplete="off" placeholder="A name worth shouting"></div><div class="creator-section"><span class="field-label">BASE</span><div class="choice-row">${['human','elf','orc'].map(v=>choose('body',v,v[0].toUpperCase()+v.slice(1))).join('')}</div></div><div class="creator-section"><span class="field-label">SKIN TONE</span>${swatches('skin',SKIN)}</div><div class="creator-section"><span class="field-label">HAIR STYLE</span><div class="choice-row">${['Crop','Bob','Long','Mohawk','Ponytail','Buzz'].map((v,i)=>choose('hair',i,v)).join('')}</div></div><div class="creator-section"><span class="field-label">HAIR COLOR</span>${swatches('hairColor',HAIR)}</div>`:
    tab==='style'?`<div class="creator-section"><span class="field-label">OUTFIT</span><div class="choice-row">${['Tunic','Jacket','Robe','Armor'].map((v,i)=>choose('outfit',i,v)).join('')}</div></div><div class="creator-section"><span class="field-label">OUTFIT COLOR</span>${swatches('color',CLOTHES)}</div><div class="creator-section"><span class="field-label">THE FINISHING TOUCH</span><div class="choice-row">${['None','Hat','Crown','Glasses','Flower','Horns'].map((v,i)=>choose('accessory',i,v)).join('')}</div></div><div class="info-box" style="margin-top:23px">Dress for the story you want.<br><strong>Or the police sketch you’ll get.</strong></div>`:
    `<div class="creator-section"><span class="field-label">PICK YOUR PARTICULAR TALENT</span><div class="roles-grid">${Object.entries(ROLES).map(([id,r])=>`<button type="button" class="role-card ${p.role===id?'selected':''}" data-action="role" data-value="${id}" aria-pressed="${p.role===id}"><span class="role-symbol" style="--role-color:${r.color}">${r.icon}</span><div><strong>${r.name}</strong><p>${r.description}</p></div></button>`).join('')}</div><p class="hint">Your class adds +3 to matching skills. You can still try anything.</p></div><div class="creator-section"><span class="field-label">ONE SMALL ADVANTAGE</span>${Object.entries(PERKS).map(([id,r])=>`<button type="button" class="perk-option ${p.perk===id?'selected':''}" data-action="perk" data-value="${id}" aria-pressed="${p.perk===id}"><span class="radio-dot"></span><div><strong>${r.name}</strong><p>${r.description}</p></div></button>`).join('')}</div>`;
  return `${header()}<main class="page-shell"><div class="page-heading"><div class="eyebrow">${M.editing?'A CHANGE OF CLOTHES':M.creatorPurpose==='solo'?'YOUR STORY STARTS HERE':'ROOM '+esc(M.code)}</div><h1>${M.editing?'Freshen up.':'Meet your next bad decision.'}</h1><p>${M.editing?'Appearance can change anytime. Your class and perk lock during a story.':'A hero, a menace, or just here for the snacks. Make it yours.'}</p></div><div class="creator-grid"><aside class="avatar-stage"><canvas width="200" height="280" data-profile aria-label="Live preview of your pixel character"></canvas><div class="name" id="preview-name">${esc(p.name)||'Adventurer'}</div><div class="role-label" id="preview-role">${ROLES[p.role].icon} ${ROLES[p.role].name} · ${PERKS[p.perk].name}</div><button class="button secondary compact randomize" data-action="random">${icon('refresh',14)} Surprise me</button></aside><section class="panel creator-options"><div class="creator-tabs" role="tablist" aria-label="Character options">${[['look','The face'],['style','The fit'],['role','The talent']].map(([id,label])=>`<button class="creator-tab ${tab===id?'selected':''}" role="tab" aria-selected="${tab===id}" data-action="creatorTab" data-value="${id}">${label}</button>`).join('')}</div>${options}${M.error?`<div class="field-error" role="alert">${esc(M.error)}</div>`:''}<div class="creator-footer"><p>Your character stays on this device.<br>No email. No account. No homework.</p><button class="button gold" data-action="enter" ${M.busy?'disabled':''}>${M.busy?'Opening the door…':M.editing?'Save character':tab!=='role'?'Next: '+(tab==='look'?'the outfit':'your talent'):'Enter the tavern'} ${icon('arrow',16)}</button></div></section></div><div class="step-label">${M.creatorPurpose==='solo'?'SOLO PRACTICE · SCRIPTED DM · FIVE BOT COMPANIONS':'YOUR PHONE IS YOUR CONTROLLER. THE TV IS THE TAVERN.'}</div></main>`;
}
function joinScreen(){return `${header()}<main class="page-shell narrow"><div class="page-heading"><div class="eyebrow">YOUR FRIENDS ARE WAITING</div><h1>Find your tavern.</h1><p>Scan the QR on the TV, or enter its six-character room code. All devices must use the same Wi-Fi.</p></div><div class="panel"><form id="join-form"><div class="field"><label class="field-label" for="room-code">ROOM CODE</label><input class="input-code" id="room-code" maxlength="6" value="${esc(M.code)}" placeholder="ABCDEF" autocomplete="off" autocapitalize="characters" spellcheck="false" required></div>${M.error?`<p class="field-error" role="alert">${esc(M.error)}</p>`:''}<button class="button gold full" type="submit">Create my character ${icon('arrow')}</button></form><div class="divider" style="margin:23px 0"></div><button class="link-button" data-action="recover">Already have a character? Use a recovery PIN →</button></div><p class="hint" style="text-align:center;margin-top:18px">No turn order. No app to install. Just bring a terrible idea.</p></main>`;}
function hostSetup(){return `${header()}<main class="page-shell narrow"><div class="page-heading"><div class="eyebrow">YOU’RE THE HOST</div><h1>Open for trouble.</h1><p>Put this screen on your TV. Your friends will join from their phones.</p></div><section class="panel"><div class="info-box"><strong>The Crown Job</strong><br>The Duke’s crown. One crowded tavern. Three guards who would rather be somewhere else.<br><br>Work together to find the crown and get the party out.</div><div class="field" style="margin-top:21px"><label class="field-label" for="reaction-length">TIME FOR EVERYONE TO REACT</label><select id="reaction-length"><option value="8000">8 seconds — a lively room</option><option value="10000" selected>10 seconds — room to think</option><option value="12000">12 seconds — maximum plotting</option></select></div>${M.error?`<p class="field-error">${esc(M.error)}</p>`:''}<button class="button gold full" data-action="createRoom" ${M.busy?'disabled':''}>${M.busy?'Lighting the lanterns…':'Create a private room'} ${icon('arrow')}</button><p class="hint">Saved automatically on this Mac. No cloud accounts or paid services.</p></section>${M.savedRooms.length?`<div class="eyebrow" style="margin-top:29px">OR RESUME A SAVED NIGHT</div><div class="room-list">${M.savedRooms.slice(0,5).map(r=>`<button class="saved-room" data-action="resumeRoom" data-code="${esc(r.code)}"><strong>${esc(r.code)}</strong><span>${r.players} adventurers · ${r.round} actions<br>${new Date(r.updatedAt).toLocaleDateString()} →</span></button>`).join('')}</div>`:''}</main>`;}
function questCard(r){const q=r.quest;return `<section class="sidebar-card"><h3>${icon('star',16)} The Crown Job</h3><div class="quest-step ${q.clues>=3?'done':'current'}"><span class="step-dot">${q.clues>=3?'✓':'1'}</span>Find the crown <span class="spacer"></span><span class="gold">${q.clues}/3 clues</span></div><div class="quest-step ${q.crown?'done':q.clues>=3?'current':''}"><span class="step-dot">${q.crown?'✓':'2'}</span>Get your hands on it</div><div class="quest-step ${q.escaped?'done':q.crown?'current':''}"><span class="step-dot">${q.escaped?'✓':'3'}</span>Get the party out</div><p class="quest-hint">${esc(q.crown?'The crown is yours. Time to leave before the guards work it out.':q.clues>=3?'The crown is in the chest behind the bar. Someone needs quick hands.':r.world.facts.at(-1)||'Marnie knows more than she lets on.')}</p></section>`;}
function chaosCard(r){return `<section class="sidebar-card"><div class="chaos-header"><span>TAVERN CHAOS</span><span class="${r.chaos>=7?'hp':'gold'}">${r.chaos}/10 · ${r.chaos>=7?'Guards are watching':r.chaos>=4?'Getting rowdy':'Suspiciously peaceful'}</span></div><div class="chaos-bars">${Array.from({length:10},(_,i)=>`<span class="chaos-bar ${i<r.chaos?'lit':''} ${i>=7?'danger':''}"></span>`).join('')}</div><p class="hint">At 10, guards sweep the room. Hiding players avoid the hit.</p></section>`;}
function joinCard(r){const url=joinUrl();return `<section class="sidebar-card"><h3>${icon('users',16)} Pull up a chair</h3><div class="qr-area"><div class="qr" id="room-qr" aria-label="QR code for joining this room"></div><div><div class="eyebrow" style="font-size:8px;margin-bottom:6px">SCAN OR ENTER CODE</div><div class="room-code">${esc(r.code)}</div><div class="join-address">${esc(url.replace(/^http:\/\//,''))}</div><div class="connected-count"><span class="dot"></span> ${r.players.filter(p=>p.connected).length} connected · 24 seats</div></div></div><button class="link-button tiny" data-action="copyJoin" style="margin-top:13px">${icon('copy',12)} Copy join link</button></section>`;}
function roster(r){return `<section class="sidebar-card roster-card"><h3>${icon('users',16)} The usual suspects <span class="spacer"></span><span class="muted tiny">${r.players.length}/24</span></h3><div class="roster">${!r.players.length?'<p class="no-players">Empty chairs. Endless possibilities.<br>Scan the QR to make your character.</p>':r.players.map(p=>`<div class="roster-player"><canvas width="60" height="84" data-avatar-pid="${p.id}" aria-hidden="true"></canvas><div><span class="roster-name">${esc(p.name)} ${p.isBot?'<span class="pill" style="font-size:7px;padding:2px 3px">BOT</span>':''}</span><span class="roster-role">${ROLES[p.role].name} · ${p.muted?'muted':p.connected?'in the room':'reconnecting'}</span></div><span class="roster-hp">♥ ${p.hp}</span>${M.mode==='party'?`<button class="roster-mute ${p.muted?'muted-player':''}" data-action="mutePlayer" data-id="${p.id}" aria-label="${p.muted?'Unmute':'Mute'} ${esc(p.name)}">${icon(p.muted?'volume':'mute',13)}</button>`:''}</div>`).join('')}</div></section>`;}
function storyCard(r){
  if(r.phase==='lobby')return `<section class="story-card"><div class="eyebrow">A QUIET MOMENT BEFORE THE NONSENSE</div><h2 class="story-title">Everyone starts somewhere. You start in a bar.</h2><p class="story-text">Get your friends in, let them dress their characters, then start the heist. There’s room for 24. There is no dress code.</p><div class="story-meta"><button class="button gold compact" data-action="startStory" ${r.players.length?'':'disabled'}>Start the heist ${icon('arrow',14)}</button><span class="host-count">${r.players.length} ${r.players.length===1?'adventurer':'adventurers'} ready for trouble</span></div></section>`;
  if(r.phase==='open')return `<section class="story-card"><div class="eyebrow">${r.round?'THE FLOOR IS OPEN AGAIN':'THE HEIST BEGINS'}</div><h2 class="story-title">${r.round?'So… what happens next?':'The Duke’s crown isn’t going to steal itself.'}</h2><p class="story-text">${r.round?'First valid declaration wins. Help a friend, invent a distraction, or do something the guards will regret.':'Find three clues, swipe the crown, and get everyone out. Talk to Marnie. Inspect a barrel. Distract a guard. It’s your bad idea.'}</p><div class="story-meta"><span class="tag purple"><span class="dot"></span> ACCEPTING DECLARATIONS</span><span class="tiny muted">Say what you try. The dice decide what happens.</span></div></section>`;
  if(r.phase==='react'){
    const p=r.players.find(p=>p.id===r.turn.actorId);
    return `<section class="story-card"><div class="row between"><div class="eyebrow">${esc(p?.name||'SOMEONE')} GOT THERE FIRST</div><span class="tag"><span data-countdown></span> TO REACT</span></div><p class="quote">“${esc(r.turn.action)}”</p><div class="story-meta"><span class="tag purple">${icon('lock',12)} LOCKED IN · #${r.turn.seq}</span><div class="reaction-dots">${r.turn.reactions.length?`${r.turn.reactions.length} reactions locked in`: 'Help them. Stop them. Save yourself.'}</div></div><div class="timer-track"><div class="timer-fill" data-timer></div></div></section>`;
  }
  if(r.phase==='ended')return resultsCard(r);
  const q=r.result;if(!q)return '';
  return `<section class="story-card"><div class="dice-result"><div class="die ${q.success?'':'fail'}">${q.roll}</div><div><div class="outcome-label ${q.success?'':'fail'}">${q.critical?'NATURAL 20. ABSOLUTELY RIDICULOUS.':q.success?'Somehow, that worked.':'A spectacular learning opportunity.'}</div><div class="roll-math">d20 ${q.roll} ${q.modifier>=0?'+':'−'} ${Math.abs(q.modifier)} = ${q.total} · needed ${q.dc}${q.assistance?' · help +'+q.assistance:''}${q.interference?' · intervention −'+q.interference:''}${q.rerolled?' · Lucky-ish rerolled a '+q.rerolled:''}</div></div></div><p class="story-text">${esc(q.narration)}</p>${q.changes.length?`<div class="change-list">${q.changes.map(c=>`<span class="change">${esc(c)}</span>`).join('')}</div>`:''}<div class="story-meta"><span class="tiny muted">Next opening in <span data-countdown></span></span><span class="tiny muted">Scripted DM · real dice rules</span></div></section>`;
}
function resultsCard(r){const ranked=[...r.players].sort((a,b)=>b.score-a.score);return `<section class="result-summary"><div class="eyebrow">THE CROWN JOB · COMPLETE</div><h2>You absolute menaces.</h2><p class="story-text">The crown is out. So are you. Marnie is updating her insurance policy.</p><div class="leaderboard-row"><span class="trophy">♛</span><div><strong style="margin:0;font-size:13px">${esc(ranked[0]?.name||'The party')}</strong><br><span class="tiny muted">Most valuable bad influence</span></div></div>${ranked.slice(0,8).map(p=>`<div class="leaderboard-row"><canvas width="60" height="84" data-avatar-pid="${p.id}"></canvas><span>${esc(p.name)}${p.isBot?' · BOT':''}<br><span class="tiny muted">${p.actions} ideas · ${p.assists} reactions</span></span><strong>${p.score} XP</strong></div>`).join('')}<button class="button gold" data-action="newStory" style="margin-top:20px">Another terrible evening ${icon('refresh',15)}</button><p class="hint">Characters stay. The heist starts fresh.</p></section>`;}
function log(r){return `<button class="log-toggle" data-action="toggleLog">The story so far <span>${M.showLog?'−':'+'}</span></button>${M.showLog?`<div class="log-list">${r.events.filter(e=>e.type!=='join').slice(-18).reverse().map(e=>`<div class="log-entry ${e.type}"><small>${e.type==='declaration'?esc(e.name)+' · DECLARED':e.type==='outcome'?'THE DICE HAVE SPOKEN':'THE STORY'}</small>${esc(e.text)}${M.mode==='party'&&e.type==='declaration'?` <button class="link-button tiny" data-action="redact" data-id="${e.id}">Hide</button>`:''}</div>`).join('')||'<p class="hint">The first page is still blank.</p>'}</div>`:''}`;}
function hostScreen(solo=false){
  const r=M.room;if(!r)return `${header()}<div class="loading">Joining the tavern…</div>`;
  return `${header()}${!M.connected?'<div class="connection-banner" role="status">Connection lost. Reconnecting — your character and campaign are saved.</div>':''}<main class="host-shell"><div class="host-heading"><div><div class="eyebrow">${solo?'SOLO PRACTICE · FIVE BOT COMPANIONS':'ROOM '+esc(r.code)+' · THE CROWN JOB'}</div><h1>Welcome to the Tipsy Wyvern.</h1></div><div class="host-tools"><button class="icon-button" data-action="sound" aria-label="${M.sound?'Mute':'Enable'} game sound">${icon(M.sound?'volume':'mute')}</button>${solo?'<span class="tag purple desktop">SCRIPTED DM · NO API KEY</span>':`<button class="button secondary compact desktop" data-action="openController">I’m playing too</button>`}<button class="icon-button" data-action="pause" aria-label="${r.paused?'Resume':'Pause'} story">${icon(r.paused?'play':'pause')}</button><button class="icon-button desktop" data-action="fullscreen" aria-label="Full screen">${icon('expand')}</button><button class="icon-button" data-action="settings" aria-label="Host controls">${icon('settings')}</button></div></div><div class="host-layout ${solo?'solo-layout':''}"><section class="theatre"><div class="scene-toolbar"><span class="location">${icon('spark',13)} THE TIPSY WYVERN <span class="muted">/</span> NIGHT ONE</span><span class="live"><span class="dot"></span> ${solo?'SOLO PRACTICE':r.paused?'PAUSED':'LIVE'} <span class="muted">· ${r.players.length} ${solo?'CHARACTERS':'ADVENTURERS'}</span></span></div><div class="scene-frame"><canvas class="scene" data-scene aria-label="Live pixel tavern, ${r.players.length} adventurers"></canvas><div class="scene-bottom"><span class="scene-label">${r.phase==='react'?'✦ REACTION WINDOW':r.phase==='reveal'?'⚄ THE DICE DECIDE':r.phase==='open'?'✦ YOUR NEXT BAD IDEA?':r.phase==='ended'?'♛ THE HEIST IS COMPLETE':'✦ THE PARTY IS ARRIVING'}</span></div></div>${storyCard(r)}${log(r)}</section>${solo?`<aside>${controllerContent(true)}<p class="practice-note">The five BOT companions give scripted reactions. Real party play uses independent phones and the same authoritative game rules.</p>${questCard(r)}${chaosCard(r)}</aside>`:`<aside class="host-sidebar">${joinCard(r)}${questCard(r)}${chaosCard(r)}${roster(r)}</aside>`}</div></main>`;
}
function controllerContent(solo=false){
  const r=M.room,p=r?.players.find(p=>p.id===M.playerId);if(!p)return '<div class="player-wait">Reconnecting your character…</div>';
  const reacted=r.turn?.reactions.find(q=>q.playerId===p.id),actor=r.turn?.actorId===p.id;
  const blocked=r.phase==='open'&&r.lastActorId===p.id&&Date.now()+M.offset<r.priorityUntil&&r.players.filter(x=>x.connected&&!x.muted&&!x.isBot).length>1;
  M.cooldownBlocked=blocked;
  let content='';
  if(r.paused)content=`<div class="controller-status"><div class="status-heading">ON PAUSE</div><h2>Marnie called a timeout.</h2><p>Your idea can wait. The host will open the floor again.</p></div><div class="player-wait"><span class="big">Ⅱ</span>Take a breather. All timers are stopped.</div>`;
  else if(p.muted)content=`<div class="controller-status"><div class="status-heading">TAKING A BREATHER</div><h2>The host muted your actions.</h2><p>You can still watch the story. Ask the host when you’re ready to rejoin the chaos.</p></div>`;
  else if(r.phase==='lobby')content=`<div class="controller-status"><div class="status-heading">YOU’RE IN · ROOM ${esc(r.code)}</div><h2>Excellent. Another liability.</h2><p>Your character is on the TV. Make yourself comfortable while the rest of the party arrives.</p></div><div class="player-wait"><span class="big">✦</span>Waiting for the host to start the heist.<br>No rules to learn. Just say what you try.</div><button class="button secondary full" style="margin-top:14px" data-action="editCharacter">Change my look</button>`;
  else if(r.phase==='react'&&(actor||reacted))content=`<div class="controller-status"><div class="status-heading">${actor?'YOU GOT THERE FIRST':'REACTION ACCEPTED'}</div><h2>${actor?'Well. You said it.':'You’re part of this now.'}</h2></div><div class="locked-card"><div class="locked-icon">${icon('lock',28)}</div><h3>No takebacks.</h3><p>“${esc(actor?r.turn.action:reacted.text)}”</p><p style="margin-top:14px"><span data-countdown></span> for the room to react.</p></div>${solo?'<button class="button secondary full" data-action="skipTimer" style="margin-top:12px">Let the dice decide →</button>':''}`;
  else if(r.phase==='react')content=`<div class="controller-status"><div class="row between"><div class="status-heading">${esc(r.players.find(p=>p.id===r.turn.actorId)?.name)} GOT THERE FIRST</div><span class="tag"><span data-countdown></span></span></div><h2>Quick. Make it worse.</h2><p>“${esc(r.turn.action)}”</p></div><div class="action-card"><div class="reaction-grid"><button class="reaction-button" data-action="react" data-kind="assist" ${M.busy||!M.connected?'disabled':''}><span>+</span>Help them</button><button class="reaction-button" data-action="react" data-kind="intervene" ${M.busy||!M.connected?'disabled':''}><span>✋</span>Stop them</button><button class="reaction-button" data-action="react" data-kind="flee" ${M.busy||!M.connected?'disabled':''}><span>»</span>Save myself</button></div><label class="field-label" for="reaction-text">OR REACT YOUR WAY</label><textarea id="reaction-text" maxlength="180" placeholder="I distract the guards with a terrible song…">${esc(M.reactDraft)}</textarea><button class="button full" data-action="customReaction" ${M.busy||!M.connected?'disabled':''}>Lock in my reaction ${icon('lock',14)}</button><p class="hint">Help: +1 to the attempt (max +4). Stop: −1 to a risky roll and −1 chaos. Flee: hide from a guard sweep.</p></div>`;
  else if(r.phase==='reveal')content=`<div class="controller-status"><div class="status-heading">THE CONSEQUENCES</div><h2>${r.result?.success?'Well, that happened.':'Could’ve gone better.'}</h2><p>The floor opens again in <span data-countdown></span>. Start thinking.</p></div><div class="locked-card" style="text-align:left;background:#282131;border-color:#584266"><p>${esc(r.result?.narration)}</p>${r.result?.changes.length?`<div class="change-list">${r.result.changes.map(x=>`<span class="change">${esc(x)}</span>`).join('')}</div>`:''}</div>${solo?'<button class="button secondary compact" data-action="skipTimer" style="margin-top:12px">Next idea →</button>':''}`;
  else if(r.phase==='ended')content=`<div class="controller-status"><div class="status-heading">PARTY VICTORY</div><h2>Wanted. Probably.</h2><p>You escaped with the crown. You earned ${p.score} XP and ${p.gold} coins. Marnie would appreciate it if you never returned.</p></div><div class="locked-card"><div class="trophy">♛</div><h3 style="margin-top:14px">Heist complete.</h3><p>${p.actions} ideas · ${p.assists} reactions<br>${p.nat20} natural twenties</p></div>`;
  else content=`<div class="controller-status"><div class="status-heading">${p.hp===0?'DOWN, BUT NOT OUT':blocked?'GIVE THE OTHERS A MOMENT':'THE FLOOR IS OPEN'}</div><h2>${p.hp===0?'The floor is quite comfy.':blocked?'Let someone else be the problem.':'What’s your bad idea?'}</h2><p>${p.hp===0?'You’re knocked out. Try resting, eating, or drinking to recover.':blocked?'You can lead again in <span data-cooldown></span>. Other players can jump in now.':'First valid declaration locks in. Type an attempt, not a guaranteed outcome.'}</p></div><div class="action-card">${M.accepted?'<div class="accepted-banner">Your last idea was accepted. The dice decide the outcome.</div>':''}<form id="action-form"><label class="field-label" for="action-text">I TRY TO…</label><textarea id="action-text" maxlength="180" placeholder="Suplex the bartender. Politely. Or search behind the bar…">${esc(M.draft)}</textarea><div class="textarea-footer"><span>Phone dictation works here, too.</span><span id="char-count">${M.draft.length}/180</span></div><button class="button gold full" type="submit" ${M.busy||!M.connected||blocked?'disabled':''}>${M.busy?'Committing your bad idea…':'Commit to the bit'} ${icon('lock',15)}</button></form><div class="quick-actions">${suggestions(r,p).map(s=>`<button class="quick-action" data-action="suggest" data-text="${esc(s.text)}">${s.label}</button>`).join('')}</div></div>`;
  return `<div class="controller-shell"><div class="player-card"><canvas width="104" height="146" data-avatar-pid="${p.id}" aria-hidden="true"></canvas><div><div class="player-name">${esc(p.name)}</div><div class="player-class">${ROLES[p.role].icon} ${ROLES[p.role].name} ${p.isBot?'· BOT':''}</div><div class="player-stats"><span class="hp">♥ ${p.hp}/${p.maxHp}</span><span class="coins">● ${p.gold}</span><span class="muted">✦ ${p.score} XP</span></div></div><span class="spacer"></span>${!solo?`<button class="icon-button" data-action="editCharacter" aria-label="Edit character">${icon('settings',15)}</button>`:''}</div>${content}<section class="inventory"><h3>YOUR POCKETS</h3><div class="inventory-list">${p.inventory.map(x=>`<span class="item">${esc(x)}</span>`).join('')}</div></section>${!solo?`<div class="recovery">YOUR RECOVERY PIN <code>${esc(M.pin||'—')}</code><br>Keep this if you switch phones. Room ${esc(r.code)}. Saved automatically.</div>`:''}${!solo&&r.phase==='open'?`<div class="controller-story"><div class="eyebrow">THE JOB</div><p>${esc(r.quest.crown?'We have the crown. Someone get us out!':r.quest.clues>=3?'The crown is in the chest behind the bar. Steal it.':r.world.facts.at(-1))}</p></div>`:''}</div>`;
}
function suggestions(r,p){
  if(p.hp<=3)return [{label:'Take a breather',text:'Rest and drink a healing potion'},{label:'Eat something',text:'Eat a very questionable tavern snack'}];
  if(r.quest.crown)return [{label:'Make our escape',text:'Flee through the door with the whole party and the crown'},{label:'Distract the guards',text:'Sing the guards a distracting song'},{label:'Heal up',text:'Drink a healing potion'}];
  if(r.quest.clues>=3)return [{label:'Swipe the crown',text:'Steal the crown from the chest behind the bar'},{label:'A little distraction',text:'Dance on a table to distract the guards'},{label:'Create a diversion',text:'Cast a harmless spell to distract Captain Brick'}];
  return [{label:'Talk to Marnie',text:'Ask Marnie the bartender about the Duke’s crown'},{label:'Look around',text:'Inspect the chest behind the bar'},{label:'Cause a scene',text:'Dance on a table and sing a terrible song'},{label:'Something reckless',text:'Suplex Captain Brick'}];
}

function render(){
  const focus=document.activeElement,focusId=focus?.id,start=focus?.selectionStart,end=focus?.selectionEnd;
  document.body.classList.toggle('tavern-tv',M.screen==='host');
  root.innerHTML=M.screen==='home'?home():M.screen==='creator'?creator():M.screen==='join'?joinScreen():M.screen==='hostSetup'?hostSetup():M.screen==='host'?hostScreen(false):M.screen==='solo'?hostScreen(true):`${header()}${!M.connected?'<div class="connection-banner">Reconnecting — your character is saved. Keep this page open.</div>':''}${controllerContent(false)}`;
  scene.attach(root.querySelector('[data-scene]'));scene.setState(M.room);
  root.querySelectorAll('[data-profile]').forEach(c=>drawPortrait(c,M.profile.avatar));
  root.querySelectorAll('[data-avatar-pid]').forEach(c=>drawPortrait(c,M.room?.players.find(p=>p.id===c.dataset.avatarPid)?.avatar));
  if(M.screen==='host')drawQR();
  if(focusId){const el=document.getElementById(focusId);if(el){el.focus({preventScroll:true});if(typeof start==='number'&&['INPUT','TEXTAREA'].includes(el.tagName))try{el.setSelectionRange(start,end);}catch{}}}
  updateTimers();
}
function setRoom(r){
  if(!r)return;if(M.room&&M.room.code===r.code&&M.room.revision>r.revision)return;
  if(r.serverNow)M.offset=r.serverNow-Date.now();
  const previousTurn=M.room?.turn?.id;
  if(r.turn?.id!==previousTurn){M.accepted=null;M.reactDraft='';}
  if(r.phase==='react'&&M.room?.phase!=='react'){sound('commit');announce(`${r.players.find(p=>p.id===r.turn.actorId)?.name} declared: ${r.turn.action}. Reaction window open.`);}
  if(r.result?.id&&r.result.id!==M.lastResult){M.lastResult=r.result.id;impactSound(r.result);sound(r.result.success?'success':'fail');announce(r.result.narration);}
  M.room=r;scene.setState(r);render();
}
function updateTimers(){
  const r=M.room;if(!r)return;
  const remaining=r.paused?(r.remaining||0):Math.max(0,r.deadline-(Date.now()+M.offset));
  const secs=(remaining/1000).toFixed(remaining<3000?1:0)+'s';
  root.querySelectorAll('[data-countdown]').forEach(x=>x.textContent=secs);
  root.querySelectorAll('[data-timer]').forEach(x=>x.style.width=Math.max(0,Math.min(100,remaining/r.reactionMs*100))+'%');
  root.querySelectorAll('[data-cooldown]').forEach(x=>x.textContent=Math.max(0,Math.ceil((r.priorityUntil-Date.now()-M.offset)/1000))+'s');
  const blocked=r.phase==='open'&&r.lastActorId===M.playerId&&Date.now()+M.offset<r.priorityUntil&&r.players.filter(x=>x.connected&&!x.muted&&!x.isBot).length>1;
  if(M.cooldownBlocked&&!blocked){M.cooldownBlocked=false;render();}
}
setInterval(updateTimers,100);
function joinUrl(){const address=M.network?.addresses?.[0]||location.hostname;const port=M.network?.port||location.port;return `http://${address}${port?':'+port:''}/join?room=${encodeURIComponent(M.room?.code||'')}`;}
function drawQR(){const el=document.getElementById('room-qr');if(!el||!window.qrcode)return;try{const q=window.qrcode(0,'M');q.addData(joinUrl());q.make();el.innerHTML=q.createSvgTag({cellSize:3,margin:1,scalable:true});}catch{el.textContent='Use code';}}

async function ensureSocket(){
  if(config.standalone)throw new Error('Real multiplayer runs in the Mac party build. This web build is solo practice.');
  if(!M.socket){
    M.socket=new PartyClient();
    M.socket.onState=r=>{if(M.room?.code===r.code)setRoom(r);};
    M.socket.onConnection=connected=>{if(M.mode!=='party')return;if(M.connected!==connected){M.connected=connected;if(M.room)render();}};
    M.socket.onClock=offset=>{if(M.mode==='party')M.offset=offset;};
    M.socket.onIdentity=d=>{
      if(d.role==='controller'&&M.mode==='party'){
        M.playerId=d.playerId;M.pin=d.recoveryPin;
        const code=d.room?.code;if(code&&d.token){M.devices[code]={profile:M.profile,token:d.token,pin:d.recoveryPin};write('chaos.devices',M.devices);}
      }
    };
    const response=await fetch('/api/info',{cache:'no-store'});if(!response.ok)throw new Error('Can’t reach the tavern. Check that the Mac game window is open.');M.network=await response.json();
  }
}
async function emit(name,data={}){await ensureSocket();return M.socket.request(name,data);}
async function loadHost(){
  M.mode='party';M.error='';M.busy=true;M.screen='hostSetup';render();
  try{await ensureSocket();const resp=await fetch('/api/host-key',{cache:'no-store'});if(!resp.ok)throw new Error('Open the host screen on the Mac running the game. Phones join as players.');M.hostKey=(await resp.json()).hostKey;const data=await emit('host:list',{hostKey:M.hostKey});M.savedRooms=data.rooms;}catch(e){M.error=e.message;}finally{M.busy=false;render();}
}
function beginCreator(purpose='solo',editing=false){
  M.screenBeforeCreate=M.screen;M.creatorPurpose=purpose;M.editing=editing;M.error='';M.creatorTab='look';M.busy=false;
  if(editing){const p=M.room?.players.find(p=>p.id===M.playerId);if(p)M.profile={name:p.name,role:p.role,perk:p.perk,avatar:{...p.avatar}};}
  M.screen='creator';render();window.scrollTo(0,0);
}
async function enter(){
  if(!M.editing&&M.creatorTab!=='role'){if(!M.profile.name.trim()){M.error='Your adventurer needs a name.';render();return;}M.creatorTab=M.creatorTab==='look'?'style':'role';M.error='';render();return;}
  if(!M.profile.name.trim()){M.error='Your adventurer needs a name.';M.creatorTab='look';render();return;}
  M.busy=true;M.error='';render();write('chaos.profile',M.profile);
  try{
    if(M.editing){
      if(M.mode==='solo'){editPlayer(M.solo,M.playerId,M.profile);soloSync();}else{const d=await emit('player:profile',{profile:M.profile});setRoom(d.room);}
      M.screen=M.screenBeforeCreate;M.editing=false;render();return;
    }
    if(M.creatorPurpose==='solo')return startSolo();
    await joinParty(M.code);
  }catch(e){M.error=e.message;}finally{M.busy=false;render();}
}
async function joinParty(code,recoveryPin=null){
  M.mode='party';await ensureSocket();const stored=M.devices[code];
  const profile={...M.profile,token:stored?.token||uid()};
  const data=await emit('player:join',{code,profile,recoveryPin});
  M.devices[code]={profile:M.profile,token:data.token,pin:data.recoveryPin};write('chaos.devices',M.devices);
  M.playerId=data.playerId;M.pin=data.recoveryPin;M.screen='controller';M.code=code;M.accepted=null;
  history.replaceState(null,'','/join?room='+encodeURIComponent(code));setRoom(data.room);window.scrollTo(0,0);
}
function soloSync(){if(!M.solo)return;write('chaos.solo',{room:M.solo,playerId:M.playerId,pin:M.pin});setRoom({...publicRoom(M.solo),serverNow:Date.now()});}
function startSolo(fresh=false){
  clearInterval(soloTimer);M.mode='solo';M.screen='solo';M.connected=true;M.offset=0;M.accepted=null;
  let saved=fresh?null:read('chaos.solo',null);
  if(['0.1.0','0.2.0'].includes(saved?.room?.version)&&saved.room.players.some(p=>p.id===saved.playerId)){
    M.solo=saved.room;M.playerId=saved.playerId;M.pin=saved.pin;
    // Finish an interrupted roll once, then continue from saved state.
    if(M.solo.phase==='react'||M.solo.phase==='reveal')M.solo.deadline=Date.now()+2000;
  }else{
    M.solo=createRoom({code:'SOLO',seed:Math.floor(Math.random()*0xffffffff),reactionMs:6000});
    const p=addPlayer(M.solo,{...M.profile,token:uid()});M.playerId=p.id;M.pin=p.pin;
    const bots=[['Sir Crumbs','knight',0,3],['Velvet','bard',1,2],['Moss','healer',2,0],['Pip','rogue',4,4],['Professor Oops','wizard',3,1]];
    bots.forEach(([name,role,color,hair],i)=>{const b=addPlayer(M.solo,{name,role,perk:'tough',token:uid(),avatar:{...DEFAULT_AVATAR,skin:i%5,hair,color,hairColor:i%6,accessory:i===4?1:i===1?4:0,outfit:i===0?3:i===4?2:0}});b.isBot=true;});
    startGame(M.solo);
  }
  let botTurn=null;
  soloTimer=setInterval(()=>{
    if(M.mode!=='solo'||!M.solo)return;
    let changed=advance(M.solo);
    if(M.solo.phase==='react'&&!M.solo.paused&&M.solo.turn.id!==botTurn){
      botTurn=M.solo.turn.id;const turnId=botTurn;
      M.solo.players.filter(p=>p.isBot).slice(0,3).forEach((bot,i)=>setTimeout(()=>{
        if(M.mode!=='solo'||M.solo.turn?.id!==turnId||M.solo.phase!=='react'||M.solo.paused)return;
        try{submit(M.solo,bot.id,{requestId:uid(),kind:'reaction',turnId,reaction:i===2?'flee':'assist',text:i===2?'I hide behind a conveniently large table.':i===0?'I provide wildly undeserved moral support.':'I distract the guards with a tiny song.'});soloSync();}catch{}
      },700+i*650));
    }
    if(changed)soloSync();
  },100);
  soloSync();window.scrollTo(0,0);
}
async function sendAction(kind='action',reaction='custom',text=null){
  if(M.busy)return;
  text=text??(kind==='reaction'?M.reactDraft:M.draft);if(!text.trim()){toast('Tell us what you try to do first.');document.getElementById(kind==='reaction'?'reaction-text':'action-text')?.focus();return;}
  M.busy=true;render();
  const data={kind,reaction,text,requestId:uid(),turnId:M.room?.turn?.id};
  try{
    let result;
    if(M.mode==='solo'){result=submit(M.solo,M.playerId,data);soloSync();}
    else{result=await emit('player:submit',data);setRoom(result.room);}
    M.accepted=result;if(kind==='action')M.draft='';else M.reactDraft='';
    sound('commit');if(navigator.vibrate)navigator.vibrate(35);
  }catch(e){toast(e.message);if(M.mode==='party')try{const d=await emit('room:sync');setRoom(d.room);}catch{}}
  finally{M.busy=false;render();}
}
async function command(cmd){
  try{if(M.mode==='solo'){hostCommand(M.solo,cmd);soloSync();}else{const d=await emit('host:command',{hostKey:M.hostKey,code:M.room.code,command:cmd});setRoom(d.room);}}catch(e){toast(e.message);}
}
function dialog(html){document.querySelector('dialog')?.remove();const d=document.createElement('dialog');d.innerHTML=html;d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close();});d.addEventListener('close',()=>d.remove());document.body.appendChild(d);d.showModal();return d;}
function how(){dialog(`<h2>Say it. Mean it. Roll for it.</h2><ol><li><strong>Make your character.</strong> Your phone is the controller. Put the host screen on TV.</li><li><strong>Type any attempt.</strong> First valid declaration received by the server locks in. You can’t edit it afterward.</li><li><strong>Everyone else reacts.</strong> Help (+1, max +4), stop a risky action (−1 and lower chaos), save yourself, or write a reaction.</li><li><strong>The dice resolve it.</strong> Your class gives +3 to matching actions. A natural 20 always works; a natural 1 fails. Luck can reroll a low die.</li><li><strong>Steal the crown together.</strong> Find 3 clues by investigating, talking, performing, or sneaking. Steal it from the chest, then flee.</li></ol><p>High chaos triggers a guard sweep. At 0 HP, rest, eat, or drink to recover. After leading an action, you briefly give others priority.<br><br>This prototype uses a fast <strong>scripted Dungeon Master</strong>, keyword-based intent matching, and seeded dice. It is not connected to a generative AI model.</p><button class="button full" data-close>That sounds irresponsible. I’m in.</button>`);}
function partyInfo(){dialog(`<h2>A party on your Wi-Fi.</h2><p>The Mac party build is the full multiplayer prototype. One Mac runs the tavern; every player joins with their phone. You don’t need an account, app, subscription, or API key.</p><ol><li>Download and unzip the Mac build.</li><li>Double-click <strong>Start Chaos Party.command</strong> and choose <strong>Host a party</strong>.</li><li>Show the host screen on TV. Friends scan its QR using the same Wi-Fi.</li></ol><p>This private website is a solo practice build. Its BOT companions are scripted; they aren’t other connected people.<br><br>The Mac must stay on <strong>while you play</strong>. Development doesn’t use your computer. macOS may ask to allow local network access or confirm the launcher.</p>${M.downloadUrl?`<a class="button gold full" href="${esc(M.downloadUrl)}" target="_blank" rel="noopener">Download the Mac party build ${icon('arrow')}</a>`:'<p class="hint">Use the Mac download attached with the prototype delivery.</p>'}<button class="button secondary full" data-close>Back to the tavern</button>`);}
function settings(){
  const r=M.room;
  const d=dialog(`<h2>The person with the keys.</h2><p>Host controls are for keeping the night moving. Every accepted action is saved automatically.</p><div class="settings-grid"><button class="button secondary" data-host="pause">${r.paused?'Resume the story':'Pause the story'}</button><button class="button secondary" data-host="resolve" ${['react','reveal'].includes(r.phase)?'':'disabled'}>Skip current timer</button><button class="button secondary" data-host="resetScene">Reset this scene</button><button class="button danger" data-host="newStory">Start a fresh heist</button></div><label class="field-label" for="settings-window">REACTION WINDOW</label><select id="settings-window"><option value="6000" ${r.reactionMs===6000?'selected':''}>6 seconds</option><option value="8000" ${r.reactionMs===8000?'selected':''}>8 seconds</option><option value="10000" ${r.reactionMs===10000?'selected':''}>10 seconds</option><option value="12000" ${r.reactionMs===12000?'selected':''}>12 seconds</option></select><p class="hint">Reset scene cancels the current attempt and heals the party a little. A fresh heist clears story progress and scores; characters stay.</p>${roster(r)}<div class="divider" style="margin-top:20px"></div><button class="button ghost full" data-close>Close the key ring</button>`);
  d.querySelectorAll('[data-avatar-pid]').forEach(c=>drawPortrait(c,r.players.find(p=>p.id===c.dataset.avatarPid)?.avatar));
  d.addEventListener('click',async e=>{const b=e.target.closest('[data-host]');if(!b)return;const type=b.dataset.host;if(type==='newStory'&&!confirm('Start a fresh heist? Your characters stay, but story progress and scores reset.'))return;d.close();await command({type});});
  d.querySelector('select').addEventListener('change',e=>command({type:'window',ms:Number(e.target.value)}));
}

root.addEventListener('input',e=>{
  if(e.target.id==='character-name'){M.profile.name=e.target.value;const p=document.getElementById('preview-name');if(p)p.textContent=e.target.value||'Adventurer';}
  if(e.target.id==='room-code'){M.code=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');e.target.value=M.code;}
  if(e.target.id==='action-text'){M.draft=e.target.value;document.getElementById('char-count').textContent=M.draft.length+'/180';}
  if(e.target.id==='reaction-text')M.reactDraft=e.target.value;
});
root.addEventListener('submit',async e=>{
  if(e.target.id==='action-form'){e.preventDefault();await sendAction();}
  if(e.target.id==='join-form'){e.preventDefault();if(M.code.length!==6){M.error='Enter the six-character code from the TV.';render();return;}if(M.devices[M.code]){try{await joinParty(M.code);return;}catch(e){M.error=e.message;render();return;}}beginCreator('party');}
});
root.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const act=b.dataset.action;
  if(act==='home'){if(M.screen==='controller'&&!confirm('Return to the home screen? Your character stays saved.'))return;M.screen='home';M.error='';scene.setState(null);render();}
  else if(act==='sound'){M.sound=!M.sound;write('chaos.sound',M.sound);sound();render();}
  else if(act==='how')how();
  else if(act==='partyInfo')partyInfo();
  else if(act==='credits')dialog(`<h2>Good people made these pixels.</h2><p>Animated characters, clothing and hair crops, and visual effects: <a href="https://pixel-boy.itch.io/ninja-adventure-asset-pack" target="_blank" rel="noopener">Ninja Adventure</a> by Pixel-boy and AAA (CC0). Scene tiles and props: <a href="https://kenney.nl/assets/tiny-dungeon" target="_blank" rel="noopener">Kenney Tiny Dungeon</a> and Tiny Town (CC0).<br><br>Multiplayer sessions, client connection, clocks and rules support: <a href="https://github.com/msynk/bomb-party" target="_blank" rel="noopener">PartyFrame</a> by Saleh Yusefnejad (MIT), adapted for 24 players and durable campaigns, running on Colyseus. QR codes: qrcode-generator (MIT). Full licenses and changes are included with the Mac build.<br><br>No game graphics were extracted from DungeonBox. No generative image or video calls are made during play.</p><button class="button full" data-close>Cheers to that.</button>`);
  else if(act==='solo'){if(read('chaos.solo',null))startSolo();else beginCreator('solo');}
  else if(act==='host')await loadHost();
  else if(act==='join'){M.mode='party';M.screen='join';M.code='';M.error='';render();}
  else if(act==='creatorTab'){M.creatorTab=b.dataset.value;M.error='';render();}
  else if(act==='avatar'){const k=b.dataset.key;M.profile.avatar[k]=k==='body'?b.dataset.value:Number(b.dataset.value);render();}
  else if(act==='role'){if(M.editing&&M.room?.phase!=='lobby'&&M.room?.phase!=='ended'){toast('Class is locked until the next heist. Your look can still change.');return;}M.profile.role=b.dataset.value;render();}
  else if(act==='perk'){if(M.editing&&M.room?.phase!=='lobby'&&M.room?.phase!=='ended'){toast('Perks are locked until the next heist.');return;}M.profile.perk=b.dataset.value;render();}
  else if(act==='random'){M.profile.avatar={body:['human','elf','orc'][Math.floor(Math.random()*3)],skin:Math.floor(Math.random()*6),hair:Math.floor(Math.random()*6),hairColor:Math.floor(Math.random()*6),outfit:Math.floor(Math.random()*4),color:Math.floor(Math.random()*6),accessory:Math.floor(Math.random()*6)};render();}
  else if(act==='enter')await enter();
  else if(act==='createRoom'){
    const ms=Number(document.getElementById('reaction-length').value);M.busy=true;M.error='';render();
    try{if(!M.hostKey)throw new Error('Open the game on the host Mac first.');const d=await emit('host:create',{hostKey:M.hostKey,reactionMs:ms});M.network=d.network;M.screen='host';M.playerId=null;setRoom(d.room);history.replaceState(null,'','/host');}catch(e){M.error=e.message;}finally{M.busy=false;render();}
  }
  else if(act==='resumeRoom')try{const d=await emit('host:watch',{hostKey:M.hostKey,code:b.dataset.code});M.network=d.network;M.screen='host';M.playerId=null;setRoom(d.room);}catch(e){toast(e.message);}
  else if(act==='startStory')await command({type:'start'});
  else if(act==='pause')await command({type:'pause'});
  else if(act==='settings')settings();
  else if(act==='skipTimer')await command({type:'resolve'});
  else if(act==='newStory'){await command({type:'newStory'});if(M.mode==='solo')await command({type:'start'});}
  else if(act==='mutePlayer')await command({type:'mute',playerId:b.dataset.id});
  else if(act==='redact')await command({type:'redact',eventId:Number(b.dataset.id)});
  else if(act==='toggleLog'){M.showLog=!M.showLog;render();}
  else if(act==='editCharacter')beginCreator(M.mode,M.mode==='solo'||M.mode==='party');
  else if(act==='suggest'){M.draft=b.dataset.text;render();document.getElementById('action-text')?.focus({preventScroll:true});}
  else if(act==='react'){const texts={assist:'I help them pull it off.',intervene:'I try to stop this terrible idea.',flee:'I hide behind a table and save myself.'};await sendAction('reaction',b.dataset.kind,texts[b.dataset.kind]);}
  else if(act==='customReaction')await sendAction('reaction','custom');
  else if(act==='copyJoin'){try{await navigator.clipboard.writeText(joinUrl());toast('Join link copied. Same Wi-Fi, same terrible judgment.');}catch{dialog(`<h2>Your party link.</h2><input readonly value="${esc(joinUrl())}" aria-label="Join link"><p class="hint">Copy this address, or scan the QR code on the TV.</p><button class="button full" data-close>Done</button>`);}}
  else if(act==='openController')window.open('/join?room='+encodeURIComponent(M.room.code),'_blank','noopener');
  else if(act==='fullscreen'){try{if(document.fullscreenElement){await document.exitFullscreen();document.body.classList.remove('fullscreen');}else{await document.documentElement.requestFullscreen();document.body.classList.add('fullscreen');}}catch{toast('Use your browser’s full-screen option or cast this tab to the TV.');}}
  else if(act==='recover'){
    const d=dialog(`<h2>Your other pair of boots.</h2><p>Enter the room code and your six-digit recovery PIN to restore your character. This moves control to this device.</p><form id="recovery-form"><div class="field" style="margin-top:20px"><label class="field-label" for="recover-room">ROOM CODE</label><input id="recover-room" maxlength="6" value="${esc(M.code)}" autocapitalize="characters" required></div><div class="field"><label class="field-label" for="recover-pin">YOUR RECOVERY PIN</label><input id="recover-pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required></div><div id="recover-error" class="field-error"></div><button class="button gold full" type="submit">Recover my character</button></form><button class="link-button" data-close style="margin-top:18px">Cancel</button>`);
    d.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const code=d.querySelector('#recover-room').value.trim().toUpperCase(),pin=d.querySelector('#recover-pin').value.trim();try{await joinParty(code,pin);d.close();}catch(e){d.querySelector('#recover-error').textContent=e.message;}});
  }
});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('fullscreen');});
document.addEventListener('ninja-assets-ready',()=>render());
document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&M.mode==='party'&&M.room&&M.socket?.connected)try{const d=await emit('room:sync');setRoom(d.room);}catch{}});

async function init(){
  // Download metadata is build-generated and contains only a user-facing release link.
  try{const d=await fetch('/release.json').then(r=>r.ok?r.json():null);M.downloadUrl=d?.downloadUrl||'';}catch{}
  const params=new URLSearchParams(location.search);const code=(params.get('room')||location.pathname.match(/^\/join\/([A-Z0-9]{6})$/)?.[1]||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
  if(!config.standalone&&code){M.code=code;if(M.devices[code]){try{await joinParty(code);return;}catch(e){M.error=e.message;}}beginCreator('party');return;}
  if(!config.standalone&&location.pathname==='/host'){await loadHost();return;}
  render();
}
render();init();
