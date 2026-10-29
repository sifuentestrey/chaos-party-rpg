import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
const keyOK=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{20,256}$/.test(value);
const fileFor=dir=>path.join(dir,'ai-settings.json');
export function readAISettings(dir){
 const file=fileFor(dir);if(!fs.existsSync(file))return null;
 const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw Error('Saved AI settings are invalid.');
 const value=JSON.parse(fs.readFileSync(file,'utf8'));
 if(value.version!==1||typeof value.enabled!=='boolean'||value.apiKey!==undefined&&!keyOK(value.apiKey))throw Error('Saved AI settings are invalid.');
 return {version:1,enabled:value.enabled,...(value.apiKey?{apiKey:value.apiKey}:{})};
}
export function aiRuntimeEnvironment(env,settings){
 if(!settings)return {...env};
 return {...env,CHAOS_AI:env.CHAOS_AI||(!settings.enabled?'off':'on'),CHAOS_AI_PROVIDER:env.CHAOS_AI_PROVIDER||'groq-free',GROQ_API_KEY:env.GROQ_API_KEY||settings.apiKey||'',CHAOS_AI_NARRATION:env.CHAOS_AI_NARRATION||'off',CHAOS_AI_MODEL:env.CHAOS_AI_PROVIDER?env.CHAOS_AI_MODEL:['openai/gpt-oss-20b','openai/gpt-oss-120b'].includes(env.CHAOS_AI_MODEL)?env.CHAOS_AI_MODEL:'openai/gpt-oss-120b'};
}
export function writeAISettings(dir,input,{environmentHasKey=false}={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['enabled','apiKey','freePlanConfirmed'].includes(k))||typeof input.enabled!=='boolean')throw Error('Choose whether to connect the AI.');
 if(input.enabled&&input.freePlanConfirmed!==true)throw Error('Confirm that the provider account uses its Free Plan.');
 if(input.apiKey!==undefined&&!keyOK(input.apiKey))throw Error('Enter a valid private connection key.');
 if(environmentHasKey&&input.apiKey!==undefined)throw Error('The existing private connection key is managed by this computer.');
 let previous=null;try{previous=readAISettings(dir);}catch{if(input.enabled&&!input.apiKey&&!environmentHasKey)throw Error('Enter a new private key to repair saved settings.');const old=fileFor(dir);if(!fs.lstatSync(old).isFile())throw Error('Saved AI settings need local repair.');const backup=old+'.invalid-'+randomBytes(8).toString('hex');fs.copyFileSync(old,backup,fs.constants.COPYFILE_EXCL);fs.chmodSync(backup,0o600);}
 const key=input.apiKey||previous?.apiKey;
 if(input.enabled&&!environmentHasKey&&!key)throw Error('Enter a private connection key first.');
 const value={version:1,enabled:input.enabled,...(key?{apiKey:key}:{})};
 fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=fileFor(dir),temporary=file+'.'+randomBytes(8).toString('hex')+'.tmp';
 try{fs.writeFileSync(temporary,JSON.stringify(value),{mode:0o600,flag:'wx'});fs.renameSync(temporary,file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
 return value;
}
