import { app } from 'electron'
import { mkdtempSync, mkdirSync, openSync, writeSync, closeSync, statSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const root=mkdtempSync(join(tmpdir(),'tervell-pi-fork-perf-'))
process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath(path:string):void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain')
async function run(){
 const {SessionManager}=await import('@earendil-works/pi-coding-agent');const cwd=join(root,'project');mkdirSync(cwd);const sessions=join(root,'pi');mkdirSync(sessions);const file=join(root,'long-pi.jsonl');const fd=openSync(file,'wx',0o600),stamp=new Date().toISOString();let cut='';let parent:string|null=null
 writeSync(fd,JSON.stringify({type:'session',version:3,id:crypto.randomUUID(),timestamp:stamp,cwd})+'\n')
 for(let i=0;i<8000;i++){const id=i.toString(16).padStart(8,'0');writeSync(fd,JSON.stringify({type:'message',id,parentId:parent,timestamp:stamp,message:i%2?{role:'assistant',content:[{type:'text',text:('完整上下文 abcdefghijklmnopqrst '+i+'\n').repeat(100)}],api:'openai-completions',provider:'openai',model:'fixture',usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:'stop',timestamp:i}:{role:'user',content:'用户 '+i,timestamp:i}})+'\n');parent=id;if(i===5999)cut=id}
 closeSync(fd)
 const start=performance.now(),mode=process.argv.includes('--before')?'before':'after';let ticks=0;const heartbeat=setInterval(()=>ticks++,5)
 if(mode==='before'){
  const source=SessionManager.open(file,sessions,cwd),branch=source.createBranchedSession(cut)!;const fork=SessionManager.forkFrom(branch,cwd,sessions);if(!fork.getEntry(cut))throw Error('cutoff missing')
 }else{
  const {forkPiArtifact}=await import('../apps/electron/src/main/lib/pi-fork-client');const result=await forkPiArtifact({sourcePath:file,sourceCwd:cwd,targetCwd:cwd,sessionDir:sessions,entryId:cut,bindings:{cut}});if(result.bindings.cut!==cut||!readFileSync(result.path,'utf8').includes(cut))throw Error('cutoff missing')
 }
 clearInterval(heartbeat);console.log(JSON.stringify({mode,inputBytes:statSync(file).size,durationMs:performance.now()-start,mainHeartbeatTicks:ticks,mainPeakRssKiB:process.resourceUsage().maxRSS,mainRssBytes:process.memoryUsage().rss}));
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)})
