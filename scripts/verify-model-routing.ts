import {mkdtempSync,mkdirSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file'
import {saveModelRouting,startModelRouting,prepareRoutedKernel,routedPiModel,stopModelRouting} from '../apps/electron/src/main/lib/model-routing-service'
import {MAGPIE_AGENT_ADAPTERS} from '../packages/auth-bridge/src/agent-routing'

/** 用真实网关与回环供应商验证转换/接线；不调用真实模型，不读取日常Magpie配置。 */
const root=mkdtempSync(join(tmpdir(),'tervell-gateway-verify-')),previous=process.env.TERVELL_PROFILE_DIR
process.env.TERVELL_PROFILE_DIR=root
let calls=0
const upstream=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){
 if(request.method==='GET')return Response.json({data:[{id:'fixture-model',supported_reasoning_levels:['low','high','max','ultra'].map(effort=>({effort}))}]})
 const body=await request.json() as {stream?:boolean;model?:string};calls++
 if(body.model!=='fixture-model')return Response.json({error:{message:'wrong upstream model'}},{status:400})
 const chunk=(content:string,done=false)=>({id:'chatcmpl-fixture',object:'chat.completion.chunk',created:1,model:'fixture-model',choices:[{index:0,delta:done?{}:{role:'assistant',content},finish_reason:done?'stop':null}],...(done?{usage:{prompt_tokens:4,completion_tokens:2,total_tokens:6}}:{})})
 if(body.stream)return new Response(`data: ${JSON.stringify(chunk('routing-ok'))}\n\ndata: ${JSON.stringify(chunk('',true))}\n\ndata: [DONE]\n\n`,{headers:{'content-type':'text/event-stream'}})
 return Response.json({id:'chatcmpl-fixture',object:'chat.completion',created:1,model:'fixture-model',choices:[{index:0,message:{role:'assistant',content:'routing-ok'},finish_reason:'stop'}],usage:{prompt_tokens:4,completion_tokens:2,total_tokens:6}})
}})
const wired:string[]=[],failures:Array<{id:string;error:string}>=[]
try{
 const directory=join(root,'config/model-routing/config/magpie');mkdirSync(directory,{recursive:true})
 writeJsonFileAtomic(join(directory,'providers.json'),{providers:[{id:'fixture',name:'Fixture',key:'{{SECRET_o4ket5zo}}',chat:`http://127.0.0.1:${upstream.port}/v1`,models:['fixture-model'],modelPrefs:{'fixture-model':{efforts:['low','high','max','ultra']}}}]})
 saveModelRouting({version:1,enabled:true,defaultModel:'fixture/fixture-model',rules:[]})
 await startModelRouting(process.env.PATH??'');const {gatewayCommand}=await import('../apps/electron/src/main/lib/model-gateway-management');await gatewayCommand({kind:'provider.refresh',id:'fixture'});const route=(await routedPiModel())!
 for(const api of ['responses','messages','chat/completions']){
  const input=api==='responses'?{input:'hello'}:{messages:[{role:'user',content:'hello'}],max_tokens:256}
  const response=await fetch(`${route.baseUrl.replace(/\/v1$/,'')}/v1/${api}`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${route.apiKey}`},body:JSON.stringify({model:route.model,...input,stream:false}),signal:AbortSignal.timeout(15000)})
  const text=await response.text();if(!response.ok||!text.includes('routing-ok'))throw new Error(`${api} 转换失败：${response.status} ${text.slice(0,200)}`)
 }
 for(const id of Object.keys(MAGPIE_AGENT_ADAPTERS)){
  saveModelRouting({version:1,enabled:false,defaultModel:'',rules:[{kernelId:id,mode:'override',model:'fixture/fixture-model'}]})
  try{const prepared=await prepareRoutedKernel(id,{PATH:process.env.PATH??''},'verify-'+id,{model:'fixture/fixture-model',effort:'high'});if(!prepared.env.HOME?.startsWith(root))throw new Error('配置空间未隔离');if(prepared.env.MAGPIE_WEB_KEY)throw new Error('控制台凭据进入Agent环境');wired.push(id)}catch(error){failures.push({id,error:error instanceof Error?error.message:String(error)})}
 }
 console.log(JSON.stringify({gateway:'0.1.4596',protocols:['responses','messages','chat/completions'],upstreamCalls:calls,configurationAdapters:wired,failures,realProviderRequests:0},null,2))
 if(failures.length)process.exitCode=1
}finally{stopModelRouting();upstream.stop(true);if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}
