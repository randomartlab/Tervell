const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
/** 各内核统一工具名/参数投影到真实语义，供导出与增强时间线共用。 */
export function paseoToolDetail(name: string, input: unknown, output: unknown): Record<string, unknown> {
  const args = record(input),
    text = typeof output === 'string' ? output : output === null || output === undefined ? '' : JSON.stringify(output, null, 2),
    kind = name.toLowerCase().replace(/^.*__/, ''),
    path = String(args.file_path ?? args.filePath ?? args.path ?? '');
  if (['bash', 'shell', 'powershell', 'terminal', 'exec_command', 'run_command'].includes(kind)) return {
    type: 'shell',
    command: String(args.command ?? args.cmd ?? ''),
    ...(args.cwd ? {
      cwd: args.cwd
    } : {}),
    output: text
  };
  if (['read', 'read_file', 'file_read'].includes(kind) && path) return {
    type: 'read',
    filePath: path,
    content: text,
    ...(typeof args.offset === 'number' ? {
      offset: args.offset
    } : {}),
    ...(typeof args.limit === 'number' ? {
      limit: args.limit
    } : {})
  };
  if (['write', 'write_file', 'file_write'].includes(kind) && path) return {
    type: 'write',
    filePath: path,
    content: String(args.content ?? args.text ?? '')
  };
  if (['edit', 'edit_file', 'file_edit'].includes(kind) && path) return {
    type: 'edit',
    filePath: path,
    oldString: String(args.old_string ?? args.oldText ?? ''),
    newString: String(args.new_string ?? args.newText ?? '')
  };
  if (['grep', 'glob', 'find', 'search', 'web_search'].includes(kind)) return {
    type: 'search',
    query: String(args.pattern ?? args.query ?? ''),
    content: text
  };
  if (['webfetch', 'web_fetch', 'fetch'].includes(kind) && typeof args.url === 'string') return {
    type: 'fetch',
    url: args.url,
    result: text
  };
  return {
    type: 'unknown',
    input: input ?? null,
    output: output ?? null
  };
}
