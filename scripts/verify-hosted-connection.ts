import { app, safeStorage } from 'electron'
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'
import { createHostedIdentity, hostedProof } from '../packages/core/src/remote/hosted'
import type { DeviceStart } from '../packages/core/src/remote/hosted'
import { RemoteHost, createHostedDevice } from '../packages/core/src/remote/host'
import type { RemoteState } from '../packages/core/src/remote/host'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'
import { HostedRemoteService } from '../apps/electron/src/main/lib/hosted-remote-service'
import { RANDOM_MARKET } from '../packages/shared/src/config/random-market'

const root=mkdtempSync(join(tmpdir(),'tervell-hosted-recovery-'))
process.env.TERVELL_PROFILE_DIR=root
app.setPath('userData',join(root,'chromium'));(app as typeof app & {setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain')
function assert(value:unknown,message:string):asserts value {if(!value)throw Error(message)}
async function run(){
 const cache=join(homedir(),'.cache/tervell/gateway-build')
 const fixture=spawn(join(cache,'go/bin/go'),['-C','services/connect','test','-run','^TestFixture$','-v'],{cwd:process.cwd(),env:{...process.env,GOPATH:join(cache,'gopath'),GOCACHE:join(cache,'build-cache'),GOTOOLCHAIN:'local',GOPROXY:'off',TERVELL_CONNECT_FIXTURE:'1'},stdio:['ignore','pipe','pipe']})
 let text='',base=''
 const service=new HostedRemoteService()
 try{
  await new Promise<void>((ok,bad)=>{const timer=setTimeout(()=>bad(Error('Go fixture startup timeout')),20000);fixture.once('error',bad);fixture.stdout.on('data',part=>{text+=String(part);const match=/FIXTURE (http:\/\/127\.0\.0\.1:\d+)/.exec(text);if(match){base=match[1]!+'/';clearTimeout(timer);ok()}});fixture.stderr.on('data',()=>{})})
  const identity=createHostedIdentity(randomUUID())
  const start=await hostedProof<DeviceStart>(base,identity,'start',{hostId:identity.hostId,name:'恢复测试电脑',platform:'test',requestId:randomUUID()})
  const approved=await fetch(new URL('account/approve',base),{method:'POST',headers:{origin:new URL(base).origin,authorization:'Bearer local-test-owner','content-type':'application/json'},body:JSON.stringify({code:start.userCode,confirm:true})});assert(approved.ok,'fixture approval failed')
  mkdirSync(join(root,'config'),{recursive:true})
  writeJsonFileAtomic(join(root,'config/random-connect-private.json'),{cipher:safeStorage.encryptString(JSON.stringify({identity,approved:true})).toString('base64')})
  // 固定本机回环服务，仅测试中替换公开常量；生产始终保留固定集市入口。
  Object.assign(RANDOM_MARKET,{connect:base})
  const state:RemoteState={hostId:identity.hostId,devices:[],sent:[]}
  const host=new RemoteHost(state,{sessions:()=>[{id:'fixture',workspaceId:'project',title:'连接恢复',updatedAt:1}],workspaces:()=>[{id:'project',name:'Project'}],create:async()=>{throw Error()},messages:()=>[],send:()=>{},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false},()=>service.syncRoutes(),()=>['project'])
  const online=async()=>{for(let i=0;i<150;i++){if(service.snapshot().phase==='online')return;await new Promise(r=>setTimeout(r,60))}throw Error('host not ready: '+JSON.stringify(service.snapshot()))}
  service.start(host,state);await online()
  const device=createHostedDevice(state,['project']);await service.waitForRoutes()
  const bootstrap=structuredClone(device.pairing),phone={...bootstrap,key:randomBytes(32).toString('hex'),token:randomBytes(32).toString('hex')};let seq=0
  const request=async(identity:typeof phone,method:string,params:object,id=randomUUID())=>{const packet=sealRemote(identity,'to-host',++seq,{id,sentAt:Date.now(),method,...params});const r=await fetch(new URL('exchange',base),{method:'POST',headers:{authorization:'Bearer '+identity.token,'content-type':'application/json'},body:JSON.stringify({hostId:identity.hostId,deviceId:identity.deviceId,packet})});assert(r.ok,'exchange failed '+r.status);const result=await r.json()as {packet:unknown};return openRemote(phone,'to-device',0,result.packet).value as {ok:boolean;data?:unknown}}
  const pairId=randomUUID(),values={deviceKey:phone.key,deviceToken:phone.token}
  assert((await request(bootstrap,'pair',values,pairId)).ok,'first pair failed')
  assert((await request(bootstrap,'pair',values,pairId)).ok,'lost first reply cannot retry bootstrap')
  assert((await request(phone,'sessions',{})).ok,'first synchronized session request failed')
  service.retry();await online();await service.waitForRoutes()
  assert((await request(phone,'sessions',{})).ok&&device.paired,'reconnect invalidated phone pairing')
  console.log('HOSTED actual desktop service + Go WS route acknowledgment + immediate encrypted pair PASS')
  console.log('RECOVERY lost first reply, same request identity, desktop reconnect retains phone authorization PASS')
 }finally{service.stop();fixture.kill('SIGTERM')}
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)})
