import {spawn} from 'node:child_process'
import {mkdtempSync,mkdirSync,rmSync,existsSync,readFileSync,realpathSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {createServer} from 'node:net'
import {randomBytes} from 'node:crypto'
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file'
import {extensionQuery,extensionCommand} from '../apps/electron/src/main/lib/gateway-extension-api'
import {gatewaySubscriptions,gatewayPluginEntries} from '../apps/electron/src/main/lib/gateway-extension-adapter'
/** 独立临时 HOME 的真实随包网关，仅加载本文件生成的无依赖插件。所有账号、授权页与返回值为合成数据。 */
const root=mkdtempSync(join(tmpdir(),'tervell-plugin-loopback-')),config=join(root,'config'),cache=join(root,'cache'),home=join(root,'home'),fixture=join(root,'fixture')
for(const dir of [config,cache,home,fixture,join(config,'magpie')])mkdirSync(dir,{recursive:true,mode:0o700})
const port=async()=>await new Promise<number>((accept,reject)=>{const server=createServer();server.listen(0,'127.0.0.1',()=>{const address=server.address();server.close(()=>address&&typeof address==='object'?accept(address.port):reject(new Error('端口失败')))})})
const gatewayPort=await port(),webPort=await port(),token=randomBytes(24).toString('hex')
const settings=join(config,'magpie/settings.json')
writeJsonFileAtomic(settings,{noAutoUpdate:true,noAutoDownload:true,noAccountDiscovery:false,agentTelemetryOff:true,gatewayMode:'on',pluginOptions:{'fixture-vendor':{free:false}}})
const plugin=`export const Fixture = async ({client})=>({
config:async(cfg)=>{cfg.provider??={};cfg.provider['fixture-vendor']={name:'合成订阅供应商',npm:'@ai-sdk/openai-compatible',api:'http://127.0.0.1:1/v1',models:{'fixture-model':{name:'Synthetic Model',limit:{context:12000,output:2000}}}}},
auth:{provider:'fixture-vendor',methods:[{type:'api',label:'密钥登录'},{type:'oauth',label:'浏览器登录',prompts:[{type:'select',key:'region',message:'选择区域',options:[{label:'本机测试',value:'local'},{label:'企业',value:'team'}]},{type:'text',key:'tenant',message:'租户名称',when:{key:'region',op:'eq',value:'team'},validate:v=>v.length>=3?undefined:'租户至少三个字符'}],authorize:async(inputs)=>({url:'https://fixture.invalid/authorize',instructions:'合成授权，请输入 fixture-code',method:'code',callback:async(code)=>code==='fixture-code'?{type:'success',access:'synthetic-access',refresh:'synthetic-refresh',expires:Date.now()+3600000,accountId:(inputs.tenant||'local')+'@fixture.invalid'}:{type:'failed',error:'合成授权被拒绝'}})}],loader:async()=>({apiKey:'synthetic',baseURL:'http://127.0.0.1:1/v1'})}})
`
writeTextFileAtomic(join(fixture,'index.js'),plugin)
writeJsonFileAtomic(join(fixture,'package.json'),{name:'tervell-synthetic-login',version:'1.0.0',type:'module',main:'index.js',magpie:{name:'合成授权插件',icon:'openai',options:{sample:'default'}}})
const binary=resolve('apps/electron/resources/model-gateway/magpie'),bun=realpathSync(process.execPath)
if(!existsSync(binary))throw new Error('缺少已准备的模型组件')
const child=spawn(binary,['web','--gateway','--no-open','--addr',`127.0.0.1:${webPort}`],{env:{PATH:process.env.PATH??'',HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:config,XDG_CACHE_HOME:cache,XDG_DATA_HOME:join(home,'.local/share'),XDG_STATE_HOME:join(home,'.local/state'),MAGPIE_ADDR:`127.0.0.1:${gatewayPort}`,MAGPIE_WEB_KEY:token,MAGPIE_BUN:bun,MAGPIE_NO_ACCOUNTS:'0',MAGPIE_NO_INSTALL:'1',MAGPIE_NO_HANDOVER:'1',MAGPIE_PLUGIN_MARKET:'off',DO_NOT_TRACK:'1'},stdio:'ignore'})
const assert=(ok:unknown,message:string)=>{if(!ok)throw new Error(message)}
async function request(path:string,body?:unknown):Promise<unknown>{const response=await fetch(`http://127.0.0.1:${webPort}${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',cookie:`magpie_web_${webPort}=${token}`,origin:`http://127.0.0.1:${webPort}`},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`合成网关 ${path}: ${response.status} ${await response.text()}`);const text=await response.text();return text?JSON.parse(text):null}
const deps={request,isolated:false}
try{
 for(let i=0;i<100;i++){try{await request('/api/providers');break}catch{if(i===99)throw new Error('合成网关启动失败');await new Promise(r=>setTimeout(r,100))}}
 await request('/api/plugins/add',{spec:fixture})
 let subs=gatewaySubscriptions(await request('/api/providers'));for(let i=0;i<30&&!subs.find(s=>s.providerId==='fixture-vendor');i++){await new Promise(r=>setTimeout(r,100));subs=gatewaySubscriptions(await request('/api/providers'))}
 const sub=subs.find(s=>s.providerId==='fixture-vendor');assert(sub?.methods.length===2,'动态登录方式未出现')
 const first=await extensionQuery({kind:'signin.prompt',provider:'fixture-vendor',method:1,inputs:{}},deps);assert(first.prompt?.type==='select','未询问区域')
 const second=await extensionQuery({kind:'signin.prompt',provider:'fixture-vendor',method:1,inputs:{},key:'region',value:'team'},deps);assert(second.prompt?.key==='tenant','未询问租户')
 const bad=await extensionQuery({kind:'signin.prompt',provider:'fixture-vendor',method:1,inputs:second.inputs!,key:'tenant',value:'x'},deps);assert(!!bad.error,'插件校验未执行')
 const ready=await extensionQuery({kind:'signin.prompt',provider:'fixture-vendor',method:1,inputs:second.inputs!,key:'tenant',value:'test-team'},deps);assert(!ready.prompt,'提问未结束')
 const flow=await extensionCommand({kind:'signin.plugin',provider:'fixture-vendor',method:1,inputs:ready.inputs!},deps);assert(flow?.signIn?.pasteCode,'没有返回粘贴授权码能力')
 await extensionCommand({kind:'signin.callback',id:flow!.signIn!.id,url:'fixture-code'},deps)
 let result=await extensionCommand({kind:'signin.poll',id:flow!.signIn!.id},deps);for(let i=0;i<40&&result?.signIn?.state==='waiting';i++){await new Promise(r=>setTimeout(r,100));result=await extensionCommand({kind:'signin.poll',id:flow!.signIn!.id},deps)}assert(result?.signIn?.state==='done','合成 OAuth 未完成')
 await extensionCommand({kind:'signin.plugin',provider:'fixture-vendor',method:0,inputs:{},key:'synthetic-api-key'},deps)
 let entries=gatewayPluginEntries(await request('/api/plugins'));assert(entries.some(p=>p.name==='合成授权插件'),'插件安装后未出现')
 await extensionCommand({kind:'plugin.options',spec:fixture,options:{sample:'edited'}},deps)
 await request('/api/plugins/off',{spec:fixture,off:true});entries=gatewayPluginEntries(await request('/api/plugins'));assert(entries.find(p=>p.spec===fixture)?.enabled===false,'停用插件失败')
 await request('/api/plugins/off',{spec:fixture,off:false})
 await request('/api/plugins/remove',{spec:fixture});assert(!gatewayPluginEntries(await request('/api/plugins')).some(p=>p.spec===fixture),'移除插件失败')
 console.log(JSON.stringify({gatewayVersion:'0.1.4596',checks:['local-plugin-install','dynamic-methods','conditional-prompts','validation-error','oauth-code-callback','oauth-completion','api-auth-method','plugin-options','disable-enable','remove'],realAccountLogins:0,realModelRequests:0,dependencyInstalls:0},null,2))
}finally{child.kill('SIGTERM');await new Promise<void>(r=>{if(child.exitCode!==null){r();return}const timer=setTimeout(()=>{child.kill('SIGKILL');r()},1500);child.once('exit',()=>{clearTimeout(timer);r()})});rmSync(root,{recursive:true,force:true})}
