/** 电脑端设置目录；搜索只匹配标题和说明，不读取用户配置或凭据。 */
export interface SettingsSectionEntry {
  id: SettingsSectionId
  label: string
  group: '工作与模型' | '项目能力' | '界面与输入' | '连接与数据' | '帮助'
  description: string
  keywords: string
}
export type SettingsSectionId = 'routing' | 'kernels' | 'plugins' | 'general' | 'channels' | 'vision-relay' | 'proxy' | 'appearance' | 'about' | 'onboarding' | 'prompts' | 'bots' | 'shortcuts' | 'voice-input' | 'migration' | 'storage' | 'skills' | 'mcp'
export const SETTINGS_SECTIONS: readonly SettingsSectionEntry[] = [
  { id: 'routing', label: '全局模型路由', group: '工作与模型', description: '跨供应商覆盖 Agent 模型、路由组、回退与用量', keywords: 'magpie gateway routing 全局 覆盖 供应商 路由 账号 登录 模型配置 channel api' },
  { id: 'kernels', label: 'Agent 内核', group: '工作与模型', description: '管理 ACP CLI、全局和项目默认内核', keywords: 'acp cli kernel provider 内核 命令' },
  { id: 'plugins', label: '插件中心', group: '项目能力', description: '插件商城、本地导入、启用与停用', keywords: 'plugin marketplace 插件 商城 扩展' },
  { id: 'general', label: '通用设置', group: '工作与模型', description: '默认行为与工作偏好', keywords: 'general 偏好' },
  { id: 'vision-relay', label: '视觉助手', group: '工作与模型', description: '图片理解与视觉模型', keywords: 'vision image 图片' },
  { id: 'prompts', label: '提示词管理', group: '工作与模型', description: '管理可复用的提示词', keywords: 'prompt 提示词' },
  { id: 'skills', label: 'Skills 技能', group: '项目能力', description: '按项目导入、启用、更新与编辑技能', keywords: 'skill 技能 SKILL.md 导入 更新' },
  { id: 'mcp', label: 'MCP 服务器', group: '项目能力', description: '图形化配置工具连接、凭据与连接测试', keywords: 'mcp tools stdio http sse 工具 服务器 OAuth' },
  { id: 'appearance', label: '外观设置', group: '界面与输入', description: '主题、颜色、字号与布局', keywords: 'theme light dark font 主题 字体' },
  { id: 'shortcuts', label: '快捷键管理', group: '界面与输入', description: '查看与配置键盘操作', keywords: 'keyboard shortcut 键盘' },
  { id: 'voice-input', label: '语音输入', group: '界面与输入', description: '听写与语音识别', keywords: 'voice speech mic 语音' },
  { id: 'bots', label: '远程连接', group: '连接与数据', description: '手机配对、设备授权与机器人', keywords: 'mobile remote 手机 飞书 机器人 设备' },
  { id: 'proxy', label: '代理设置', group: '连接与数据', description: '模型与网络连接偏好', keywords: 'proxy network 网络 代理' },
  { id: 'migration', label: '数据迁移', group: '连接与数据', description: '导入、迁移与保留历史数据', keywords: 'migration import 迁移 导入' },
  { id: 'storage', label: '磁盘管理', group: '连接与数据', description: '查看存储与清理空间', keywords: 'disk storage 磁盘 清理' },
  { id: 'onboarding', label: 'Tervell 新手引导', group: '帮助', description: '了解基本流程与常用功能', keywords: 'help guide 教程 帮助' },
  { id: 'about', label: '关于/更新', group: '帮助', description: '版本、环境检查与更新记录', keywords: 'version update release 版本 更新' },
]
export function searchSettingsSections(query: string): SettingsSectionEntry[] {
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return SETTINGS_SECTIONS.filter(section => words.every(word => `${section.label} ${section.description} ${section.keywords}`.toLocaleLowerCase().includes(word)))
}
