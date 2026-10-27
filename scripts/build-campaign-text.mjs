import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {renderCampaignText} from './campaign-text-schema.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export const CAMPAIGN_TEXT_SOURCE=path.join(root,'public/content/campaign-text.json');
export const CAMPAIGN_TEXT_OUTPUT=path.join(root,'public/content/campaign-text.generated.js');
export function buildCampaignText({input=CAMPAIGN_TEXT_SOURCE,output=CAMPAIGN_TEXT_OUTPUT}={}){
  if(path.resolve(input)===path.resolve(output))throw Error('Campaign text input and generated output must differ.');
  // Parse and validate everything before touching the previous generated artifact.
  const generated=renderCampaignText(JSON.parse(fs.readFileSync(input,'utf8')));
  if(fs.existsSync(output)&&fs.readFileSync(output,'utf8')===generated)return {output,changed:false};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  const temporary=output+'.tmp-'+process.pid;
  try{fs.writeFileSync(temporary,generated,'utf8');fs.renameSync(temporary,output);}
  finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
  return {output,changed:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  buildCampaignText();console.log('Validated and generated the existing campaign display text.');
}
