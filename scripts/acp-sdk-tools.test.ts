import { expect, test } from 'bun:test'
import { DesktopAcpTools } from '../apps/electron/src/main/lib/desktop-acp-tools'

test('Given 工具先发布占位再补标题参数 When 完成 Then 同UUID替换预览且完整持久化一次', () => {
  const tools = new DesktopAcpTools('fixture'), initial = tools.call({ id: 't', name: 'execute', kind: 'execute', status: 'pending' })[0]!
  expect(initial.persist).toBe(false)
  const patched = tools.update('t', { title: '执行命令', input: { command: 'echo OK' }, metadata: { phase: 'started' } })[0]!
  expect((patched.message as {uuid?:string}).uuid).toBe((initial.message as {uuid?:string}).uuid); expect(patched.persist).toBe(false)
  const complete = tools.update('t', { status: 'succeeded', result: 'OK' })
  expect(complete).toHaveLength(2); expect(complete.every(row => row.persist)).toBe(true)
  expect(complete[0]!.message).toMatchObject({ uuid: (initial.message as {uuid?:string}).uuid, message: { content: [{ name: 'execute', input: { command: 'echo OK' }, _acpTitle: '执行命令', _acpMetadata: { phase: 'started' } }] } })
  expect(complete[0]!.message).not.toHaveProperty('_partial')
  expect(tools.update('t', { status: 'succeeded', result: 'duplicate' })).toEqual([])
  expect(tools.drain()).toEqual([])
})

test('Given 并发工具中途取消 When 回收 Then 未完成工具仍保留最后参数且释放状态', () => {
  const tools = new DesktopAcpTools('fixture')
  tools.call({ id: 'a', name: 'read', kind: 'read', status: 'pending' }); tools.call({ id: 'b', name: 'exec', kind: 'execute', status: 'pending' })
  tools.update('a', { input: { path: 'unicode中文' } })
  const remaining = tools.drain(); expect(remaining).toHaveLength(2); expect(JSON.stringify(remaining)).toContain('unicode中文'); expect(tools.drain()).toEqual([])
})

test('Given 工具初始帧已完成 When 投影 Then 立即保存调用和结果而不是永远等待patch',()=>{
 const rows=new DesktopAcpTools('fixture').call({id:'done',name:'read',kind:'read',status:'succeeded',result:'already-done'})
 expect(rows).toHaveLength(2);expect(rows.every(row=>row.persist)).toBe(true);expect(JSON.stringify(rows)).toContain('already-done')
})
