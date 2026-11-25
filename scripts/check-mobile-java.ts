import {parser} from '@lezer/java'
import {readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
/** 现有解析器的语法检查；不替代 javac/Android SDK 构建。 */
const roots=['apps/mobile/app/src/main/java/art/randomai/proma','apps/mobile/app/src/test/java/art/randomai/proma']
let errors=0
for(const root of roots)for(const file of readdirSync(root)){
 if(!file.endsWith('.java'))continue
 // lezer/java 未识别项目既有的包级 synchronized 方法修饰符；只屏蔽该词，保持位置。
 const source=readFileSync(join(root,file),'utf8').replace(/\bsynchronized(?=\s+(?:boolean|void|JSONObject))/g,'            ')
 const found:Array<{from:number;to:number}>=[]
 parser.parse(source).iterate({enter:node=>{if(node.type.isError)found.push({from:node.from,to:node.to})}})
 console.log(JSON.stringify({file,syntaxErrors:found}));errors+=found.length
}
console.log('仅 Java 语法解析；未编译、未生成 APK、未验证 Android UI。')
if(errors)process.exit(1)
