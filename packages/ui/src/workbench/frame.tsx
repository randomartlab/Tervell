import type { ReactNode } from 'react'

export interface WorkbenchFrameProps {
  navigation: ReactNode
  children: ReactNode
  workspace?: ReactNode
  toolbar?: ReactNode
  className?: string
  mainId?: string
}
/** Web 与桌面的工作台容器共享语义；具体能力由各宿主注入，不启动第二套会话运行时。 */
export function WorkbenchFrame({ navigation, children, workspace, toolbar, className = '', mainId }: WorkbenchFrameProps) {
  const Content = mainId ? 'main' : 'div'
  return <div className={`unified-workbench ${className}`}>
    <div className="unified-navigation">{navigation}</div>
    <div className="unified-main">{toolbar}<Content className="unified-content" id={mainId} tabIndex={mainId ? -1 : undefined}>{children}</Content></div>
    {workspace && <div className="unified-artifacts">{workspace}</div>}
  </div>
}
