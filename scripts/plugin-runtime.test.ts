import {test,expect} from 'bun:test'
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,statSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {stagePluginFiles,materializePlugin,validPluginPath} from '../apps/electron/src/main/lib/plugin-host/packages'
import {desktopThemeOptionsAtom,desktopPluginStateAtom} from '../apps/electron/src/renderer/atoms/desktop-themes'
import {createStore} from 'jotai'
import {DesktopPluginSchema,pluginDigest} from '../apps/electron/src/main/lib/desktop-extension-config'
import {completePalette} from '../packages/shared/src/utils/theme-palette'
const isolated=(work:(root:string)=>void)=>{const root=mkdtempSync(join(tmpdir(),'tervell-plugin-test-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root;try{work(root)}finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}}
test('Given 插件原包含index.json和二进制 When 暂存再安装 Then 文件保真且索引不覆盖原包',()=>isolated(root=>{
 const files=new Map([['paseo-plugin.json',Buffer.from('{"id":"sample"}')],['index.server.ts',Buffer.from('export default()=>{}')],['index.json',Buffer.from('{"own":true}')],['assets/a.png',Buffer.from([0,255,1,2])]])
 const runtime=stagePluginFiles(files,'paseo'),directory=materializePlugin(runtime,'sample');expect(readFileSync(join(directory,'source/index.json'),'utf8')).toBe('{"own":true}');expect(readFileSync(join(directory,'source/assets/a.png'))).toEqual(Buffer.from([0,255,1,2]));expect(runtime.serverEntry).toBe('index.server.ts')
 writeFileSync(join(root,'config/plugin-packages',runtime.bundleId,'files/index.server.ts'),Buffer.from('tampered').toString('base64'));expect(()=>materializePlugin(runtime,'sample')).toThrow('原包已变化')
}))
test('Given 恶意入口和文件路径 When 安装 Then 预览和落盘均拒绝越界',()=>isolated(()=>{
 for(const path of ['/absolute','../outside','a/../../x','a\\x','a//b','./a','a/..'])expect(validPluginPath(path)).toBe(false)
 expect(()=>stagePluginFiles(new Map([['../bad',Buffer.from('x')]]),'paseo')).toThrow('路径')
 expect(()=>materializePlugin({ecosystem:'paseo',bundleId:'../bad'},'sample')).toThrow('校验')
 const runtime=stagePluginFiles(new Map([['index.server.ts',Buffer.from('export default()=>{}')]]),'paseo');expect(()=>materializePlugin({...runtime,serverEntry:'../x'},'sample')).toThrow('入口')
}))
test('Given 已安装但停用的社区外观 When 枚举 Then 保留选择项可重新启用',()=>{
 const store=createStore();store.set(desktopPluginStateAtom,{catalog:[],installed:[{manifest:{id:'sample',name:'Sample',description:'主题测试',version:'1.0.0',capabilities:['theme'],themes:[{id:'night',name:'夜色',format:'paseo',appearance:'dark',colors:completePalette({background:'#111111',foreground:'#eeeeee',accent:'#aabbcc'}),warnings:[]}]},enabled:false,source:'fixture',digest:'a'.repeat(64),installedAt:1}]});const options=store.get(desktopThemeOptionsAtom);expect(options).toHaveLength(1);expect(options[0]?.enabled).toBe(false);expect(options[0]?.pluginId).toBe('sample')
})

test('Given 插件随包可执行准备文件 When 暂存和物化 Then 执行位参与摘要且恢复权限',()=>isolated(()=>{
 const files=new Map([['paseo-plugin.json',Buffer.from('{"id":"sample"}')],['index.server.ts',Buffer.from('export default()=>{}')],['scripts/prepare',Buffer.from('#!/bin/sh\nexit 0\n')]]) as import('../apps/electron/src/main/lib/plugin-host/packages').PluginPackageFiles;
 files.executablePaths=['scripts/prepare'];const runtime=stagePluginFiles(files,'paseo'),directory=materializePlugin(runtime,'sample');expect(statSync(join(directory,'source/scripts/prepare')).mode&0o111).not.toBe(0);
 files.executablePaths=[];expect(stagePluginFiles(files,'paseo').bundleId).not.toBe(runtime.bundleId);
}))

test('Given build生成入口的原包 When 预览和校验 Then 暂不要求入口且清单摘要稳定',()=>isolated(()=>{
 const files=new Map([['paseo-plugin.json',Buffer.from(JSON.stringify({id:'generated',requirements:{paseo:'>=0.14.0'},build:[['bun','prepare.ts']]}))],['prepare.ts',Buffer.from('export {}')]]);
 const runtime=stagePluginFiles(files,'paseo');expect(runtime.discoverEntriesAfterBuild).toBe(true);expect(runtime.serverEntry).toBeUndefined();
 const manifest={id:'generated',name:'Generated',version:'1.0.0',description:'生成入口测试',capabilities:['runtime' as const],runtime};
 expect(pluginDigest(DesktopPluginSchema.parse(manifest))).toBe(pluginDigest(manifest));
}))

test('Given 同一插件重装 When 原源码重新物化 Then 清除旧准备标记并保留插件设置',()=>isolated(()=>{
 const files=new Map([['paseo-plugin.json',Buffer.from('{"id":"sample"}')],['index.server.ts',Buffer.from('export default()=>{}')]]);
 const runtime=stagePluginFiles(files,'paseo'),directory=materializePlugin(runtime,'sample');
 mkdirSync(join(directory,'data'));writeFileSync(join(directory,'data/settings.json'),'saved');
 writeFileSync(join(directory,'preparation.json'),'old');writeFileSync(join(directory,'dependency-install.json'),'old');
 materializePlugin(runtime,'sample');
 expect(()=>readFileSync(join(directory,'preparation.json'))).toThrow();expect(()=>readFileSync(join(directory,'dependency-install.json'))).toThrow();
 expect(readFileSync(join(directory,'data/settings.json'),'utf8')).toBe('saved');
}))

import {previewDesktopPlugin,installDesktopPlugin,configureDesktopPlugin,readDesktopPluginEntries} from '../apps/electron/src/main/lib/desktop-extension-service'
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file'
test('Given 显式全宿主授权 When 新项目加入 Then 自动涵盖新项目且旧项目授权不被扩大',()=>isolated(root=>{
 const source=join(root,'fixture');mkdirSync(source);writeFileSync(join(source,'paseo-plugin.json'),JSON.stringify({id:'scope-fixture',requirements:{paseo:'>=0.14.0'}}));writeFileSync(join(source,'index.server.ts'),'export default()=>()=>{}');
 const offer=previewDesktopPlugin(source);installDesktopPlugin(offer);configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:false,runtime:'trusted',allWorkspaces:true}});
 const save=(ids:string[])=>writeJsonFileAtomic(join(root,'config/agent-workspaces.json'),{version:2,workspaces:ids.map(id=>({id,name:id,slug:id,createdAt:1,updatedAt:1}))});
 save(['a']);expect(readDesktopPluginEntries()[0]?.access?.workspaceIds).toEqual(['a']);save(['a','b']);expect(readDesktopPluginEntries()[0]?.access?.workspaceIds).toEqual(['a','b']);
 configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:false,runtime:'restricted'}});expect(readDesktopPluginEntries()[0]?.access?.workspaceIds).toEqual(['a']);
 expect(()=>configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:false,runtime:'restricted',allWorkspaces:true}})).toThrow('受信任');
}))
