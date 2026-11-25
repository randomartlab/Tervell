import { createHash } from 'node:crypto'
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** 内置组件固定版本与摘要；仅复用已校验补丁产物；不回退原版、不访问用户配置。 */
export const MODEL_GATEWAY_RELEASE={version:'0.1.4596-tervell.1',repository:'https://github.com/yetone/magpie',sourceCommit:'f65fe92ef93557e9a2098d2606a4d9c0175a4213',sha256:{arm64:'f91fa6779c933a796cebf307e7b9ad73acde8cbbe1be2bce16db589bc57d23a3',x64:'46ac391bf96d104a7773fc5086a49f4ac4541a4259cfe112c0f192e8099fd576','win32-x64':'f340031bd0e79bd051b59fb9d88398da224b3f4c9c089516bc2af37b1f8d5db2'}} as const
export async function prepareModelGateway():Promise<void> {
 const arch=process.env.PROMA_BUILD_ARCH??process.arch
 const platform=process.env.PROMA_BUILD_PLATFORM??process.platform
 if(platform==='win32'&&arch==='x64'){
  const target=resolve(import.meta.dir,'../resources/model-gateway/magpie.exe'),vendor=resolve(import.meta.dir,'../../../vendor/model-gateway/win32-x64/magpie.exe')
  const source=[process.env.TERVELL_MAGPIE_BIN,vendor,target].find((file):file is string=>!!file&&existsSync(file)&&createHash('sha256').update(readFileSync(file)).digest('hex')===MODEL_GATEWAY_RELEASE.sha256['win32-x64'])
  if(!source)throw new Error('缺少已校验的Windows模型网关组件')
  mkdirSync(resolve(target,'..'),{recursive:true});if(resolve(source)!==target)copyFileSync(source,target);return
 }
 if(platform!=='darwin'||arch!=='arm64'&&arch!=='x64')throw new Error('模型网关组件不支持该目标平台')
 const target=resolve(import.meta.dir,'../resources/model-gateway/magpie'),vendor=resolve(import.meta.dir,`../../../vendor/model-gateway/darwin-${arch}/magpie`)
 const source=[process.env.TERVELL_MAGPIE_BIN,vendor,target,'/Applications/magpie.app/Contents/MacOS/magpie'].find((file):file is string=>!!file&&existsSync(file)&&createHash('sha256').update(readFileSync(file)).digest('hex')===MODEL_GATEWAY_RELEASE.sha256[arch])
 if(!source){
  throw new Error(`缺少已校验的 Tervell 网关补丁组件 / ${arch}，请按 third-party/model-gateway-patches/build.json 重建，禁止退回会截断推理档位的原版组件`)
 }
 mkdirSync(resolve(target,'..'),{recursive:true});if(resolve(source)!==target)copyFileSync(source,target);chmodSync(target,0o755)
 console.log(`模型网关 ${MODEL_GATEWAY_RELEASE.version} / ${arch} 已核验并准备`)
}
if(import.meta.main)await prepareModelGateway()
