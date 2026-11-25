import {test,expect} from 'bun:test'
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {saveModelRouting,modelRoutingConfig,prepareRoutedKernel,modelRoutingState,routedAgentModelSelection} from '../apps/electron/src/main/lib/model-routing-service'
test('Given 隔离配置 When 保存路由/停用 Then 不触碰原CLI且严格校验重复例外',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-routing-test-')),old=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{
  mkdirSync(join(root,'config'),{recursive:true});expect(modelRoutingConfig().enabled).toBe(false)
  expect(()=>saveModelRouting({version:1,enabled:true,defaultModel:'',rules:[]})).toThrow('全局覆盖模型')
  expect(()=>saveModelRouting({version:1,enabled:false,defaultModel:'a/b',rules:[{kernelId:'codex',mode:'native'},{kernelId:'codex',mode:'override'}]})).toThrow('一条例外')
  const config={version:1 as const,enabled:false,defaultModel:'vendor/model',rules:[]};saveModelRouting(config)
  expect(modelRoutingConfig()).toEqual(config);const base={HOME:'/original',PATH:'/bin'};expect((await prepareRoutedKernel('codex',base)).env).toBe(base)
  const disk=readFileSync(join(root,'config/model-routing.json'),'utf8');expect(disk).not.toContain('apiKey');expect(modelRoutingState().support.find(s=>s.kernelId==='kiro')?.method).toBe('unavailable')
 }finally{if(old===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=old;rmSync(root,{recursive:true,force:true})}
})
test('Given 没有旧渠道且全局覆盖关闭 When 保存 Pi 单独覆盖 Then 提供路由模型并拒绝空覆盖',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-pi-override-')),old=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{
  mkdirSync(join(root,'config'),{recursive:true})
  const config={version:1 as const,enabled:false,defaultModel:'',rules:[{kernelId:'pi',mode:'override' as const,model:'fixture/glm-5.3'}]}
  saveModelRouting(config)
  expect(routedAgentModelSelection()).toMatchObject({channelId:'tervell-routing',models:[{id:'fixture/glm-5.3',name:'fixture/glm-5.3'}]})
  for(const model of [undefined,'','  '])expect(()=>saveModelRouting({...config,rules:[{kernelId:'pi',mode:'override',model}]})).toThrow('单独覆盖模型')
  expect(modelRoutingConfig()).toEqual(config)
  saveModelRouting({...config,rules:[{kernelId:'pi',mode:'native'}]})
  expect(routedAgentModelSelection()).toBeUndefined()
 }finally{if(old===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=old;rmSync(root,{recursive:true,force:true})}
})
