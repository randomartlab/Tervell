import { expect, test } from 'bun:test'
import { parseMcpArguments, parseMcpKeyValues, parseMcpTimeout } from './mcp-form.ts'
import { mergeMcpServerEdit } from './mcp-config.ts'
import type { McpServerEntry } from '../types/agent.ts'

test('Given 图形化MCP参数包含路径、逗号和空字符串 When 解析及恢复 Then 原样保留参数边界', () => {
  const args = ['-y', 'C:\\my folder\\a,b.txt', '', '--filter=x,y', '  两端空格  ']
  expect(parseMcpArguments(JSON.stringify(args, null, 2))).toEqual(args)
  expect(parseMcpArguments('-y\n--filter=x,y\nC:\\my folder\\path')).toEqual(['-y', '--filter=x,y', 'C:\\my folder\\path'])
  for (const invalid of ['["ok", 1]', '["未结束"']) expect(() => parseMcpArguments(invalid)).toThrow()
})
test('Given MCP环境与请求头 When 无效、重复或值内含分隔符 Then 拒绝错误且不静默丢行', () => {
  expect(parseMcpKeyValues('TOKEN=a=b\nPATH=C:\\folder', '=')).toEqual({ TOKEN: 'a=b', PATH: 'C:\\folder' })
  expect(parseMcpKeyValues('Authorization: Bearer a:b', ':')).toEqual({ Authorization: 'Bearer a:b' })
  for (const text of ['缺少等号', 'A=1\nA=2', '=empty', 'bad name=1']) expect(() => parseMcpKeyValues(text, '=')).toThrow()
  expect(() => parseMcpKeyValues('X-Key: a\nx-key: b', ':')).toThrow()
  for (const text of ['0', '-1', '3abc', '1.5', '601']) expect(() => parseMcpTimeout(text)).toThrow()
  expect(parseMcpTimeout('')).toBeUndefined()
  expect(parseMcpTimeout('45')).toBe(45)
})
test('Given 两个窗口编辑不同MCP When 单条保存 Then 保留无关连接并拒绝相同条目的旧快照', () => {
  const first: McpServerEntry = { type: 'stdio', command: 'tool', args: ['a,b'], enabled: false }
  const other: McpServerEntry = { type: 'http', url: 'https://mcp.test', enabled: true }
  const current = { servers: { first, other } }, next = { ...first, args: ['new'] }
  const saved = mergeMcpServerEdit(current, 'first', first, next)
  expect(saved.servers.other).toBe(other)
  expect(current.servers.first).toBe(first)
  expect(() => mergeMcpServerEdit(saved, 'first', first, first)).toThrow('其他操作')
  expect(() => mergeMcpServerEdit({ servers: {} }, 'first', first, next)).toThrow()
  expect(mergeMcpServerEdit({ servers: { first: { ...first, lastTestResult: { success: true, message: 'test', timestamp: 1 } } } }, 'first', first, next).servers.first).toEqual(next)
})
