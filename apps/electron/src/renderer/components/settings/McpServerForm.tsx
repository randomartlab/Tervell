/**
 * McpServerForm - MCP 服务器创建/编辑表单
 *
 * 支持 stdio / http / sse 三种传输类型，
 * 复用设置原语组件实现卡片化布局。
 */

import * as React from 'react'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { parseMcpArguments, parseMcpKeyValues, parseMcpTimeout } from '@proma/shared/utils'
import { useCapabilityDraftGuard } from '@/hooks/useCapabilityDraftGuard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { McpOAuthConfiguration, McpServerEntry, McpTransportType, WorkspaceMcpConfig } from '@proma/shared'
import {
  SettingsSection,
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsToggle,
  SettingsTextarea,
} from './primitives'

/** 编辑中的服务器 */
interface EditingServer {
  name: string
  entry: McpServerEntry
}

interface McpServerFormProps {
  /** 编辑模式传入已有服务器，创建模式传 null */
  server: EditingServer | null
  /** 当前工作区 slug */
  workspaceSlug: string
  onSaved: () => void
  onChanged?: () => void | Promise<void>
  onCancel: () => void | Promise<void>
  /** 外部详情页请求关闭的递增标记；表单会先 flush 自动保存再触发 onCancel。 */
  closeRequestId?: number
  /** 由 MCP 内部详情页托管标题与返回操作时隐藏表单标题栏。 */
  showHeader?: boolean
}

/** 传输类型选项 */
const TRANSPORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'stdio', label: 'stdio（命令行）' },
  { value: 'http', label: 'HTTP（Streamable HTTP）' },
  { value: 'sse', label: 'SSE（Server-Sent Events）' },
]

/**
 * 将 Record 序列化为多行 key=value / key: value 文本
 */
function serializeKeyValueText(record: Record<string, string> | undefined, separator: '=' | ':'): string {
  if (!record) return ''
  return Object.entries(record)
    .map(([key, value]) => `${key}${separator}${separator === ':' ? ' ' : ''}${value}`)
    .join('\n')
}

interface McpFormValues {
  transportType: McpTransportType
  enabled: boolean
  testResult: { success: boolean; message: string; timestamp?: number } | null
  isBuiltin: boolean
  /** OAuth 公开元数据不在此表单编辑，但保存其他字段时必须原样保留。 */
  oauth?: McpOAuthConfiguration
  command: string
  argsText: string
  envText: string
  timeoutStr: string
  url: string
  headersText: string
}

/** 根据当前表单值构建 McpServerEntry */
function buildEntryFromValues(values: McpFormValues, includeTestResult = false): McpServerEntry {
  const base: McpServerEntry = {
    type: values.transportType,
    enabled: values.enabled,
    ...(values.isBuiltin && { isBuiltin: true }),
    ...(values.oauth && { oauth: values.oauth }),
    ...(includeTestResult && values.testResult && {
      lastTestResult: {
        ...values.testResult,
        timestamp: values.testResult.timestamp ?? Date.now(),
      },
    }),
  }

  if (values.transportType === 'stdio') {
    base.command = values.command.trim()
    const args = parseMcpArguments(values.argsText)
    if (args.length > 0) base.args = args
    const env = parseMcpKeyValues(values.envText, '=')
    if (Object.keys(env).length > 0) base.env = env
    const timeout = parseMcpTimeout(values.timeoutStr)
    if (timeout !== undefined) base.timeout = timeout
  } else {
    base.url = values.url.trim()
    const headers = parseMcpKeyValues(values.headersText, ':')
    if (Object.keys(headers).length > 0) base.headers = headers
  }

  return base
}

export function McpServerForm({ server, workspaceSlug, onSaved, onChanged, onCancel, closeRequestId, showHeader = true }: McpServerFormProps): React.ReactElement {
  const isEdit = server !== null
  const isBuiltin = server?.entry.isBuiltin === true
  const oauth = server?.entry.oauth

  // 表单状态
  const [name, setName] = React.useState(server?.name ?? '')
  const [transportType, setTransportType] = React.useState<McpTransportType>(server?.entry.type ?? 'stdio')
  const [enabled, setEnabled] = React.useState(server?.entry.enabled ?? false) // 默认关闭
  const explicitlyDisabledRef = React.useRef(false)
  // Strict Mode 会重复执行 mount effect；只有真实用户操作才能解锁自动保存，
  // 以保证“查看配置”不会触发 SAVE_MCP_CONFIG → 禁用 → 验证 → 重启用。
  const hasUserEditedRef = React.useRef(false)
  const [dirty, setDirty] = React.useState(false)
  const editRevisionRef = React.useRef(0)
  const markUserEdited = React.useCallback((): void => {
    hasUserEditedRef.current = true
    setDirty(true)
    editRevisionRef.current += 1
  }, [])
  const handleEnabledChange = React.useCallback((nextEnabled: boolean): void => {
    markUserEdited()
    if (!nextEnabled) explicitlyDisabledRef.current = true
    setEnabled(nextEnabled)
  }, [markUserEdited])

  // stdio 字段
  const [command, setCommand] = React.useState(server?.entry.command ?? '')
  const [argsText, setArgsText] = React.useState(JSON.stringify(server?.entry.args ?? [], null, 2))
  const [envText, setEnvText] = React.useState(serializeKeyValueText(server?.entry.env, '='))
  const [timeoutStr, setTimeoutStr] = React.useState(
    server?.entry.timeout != null ? String(server.entry.timeout) : ''
  )

  // http/sse 字段
  const [url, setUrl] = React.useState(server?.entry.url ?? '')
  const [headersText, setHeadersText] = React.useState(serializeKeyValueText(server?.entry.headers, ':'))

  // UI 状态
  const [discardNew, setDiscardNew] = React.useState(false)
  const [verificationNotice, setVerificationNotice] = React.useState('')
  const lastSavedFormRef = React.useRef('')
  const [formError, setFormError] = React.useState('')
  const [retryRevision, setRetryRevision] = React.useState(0)
  const savingRef = React.useRef(false)
  const testingRef = React.useRef(false)
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string; timestamp?: number } | null>(
    server?.entry.lastTestResult ?? null
  )

  // 自动保存状态（仅编辑模式）
  const AUTO_SAVE_DELAY = 600
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = React.useRef(true)
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const maySave = useCapabilityDraftGuard(saving || dirty || (!isEdit && Boolean(name || command || url || envText || headersText)))

  // 保留最新表单值，供 unmount 时 flush 待保存变更
  const latestValuesRef = React.useRef({
    name, transportType, command, url, argsText, envText, headersText, timeoutStr, enabled, testResult, isBuiltin, oauth,
  })
  React.useEffect(() => {
    latestValuesRef.current = {
      name, transportType, command, url, argsText, envText, headersText, timeoutStr, enabled, testResult, isBuiltin, oauth,
    }
  }, [name, transportType, command, url, argsText, envText, headersText, timeoutStr, enabled, testResult, isBuiltin, oauth])

  // 监听配置改变，清空测试结果（避免展示过期的测试结果）
  React.useEffect(() => {
    if (!server) return // 新建时不需要清空

    // 检查关键配置是否改变（包括连接相关的所有字段）
    // 注意：server.entry.command/url 可能为 undefined，需要与空字符串统一比较
    const configChanged =
      transportType !== server.entry.type ||
      (transportType === 'stdio' && command !== (server.entry.command ?? '')) ||
      (transportType !== 'stdio' && url !== (server.entry.url ?? '')) ||
      argsText !== JSON.stringify(server.entry.args ?? [], null, 2) ||
      envText !== serializeKeyValueText(server.entry.env, '=') ||
      headersText !== serializeKeyValueText(server.entry.headers, ':')

    if (configChanged) {
      setTestResult(null)
    }
  }, [transportType, command, url, argsText, envText, headersText, server])

  /** 构建 McpServerEntry */
  const buildEntry = (includeTestResult = false): McpServerEntry => {
    return buildEntryFromValues(
      {
        transportType,
        enabled,
        testResult,
        isBuiltin,
        oauth,
        command,
        argsText,
        envText,
        timeoutStr,
        url,
        headersText,
      },
      includeTestResult,
    )
  }

  const expectedEntryRef = React.useRef(server?.entry)
  const lastSaveFailedRef = React.useRef(false)
  const saveGenerationRef = React.useRef(0)
  const saveQueueRef = React.useRef<Promise<unknown>>(Promise.resolve())

  /** 执行自动保存 */
  const doSaveEntry = React.useCallback(async (serverName: string, entry: McpServerEntry, revision: number) => {
    if (!maySave()) return false
    const generation = ++saveGenerationRef.current
    if (mountedRef.current) setSaveStatus('saving')
    try {
      const config = await window.electronAPI.getWorkspaceMcpConfig(workspaceSlug)
      const newConfig: WorkspaceMcpConfig = {
        servers: { ...config.servers, [serverName]: entry },
      }
      if (isEdit && !expectedEntryRef.current) throw new Error('目标 MCP 已不存在，请重新读取列表。')
      const options = {
        ...(expectedEntryRef.current && { edit: { name: serverName, expected: expectedEntryRef.current } }),
        ...(explicitlyDisabledRef.current && !entry.enabled && { explicitlyDisabledServerNames: [serverName] }),
      }
      if (!maySave()) return false
      await window.electronAPI.saveWorkspaceMcpConfig(workspaceSlug, newConfig, options)
      const saved = await window.electronAPI.getWorkspaceMcpConfig(workspaceSlug)
      if (!saved.servers[serverName]) throw new Error('目标 MCP 已被删除，请重新读取列表。')
      expectedEntryRef.current = saved.servers[serverName]
      if (editRevisionRef.current === revision) {
        const actual = saved.servers[serverName]!
        lastSavedFormRef.current = JSON.stringify(buildEntryFromValues({ ...latestValuesRef.current, enabled: actual.enabled }, false))
        setEnabled(actual.enabled)
        setVerificationNotice(entry.enabled && !actual.enabled ? '配置已保存，但连接验证未成功。服务器保持关闭，请检查配置或授权后重试。' : '')
      }
      lastSaveFailedRef.current = false
      if (generation === saveGenerationRef.current && mountedRef.current) {
        // 编辑抽屉外的 MCP 卡片使用独立快照；每次持久化后通知其局部重读，
        // 让测试结果无需离开再进入页面即可同步显示。
        await onChanged?.()
        setFormError('')
        if (editRevisionRef.current === revision) setDirty(false)
        setSaveStatus('saved')
        setTimeout(() => {
          if (generation === saveGenerationRef.current && mountedRef.current) {
            setSaveStatus('idle')
          }
        }, 3000)
      }
      return true
    } catch (error) {
      lastSaveFailedRef.current = true
      console.error('[MCP 表单] 自动保存失败:', error)
      if (generation === saveGenerationRef.current && mountedRef.current) {
        toast.error('自动保存失败')
        setSaveStatus('error')
        setFormError(error instanceof Error ? error.message : '自动保存失败，草稿仍保留。请重试保存后再离开。')
      }
      return false
    }
  }, [workspaceSlug, onChanged, isEdit, maySave])

  const enqueueSave = React.useCallback((serverName: string, entry: McpServerEntry): Promise<boolean> => {
    const revision = editRevisionRef.current
    const next = saveQueueRef.current.catch(() => undefined).then(() => doSaveEntry(serverName, entry, revision))
    saveQueueRef.current = next
    return next
  }, [doSaveEntry])
  const doSaveEntryRef = React.useRef(enqueueSave)
  React.useEffect(() => { doSaveEntryRef.current = enqueueSave }, [enqueueSave])

  // 编辑模式下监听配置字段变化，防抖自动保存。
  // 测试结果只展示在当前表单，不能触发完整 mcp.json 保存；后者会重新验证其他已启用 MCP。
  React.useEffect(() => {
    // 仅用户修改配置后保存；不要让详情预览的挂载（含 Strict Mode 二次 effect）写回配置。
    if (!isEdit || !hasUserEditedRef.current) return
    try { if (JSON.stringify(buildEntryFromValues(latestValuesRef.current, false)) === lastSavedFormRef.current) return } catch { /* 延迟显示校验错误，保留草稿。 */ }
    const serverName = name.trim()
    if (!serverName) return
    if (transportType === 'stdio' && !command.trim()) return
    if (transportType !== 'stdio' && !url.trim()) return
    setSaveStatus('idle')
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null
      const vals = latestValuesRef.current
      try {
        const entry = buildEntryFromValues(vals, true)
        void doSaveEntryRef.current(vals.name.trim(), entry)
      } catch (error) { setFormError(error instanceof Error ? error.message : '配置无效'); setSaveStatus('error') }
    }, AUTO_SAVE_DELAY)
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [
    isEdit,
    name,
    transportType,
    command,
    url,
    argsText,
    envText,
    headersText,
    timeoutStr,
    enabled,
    retryRevision,
  ])

  // Strict Mode 会执行一次 setup → cleanup → setup；每次 setup 都恢复 mounted 状态。
  // 正常“返回”会先走 handleCancel 的 await flush，再卸载，不依赖这里的异步兜底同步 UI。
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
        if (!maySave()) return
        const vals = latestValuesRef.current
        const serverName = vals.name.trim()
        if (!serverName) return
        if (vals.transportType === 'stdio' && !vals.command.trim()) return
        if (vals.transportType !== 'stdio' && !vals.url.trim()) return
        try { const entry = buildEntryFromValues(vals, true); void doSaveEntryRef.current(serverName, entry) } catch { /* 无效草稿不覆盖磁盘配置。 */ }
      }
    }
  }, [])
  const handleTest = async (): Promise<void> => {
    const serverName = name.trim()
    if (!serverName) return

    // stdio 需要 command，http/sse 需要 url
    if (transportType === 'stdio' && !command.trim()) return
    if (transportType !== 'stdio' && !url.trim()) return

    if (testingRef.current) return
    testingRef.current = true
    const testedRevision = editRevisionRef.current
    setTesting(true)
    setTestResult(null)
    setFormError('')

    try {
      const entry = buildEntry(false) // 测试时不包含旧的测试结果
      const result = await window.electronAPI.testMcpServer(workspaceSlug, serverName, entry)
      if (testedRevision !== editRevisionRef.current || !mountedRef.current) return
      // 连接测试是孤立诊断：不能被视为配置编辑而触发完整 mcp.json 保存。
      // 否则 SAVE_MCP_CONFIG 会重新验证全部已启用条目，造成其他 MCP 重连。
      setTestResult({
        success: result.success,
        message: result.message,
        timestamp: Date.now(),
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '测试失败',
        timestamp: Date.now(),
      })
    } finally {
      testingRef.current = false
      setTesting(false)
    }
  }

  /** 提交表单（仅创建模式） */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (isEdit) return

    const serverName = name.trim()
    if (!serverName) return

    // stdio 需要 command，http/sse 需要 url
    if (transportType === 'stdio' && !command.trim()) return
    if (transportType !== 'stdio' && !url.trim()) return

    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setFormError('')
    try {
      const entry = buildEntry(true)
      const result = await window.electronAPI.installMcpAndValidate(workspaceSlug, serverName, entry)
      if (!result.installed) throw new Error('同名 MCP 已存在。请返回列表编辑现有服务器，或更换名称。')
      if (entry.enabled && !result.verification.success) toast.warning('配置已保存，连接验证失败；服务器保持关闭。')
      onSaved()
    } catch (error) {
      console.error('[MCP 表单] 保存失败:', error)
      setFormError(error instanceof Error ? error.message : '创建失败，请重试')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  /** 判断表单是否可提交 */
  const canSubmit = (): boolean => {
    if (!name.trim()) return false
    if (transportType === 'stdio' && !command.trim()) return false
    if (transportType !== 'stdio' && !url.trim()) return false
    try { buildEntry(false); return true } catch { return false }
  }

  /** 判断是否可以测试 */
  const canTest = (): boolean => {
    return canSubmit()
  }

  /** 返回/关闭：编辑模式下先 flush 待保存变更 */
  const handleCancel = React.useCallback(async (): Promise<void> => {
    if (!isEdit && Boolean(name || command || url || envText || headersText)) { setDiscardNew(true); return }
    if (isEdit && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
      const vals = latestValuesRef.current
      const serverName = vals.name.trim()
      if (serverName) {
        const isValid =
          (vals.transportType === 'stdio' && vals.command.trim()) ||
          (vals.transportType !== 'stdio' && vals.url.trim())
        if (isValid) {
          try {
            const entry = buildEntryFromValues(vals, true)
            const saved = await doSaveEntryRef.current(serverName, entry)
            if (!saved) return
          } catch (error) { setFormError(error instanceof Error ? error.message : '配置无效'); return }
        }
      }
    }
    if (isEdit && hasUserEditedRef.current) {
      try { buildEntryFromValues(latestValuesRef.current) } catch (error) { setFormError(error instanceof Error ? error.message : '配置无效'); return }
    }
    await saveQueueRef.current
    if (isEdit && lastSaveFailedRef.current) { setFormError('仍有未保存的修改，请重试保存。'); return }
    await onCancel()
  }, [isEdit, onCancel, saveStatus, name, command, url, envText, headersText])

  const handledCloseRequestRef = React.useRef(closeRequestId ?? 0)
  React.useEffect(() => {
    if (closeRequestId === undefined || closeRequestId === handledCloseRequestRef.current) return
    handledCloseRequestRef.current = closeRequestId
    void handleCancel()
  }, [closeRequestId, handleCancel])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ConfirmDialog open={discardNew} onOpenChange={setDiscardNew} title="放弃 MCP 配置草稿？" description="草稿还没有创建为服务器。已保存的 MCP 配置不会受到影响。" confirmLabel="放弃草稿并返回" onConfirm={() => { setDiscardNew(false); void onCancel() }}/>

      {verificationNotice && <p role="status" className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{verificationNotice}</p>}
      {formError && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}{isEdit && <button type="button" className="ml-3 underline" onClick={() => setRetryRevision(value => value + 1)}>重试保存</button>}</div>}
      {isEdit && <p role="status" className="text-xs text-muted-foreground">{saveStatus === 'saving' ? '正在保存…' : saveStatus === 'saved' ? '修改已保存' : saveStatus === 'error' ? '存在未保存的修改' : '配置修改将自动保存；启用前会验证连接。'}</p>}
      {/* 标题栏 + 操作按钮。内部详情页已提供统一标题与返回入口。 */}
      {showHeader && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="返回 MCP 列表" type="button" onClick={() => void handleCancel()}>
            <ArrowLeft size={18} />
          </Button>
          <h3 className="text-lg font-medium text-foreground flex-1">
            {isEdit ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
          </h3>
          {isEdit && (saveStatus === 'saved' || saveStatus === 'error') && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs',
              saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}>
              {saveStatus === 'saved' && <CheckCircle2 size={12} className="text-emerald-600" />}
              {saveStatus === 'error' && <XCircle size={12} />}
              <span>
                {saveStatus === 'saved' && '已保存'}
                {saveStatus === 'error' && '保存失败'}
              </span>
            </div>
          )}
          {!isEdit && (
            <Button size="sm" type="submit" disabled={saving || !canSubmit()}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>创建服务器</span>
            </Button>
          )}
        </div>
      )}

      {/* 基本信息 */}
      <SettingsSection title="基本信息">
        <SettingsCard>
          <SettingsInput
            label="服务器名称"
            value={name}
            onChange={(value) => { markUserEdited(); setName(value) }}
            placeholder="例如: github-mcp"
            required
            disabled={isEdit}
          />
          <SettingsSelect
            label="传输类型"
            value={transportType}
            onValueChange={(v) => { markUserEdited(); setTransportType(v as McpTransportType) }}
            options={TRANSPORT_OPTIONS}
            placeholder="选择传输类型"
            disabled={isBuiltin}
          />

          {/* stdio 专用字段 */}
          {transportType === 'stdio' && (
            <>
              <SettingsInput
                label="命令"
                value={command}
                onChange={(value) => { markUserEdited(); setCommand(value) }}
                placeholder="例如: npx"
                required
                disabled={isBuiltin}
              />
              <SettingsTextarea
                label="参数"
                value={argsText}
                onChange={(value) => { markUserEdited(); setArgsText(value) }}
                placeholder={'["-y", "@modelcontextprotocol/server-github"]'}
                description="推荐 JSON 字符串数组，支持空参数；也可每行一个参数，空格和逗号不会被拆分。"
                disabled={isBuiltin}
              />
              {/* 环境变量多行输入 */}
              <div className="px-4 py-3 space-y-2">
                <div>
                  <div className="text-sm font-medium text-foreground">环境变量</div>
                  <div className="text-xs text-muted-foreground mt-0.5">每行一个，格式: KEY=VALUE</div>
                </div>
                <textarea
                  aria-label="环境变量"
                  value={envText}
                  onChange={(e) => { markUserEdited(); setEnvText(e.target.value) }}
                  placeholder="GITHUB_TOKEN=ghp_xxx&#10;DEBUG=true"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
                />
              </div>
              <SettingsInput
                label="启动超时（秒）"
                description="MCP 服务器启动的最大等待时间，默认 30 秒"
                value={timeoutStr}
                onChange={(value) => { markUserEdited(); setTimeoutStr(value) }}
                placeholder="30"
                type="number"
              />
            </>
          )}

          {/* http/sse 专用字段 */}
          {transportType !== 'stdio' && (
            <>
              <SettingsInput
                label="URL"
                value={url}
                onChange={(value) => { markUserEdited(); setUrl(value) }}
                placeholder="例如: http://localhost:3000/mcp"
                required
              />
              {/* 请求头多行输入 */}
              <div className="px-4 py-3 space-y-2">
                <div>
                  <div className="text-sm font-medium text-foreground">请求头</div>
                  <div className="text-xs text-muted-foreground mt-0.5">每行一个，格式: Key: Value</div>
                </div>
                <textarea
                  aria-label="请求头"
                  value={headersText}
                  onChange={(e) => { markUserEdited(); setHeadersText(e.target.value) }}
                  placeholder="Authorization: Bearer xxx&#10;X-Custom-Header: value"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
                />
              </div>
            </>
          )}

          {/* 测试连接区域 */}
          <div className="px-4 py-3 space-y-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">连接测试</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  可选的诊断工具；测试结果不会影响 MCP 是否启用
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testing || !canTest()}
              >
                {testing && <Loader2 size={14} className="animate-spin" />}
                <span>{testing ? '测试中...' : '测试连接'}</span>
              </Button>
            </div>

            {/* 测试结果显示 */}
            {testResult && (
              <div
                className={cn(
                  'flex items-start gap-2 px-3 py-2 rounded-md text-sm',
                  testResult.success
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {testResult.success ? '测试成功' : '测试失败'}
                  </div>
                  <div className="text-xs mt-0.5 opacity-90">{testResult.message}</div>
                </div>
              </div>
            )}

            {/* 未测试警告 */}
            {!testResult && !testing && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="text-xs">
                  尚未测试连接。如需排查配置，可以点击"测试连接"。
                </div>
              </div>
            )}
          </div>

          {/* 启用开关 */}
          <SettingsToggle
            label="启用此服务器"
            description={
              enabled
                ? '保存后会进行真实连接验证；仅验证成功才会在 Agent 会话中加载。'
                : '关闭时该 MCP 不会在 Agent 会话中加载。'
            }
            checked={enabled}
            onCheckedChange={handleEnabledChange}
          />
        </SettingsCard>
      </SettingsSection>
    </form>
  )
}
