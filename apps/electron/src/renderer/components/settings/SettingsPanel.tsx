import {PluginSettingsNavigation,NativePluginSurface} from '@/components/plugins/native-placements'
import {pluginSettingsTargetAtom} from '@/components/plugins/native-state'
import { ModelRoutingSettings } from './ModelRoutingSettings'
import { KernelSettings } from './KernelSettings'
import { PluginSettings } from './PluginSettings'
/**
 * SettingsPanel - 设置面板
 *
 * 在应用主工作区中展示左侧导航和右侧 ScrollArea 内容区域。
 * 使用 Jotai atom 管理当前标签页状态，保持已有设置项与分组顺序。
 */

import * as React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { detectIsWindows } from "@/lib/platform";
import { getWindowTitlebarDragInsetStyle } from "@/lib/window-titlebar-layout";
import {
  Settings,
  Search,
  Sparkles,
  Plug,
  Radio,
  Eye,
  Palette,
  Info,
  Globe,
  BookOpen,
  Bot,
  GraduationCap,
  ArrowLeft,
  Keyboard,
  Mic,
  HardDriveDownload,
  HardDrive,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShortcutKeycaps } from "@/components/shortcuts/ShortcutKeycaps";
import {
  settingsTabAtom,
  modelRoutingTabAtom,
  capabilityDiscardRevisionAtom,
  settingsUnsavedChangesAtom,
  settingsCloseRequestedAtom,
  settingsOpenAtom,
  settingsPendingSessionNavigationAtom,
  type SettingsSessionNavigation,
} from "@/atoms/settings-tab";
import type { SettingsTab } from "@/atoms/settings-tab";
import { activeViewAtom } from "@/atoms/active-view";
import { automationFormAtom } from "@/atoms/automation-atoms";
import { hasUpdateAtom } from "@/atoms/updater";
import { hasEnvironmentIssuesAtom } from "@/atoms/environment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChannelSettings } from "./ChannelSettings";
import { VisionRelaySettings } from "./VisionRelaySettings";
import { GeneralSettings } from "./GeneralSettings";
import { ProxySettings } from "./ProxySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AboutSettings } from "./AboutSettings";
import { PromptSettings } from "./PromptSettings";
import { BotHubSettings } from "./BotHubSettings";
import { ShortcutSettings } from "./ShortcutSettings";
import { VoiceInputSettings } from "./VoiceInputSettings";
import { MigrationSettings } from "./MigrationSettings";
import { StorageSettings } from "./StorageSettings";
import { OnboardingSettings } from "./OnboardingSettings";
import { SETTINGS_SECTIONS, searchSettingsSections } from '@proma/shared/config'
import { CapabilitySettingsScope } from '@/hooks/useCapabilityDraftGuard'
import { ProjectCapabilitySettings } from './ProjectCapabilitySettings'
import { useOpenSession } from '@/hooks/useOpenSession'

/** 设置 Tab 定义 */
interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

/** 图标映射与共享的可搜索设置目录保持一一对应。 */
const TAB_ICONS: Record<SettingsTab, React.ReactNode> = {
  routing: <Radio size={16}/>, kernels: <Radio size={16}/>, plugins: <Plug size={16}/>, general: <Settings size={16}/>, channels: <Radio size={16}/>, 'vision-relay': <Eye size={16}/>,
  prompts: <BookOpen size={16}/>, proxy: <Globe size={16}/>, appearance: <Palette size={16}/>,
  about: <Info size={16}/>, bots: <Bot size={16}/>, shortcuts: <Keyboard size={16}/>,
  'voice-input': <Mic size={16}/>, migration: <HardDriveDownload size={16}/>, storage: <HardDrive size={16}/>,
  onboarding: <GraduationCap size={16}/>, skills: <Sparkles size={16}/>, mcp: <Plug size={16}/>,
}

/** 根据标签页 id 渲染对应内容 */
function renderTabContent(tab: SettingsTab): React.ReactElement {
  switch (tab) {
    case "routing": return <ModelRoutingSettings/>;
    case "kernels": return <KernelSettings/>;
    case "plugins": return <PluginSettings/>;
    case "skills":
    case "mcp":
      return <ProjectCapabilitySettings key={tab} tab={tab} />;
    case "general":
      return <GeneralSettings />;
    case "channels":
      return <ModelRoutingSettings initialTab="legacy"/>;
    case "vision-relay":
      return <VisionRelaySettings />;
    case "prompts":
      return <PromptSettings />;
    case "proxy":
      return <ProxySettings />;
    case "appearance":
      return <AppearanceSettings />;
    case "about":
      return <AboutSettings />;
    case "bots":
      return <BotHubSettings />;
    case "shortcuts":
      return <ShortcutSettings />;
    case "voice-input":
      return <VoiceInputSettings />;
    case "migration":
      return <MigrationSettings />;
    case "storage":
      return <StorageSettings />;
    case "onboarding":
      return <OnboardingSettings />;
    default:
      return <GeneralSettings />;
  }
}

interface SettingsPanelProps {
  onClose?: () => void;
}

export function SettingsPanel({
  onClose,
}: SettingsPanelProps): React.ReactElement {
  const isWindows = React.useMemo(() => detectIsWindows(), [])
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);
  const [pluginSettings,setPluginSettings]=useAtom(pluginSettingsTargetAtom);
  const setRoutingTab=useSetAtom(modelRoutingTabAtom);
  React.useEffect(()=>{if(activeTab==='channels'){setRoutingTab('legacy');setActiveTab('routing')}},[activeTab,setRoutingTab,setActiveTab]);
  const channelFormDirty = useAtomValue(settingsUnsavedChangesAtom);
  const discardCapabilityDrafts = useSetAtom(capabilityDiscardRevisionAtom);
  const [closeRequested, setCloseRequested] = useAtom(settingsCloseRequestedAtom);
  const [pendingSessionNavigation, setPendingSessionNavigation] = useAtom(settingsPendingSessionNavigationAtom);
  const setSettingsOpen = useSetAtom(settingsOpenAtom);
  const setActiveView = useSetAtom(activeViewAtom);
  const setAutomationForm = useSetAtom(automationFormAtom);
  const hasUpdate = useAtomValue(hasUpdateAtom);
  const hasEnvironmentIssues = useAtomValue(hasEnvironmentIssuesAtom);
  const openSession = useOpenSession()
  /** 统一的退出拦截对话框状态 */
  type PendingAction =
    | { type: 'tab'; tabId: SettingsTab }
    | { type: 'close' }
    | { type: 'session'; navigation: SettingsSessionNavigation }
    | null
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null)
  const showNavDialog = pendingAction !== null

  /** 执行待处理的操作 */
  const executePendingAction = (): void => {
    if (!pendingAction) return
    discardCapabilityDrafts(revision => revision + 1)
    if (pendingAction.type === 'tab') {
      setActiveTab(pendingAction.tabId)
    } else if (pendingAction.type === 'session') {
      openSession(
        pendingAction.navigation.type,
        pendingAction.navigation.sessionId,
        pendingAction.navigation.title,
        {
          bypassSettingsGuard: true,
          onOpened: pendingAction.navigation.onOpened,
        },
      )
    } else {
      onClose?.()
    }
    setPendingAction(null)
  }

  /** 取消待处理的操作 */
  const cancelPendingAction = (): void => {
    setPendingAction(null)
  }

  /** 切换标签页时检测是否有未保存内容 */
  const handleTabChange = (tabId: SettingsTab): void => {
    if (tabId === activeTab&&!pluginSettings) return
    setPluginSettings(null)
    if (channelFormDirty) {
      setPendingAction({ type: 'tab', tabId })
      return
    }
    setActiveTab(tabId)
  }

  /** 关闭设置面板时检测是否有未保存内容 */
  const handleClose = React.useCallback((): void => {
    if (channelFormDirty) {
      setPendingAction({ type: 'close' })
      return
    }
    onClose?.()
  }, [activeTab, channelFormDirty, onClose])

  /** 按 ESC 退出设置面板：window 级监听确保焦点在设置面板内任何位置（含 body）都生效；
   *  Radix 弹层（Select 下拉/AlertDialog/Popover 等）处理 ESC 时会 preventDefault，
   *  此时交给弹层自行关闭，不退出设置。 */
  React.useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      if (e.defaultPrevented) return
      handleClose()
    }
    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [handleClose])

  // 左侧会话点击在渠道表单有未保存内容时，由 useOpenSession 暂存目标并交给此处确认。
  React.useEffect(() => {
    if (!pendingSessionNavigation) return
    setPendingAction({ type: 'session', navigation: pendingSessionNavigation })
    setPendingSessionNavigation(null)
  }, [pendingSessionNavigation, setPendingSessionNavigation])

  // Cmd+W 等外部关闭请求：弹出确认对话框
  React.useEffect(() => {
    if (closeRequested) {
      setPendingAction({ type: 'close' })
      setCloseRequested(false)
    }
  }, [closeRequested, activeTab, setCloseRequested])

  const [search, setSearch] = React.useState('')
  const searchId = React.useId()
  const sections = searchSettingsSections(search)
  const groups = [...new Set(SETTINGS_SECTIONS.map(section => section.group))]
  const tabs: TabItem[] = sections.map(section => ({ id: section.id, label: section.label, icon: TAB_ICONS[section.id] }))
  const managingCapabilities = activeTab === 'mcp' || activeTab === 'skills'

  return (
    <CapabilitySettingsScope.Provider value={true}><div className="flex h-full min-h-0 flex-col bg-content-area text-foreground">
      <div className="relative h-[35px] flex-shrink-0 bg-[hsl(var(--sidebar-surface))]">
        <div
          aria-hidden="true"
          className="titlebar-drag-region pointer-events-none absolute inset-y-0 left-0"
          style={getWindowTitlebarDragInsetStyle(isWindows)}
        />
      </div>

      {/* 主体：左导航 + 右内容 */}
      <div className="flex flex-1 min-h-0">
        {/* 左侧 Tab 导航 */}
        <div className="flex h-full min-h-0 w-[277px] flex-shrink-0 flex-col border-r border-border/80 bg-[hsl(var(--sidebar-surface))] dark:border-border/70">
          <div className="px-4 pt-5 pb-3">
            <h1 className="text-lg font-semibold mb-3">设置</h1>
            <label htmlFor={searchId} className="sr-only">搜索设置</label>
            <div className="relative"><Search size={15} aria-hidden="true" className="absolute left-3 top-3 text-muted-foreground"/>
              <input id={searchId} value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索设置、MCP、Skills…" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
            </div>
          </div>
          <nav aria-label="设置分类" className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 scrollbar-thin">
            {groups.map(group => {
              const entries = tabs.filter(tab => sections.find(section => section.id === tab.id)?.group === group)
              if (!entries.length) return null
              return <section key={group}><h2 className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{group}</h2>{entries.map(tab => <button key={tab.id} onClick={() => handleTabChange(tab.id)} aria-current={!pluginSettings&&activeTab === tab.id ? 'page' : undefined} title={sections.find(section => section.id === tab.id)?.description} className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', !pluginSettings&&activeTab === tab.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground')}>
                <span aria-hidden="true">{tab.icon}</span><span>{tab.label}</span>{tab.id === 'about' && (hasUpdate || hasEnvironmentIssues) && <span className="ml-auto text-xs text-primary">待处理</span>}
              </button>)}</section>
            })}
            <PluginSettingsNavigation search={search}/>
            {!tabs.length && <p role="status" className="px-3 py-4 text-sm text-muted-foreground">没有匹配的设置，试试“模型”“MCP”或“技能”。</p>}
          </nav>
          <div className="flex-shrink-0 p-3">
            <button
              onClick={handleClose}
              className="group flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            >
              <ArrowLeft size={16} />
              <span>返回</span>
              <span aria-hidden="true" className="ml-auto inline-flex opacity-0 transition-opacity group-hover:opacity-100">
                <ShortcutKeycaps accelerator="Esc" />
              </span>
            </button>
          </div>
        </div>

        {/* 右侧内容区域 */}
        {pluginSettings?<div className="min-w-0 flex-1 bg-content-area"><NativePluginSurface key={pluginSettings.pluginId+'/'+pluginSettings.id} target={pluginSettings}/></div>:managingCapabilities ? <div className="min-w-0 flex-1 bg-content-area">{renderTabContent(activeTab)}</div> : <ScrollArea className="min-w-0 flex-1 bg-content-area">
          <div className="mx-auto w-full max-w-[1080px] px-5 py-8 pb-12 sm:px-8">
            {renderTabContent(activeTab)}
          </div>
        </ScrollArea>}
      </div>

      {/* 退出拦截弹窗（侧边栏导航 / X 关闭 / Cmd+W） */}
      <AlertDialog open={showNavDialog} onOpenChange={(open) => { if (!open) cancelPendingAction() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃未保存的更改？</AlertDialogTitle>
            <AlertDialogDescription>
              当前设置或项目能力有未保存的内容，确定要离开吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingAction}>留在当前页</AlertDialogCancel>
            <AlertDialogAction onClick={executePendingAction}>放弃并离开</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div></CapabilitySettingsScope.Provider>
  );
}
