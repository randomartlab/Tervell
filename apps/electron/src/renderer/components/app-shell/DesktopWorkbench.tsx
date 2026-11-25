import type { ReactElement, ReactNode } from 'react'
import { WorkbenchFrame } from '@proma/ui/workbench/frame'
import '@proma/ui/workbench/frame.css'
import './desktop-workbench.css'

interface DesktopWorkbenchProps {
  navigation: ReactNode
  workspace?: ReactNode
  children: ReactNode
}

/** 桌面默认入口与 Web 共用布局容器，桌面模块继续使用现有 IPC、会话和文件存储。 */
export function DesktopWorkbench({ navigation, workspace, children }: DesktopWorkbenchProps): ReactElement {
  return <>
    <a className="desktop-skip-link titlebar-no-drag" href="#desktop-workspace-main">跳到主要内容</a>
    <WorkbenchFrame className="desktop-workbench" mainId="desktop-workspace-main" navigation={navigation} workspace={workspace}>
      {children}
    </WorkbenchFrame>
  </>
}
