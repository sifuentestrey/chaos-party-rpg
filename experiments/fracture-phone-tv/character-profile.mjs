// @ts-nocheck
/** Shared avatar catalog. Appearance never grants native gear or statistics. */
export const ARMORS=Object.freeze({clotharmor:'Cloth',leatherarmor:'Leather',mailarmor:'Chain mail',platearmor:'Plate',redarmor:'Royal armor',goldenarmor:'Ornate armor'});
export const OUTFITS=Object.freeze({...ARMORS,robe:'Mage robe',dress:'Village dress',tunic:'Travel tunic',cloak:'Travel cloak',tabard:'Tabard'});
export const OUTFIT_SOURCES=Object.freeze({tunic:'clotharmor',cloak:'clotharmor',tabard:'clotharmor'});
export const BODIES=Object.freeze({human:'Human',elf:'Elf',orc:'Orc',dwarf:'Dwarf',ogre:'Ogre',fairy:'Fairy',vampire:'Vampire',werewolf:'Werewolf',skeleton:'Skeleton',demon:'Demon'});
export const ACCESSORIES=Object.freeze({none:'None',hat:'Hat',crown:'Crown',flower:'Flower',glasses:'Glasses',cape:'Cape',scarf:'Scarf',satchel:'Satchel',shoulderpad:'Shoulder guard',ribbon:'Ribbon'});
export const HAIR_STYLES=Object.freeze({original:'Original',cropped:'Cropped',bob:'Bob',long:'Long',ponytail:'Ponytail',bun:'Bun',braids:'Braids',mohawk:'Mohawk',sidecut:'Side cut',curly:'Curly',pixie:'Pixie',topknot:'Top knot',sidebraid:'Side braid'});
export const FACIAL_HAIR=Object.freeze({none:'None',stubble:'Stubble',mustache:'Mustache',beard:'Beard',goatee:'Goatee',sideburns:'Sideburns'});
export const HEADWEAR=Object.freeze({bare:'No helmet',hood:'Hood',mask:'Mask',circlet:'Circlet',cowl:'Cowl',pointed:'Pointed cap',veil:'Veil',...ARMORS});
export const HEADWEAR_SOURCES=Object.freeze({bare:'clotharmor',hood:'clotharmor',mask:'clotharmor',circlet:'clotharmor',cowl:'clotharmor',pointed:'clotharmor',veil:'clotharmor'});
export const DERIVED_HERITAGES=Object.freeze({
 vampire:Object.freeze({label:'Vampire',skin:'#eadfea',accent:'#a83b61',layer:'fangs-eyes-cape'}),
 werewolf:Object.freeze({label:'Werewolf',skin:'#9a714f',accent:'#d0a16e',layer:'ears-tail'}),
 skeleton:Object.freeze({label:'Skeleton',skin:'#d8d1b8',accent:'#f0e9d2',layer:'skull'}),
 demon:Object.freeze({label:'Demon',skin:'#bd5260',accent:'#e4a05c',layer:'horns-tail-wings'})
});
export const CLOTH_COLORS=['Original','Rose','Lavender','Teal','Blue','Gold','Crimson','Forest','Ivory','Black','Plum','Coral','Mint','Sky','Copper','Silver'];
export const SKIN_COLORS=['Original','Light','Warm','Tan','Brown','Deep','Porcelain','Olive','Copper','Umber'];
export const HAIR_COLORS=['Original','Brown','Black','Silver','Purple','Pink','Auburn','White','Blue','Green','Red','Honey'];
export const PRESENTATIONS=Object.freeze({neutral:'Neutral',feminine:'Feminine'});
/** Small, appearance-independent origin choices. Their bonuses are applied
 * only by the server's existing Chaos D20 resolver. */
export const BACKGROUNDS=Object.freeze({
 farmhand:Object.freeze({name:'Farmhand',description:'You know hard work and steady hands. +3 on Strength checks.',baseBonus:3,checks:Object.freeze(['strength'])}),
 thief:Object.freeze({name:'Thief',description:'You learned to read a room and slip past trouble. +2 on social and sneak checks.',baseBonus:2,checks:Object.freeze(['social','sneak'])}),
 scholar:Object.freeze({name:'Scholar',description:'You studied old clues and careful observation. +2 on Wisdom and inspect checks.',baseBonus:2,checks:Object.freeze(['wisdom','inspect'])}),
 soldier:Object.freeze({name:'Soldier',description:'You held a line when others ran. +2 on attack and break checks.',baseBonus:2,checks:Object.freeze(['attack','break'])}),
 wanderer:Object.freeze({name:'Wanderer',description:'You learned to cross uncertain ground quietly. +2 on Dexterity and sneak checks.',baseBonus:2,checks:Object.freeze(['dexterity','sneak'])}),
 artisan:Object.freeze({name:'Artisan',description:'You make useful things from what the world leaves behind. +2 on Craft and repair checks.',baseBonus:2,checks:Object.freeze(['craft','repair'])})
});
export const DEFAULT_APPEARANCE=Object.freeze({version:2,body:'human',presentation:'neutral',outfit:'clotharmor',skin:0,hair:0,color:0,accessory:'none',legs:'clotharmor',boots:'clotharmor',headwear:'bare',hairStyle:'original',facialHair:'none',bottomColor:0,bootColor:0,headColor:0,eyewear:'none',flower:'none'});
const legacyKeys=['version','body','outfit','skin','hair','color','accessory'];
export function normalizeAppearance(value){const a=validateAppearance(value);if(a.version===2)return a;return {...DEFAULT_APPEARANCE,...a,version:2,legs:a.outfit,boots:a.outfit,headwear:['clotharmor','leatherarmor'].includes(a.outfit)?'bare':a.outfit,bottomColor:a.color,bootColor:a.color,headColor:a.color};}
export function bodyScale(body){return body==='fairy'?[.72,.72]:body==='dwarf'?[1.12,.82]:body==='ogre'?[1.2,1.2]:[1,1];}
export const STARTERS=Object.freeze({
 knight:{name:'Fighter',ability:'Power Strike',skill:'power_strike',cooldown:12,description:'Your next attack within five seconds deals double damage.'},
 rogue:{name:'Rogue',ability:'Phase Shift',skill:'phase_shift',cooldown:12,description:'Vanish for two seconds, lose enemy attention and slip past enemies. Walls still block you.'},
 wizard:{name:'Mage',ability:'Arcane Shock',skill:'war_cry',cooldown:20,description:'Stun enemies within three tiles for three seconds.'},
 healer:{name:'Healer',ability:'Mend',skill:'mend',cooldown:20,description:'Restore up to a quarter of your or a nearby friend’s maximum health. Cannot revive the fallen.'},
 barbarian:{name:'Barbarian',ability:'Frenzy',skill:'frenzy',cooldown:15,description:'Empower your melee attacks for a short engine-controlled window.'},
 paladin:{name:'Paladin',ability:'Bulwark',skill:'bulwark',cooldown:20,description:'Reduce the next damage you take through a self-only engine shield.'},
 assassin:{name:'Assassin',ability:'Ambush',skill:'ambush',cooldown:15,description:'Your first attack after using Ambush deals bonus damage.'},
 druid:{name:'Druid',ability:'Entangle',skill:'entangle',cooldown:20,description:'Entangle nearby enemies with the native engine stun effect.'},
 warlock:{name:'Warlock',ability:'Curse',skill:'curse',cooldown:15,description:'Curse your next attack with an engine-controlled damage bonus.'}
});
export function validateAppearance(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||![1,2].includes(value.version))throw Error('Choose a supported character appearance.');
 const keys=value.version===1?legacyKeys:Object.keys(DEFAULT_APPEARANCE);
 if(Object.keys(value).some(k=>!keys.includes(k)))throw Error('Character appearance has unsupported or missing choices.');
 // v2 looks saved before newer cosmetic layers were added remain valid; fill
 // only missing cosmetic fields from the canonical defaults before validating.
 if(value.version===2)value={...DEFAULT_APPEARANCE,...value};
 if(keys.some(k=>value[k]===undefined))throw Error('Character appearance has unsupported or missing choices.');
 if(!Object.hasOwn(BODIES,value.body)||!Object.hasOwn(OUTFITS,value.outfit)||!Object.hasOwn(ACCESSORIES,value.accessory))throw Error('Choose an available heritage, outfit and accessory.');
 for(const [key,n] of [['skin',value.version===1?6:10],['hair',value.version===1?6:12],['color',value.version===1?8:16]])if(!Number.isInteger(value[key])||value[key]<0||value[key]>=n)throw Error('Choose an available appearance color.');
 if(value.version===2){if(!Object.hasOwn(PRESENTATIONS,value.presentation))throw Error('Choose an available presentation.');for(const [key,options] of [['legs',ARMORS],['boots',ARMORS],['headwear',HEADWEAR],['hairStyle',HAIR_STYLES],['facialHair',FACIAL_HAIR],['eyewear',{none:1,glasses:1}],['flower',{none:1,left:1,right:1}]])if(!Object.hasOwn(options,value[key]))throw Error('Choose an available '+key);for(const key of ['bottomColor','bootColor','headColor'])if(!Number.isInteger(value[key])||value[key]<0||value[key]>=16)throw Error('Choose an available piece color.');}
 return Object.fromEntries(keys.map(k=>[k,value[k]]));
}
export function isStarter(role){return typeof role==='string'&&Object.hasOwn(STARTERS,role);}
export function randomAppearance(random=Math.random){const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))],index=n=>Math.min(n-1,Math.floor(random()*n));return {...DEFAULT_APPEARANCE,body:pick(Object.keys(BODIES)),outfit:pick(Object.keys(OUTFITS)),legs:pick(Object.keys(ARMORS)),boots:pick(Object.keys(ARMORS)),headwear:pick(Object.keys(HEADWEAR)),hairStyle:pick(Object.keys(HAIR_STYLES)),facialHair:pick(Object.keys(FACIAL_HAIR)),skin:index(10),hair:index(12),color:index(16),bottomColor:index(16),bootColor:index(16),headColor:index(16),accessory:pick(Object.keys(ACCESSORIES)),eyewear:pick(['none','glasses']),flower:pick(['none','left','right'])};}
