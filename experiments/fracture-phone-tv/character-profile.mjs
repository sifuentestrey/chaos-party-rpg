// @ts-nocheck
/** Shared avatar catalog. Appearance never grants native gear or statistics. */
export const ARMORS=Object.freeze({clotharmor:'Cloth',leatherarmor:'Leather',mailarmor:'Chain mail',platearmor:'Plate',redarmor:'Royal armor',goldenarmor:'Ornate armor'});
export const OUTFITS=Object.freeze({...ARMORS,robe:'Mage robe',dress:'Village dress'});
export const BODIES=Object.freeze({human:'Human',elf:'Elf',orc:'Orc',dwarf:'Dwarf',ogre:'Ogre',fairy:'Fairy'});
export const ACCESSORIES=Object.freeze({none:'None',hat:'Hat',crown:'Crown',flower:'Flower',glasses:'Glasses'});
export const HAIR_STYLES=Object.freeze({original:'Original',cropped:'Cropped',bob:'Bob',long:'Long',ponytail:'Ponytail',bun:'Bun'});
export const HEADWEAR=Object.freeze({bare:'No helmet',...ARMORS});
export const CLOTH_COLORS=['Original','Rose','Lavender','Teal','Blue','Gold','Crimson','Forest','Ivory','Black','Plum','Coral','Mint','Sky','Copper','Silver'];
export const SKIN_COLORS=['Original','Light','Warm','Tan','Brown','Deep','Porcelain','Olive','Copper','Umber'];
export const HAIR_COLORS=['Original','Brown','Black','Silver','Purple','Pink','Auburn','White','Blue','Green','Red','Honey'];
export const DEFAULT_APPEARANCE=Object.freeze({version:2,body:'human',outfit:'clotharmor',skin:0,hair:0,color:0,accessory:'none',legs:'clotharmor',boots:'clotharmor',headwear:'bare',hairStyle:'original',bottomColor:0,bootColor:0,headColor:0,eyewear:'none',flower:'none'});
const legacyKeys=['version','body','outfit','skin','hair','color','accessory'];
export function normalizeAppearance(value){const a=validateAppearance(value);if(a.version===2)return a;return {...DEFAULT_APPEARANCE,...a,version:2,legs:a.outfit,boots:a.outfit,headwear:['clotharmor','leatherarmor'].includes(a.outfit)?'bare':a.outfit,bottomColor:a.color,bootColor:a.color,headColor:a.color};}
export function bodyScale(body){return body==='fairy'?[.72,.72]:body==='dwarf'?[1.12,.82]:body==='ogre'?[1.2,1.2]:[1,1];}
export const STARTERS=Object.freeze({
 knight:{name:'Fighter',ability:'Power Strike',skill:'power_strike',cooldown:12,description:'Your next attack within five seconds deals double damage.'},
 rogue:{name:'Rogue',ability:'Phase Shift',skill:'phase_shift',cooldown:12,description:'Vanish for two seconds, lose enemy attention and slip past enemies. Walls still block you.'},
 wizard:{name:'Mage',ability:'Arcane Shock',skill:'war_cry',cooldown:20,description:'Stun enemies within three tiles for three seconds.'},
 healer:{name:'Healer',ability:'Mend',skill:'mend',cooldown:20,description:'Restore up to a quarter of your or a nearby friend’s maximum health. Cannot revive the fallen.'}
});
export function validateAppearance(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||![1,2].includes(value.version))throw Error('Choose a supported character appearance.');
 const keys=value.version===1?legacyKeys:Object.keys(DEFAULT_APPEARANCE);
 if(Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>value[k]===undefined))throw Error('Character appearance has unsupported or missing choices.');
 if(!Object.hasOwn(BODIES,value.body)||!Object.hasOwn(OUTFITS,value.outfit)||!Object.hasOwn(ACCESSORIES,value.accessory))throw Error('Choose an available heritage, outfit and accessory.');
 for(const [key,n] of [['skin',value.version===1?6:10],['hair',value.version===1?6:12],['color',value.version===1?8:16]])if(!Number.isInteger(value[key])||value[key]<0||value[key]>=n)throw Error('Choose an available appearance color.');
 if(value.version===2){for(const [key,options] of [['legs',ARMORS],['boots',ARMORS],['headwear',HEADWEAR],['hairStyle',HAIR_STYLES],['eyewear',{none:1,glasses:1}],['flower',{none:1,left:1,right:1}]])if(!Object.hasOwn(options,value[key]))throw Error('Choose an available '+key);for(const key of ['bottomColor','bootColor','headColor'])if(!Number.isInteger(value[key])||value[key]<0||value[key]>=16)throw Error('Choose an available piece color.');}
 return Object.fromEntries(keys.map(k=>[k,value[k]]));
}
export function isStarter(role){return typeof role==='string'&&Object.hasOwn(STARTERS,role);}
export function randomAppearance(random=Math.random){const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))],index=n=>Math.min(n-1,Math.floor(random()*n));return {...DEFAULT_APPEARANCE,body:pick(Object.keys(BODIES)),outfit:pick(Object.keys(OUTFITS)),legs:pick(Object.keys(ARMORS)),boots:pick(Object.keys(ARMORS)),headwear:pick(Object.keys(HEADWEAR)),hairStyle:pick(Object.keys(HAIR_STYLES)),skin:index(10),hair:index(12),color:index(16),bottomColor:index(16),bootColor:index(16),headColor:index(16),accessory:pick(['none','hat','crown']),eyewear:pick(['none','glasses']),flower:pick(['none','left','right'])};}
