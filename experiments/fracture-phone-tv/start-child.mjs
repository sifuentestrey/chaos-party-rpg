// Keep terminal Ctrl-C from racing the ordered bridge-save -> server-stop cleanup.
import {spawn} from 'node:child_process';
if(!process.argv[2])throw Error('A local Node entrypoint is required');
const child=spawn(process.execPath,process.argv.slice(2),{stdio:'inherit',detached:process.platform!=='win32'});
process.on('SIGINT',()=>{}); // The launcher's trap owns shutdown order.
process.on('SIGTERM',()=>child.kill('SIGTERM'));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal==='SIGTERM'?0:1);});
