import { test, expect } from 'bun:test'
import { PermissionRules, commandFacts } from './rules.ts'
const ask = { mode: 'ask', plan: false } as const
const cases: Array<[string, string]> = [
  ['pwd', 'read'], ['git status --short', 'read'], ['git log --oneline', 'read'], ['git diff --stat', 'read'], ['git branch --list', 'read'], ['git remote -v', 'read'], ['ls -la', 'read'], ['bun --version', 'read'],
  ['git branch new', 'review'], ['git tag release', 'review'], ['git remote add x https://host', 'review'], ['node -e evil', 'review'], ['find . -delete', 'dangerous'], ['rm -rf /tmp/example', 'dangerous'], ['git push --force', 'dangerous'], ['sudo ls', 'dangerous'],
  ['ls && touch x', 'review'], ['ls; touch x', 'review'], ['cat a | sh', 'review'], ['ls > x', 'review'], ['ls < x', 'review'], ['ls $(touch x)', 'review'], ['ls `touch x`', 'review'], ['ls\ntouch x', 'review'], ['git -c alias.x=evil status', 'review'], ['git diff --output=x', 'review'], ['git diff --ext-diff', 'review'], ['X=y ls', 'review'], ['ls /tmp/*', 'review'], ['ls "/tmp/a"', 'review'],
]
for (const [command, risk] of cases) test(`Given ${command} When 分类 Then ${risk}`, () => expect(String(commandFacts(command).risk)).toBe(risk))
test('Given 会话授权 When 同输入/别会话/改输入/清除 Then 仅精确本会话生效', () => {
  const rules = new PermissionRules(); const request = { tool: 'Write', input: { path: 'a', content: 'x' } }
  expect(rules.evaluate('s1', ask, request).decision).toBe('ask'); rules.allowForSession('s1', ask, request)
  expect(rules.evaluate('s1', ask, request).decision).toBe('allow')
  expect(rules.evaluate('s2', ask, request).decision).toBe('ask'); expect(rules.evaluate('s1', ask, { ...request, input: { path: 'b' } }).decision).toBe('ask')
  expect(rules.evaluate('s1', { mode: 'auto', plan: true }, request).decision).toBe('deny')
  rules.clearSession('s1'); expect(rules.evaluate('s1', ask, request).decision).toBe('ask')
})
test('Given 精确命令白名单 When 后缀/复合/危险/PowerShell Then 不能放宽', () => {
  const rules = new PermissionRules([{ executable: 'npm', args: ['test'] }])
  expect(rules.evaluate('s1', ask, { tool: 'Bash', command: 'npm test' }).decision).toBe('allow')
  for (const command of ['npm test x', 'npm test && touch x']) expect(rules.evaluate('s1', ask, { tool: 'Bash', command }).decision).toBe('ask')
  expect(rules.evaluate('s1', { mode: 'auto', plan: false }, { tool: 'Bash', command: 'rm -rf x' }).decision).toBe('deny')
  expect(rules.evaluate('s1', { mode: 'auto', plan: false }, { tool: 'PowerShell', command: 'Get-Content a' }).decision).toBe('ask')
  expect(() => rules.allowForSession('s1', ask, { tool: 'PowerShell', command: 'Get-Content a' })).toThrow('不能')
})

for (const command of ['file -C', 'file --compile', 'git diff --output=/tmp/a', 'git diff --ext-diff']) test(`Given ${command} When 判断 Then 不是只读免审`, () => expect(commandFacts(command).risk).not.toBe('read'))
for (const command of ['/bin/rm -rf x', 'git push -f origin main', 'git reset --hard']) test(`Given ${command} When 判断 Then 默认拒绝`, () => expect(new PermissionRules().evaluate('s', { mode: 'auto', plan: false }, { tool: 'Bash', command }).decision).toBe('deny'))

test('Given shell工具路径或判定/执行命令不一致 When 白名单判定 Then 不能绕过', () => {
  const rules = new PermissionRules()
  expect(rules.evaluate('s1', { mode: 'auto', plan: false }, { tool: 'C:\\Windows\\System32\\powershell.exe', command: 'Get-Content a' }).decision).toBe('ask')
  expect(rules.evaluate('s1', ask, { tool: 'Bash', command: 'pwd', input: { command: 'rm -rf a' } }).decision).toBe('deny')
  expect(commandFacts('git log --show-signature').risk).toBe('review')
})

for (const command of ['git push --force=true', 'git -C repo push -f origin main', '/usr/bin/git push --force-with-lease', 'git branch -D main', 'del.exe /S C:\\data']) test(`Given ${command} When auto判定 Then 仍默认拒绝`, () => expect(new PermissionRules().evaluate('s', { mode: 'auto', plan: false }, { tool: 'Bash', command }).decision).toBe('deny'))

for (const tool of ['Bash.exe', 'cmd.exe', 'custom-runner']) test(`Given ${tool}携带危险command When auto判定 Then 不因工具别名绕过`, () => expect(new PermissionRules().evaluate('s', { mode: 'auto', plan: false }, { tool, command: 'rm -rf x' }).decision).toBe('deny'))

test('Given Read等只读名称携带command When read-only策略 Then 按执行操作处理不能被名称放行', () => {
  expect(new PermissionRules().evaluate('s', { mode: 'read-only', plan: false }, { tool: 'Read', command: 'touch a' }).decision).toBe('deny')
})
