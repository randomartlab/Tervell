import type { ReactNode } from 'react'

export interface WorkbenchHeadingProps {
  title: ReactNode
  breadcrumbs?: ReactNode
  status?: { label: string; kind: 'ready' | 'running' | 'blocked' }
  actions?: ReactNode
  className?: string
}

/** 项目位置、任务标题和运行反馈使用同一层级，操作由宿主注入。 */
export function WorkbenchHeading({ title, breadcrumbs, status, actions, className = '' }: WorkbenchHeadingProps) {
  return <header className={`workbench-heading ${className}`}>
    <div className="workbench-heading-content">
      {breadcrumbs && <div className="workbench-breadcrumbs">{breadcrumbs}</div>}
      <div className="workbench-title-row">
        <div className="workbench-title">{title}</div>
        {status && <span role="status" className={`workbench-status workbench-status-${status.kind}`}>{status.label}</span>}
      </div>
    </div>
    {actions && <div className="workbench-heading-actions">{actions}</div>}
  </header>
}
