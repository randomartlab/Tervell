import{app}from'electron'
import{mkdtempSync}from'node:fs'
import{tmpdir}from'node:os'
import{join,resolve}from'node:path'
const root=mkdtempSync(join(tmpdir(),'tervell-gateway-lifetime-'));process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath(path:string):void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain')
const check=(v:unknown,m:string)=>{if(!v)throw Error(m)}
async function run(){
 const routing=await import('../apps/electron/src/main/lib/model-routing-service')
 const stopped=routing.startModelRouting(process.env.PATH??'').then(()=>false,()=>true);routing.stopModelRouting();check(await stopped,'启动被取消后仍报告成功');check(routing.modelRoutingState().phase==='stopped','取消启动污染状态')
 const ready=await routing.startModelRouting(process.env.PATH??'');check(ready.phase==='ready','取消后无法再次正常启动')
 const {gatewayRequest}=routing;const status=await gatewayRequest('/api/providers');check(!!status,'真实网关未响应')
 routing.stopModelRouting(true);check(routing.modelRoutingState().phase==='stopped','退出未停止');let rejected=false;try{await routing.startModelRouting(process.env.PATH??'')}catch{rejected=true}check(rejected,'应用退出后重新创建了网关')
 console.log(JSON.stringify({ok:true,cancelDuringStart:true,restartAfterCancel:true,permanentDispose:true,profile:root}));
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(e=>{console.error(e);app.exit(1)})
