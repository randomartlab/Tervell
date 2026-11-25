import {test,expect} from 'bun:test'
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {syncRuntimeDeps} from '../apps/electron/scripts/sync-runtime-deps'
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file'
test('Given 显式运行依赖与传递依赖版本不同 When 同步安装包 Then 顶层固定版本且父包保留自己的版本',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-package-deps-')),source=join(root,'source/node_modules'),target=join(root,'target/node_modules')
 const pkg=(path:string,value:object)=>{mkdirSync(path,{recursive:true});writeJsonFileAtomic(join(path,'package.json'),value)}
 try{pkg(join(source,'compiler'),{name:'compiler',version:'1.0.0'});pkg(join(source,'engine'),{name:'engine',version:'1.0.0',dependencies:{compiler:'2.0.0'}});pkg(join(source,'engine/node_modules/compiler'),{name:'compiler',version:'2.0.0'});syncRuntimeDeps({sourceNodeModules:source,targetNodeModules:target,externalRuntimePackages:['engine','compiler']});expect(JSON.parse(readFileSync(join(target,'compiler/package.json'),'utf8')).version).toBe('1.0.0');expect(JSON.parse(readFileSync(join(target,'engine/node_modules/compiler/package.json'),'utf8')).version).toBe('2.0.0')}finally{rmSync(root,{recursive:true,force:true})}
})
