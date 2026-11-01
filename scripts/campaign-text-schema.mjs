const QUEST_KEYS=['recover','rescue','restore'];
function fields(value,keys,label){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error(label+' must be a plain object.');
  const actual=Reflect.ownKeys(value);
  if(actual.length!==keys.length||!keys.every(key=>Object.hasOwn(value,key)))throw Error(label+' has missing or unknown fields.');
}
function text(value,max,label){
  if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>max||/[\u0000-\u001f\u007f-\u009f\u2028\u2029<>]/.test(value))throw Error(label+' must be nonempty single-line plain text of at most '+max+' characters.');
  return value;
}
function unique(values,label){
  if(new Set(values.map(value=>value.toLowerCase())).size!==values.length)throw Error(label+' must not repeat values.');
  return values;
}
function list(value,count,max,label){
  if(!Array.isArray(value)||value.length!==count||Reflect.ownKeys(value).length!==count+1)throw Error(label+' must contain exactly '+count+' text values.');
  return unique(Array.from(value,(entry,index)=>text(entry,max,label+'['+index+']')),label);
}
// Only display text is configurable. Mechanics, IDs and selector counts stay in code.
export function validateCampaignText(value){
  fields(value,['locationPrefixes','rumors','questTitles'],'Campaign text');
  const locationPrefixes=list(value.locationPrefixes,8,32,'Location prefixes'),rumors=list(value.rumors,3,160,'Rumors');
  fields(value.questTitles,QUEST_KEYS,'Quest titles');
  const titles=QUEST_KEYS.map(key=>text(value.questTitles[key],64,'Quest title '+key));unique(titles,'Quest titles');
  return {locationPrefixes,rumors,questTitles:Object.fromEntries(QUEST_KEYS.map((key,index)=>[key,titles[index]]))};
}
export function renderCampaignText(value){
  const content=JSON.stringify(validateCampaignText(value),null,2);
  return '// Generated from public/content/campaign-text.json. Do not hand-edit.\n'+
    'const content = '+content+';\n'+
    'Object.freeze(content.locationPrefixes);\nObject.freeze(content.rumors);\nObject.freeze(content.questTitles);\n'+
    'export const CAMPAIGN_TEXT = Object.freeze(content);\n';
}
