// Authored geography uses the existing seeded scenes, item rules and quest engine.
// Installed explicitly after the heist; legacy sandbox locations/saves are retained.
export const EXPEDITION_ROUTES={
 'forest-trail':{name:'Lanternwood Trail',kind:'forest',at:[0,2],exits:['ruins','deep-woods','woodcutters-camp'],description:'Lantern marks lead north. A woodcutters’ camp lies east.'},
 'woodcutters-camp':{name:'Woodcutters’ Camp',kind:'clearing',at:[1,2],exits:['forest-trail','riverbank'],description:'Cut timber and a sheltered spring offer a quieter route to the river.'},
 'deep-woods':{name:'The Whispering Woods',kind:'forest',at:[0,3],exits:['forest-trail','riverbank'],description:'Old trail stones point toward the sound of running water.'},
 riverbank:{name:'West Riverbank',kind:'marsh',at:[1,3],exits:['deep-woods','woodcutters-camp','old-bridge','river-cave'],description:'The fast river divides the valley. Repair the bridge, or seek the cave crossing.'},
 'old-bridge':{name:'The Broken Span',kind:'bridge',at:[2,3],exits:['riverbank','east-road'],quest:'restore',patron:'Brin the Bridgekeeper',description:'The bridgekeeper needs help making the crossing safe. Repair the broken span.'},
 'river-cave':{name:'The Ferryman’s Cave',kind:'cavern',at:[2,4],exits:['riverbank','east-road'],quest:'rescue',patron:'Pip the Ferryman',description:'An injured ferryman knows a sheltered crossing. Heal him and make the cave safe.'},
 'east-road':{name:'Eastbank Road',kind:'road',at:[3,3],exits:['old-bridge','river-cave','market-square'],description:'Both crossings meet on the road to Bellweather.'},
 'market-square':{name:'Bellweather Market',kind:'village',at:[4,3],exits:['east-road','town-inn','castle-road'],quest:'rescue',patron:'Mayor Tansy',description:'The mayor was hurt when the castle bell vanished. Help her and learn the way into the keep.'},
 'town-inn':{name:'The Sleepy Griffin Inn',kind:'interior',at:[4,4],exits:['market-square'],description:'A warm rest stop. The innkeeper knows how to make the castle sentries listen.'},
 'castle-road':{name:'The King’s Road',kind:'road',at:[4,2],exits:['market-square','castle-gate'],description:'The town gives way to high walls and a watchtower.'},
 'castle-gate':{name:'Castle Gatehouse',kind:'village',at:[4,1],exits:['castle-road','castle-yard'],description:'Beyond the gatehouse lies the keep. The mayor’s rescue earns you safe passage.'},
 'castle-yard':{name:'Castle Courtyard',kind:'ruins',at:[4,0],exits:['castle-gate','castle-cellar'],description:'A stair beneath the old chapel leads to the missing bell.'},
 'castle-cellar':{name:'The Chapel Cellar',kind:'cavern',at:[3,0],exits:['castle-yard','bell-vault'],quest:'restore',patron:'Orin the Lamplighter',description:'Repair the cellar door and make these stairs safe before opening the vault.'},
 'bell-vault':{name:'Vault of the Dawn Bell',kind:'cavern',at:[2,0],exits:['castle-cellar'],quest:'recover',patron:'Wren the Bellkeeper',description:'Recover the Dawn Bell and return it to its keeper. Force or friendship can clear the way.'}
};
export function beginExpedition(s){
 if(s.expedition)return false;
 s.expedition={version:1,title:'The Dawn Bell',status:'active',crossings:{},startedChapter:s.campaign.chapter};
 for(const [id,d] of Object.entries(EXPEDITION_ROUTES))s.locations[id]={id,name:d.name,kind:d.kind,exits:[...d.exits],visited:false,at:d.at,description:d.description,danger:['castle-cellar','bell-vault'].includes(id)?3:1,decor:Array.from({length:8},(_,i)=>[90+(i*137)%780,180+(i*73)%270,i%3])};
 // New expedition parties take a bounded route; already explored sandbox routes stay intact.
 const usedSandbox=Object.values(s.locations).some(l=>l.id.startsWith('wild-')&&l.visited);
 s.locations.ruins.exits=s.locations.ruins.exits.filter(id=>id!=='wild-0-0'||usedSandbox);
 if(!s.locations.ruins.exits.includes('forest-trail'))s.locations.ruins.exits.push('forest-trail');
 s.locations.tavern.at=[0,-1];s.locations.clearing.at=[0,0];s.locations.ruins.at=[0,1];
 return true;
}
export function expeditionTravelError(s,destination){
 if(!s.expedition)return null;
 const pair=[s.current,destination],done=id=>s.campaign.completed.some(q=>q.location===id);
 if(pair.includes('old-bridge')&&pair.includes('east-road')&&!s.expedition.crossings.bridge)return 'The span is broken or unsafe. Talk to the bridgekeeper, make the road safe, and repair the span; or try the ferryman’s cave.';
 if(pair.includes('river-cave')&&pair.includes('east-road')&&!done('river-cave'))return 'The ferryman cannot guide a crossing yet. Speak to him, make the cave safe, and bandage his injury.';
 if(pair.includes('castle-gate')&&pair.includes('castle-yard')&&!done('market-square'))return 'The sentries need the mayor’s word. Return to Bellweather Market and help the injured mayor.';
 if(pair.includes('castle-cellar')&&pair.includes('bell-vault')&&!done('castle-cellar'))return 'The vault stairs are unsafe. Speak to the lamplighter, make the cellar safe, and repair its door.';
 return null;
}
export function decorateExpeditionRegion(s,id){
 const d=EXPEDITION_ROUTES[id],q=s.regions[id]?.quest;if(!s.expedition||!d||!q)return;
 const patron=s.creatures[q.patronId],beast=s.creatures[q.threatId],gate=s.items[q.gateId],relic=s.items[q.relicId];
 if(d.quest){q.kind=d.quest;q.title=id==='bell-vault'?'Ring in the morning':d.quest==='restore'?'Make the crossing safe':'A helping hand';}
 if(d.patron)patron.name=d.patron;
 patron.goal=d.description;patron.routine={activity:id==='town-inn'?'tending the hearth':id==='market-square'?'watching the market':'keeping watch',home:[...patron.position]};
 if(q.kind==='restore'){gate.condition='broken';gate.hp=0;}
 if(id==='old-bridge'){gate.position=[480,230];patron.position=[240,330];patron.routine.home=[240,330];beast.position=[760,330];gate.name='bridge span';q.objective='Make the road safe and repair the bridge span.';}
 else if(id==='castle-cellar'){gate.name='cellar door';q.objective='Make the stairs safe and repair the cellar door.';}
 else if(q.kind==='rescue')q.objective='Make the road safe and bandage '+patron.name+'.';
 if(id==='bell-vault'){relic.name='Dawn Bell';q.title='Return the Dawn Bell';q.objective='Make the vault safe and return the Dawn Bell to Wren the Bellkeeper.';beast.name='Cinder the Vault Guardian';}
 s.regions[id].rumor=d.description;
}
export function advanceExpedition(s){
 if(!s.expedition)return null;
 if(s.current==='old-bridge'){
  const q=s.regions[s.current]?.quest,gate=s.items[q?.gateId],beast=s.creatures[q?.threatId];
  s.expedition.crossings.bridge=!!gate&&gate.condition==='intact'&&!!beast&&(beast.hp<=0||beast.attitude==='friendly');
 }
 if(s.expedition.status==='active'&&s.campaign.completed.some(q=>q.location==='bell-vault')){
  s.expedition.status='completed';s.expedition.ending='The Dawn Bell rings across Bellweather. The road is open, the town is safe, and the bellkeeper names your unlikely company honorary protectors of the valley.';
  return s.expedition.ending;
 }
 return null;
}
