import {test,expect}from'bun:test'
import {extractStaticThemes,parseThemeText,presetFromValue,colorHex}from'../apps/electron/src/main/lib/theme-static-reader'
import {parseMarketIndex,archiveTextFiles,marketBytes,desktopMarket}from'../apps/electron/src/main/lib/desktop-plugin-market'
import {completePalette,themeTokens,contrastRatio,readableColor}from'../packages/shared/src/utils/theme-palette'
import {DESKTOP_REFERENCE_CATALOG}from'../packages/kernel-host/src/desktop-catalog'
import {KernelRegistry}from'../packages/kernel-host/src/registry'
import {desktopKernelState,previewDesktopPlugin,installDesktopPlugin,toggleDesktopPlugin,selectDesktopTheme,removeDesktopPlugin}from'../apps/electron/src/main/lib/desktop-extension-service'
import {mkdtempSync,writeFileSync,rmSync}from'node:fs'
import {tmpdir}from'node:os'
import {join}from'node:path'
const palette={background:'#1e1e2e',foreground:'#cdd6f4',raised:'#313244',control:'#45475a',accent:'#cba6f7',border:'#45475a',mutedForeground:'#a6adc8',ring:'#6c7086'}
test('Given Paseo原生addTheme和相对导入 When 读取主题 Then 静态提取多个色板不执行脚本',()=>{
 const files=new Map([['index.client.ts',`import {themes} from './client/themes';export default function contribute(client:unknown){const cleanups=themes.map(t=>client.addTheme(t));fetch('https://should-not-run');return()=>{}}`],['client/themes.ts',`export const themes=[{id:'mocha',name:'Mocha',appearance:'dark',colors:${JSON.stringify(palette)}},{id:'second',name:'Second',appearance:'dark',colors:${JSON.stringify(palette)}}] as const`]])
 expect(extractStaticThemes(files).map(t=>t.id)).toEqual(['mocha','second'])
 expect(extractStaticThemes(new Map([['unsafe.ts',`client.addTheme(fetch('https://evil'));client.addTheme((()=>{throw Error('executed')})());`]]))).toEqual([])
})
test('Given Codex导入串 When 导入 Then surface/ink与diff语义完整映射到界面',()=>{
 const presets=parseThemeText('codex-theme-v1:'+JSON.stringify({codeThemeId:'nord',variant:'dark',theme:{surface:'#2e3440',ink:'#d8dee9',accent:'#88c0d0',semanticColors:{diffAdded:'#a3be8c',diffRemoved:'#bf616a'}}}),'Nord')
 expect(presets[0]?.format).toBe('codex');const tokens=themeTokens(presets[0]!);expect(tokens['--tervell-diff-added']).toBe('#a3be8c');expect(tokens['--content-area']).toBeDefined();expect(tokens['--dialog']).toBeDefined();expect(tokens['--sidebar-surface']).toBeDefined();expect(tokens['--input-surface']).toBeDefined();expect(tokens['--tervell-terminal-background']).toBe('#2e3440')
})
test('Given DSH种子/双模式色板/CSS变量 When 导入 Then 兼容数据且拒绝动态JS与URL颜色',()=>{
 expect(presetFromValue({id:'seed',name:{zh:'夜色'},appearance:'dark',seeds:{surface:'#201a40',text:'#e8e2ff',accent:'#9d8bff'}},'seed')[0]?.format).toBe('dsh')
 expect(presetFromValue({name:'Dual',palette:{lightBackground:'#ffffff',lightForeground:'#111111',lightAccent:'#3274ab',darkBackground:'#111111',darkForeground:'#eeeeee',darkAccent:'#99bbff'}},'Dual')).toHaveLength(2)
 const css=':root {--base:#123456;--dsw-alias-bg-layer-1:var(--base);--dsw-alias-label-primary:#ffffff;--dsw-alias-brand-primary:rgb(120, 190, 230);}';expect(parseThemeText(css,'sample.css')[0]?.colors.background).toBe('#123456')
 expect(parseThemeText(':root{--background:url(https://bad);--foreground:#fff}','bad.css')).toEqual([])
})
test('Given 低对比社区色板 When 应用 Then 前景/按钮/焦点可读且还原样式不靠绝对黑白背景',()=>{
 expect(contrastRatio(readableColor('#888888','#999999'),'#999999')).toBeGreaterThanOrEqual(4.5)
 const t=themeTokens({id:'test',name:'test',appearance:'dark',format:'paseo',colors:completePalette(palette),warnings:[]});expect(Object.keys(t).length).toBeGreaterThan(45);expect(t['--tervell-terminal-foreground']).toBe('#cdd6f4')
})
test('Given Paseo与Orca目录 When 默认枚举 Then 全部展示且终端条目不假称ACP',()=>{
 const registry=new KernelRegistry();for(const item of DESKTOP_REFERENCE_CATALOG)expect(registry.get(item.id)).toBeDefined();expect(DESKTOP_REFERENCE_CATALOG.filter(d=>d.sources.includes('Paseo')).length).toBe(40)
 const root=mkdtempSync(join(tmpdir(),'tervell-catalog-test-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{const state=desktopKernelState();for(const item of DESKTOP_REFERENCE_CATALOG.filter(d=>!['opencode2','kilocode','deepseek'].includes(d.id)))expect(state.entries.some(e=>e.id===item.id)).toBe(true);expect(state.entries.some(e=>e.id==='opencode2'||e.id==='kilocode')).toBe(false);expect(state.entries.find(e=>e.id==='aider')?.transport).toBe('pty');expect(state.entries.find(e=>e.id==='claude-agent-teams')?.hostRequirement).toContain('Orca');expect(state.entries.find(e=>e.id==='claude-agent-teams')?.available).toBe(false);expect(registry.get('gemini')?.acp?.args).toEqual(['--acp']);expect(registry.get('qwen')?.acp?.args).toContain('--acp')}finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}
})
test('Given 主题安装选择 When 停用或移除 Then 撤销生效选择并保留原主题恢复路径',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-theme-test-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{const file=join(root,'theme.json');writeFileSync(file,JSON.stringify({id:'sample',name:'Sample',appearance:'dark',colors:palette}));const offer=previewDesktopPlugin(file);expect(offer.manifest.themes).toHaveLength(1);installDesktopPlugin(offer);expect(()=>selectDesktopTheme(offer.manifest.id+'/sample')).toThrow();toggleDesktopPlugin(offer.manifest.id,true);expect(selectDesktopTheme(offer.manifest.id+'/sample').selectedThemeId).toContain('/sample');expect(toggleDesktopPlugin(offer.manifest.id,false).selectedThemeId).toBeNull();removeDesktopPlugin(offer.manifest.id)}finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}
})
test('Given 远程目录部分条目损坏 When 读取 Then 保留合法条目且不解释不认识的artifact',()=>{
 expect(parseMarketIndex({schemaVersion:1,plugins:[{id:'bad'},null]})).toEqual([])
 expect(()=>archiveTextFiles(Buffer.from('not-a-tar'))).toThrow()
})
test('Given 社区主题用文本表压缩固定配色 When 读取 Then 第一和最后一行不会丢失',()=>{
 const table="const TABLE = `first|First|dark|1A1A1A 262626 373737 505050 FFFFFF B9B9B9 8C8C8C D77757\nlast|Last|light|FAF9F5 F0EEE6 E8E4D7 DAD5C4 151412 64635D 737169 B54821`;"
 expect(extractStaticThemes(new Map([['themes.ts',table]])).map(t=>t.id)).toEqual(['first','last'])
})
test('Given DSH正式token主题与Codex源码JSON When 导入 Then 识别背景/侧栏/模式而不是只换强调色',()=>{
 const dsh=presetFromValue({format:'dsh-theme',version:1,id:'nord',name:'Nord',colorScheme:'dark',tokens:{'--dsw-alias-bg-base':'#2e3440','--dsw-alias-bg-layer-1':'#3b4252','--dsw-alias-label-primary':'#eceff4','--dsw-alias-brand-primary':'#88c0d0','--dsw-specific-sidebar-fill':'#272c36'}},'Nord')
 expect(dsh[0]?.colors.background).toBe('#2e3440');expect(dsh[0]?.colors.sidebar).toBe('#272c36');expect(dsh[0]?.format).toBe('dsh')
 const codex=presetFromValue({name:'Tokyo Night',mode:'light',codeThemeId:'tokyo-night',theme:{background:'#ffffff',foreground:'#111111',surface:'#eeeeee',accent:'#3466bb'}},'Tokyo')
 expect(codex[0]?.appearance).toBe('light');expect(codex[0]?.colors.background).toBe('#ffffff');expect(codex[0]?.colors.raised).toBe('#eeeeee')
})
test('Given DSH只读Object.freeze色板 When 静态提取 Then 不执行函数也能识别正式token契约',()=>{
 const source=`export const nord=Object.freeze({id:'nord',colorScheme:'dark',tokens:Object.freeze({'--dsw-alias-bg-base':'#2e3440','--dsw-alias-label-primary':'#eceff4','--dsw-alias-brand-primary':'#88c0d0'})});`
 expect(extractStaticThemes(new Map([['nord.ts',source]]))[0]?.colors.background).toBe('#2e3440')
})
test('Given Codex主题字体 When 导入 Then 保留安全字体但不加载远程CSS或脚本值',()=>{
 const [theme]=presetFromValue({name:'Font test',variant:'dark',theme:{surface:'#111111',ink:'#eeeeee',accent:'#aabbcc',fonts:{ui:'SF Pro Text',code:'SF Mono'}}},'font')
 expect(theme?.typography?.uiFont).toBe('SF Pro Text');expect(themeTokens(theme!)['--tervell-code-font']).toBe('SF Mono')
 const [unsafe]=presetFromValue({theme:{surface:'#111111',ink:'#eeeeee',fonts:{ui:'url(https://not-font)'}}},'font');expect(unsafe?.typography?.uiFont).toBeUndefined()
})

test('Given 透明主题颜色 When 映射到不透明宿主 Then 复合到实际背景而非错误变成白色边框',()=>{
 expect(colorHex('rgba(255, 255, 255, 0.1)','#000000')).toBe('#1a1a1a')
 expect(colorHex('#ffffff80','#000000')).toBe('#808080')
})
test('Given 注释JSON与循环引用CSS When 读取 Then JSONC可导入且循环有界不挂住',()=>{
 const source=`{ // comment\n "name":"JSONC", "type":"dark", "colors":{"editor.background":"#101010","editor.foreground":"#eeeeee","focusBorder":"#aabbcc",},}`
 expect(parseThemeText(source,'theme.jsonc')[0]?.format).toBe('vscode')
 expect(parseThemeText(':root{--background:var(--loop);--loop:var(--background);--foreground:#fff;}','bad.css')).toEqual([])
})

test('Given 插件网络暂时失败或内容超限 When 获取 Then 自动有限重试且拒绝不可信目标',async()=>{
 let calls=0
 const request=(async()=>{calls++;if(calls===1)throw new Error('temporary');return new Response('ok')})
 expect((await marketBytes('https://plugins.paseo.sh/index.json',100,request)).toString()).toBe('ok');expect(calls).toBe(2)
 await expect(marketBytes('https://127.0.0.1/index.json',100,request)).rejects.toThrow('来源必须')
 await expect(marketBytes('https://plugins.paseo.sh/index.json',1,async()=>new Response('too long'))).rejects.toThrow('大小')
})


test('Given 已缓存真实结构的市场目录 When 断网更新 Then 显示离线目录且不影响已安装主题',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-market-offline-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{
  const entry={id:'example/theme',name:'Example',description:'Fixture only',categories:['themes'],author:{github:'example'},repository:{url:'https://github.com/example/theme'},artifact:{kind:'npm',package:'example-theme',version:'1.0.0',resolved:'https://registry.npmjs.org/example-theme/-/example-theme-1.0.0.tgz',integrity:'sha512-YQ=='}}
  const online=await desktopMarket(true,async url=>Response.json(url.hostname==='plugins.paseo.sh'?{schemaVersion:1,plugins:[entry]}:{format:1,plugins:[]}));expect(online.entries).toHaveLength(1);expect(online.stale).toBe(false)
  let calls=0;const offline=await desktopMarket(true,async()=>{calls++;throw new Error('fixture offline')});expect(calls).toBe(4);expect(offline.stale).toBe(true);expect(offline.entries[0]?.id).toBe('example/theme');expect(offline.error).toContain('离线')
 }finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true})}
})

test('Given DSH主题包的hero图片 When 通用包读取 Then 相对资源内联保留且SVG脚本拒绝',async()=>{
 const {readThemePackage}=await import('../apps/electron/src/main/lib/theme-package')
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')
 const themes=readThemePackage(new Map([['skins/cosmos.json',Buffer.from(JSON.stringify({id:'cosmos',appearance:'dark',seeds:{surface:'#201a40',text:'#e8e2ff',accent:'#9d8bff'},hero:'cosmos.png',heroFocus:'50% 8%'}))],['skins/cosmos.png',png]]))
 expect(themes[0]?.background?.image).toStartWith('data:image/png;base64,');expect(themes[0]?.background?.position).toBe('50% 8%')
 const {validThemeImage}=await import('../packages/shared/src/utils/theme-background');expect(validThemeImage('data:image/svg+xml,'+encodeURIComponent('<svg><script>alert(1)</script></svg>'))).toBe(false)
})

test('Given DSH format-1多市场 When 读取索引 Then 保留独立来源、精确版本和本地化不伪称已安装',async()=>{
 const {parseDshMarket,DEFAULT_MARKETS}=await import('../apps/electron/src/main/lib/market-sources')
 const rows=parseDshMarket({format:1,plugins:[{name:'test-theme',title:{en:'Test',zh:'测试'},metadata:{category:'theme'},versions:[{version:'1.0.0',publishTimestamp:1,source:{type:'npm'},engines:{dsh:'>=0.2.1'}}]}]},DEFAULT_MARKETS[1]!)
 expect(rows[0]?.marketId).toBe('dsh');expect(rows[0]?.name).toBe('测试');expect(rows[0]?.artifact.kind).toBe('npm-version');expect(rows[0]?.engines).toBe('>=0.2.1')
})
