import {test,expect} from 'bun:test'
import {readFileSync,existsSync} from 'node:fs'
import {gatewayIcon} from '../apps/electron/src/main/lib/model-routing-service'
import {gatewayPresets,gatewayProviders,gatewayRoutingModels} from '../apps/electron/src/main/lib/model-gateway-adapter'
import {providerPresetGroup,providerPresetMatches,existingPresetProvider,providerHost} from '../packages/shared/src/utils/gateway-provider-picker'
import type {GatewayPreset} from '../packages/shared/src/types/model-gateway'
const preset:GatewayPreset={id:'deepseek',name:'DeepSeek',icon:'deepseek-color',kind:'vendor',chat:'https://api.deepseek.com/v1',responses:'',anthropic:'',noKey:false}
test('Given 原始供应商预设 When 读取选择目录 Then 保留品牌图标分类地区与默认模型而不返回密钥',()=>{
 const [item]=gatewayPresets({presets:[{...preset,note:'厂商 API',website:'https://deepseek.com',keysUrl:'https://platform.deepseek.com',models:['model-a'],regions:[{id:'global',name:'Global',chat:'https://api.example.com/v1',models:['model-b']}],key:'must-not-leak'}]})
 expect(item?.icon).toBe('deepseek-color');expect(item?.kind).toBe('vendor');expect(item?.regions?.[0]?.models).toEqual(['model-b']);expect(item?.models).toEqual(['model-a']);expect(JSON.stringify(item)).not.toContain('must-not-leak')
 const [provider]=gatewayProviders({providers:[{id:'custom-id',name:'My Provider',preset:'deepseek',icon:'deepseek-color',key:{set:true,masked:'masked'},models:[]}]})
 expect(existingPresetProvider(preset,[provider!])?.id).toBe('custom-id')
 expect(gatewayRoutingModels([{id:'custom-id/m'}],{providers:[{id:'custom-id',name:'My Provider',icon:'deepseek-color'}]})[0]).toMatchObject({icon:'deepseek-color',providerName:'My Provider'})
})
test('Given 品牌/域名搜索与供应商类别 When 筛选 Then 大小写不敏感且本机/中转保持各自分类',()=>{
 expect(providerPresetMatches(preset,'deepSEEK')).toBe(true);expect(providerPresetMatches(preset,'api.deepseek.com')).toBe(true);expect(providerPresetMatches(preset,'missing-provider')).toBe(false)
 expect(providerPresetGroup(preset)).toBe('vendor');expect(providerPresetGroup({...preset,kind:'partner'})).toBe('relay');expect(providerPresetGroup({...preset,kind:'local'})).toBe('local');expect(providerPresetGroup({...preset,kind:'remote'})).toBe('remote')
 expect(providerHost({chat:'https://api.example.com/v1?secret=redacted'})).toBe('api.example.com')
})
test('Given 随包品牌资源 When 核对常见厂商与磁盘文件 Then 使用原始资源且不依赖在线favicon',()=>{
 const root=new URL('../apps/electron/src/renderer/assets/gateway-providers/',import.meta.url)
 const sources=JSON.parse(readFileSync(new URL('sources.json',root),'utf8')) as {assets:Array<{file:string;url:string}>}
 expect(sources.assets.length).toBeGreaterThan(100)
 for(const icon of ['openai.svg','claude-color.svg','deepseek-color.svg','gemini-color.svg','kimi.svg','zhipu-color.svg','xai.svg','openrouter.svg','ollama.svg'])expect(existsSync(new URL(icon,root))).toBe(true)
 for(const item of sources.assets)expect(existsSync(new URL(item.file,root))).toBe(true)
})

test('Given 缓存Logo标识 When 请求图片 Then 非缓存标识不启动网关或读取任意路径',async()=>{
 expect(await gatewayIcon('https://example.com/icon.svg')).toBeUndefined()
 expect(await gatewayIcon('file:../../private-key.png')).toBeUndefined()
 expect(await gatewayIcon('file:/Users/name/secrets.png')).toBeUndefined()
})
