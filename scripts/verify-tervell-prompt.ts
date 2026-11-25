import {app} from 'electron'
import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file'
import {BUILTIN_DEFAULT_PROMPT_STRING} from '../packages/shared/src/types/system-prompt'
const root=mkdtempSync(join(tmpdir(),'tervell-prompt-migration-'));process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'))
async function run(){try{
 const config=join(root,'config');mkdirSync(config,{recursive:true});const file=join(config,'system-prompts.json')
 const custom={id:'custom-user',name:'我的提示词',content:'用户自行编辑的内容必须保留',isBuiltin:false,createdAt:11,updatedAt:22}
 writeJsonFileAtomic(file,{prompts:[{id:'builtin-default',name:'Proma 内置提示词',content:'旧内容',isBuiltin:true,createdAt:0,updatedAt:0},custom],defaultPromptId:custom.id,appendDateTimeAndUserName:false})
 const manager=await import('../apps/electron/src/main/lib/system-prompt-manager'),loaded=manager.getSystemPromptConfig()
 if(loaded.defaultPromptId!==custom.id||loaded.appendDateTimeAndUserName!==false||JSON.stringify(loaded.prompts.find(p=>p.id===custom.id))!==JSON.stringify(custom))throw Error('升级覆盖用户数据')
 if(loaded.prompts[0]?.name!=='Tervell 内置提示词'||loaded.prompts[0]?.content!==BUILTIN_DEFAULT_PROMPT_STRING)throw Error('内置提示词未更新')
 manager.updateSystemPrompt(custom.id,{name:'仍由用户控制'});const persisted=JSON.parse(readFileSync(file,'utf8'));if(persisted.prompts.find((p:{id:string})=>p.id===custom.id).content!==custom.content||persisted.defaultPromptId!==custom.id)throw Error('保存丢失内容或默认选择')
 console.log('PASS migration retained custom prompt, default selection and date preference; builtin name/body updated; atomic persistence verified');app.exit(0)
}catch(error){console.error(error);app.exit(1)}}
if(app.isReady())void run();else app.once('ready',()=>void run())
