import { describe, expect, test } from 'bun:test'
import { CapabilitySchema, PluginManifestSchema } from './plugin.ts'

const minimal = { api: 1, engines: { proma: '>=0.20 <1' }, display: { title: { zh: '主题' } }, capabilities: [], data: { themes: ['themes/a.json'] } }

describe('PR-04 插件清单', () => {
  test('Given 纯数据插件 When 解析 Then 保留文件清单', () => {
    expect(PluginManifestSchema.parse(minimal).data?.themes).toEqual(['themes/a.json'])
    expect(CapabilitySchema.options).toHaveLength(12)
  })
  test('Given UI/host/compat 清单 When 解析 Then 保留各类贡献', () => {
    const parsed = PluginManifestSchema.parse({ ...minimal, capabilities: ['panels', 'screens', 'tools', 'kernels'],
      ui: { entry: 'ui/index.js', platform: ['web', 'desktop', 'mobile'], contributes: {
        screens: [{ id: 'board', title: '看板' }], workspacePanels: [{ id: 'panel', title: '面板', location: 'right' }],
        commands: [{ id: 'open', title: '打开' }], sidebarItems: [{ id: 'link', title: '入口', section: 'footer' }],
        composerItems: [{ id: 'pin', title: '固定' }], statusBar: [{ id: 'count', align: 'right' }], settings: [{ id: 'settings', title: '设置' }],
      } },
      host: { entry: 'host/index.js', contributes: { kernels: [{ id: 'custom', title: '内核', protocol: 'acp' }], tools: [{ id: 'sync' }], hooks: ['session.afterTurn'], rpc: ['board.query'] } },
      compat: { paseo: { entry: './paseo', mode: 'shim' }, dsh: { bundle: './cordis.patch.yml', mode: 'adapter' } },
    })
    expect(parsed.host?.contributes?.tools?.[0]?.id).toBe('sync')
    expect(parsed.ui?.contributes?.screens?.[0]?.id).toBe('board')
    expect(parsed.compat?.dsh?.mode).toBe('adapter')
  })
  const invalid: Array<[string, unknown]> = [
    ['API 版本', { ...minimal, api: 0 }],
    ['缺 engines', { ...minimal, engines: undefined }],
    ['空名称', { ...minimal, display: { title: { zh: '' } } }],
    ['空本地化', { ...minimal, display: { title: {} } }],
    ['未知能力', { ...minimal, capabilities: ['root'] }],
    ['重复能力', { ...minimal, capabilities: ['network', 'network'] }],
    ['缺 capabilities', { ...minimal, capabilities: undefined }],
    ['无运行面', { ...minimal, data: undefined }],
    ['空 data', { ...minimal, data: {} }],
    ['UI 无入口', { ...minimal, ui: { platform: ['web'] } }],
    ['未知平台', { ...minimal, ui: { entry: 'ui.js', platform: ['watch'] } }],
    ['重复平台', { ...minimal, ui: { entry: 'ui.js', platform: ['web', 'web'] } }],
    ['逃逸路径', { ...minimal, host: { entry: '../escape.js' } }],
    ['绝对路径', { ...minimal, data: { themes: ['/etc/passwd'] } }],
    ['Windows 路径', { ...minimal, host: { entry: 'C:\\escape.js' } }],
    ['远程入口', { ...minimal, host: { entry: 'https://example.test/plugin.js' } }],
    ['空路径', { ...minimal, host: { entry: '' } }],
    ['未知清单字段', { ...minimal, unrestricted: true }],
    ['无授权工具', { ...minimal, host: { entry: 'host.js', contributes: { tools: [{ id: 'exec' }] } } }],
    ['无授权界面', { ...minimal, ui: { entry: 'ui.js', platform: ['web'], contributes: { screens: [{ id: 's', title: '屏幕' }] } } }],
    ['重复贡献 ID', { ...minimal, capabilities: ['screens'], ui: { entry: 'ui.js', platform: ['web'], contributes: { screens: [{ id: 's', title: '一' }, { id: 's', title: '二' }] } } }],
    ['兼容路径逃逸', { ...minimal, compat: { paseo: { entry: '../paseo', mode: 'shim' } } }],
    ['非法兼容模式', { ...minimal, compat: { dsh: { bundle: './p.yml', mode: 'native' } } }],
  ]
  for (const [name, manifest] of invalid) {
    test(`Given ${name} When 校验 Then 拒绝`, () => expect(PluginManifestSchema.safeParse(manifest).success).toBe(false))
  }
})
