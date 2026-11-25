import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorkbenchFrame } from '../packages/ui/src/workbench/frame.tsx'
import { WorkbenchHeading } from '../packages/ui/src/workbench/heading.tsx'
import { resolveConfigDir } from '../apps/cli/src/paths.ts'

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Given 桌面已有完整模块 When 默认挂载工作台 Then 保留主区订阅、设置覆盖和侧栏能力', () => {
  const shell = source('apps/electron/src/renderer/components/app-shell/AppShell.tsx')
  expect(shell).toContain('<DesktopWorkbench navigation=')
  for (const module of ['<MainArea', '<LeftSidebar', '<RightSidePanel', '<SettingsPanel', '<WorkspaceMemoryChangeObserver']) expect(shell).toContain(module)
  expect(shell).not.toMatch(/new CoreRpc|openCoreService|loadURL.*apps\/web/)
  const navigation = source('apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx')
  for (const entry of ['setSettingsTab(\'mcp\')', 'setSettingsTab(\'skills\')', 'viewMode === \'active\'', '返回活跃', 'ModeSwitcher']) expect(navigation).toContain(entry)
})

test('Given 各宿主注入工作区 When 渲染共享布局与标题 Then 导航顺序一致且不嵌套main地标', () => {
  const html = renderToStaticMarkup(<WorkbenchFrame navigation={<nav aria-label="主导航">项目</nav>} mainId="test-main" workspace={<aside aria-label="产物">文件</aside>}>
    <WorkbenchHeading title={<h1>检查产物</h1>} breadcrumbs={<span>研究项目</span>} status={{ kind: 'blocked', label: '需要你确认' }} actions={<button>打开设置</button>}/>
  </WorkbenchFrame>)
  expect(html.indexOf('主导航')).toBeLessThan(html.indexOf('test-main'))
  expect(html.indexOf('test-main')).toBeLessThan(html.indexOf('aria-label="产物"'))
  expect(html.match(/<main\b/g)).toHaveLength(1)
  expect(html).toContain('role="status"')
  expect(html).toContain('需要你确认')
  const web = renderToStaticMarkup(<WorkbenchFrame navigation="导航"><main>内容</main></WorkbenchFrame>)
  expect(web.match(/<main\b/g)).toHaveLength(1)
  expect(source('apps/web/src/App.tsx')).toContain('<WorkbenchFrame')
})

test('Given Alpha安装包 When 读取内置策略 Then 独立身份且更新器所有入口受限', () => {
  const config = source('apps/electron/electron-builder.alpha.yml')
  expect(config).toContain('promaReleaseChannel: alpha')
  expect(config).toContain('appId: art.randomai.tervell.alpha')
  expect(config).toContain('publish: null')
  const update = source('apps/electron/src/main/lib/updater/auto-updater.ts')
  for (const method of ['initAutoUpdater', 'checkForUpdates', 'installWhenIdle', 'quitAndInstall']) {
    expect(update).toMatch(new RegExp(`function ${method}[^}]{0,250}currentReleasePolicy\\(\\).automaticUpdates`))
  }
})

test('Given Alpha调用内置CLI When 宿主显式传入配置路径 Then 读取隔离数据且显式参数可覆盖', () => {
  const original = process.env.PROMA_CONFIG_DIR
  try {
    process.env.PROMA_CONFIG_DIR = '/test/isolated-alpha'
    expect(resolveConfigDir()).toBe('/test/isolated-alpha')
    expect(resolveConfigDir({ configDir: '/test/explicit' })).toBe('/test/explicit')
  } finally {
    if (original === undefined) delete process.env.PROMA_CONFIG_DIR
    else process.env.PROMA_CONFIG_DIR = original
  }
})

test('Given 独立文件预览使用提示与主题 When 挂载 Then 提供Tooltip上下文并订阅社区色板',()=>{
 const entry=source('apps/electron/src/renderer/main.tsx')
 expect(entry).toContain('<TooltipProvider><DetachedPreviewApp /></TooltipProvider>')
 expect(entry).toContain('<ThemeInitializer /><DesktopPluginContributions/>')
})
