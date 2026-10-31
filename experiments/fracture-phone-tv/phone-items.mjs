/** Presentation catalog for existing native items. Never supplies game effects. */
const equipment={sword1:'Sword 1',sword2:'Sword 2',axe:'Axe',morningstar:'Morning star',redsword:'Red sword',bluesword:'Blue sword',goldensword:'Golden sword',crystalstaff:'Crystal staff',voidblade:'Void blade',tentacle:'Tentacle',raygun:'Ray gun',lasergun:'Laser gun',mp5:'MP5',tec9:'TEC-9',plasmahelix:'Plasma helix',clotharmor:'Cloth armor',leatherarmor:'Leather armor',mailarmor:'Chain mail',platearmor:'Plate armor',redarmor:'Red armor',goldenarmor:'Golden armor',mecharmor:'Mech armor',crystalshell:'Crystal shell',voidcloak:'Void cloak'};
const consumables={flask:'Flask',burger:'Burger',cake:'Cake',firepotion:'Fire potion'};
export const ITEM_NAMES=Object.freeze({...equipment,...consumables,shieldbubble:'Shield bubble'});
export function itemAsset(name){return Object.hasOwn(ITEM_NAMES,name)?'item-'+name+'.png':null;}
export function itemLabel(name){return Object.hasOwn(ITEM_NAMES,name)?ITEM_NAMES[name]:String(name||'Unknown item');}
export function inventoryView(actor){
 if(!actor)return {equipped:[],bag:[]};
 const equipped=[['weapon',actor.weapon],['armor',actor.armor]].filter(([,name])=>typeof name==='string'&&name).map(([slot,name])=>({key:slot,name,label:itemLabel(name),asset:itemAsset(name),category:slot==='weapon'?'Weapon':'Armor',count:1,actions:[]}));
 const groups=new Map();
 for(const item of actor.inventory||[]){if(typeof item?.name!=='string'||!Number.isInteger(item.count)||item.count<1)continue;const name=item.name;
  if(!groups.has(name))groups.set(name,{key:'native:'+name,name,label:itemLabel(name),asset:itemAsset(name),category:'In your bag',count:0,actions:Object.hasOwn(consumables,name)?[{label:'Use',text:'use '+name}]:Object.hasOwn(equipment,name)?[{label:'Equip',text:'equip '+name}]:[]});
  groups.get(name).count+=item.count;
 }
 const bag=[...groups.values()];
 for(const item of actor.chaos?.bag||[]){if(typeof item?.id!=='string'||!item.id||item.id.length>160)continue;bag.push({key:'chaos:'+item.id,name:item.name||item.kind||'Belonging',label:item.name||item.kind||'Belonging',asset:null,category:item.carried?'Carrying':item.equipped?'Worn':'Belonging',count:1,actions:[{label:'Inspect',text:'inspect '+item.id},...(item.carried?[{label:'Drop',text:'drop '+item.id}]:[])]});}
 return {equipped,bag};
}
