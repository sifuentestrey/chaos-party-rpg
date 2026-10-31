// @ts-nocheck
/** Shared creation catalog. Cosmetics never grant native gear or statistics. */
export const OUTFITS=Object.freeze({clotharmor:'Cloth',leatherarmor:'Leather',mailarmor:'Chain mail',platearmor:'Plate',redarmor:'Royal armor',goldenarmor:'Ornate armor'});
export const BODIES=Object.freeze({human:'Human',elf:'Elf',orc:'Orc'});
export const ACCESSORIES=Object.freeze({none:'None',hat:'Hat',crown:'Crown',flower:'Flower',glasses:'Glasses'});
export const CLOTH_COLORS=['Original','Rose','Lavender','Teal','Blue','Gold','Crimson','Forest'];
export const SKIN_COLORS=['Original','Light','Warm','Tan','Brown','Deep'];
export const HAIR_COLORS=['Original','Brown','Black','Silver','Purple','Pink'];
export const DEFAULT_APPEARANCE=Object.freeze({version:1,body:'human',outfit:'clotharmor',skin:0,hair:0,color:0,accessory:'none'});
export const STARTERS=Object.freeze({
 knight:{name:'Fighter',ability:'Power Strike',skill:'power_strike',cooldown:12,description:'Your next attack within five seconds deals double damage.'},
 rogue:{name:'Rogue',ability:'Phase Shift',skill:'phase_shift',cooldown:12,description:'Vanish for two seconds, lose enemy attention and slip past enemies. Walls still block you.'},
 wizard:{name:'Mage',ability:'Arcane Shock',skill:'war_cry',cooldown:20,description:'Stun enemies within three tiles for three seconds.'},
 healer:{name:'Healer',ability:'Mend',skill:'mend',cooldown:20,description:'Restore up to a quarter of your or a nearby friend’s maximum health. Cannot revive the fallen.'}
});
export function validateAppearance(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||Object.keys(value).some(k=>!Object.hasOwn(DEFAULT_APPEARANCE,k)))throw Error('Choose a supported character appearance.');
 if(!Object.hasOwn(BODIES,value.body)||!Object.hasOwn(OUTFITS,value.outfit)||!Object.hasOwn(ACCESSORIES,value.accessory))throw Error('Choose an available body, outfit and accessory.');
 for(const [key,n] of [['skin',6],['hair',6],['color',8]])if(!Number.isInteger(value[key])||value[key]<0||value[key]>=n)throw Error('Choose an available appearance color.');
 return Object.fromEntries(Object.keys(DEFAULT_APPEARANCE).map(k=>[k,value[k]]));
}
export function isStarter(role){return typeof role==='string'&&Object.hasOwn(STARTERS,role);}
export function randomAppearance(random=Math.random){const pick=a=>a[Math.floor(random()*a.length)];return {...DEFAULT_APPEARANCE,body:pick(Object.keys(BODIES)),outfit:pick(Object.keys(OUTFITS)),skin:pick([0,1,2,3,4,5]),hair:pick([0,1,2,3,4,5]),color:pick([0,1,2,3,4,5,6,7]),accessory:pick(Object.keys(ACCESSORIES))};}
