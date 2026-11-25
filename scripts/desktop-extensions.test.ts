import {expect,test} from 'bun:test'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {DesktopKernelConfigSchema,DesktopKernelSelectionSchema,DesktopPluginSchema,pluginDigest,BUILTIN_PLUGIN_CATALOG} from '../apps/electron/src/main/lib/desktop-extension-config.ts'
import {desktopKernelState,saveDesktopKernel,setDesktopDefaultKernel,resolveDesktopCommand,probeDesktopKernel,desktopPluginState,installDesktopPlugin,toggleDesktopPlugin,removeDesktopPlugin,previewDesktopPlugin} from '../apps/electron/src/main/lib/desktop-extension-service.ts'

test('Given 本机内核与插件清单 When 校验 Then 拒绝越界能力、脚本字段和重复标识',()=>{
 expect(()=>DesktopKernelSelectionSchema.parse({kernelId:'pi',unknown:'ignored'})).toThrow()
 expect(()=>DesktopKernelConfigSchema.parse({id:'../bad',name:'x',command:'cmd',args:[],enabled:false})).toThrow()
 expect(()=>DesktopPluginSchema.parse({...BUILTIN_PLUGIN_CATALOG[0],host:'arbitrary.js'})).toThrow()
 expect(()=>DesktopPluginSchema.parse({...BUILTIN_PLUGIN_CATALOG[0],capabilities:[]})).toThrow()
 expect(()=>DesktopPluginSchema.parse({...BUILTIN_PLUGIN_CATALOG[1],theme:{'--unknown':'#ffffff'}})).toThrow()
 expect(()=>DesktopPluginSchema.parse({...BUILTIN_PLUGIN_CATALOG[1],theme:{'--primary':'url(https://evil)'}})).toThrow()
})

test('Given 隔离配置 When 添加CLI并探测/安装停用插件 Then 持久化且实际握手关闭进程',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-extension-test-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{
  const fixture=join(import.meta.dir,'../packages/kernel-host/src/acp/test-fixtures/server.ts')
  saveDesktopKernel({id:'alpha-acp',name:'本地测试ACP',command:process.execPath,args:[fixture],enabled:true})
  setDesktopDefaultKernel('alpha-acp');expect(desktopKernelState().defaultKernelId).toBe('alpha-acp')
  expect(desktopKernelState().entries.find(e=>e.id==='alpha-acp')?.available).toBe(true)
  const catalog=await probeDesktopKernel('alpha-acp',root);expect(catalog.models).toEqual([])
  const offer=desktopPluginState().catalog[0]!
  installDesktopPlugin(offer);expect(desktopPluginState().installed[0]?.enabled).toBe(false)
  toggleDesktopPlugin(offer.manifest.id,true);expect(desktopPluginState().installed[0]?.enabled).toBe(true)
  toggleDesktopPlugin(offer.manifest.id,false);expect(desktopPluginState().installed[0]?.enabled).toBe(false)
  removeDesktopPlugin(offer.manifest.id);expect(desktopPluginState().installed.filter(p=>p.source!=='Tervell 内置功能')).toEqual([]);expect(desktopPluginState().installed.filter(p=>p.source==='Tervell 内置功能').every(p=>p.enabled)).toBe(true)
  const source=join(root,'plugin');mkdirSync(source);writeFileSync(join(source,'tervell-plugin.json'),JSON.stringify(offer.manifest));const preview=previewDesktopPlugin(source)
  writeFileSync(join(source,'tervell-plugin.json'),JSON.stringify({...offer.manifest,version:'2.0.0'}));expect(()=>installDesktopPlugin(preview)).toThrow('来源已修改')
  expect(()=>installDesktopPlugin({...offer,digest:'bad'})).toThrow('内容已变更')
  const kernelPlugin=DesktopPluginSchema.parse({id:'test-kernel',name:'内核配置插件',version:'1.0.0',description:'测试',capabilities:['kernels'],kernels:[{id:'plugin-acp',name:'插件CLI',command:process.execPath,args:[fixture],enabled:true}]})
  const pluginPath=join(root,'kernel.json');writeFileSync(pluginPath,JSON.stringify(kernelPlugin));installDesktopPlugin({manifest:kernelPlugin,digest:pluginDigest(kernelPlugin),source:pluginPath});toggleDesktopPlugin('test-kernel',true)
  expect(desktopKernelState().entries.find(e=>e.id==='plugin-acp')?.pluginId).toBe('test-kernel')
  toggleDesktopPlugin('test-kernel',false);expect(desktopKernelState().entries.some(e=>e.id==='plugin-acp')).toBe(false)
  expect(resolveDesktopCommand(root)).toBeUndefined()
  expect(()=>installDesktopPlugin({manifest:kernelPlugin,digest:pluginDigest(kernelPlugin),source:pluginPath})).toThrow('同名')
  const configPath=join(root,'config/desktop-extensions.json');const good=readFileSync(configPath,'utf8')
  writeFileSync(configPath,JSON.stringify({version:1,kernels:'broken'}));expect(()=>desktopKernelState()).toThrow('结构无效');expect(readFileSync(configPath,'utf8')).toContain('broken')
  const tampered=JSON.parse(good);tampered.plugins[0].manifest.description='unconfirmed edit';writeFileSync(configPath,JSON.stringify(tampered));expect(()=>desktopPluginState()).toThrow('校验值不符')
 }finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}
})
