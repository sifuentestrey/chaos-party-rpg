/** Chaos-owned action contract. No engine state or outcomes are invented here. */
export type Intent = {verb: string; skill?: string; target?: string; dx?: number; dy?: number; steps?: number; x?: number; y?: number; judgment?: {action:string;targetId:string;ability:string;dc:number;description:string}};
const directions: Record<string, number[]> = {left:[-1,0],west:[-1,0],right:[1,0],east:[1,0],up:[0,-1],north:[0,-1],down:[0,1],south:[0,1]};
export function parseIntent(raw: string): Intent {
  let text = String(raw).toLowerCase().trim().replace(/[.!?]+$/, '').replace(/^(?:please\s+|i\s+(?:want to\s+|would like to\s+)?|try to\s+)+/, '').replace(/\s+/g,' ');
  if (/^(?:stop|halt|cancel|quit|cease)(?:\s+(?:(?:running|walking|moving|attacking|fighting)(?:\s+.+)?|everything|that|my action))?$/.test(text) || /^(?:hold still|hold position|stand still|stay put|wait)$/.test(text)) return {verb:'cancel'};
  if (/^(?:respawn|revive|rejoin|stand back up)$/.test(text)) return {verb:'respawn'};
  if (/^(?:look(?: around)?|survey|inspect surroundings)$/.test(text)) return {verb:'look'};
  const departure=text.match(/^(?:leave|exit|go outside|walk outside|get out)(?: (?:the )?(.+))?$/);
  if(departure)return {verb:'exit',...(departure[1]?{target:departure[1]}:{})};
  const entry=text.match(/^(?:enter|(?:go|walk|head|step|get) (?:in|inside|into|through)|use)(?: (?:the |a |an )?(.+))?$/);
  if(entry&&(!text.startsWith('use')||/door|entrance|building|house|tavern/.test(entry[1]||'')))return {verb:'enter',...(entry[1]?{target:entry[1]}:{})};
  if(/^(?:don't|do not|no more) (?:run|walk|move|attack|fight|keep running|keep moving|keep attacking)(?:\s+.*)?$/.test(text))return {verb:'cancel'};
  const ability=text.match(/^(?:use (?:my )?(?:class )?ability|power strike|phase shift|arcane shock|mend)(?: (?:on|to) (.+))?$/);
  if(ability){const skill=text.startsWith('power strike')?'power_strike':text.startsWith('phase shift')?'phase_shift':text.startsWith('arcane shock')?'war_cry':text.startsWith('mend')?'mend':null;return {verb:'ability',...(skill?{skill}:{}),...(ability[1]?{target:ability[1]}:{})};}
  const heal=text.match(/^(?:heal|mend) (.+)$/);if(heal)return {verb:'ability',skill:'mend',target:heal[1]};
  const numbers:Record<string,string>={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12'};
  text=text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g,w=>numbers[w]);
  const beforeDirection=text.match(/^(move|walk|run|go|step|head) (\d{1,2}) (?:steps?|tiles?) (left|right|up|down|north|south|east|west)$/);
  if(beforeDirection)text=`${beforeDirection[1]} ${beforeDirection[3]} ${beforeDirection[2]}`;
  const move = text.match(/^(?:move|walk|run|go|step|head)\s+(?:(?:to|towards?) (?:the )?)?(left|right|up|down|north|south|east|west)(?:\s+(\d{1,2})(?:\s+(?:steps?|tiles?))?)?$/);
  if (move) {const [dx,dy] = directions[move[1]]; return {verb:'move',dx,dy,steps:Math.min(12,Math.max(1,Number(move[2]||1)))};}
  const coords = text.match(/^(?:move|walk|run|go|head) to (\d{1,3})[, ]\s*(\d{1,3})$/);
  if (coords) return {verb:'go',x:Number(coords[1]),y:Number(coords[2])};
  const patterns: [string, RegExp][] = [
    ['quest', /^(?:ask|request)(?: the)? (.+?) (?:for (?:a )?(?:quest|job|adventure)|quest)$/],
    ['use_item', /^(?:eat|drink|use)\s+(.+)$/],
    ['equip', /^(?:equip|wear|wield)\s+(.+)$/],
    ['attack', /^(?:attack|hit|fight|strike|punch|kick|tackle)\s+(.+)$/],
    ['talk', /^(?:talk to|speak to|chat with|ask)\s+(.+)$/],
    ['go', /^(?:move|walk|run|go|head|approach)\s+(?:(?:to|towards?)\s+)?(.+)$/],
    ['open', /^open\s+(.+)$/], ['loot', /^(?:pick up|pickup|take|collect|grab|loot)\s+(.+)$/],
    ['manipulate', /^(?:push|drag|lift|carry|pull)\s+(.+)$/]
  ];
  for (const [verb,pattern] of patterns) {const m = text.match(pattern); if(m) {
    // "move the tent" is object manipulation, not actor navigation.
    const actual = verb==='go' && /^move\s+(?!to\b)/.test(text) ? 'manipulate' : verb;
    return {verb:actual,target:m[1].replace(/^(?:(?:the|a|an|nearest|closest|nearby)\s+)+/,'').trim()};
  }}
  return {verb:'unknown',target:text};
}
export function validIntent(value: any): value is Intent {
  if (!value || typeof value!=='object' || Array.isArray(value)) return false;
  if (!['use_item','creative','cancel','respawn','equip','quest','look','exit','enter','move','go','attack','talk','open','loot','manipulate','environment','ability','unknown'].includes(value.verb)) return false;
  if(Object.keys(value).some(k=>!['verb','target','dx','dy','steps','x','y','judgment','skill'].includes(k)))return false;
  if(value.verb==='environment'){
     if(Object.keys(value).some(k=>!['verb','judgment'].includes(k)))return false;
     const j=value.judgment;
     if(!j||typeof j!=='object'||Array.isArray(j)||Object.keys(j).some(k=>!['action','targetId','ability','dc','description'].includes(k)))return false;
     const move=/^move_(north|south|east|west)$/.test(j.action);
     const allowed=['break','ignite','extinguish','repair','inspect','drink'].includes(j.action)||move;
     const ability=move||j.action==='break'?'strength':j.action==='ignite'?'wisdom':j.action==='repair'?'dexterity':'none';
     const dcOk=move?j.dc>=8&&j.dc<=30:j.action==='break'?j.dc>=6&&j.dc<=30:
       j.action==='repair'?j.dc===12:['extinguish','inspect','drink'].includes(j.action)?j.dc===0:j.dc>=0&&j.dc<=30;
     // This validates the wire shape only. The native executor still verifies
     // exact object identity, current capabilities, position and engine-owned DC.
     return allowed&&typeof j.targetId==='string'&&j.targetId.length>0&&j.targetId.length<=180&&
       j.ability===ability&&Number.isInteger(j.dc)&&dcOk&&
       typeof j.description==='string'&&j.description.length<=240;
   }
   if(value.judgment!==undefined)return false;
   if(value.verb==='ability'&&Object.keys(value).some(k=>!['verb','skill','target'].includes(k)))return false;
   if(value.skill!==undefined&&(value.verb!=='ability'||!['power_strike','phase_shift','war_cry','mend'].includes(value.skill)))return false;
   if(value.target!==undefined && (typeof value.target!=='string'||!value.target.trim()||value.target.length>180))return false;
  if(value.verb==='move')return Number.isInteger(value.dx)&&Number.isInteger(value.dy)&&Math.abs(value.dx)+Math.abs(value.dy)===1&&Number.isInteger(value.steps)&&value.steps>=1&&value.steps<=12;
  if(value.verb==='go' && value.x!==undefined)return Number.isInteger(value.x)&&Number.isInteger(value.y)&&value.x>0&&value.y>0&&value.x<1000&&value.y<1000;
  return !['use_item','creative','go','attack','talk','quest','equip','open','loot','manipulate'].includes(value.verb)||!!value.target;
}
// Breadth-first search gives a shortest cardinal path, with bounded work on the real map.
export function shortestPath(start: number[], goal: (x:number,y:number)=>boolean, walkable: (x:number,y:number)=>boolean, limit=55000): number[][] | null {
  const key=(x:number,y:number)=>`${x},${y}`;
  const queue=[start], parents=new Map<string,number[]|null>([[key(start[0],start[1]),null]]);
  for(let i=0;i<queue.length && i<limit;i++) {
    const [x,y]=queue[i];
    if(goal(x,y)) {const path:number[][]=[];let p:number[]|null=[x,y];while(p){path.push(p);p=parents.get(key(p[0],p[1]))!;}return path.reverse().slice(1);}
    for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!parents.has(k)&&walkable(nx,ny)){parents.set(k,[x,y]);queue.push([nx,ny]);}}
  }
  return null;
}
// Read the pinned native client's declared cooldowns rather than inventing new balance.
export function extractNativeAttackRates(characterSource: string,mobSource: string): Record<string,number> {
  const inherited=Number(characterSource.match(/this\.setAttackRate\((\d+)\)/)?.[1]);
  if(!inherited)throw Error('Native attack cadence is unavailable');
  const rates:Record<string,number>={default:inherited};
  for(const block of mobSource.split(/\n  (?=\w+: class )/).slice(1)){
    const kind=block.match(/Types\.Entities\.(\w+)/)?.[1]?.toLowerCase();
    if(kind)rates[kind]=Number(block.match(/this\.setAttackRate\((\d+)\)/)?.[1]||inherited);
  }
  return rates;
}
