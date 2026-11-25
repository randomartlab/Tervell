import { useEffect, useRef, useState } from 'react'
import { WorkbenchDialog } from '@proma/ui/workbench'

export interface Command { id: string; label: string; hint?: string; run: () => void }
export function CommandPalette({ open, close, commands }: { open: boolean; close: () => void; commands: Command[] }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const list = useRef<HTMLDivElement>(null)
  const pending = useRef<Command>()
  useEffect(() => { if (open) { setQuery(''); setActive(0) } }, [open])
  const matches = commands.filter(command => command.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const select = (command?: Command) => { if (command) { pending.current = command; close() } }
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active])
  return <WorkbenchDialog open={open} onOpenChange={value => { if (!value) close() }} onClosed={() => { const command = pending.current; pending.current = undefined; if (command) requestAnimationFrame(command.run) }} title="命令面板" description="搜索会话或操作。方向键选择，回车打开，Escape 关闭。"><input autoFocus className="command-search" aria-label="搜索命令" role="combobox" aria-expanded="true" aria-controls="command-list" aria-autocomplete="list" aria-activedescendant={matches[active] ? `command-${matches[active].id}` : undefined} value={query} onChange={event => { setQuery(event.target.value); setActive(0) }} onKeyDown={event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => Math.min(index + 1, matches.length - 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, index - 1)) }
    if (event.key === 'Enter') { event.preventDefault(); select(matches[active]) }
  }}/><div ref={list} id="command-list" className="command-list" role="listbox" aria-label="命令结果">{matches.map((command, index) => <button type="button" role="option" aria-selected={index === active} id={`command-${command.id}`} key={command.id} tabIndex={-1} onMouseEnter={() => setActive(index)} onClick={() => select(command)}><span>{command.label}</span><small>{command.hint}</small></button>)}{!matches.length && <p className="empty">没有匹配的命令</p>}</div><footer className="palette-footer">↑ ↓ 选择 <span>↵ 打开</span><kbd>esc</kbd> 关闭</footer></WorkbenchDialog>
}

export const shortcuts = [
  ['⌘ / Ctrl + K', '打开命令面板'], ['⌘ / Ctrl + Enter', '发送消息；运行中排队'],
  ['⌘ / Ctrl + Shift + A', '打开审批中心'], ['⌘ / Ctrl + Shift + L', '聚焦消息输入'],
  ['⌘ / Ctrl + /', '查看快捷键'], ['Alt + ↑ / ↓', '上一个 / 下一个会话'],
  ['Escape', '关闭弹窗并恢复焦点'], ['Tab / Shift + Tab', '在操作之间移动'],
]
