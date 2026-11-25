import { test, expect } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openJournal } from './index.ts'
import { LeaseStore } from './lease.ts'

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'proma-lease-')); const path = join(dir, 'journal.db')
  const first = await openJournal(path); const second = await openJournal(path)
  first.db.exec("INSERT INTO sessions VALUES ('s1', '{}')")
  let now = 1000
  return { first, second, a: new LeaseStore(first, () => now), b: new LeaseStore(second, () => now),
    time: (value: number) => { now = value }, close: () => { first.close(); second.close(); rmSync(dir, { recursive: true, force: true }) } }
}

test('Given 双连接 When 同时申请 lease Then 仅一方持有且旧 fence 拒绝', async () => {
  const f = await fixture()
  try {
    const first = f.a.claim('s1', 'desktop')
    expect(first.expiresAt).toBe(31000)
    expect(() => f.b.claim('s1', 'mobile')).toThrow('lease')
    expect(() => f.b.claim('s1', 'desktop')).toThrow('lease')
    const takeover = f.b.claim('s1', 'mobile', true)
    expect(takeover.fence).toBe(first.fence + 1)
    expect(() => f.a.assert(first)).toThrow('lease')
    expect(() => f.a.renew(first)).toThrow('lease')
    expect(() => f.a.release(first)).toThrow('lease')
    expect(f.b.assert(takeover)).toEqual(takeover)
  } finally { f.close() }
})
test('Given 持有者 When 续租与到期 Then 固定 fence 且过期不能续租', async () => {
  const f = await fixture()
  try {
    const proof = f.a.claim('s1', 'desktop'); f.time(11000)
    expect(f.a.renew(proof).expiresAt).toBe(41000)
    expect(f.a.assert(proof).fence).toBe(proof.fence)
    f.time(41000)
    expect(() => f.a.assert(proof)).toThrow('lease')
    expect(() => f.a.renew(proof)).toThrow('lease')
    expect(f.b.claim('s1', 'mobile').fence).toBe(proof.fence + 1)
  } finally { f.close() }
})
test('Given 释放 lease When 重领 Then fence 不归零且旧 claim 无效', async () => {
  const f = await fixture()
  try {
    const old = f.a.claim('s1', 'same-holder'); f.a.release(old)
    const next = f.b.claim('s1', 'same-holder')
    expect(next.fence).toBe(old.fence + 1)
    expect(next.claimKeyId).not.toBe(old.claimKeyId)
    expect(() => f.a.assert(old)).toThrow('lease')
    expect(() => f.a.assert({ ...next, claimKeyId: old.claimKeyId })).toThrow('lease')
  } finally { f.close() }
})
test('Given 不存在的会话或无效时钟 When 申请 Then 不写入租约', async () => {
  const f = await fixture()
  try {
    expect(() => f.a.claim('missing', 'desktop')).toThrow()
    expect(() => new LeaseStore(f.first, () => -1).claim('s1', 'desktop')).toThrow()
    expect(f.first.db.prepare('SELECT * FROM leases').all()).toEqual([])
  } finally { f.close() }
})

test('Given 两个独立进程同时抢占 When SQLite 争用 Then 只有一个成功', async () => {
  const f = await fixture()
  const path = join(import.meta.dir, 'index.ts'); const leases = join(import.meta.dir, 'lease.ts')
  const database = f.first.db.prepare('PRAGMA database_list').get()?.file
  if (typeof database !== 'string') throw new Error('数据库路径缺失')
  const children = ['process-a', 'process-b'].map((holder) => Bun.spawn([process.execPath, '-e', `
    import { openJournal } from ${JSON.stringify(path)}
    import { LeaseStore } from ${JSON.stringify(leases)}
    const journal=await openJournal(${JSON.stringify(database)})
    console.log('ready')
    await Bun.stdin.text()
    try { new LeaseStore(journal).claim('s1', ${JSON.stringify(holder)}); console.log('winner') }
    catch(error) { if(!String(error).includes('lease')) throw error; console.log('conflict') }
    finally { journal.close() }
  `], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' }))
  try {
    const readers = children.map((child) => child.stdout.getReader())
    for (const reader of readers) {
      const ready = await reader.read(); expect(new TextDecoder().decode(ready.value)).toContain('ready')
    }
    for (const child of children) { child.stdin.write('go'); child.stdin.end() }
    const output = await Promise.all(children.map(async (child, index) => {
      const reader = readers[index]
      if (!reader) throw new Error('缺少进程输出流')
      let text = ''
      for (;;) { const part = await reader.read(); if (part.done) break; text += new TextDecoder().decode(part.value) }
      expect(await child.exited, await new Response(child.stderr).text()).toBe(0)
      return text.trim()
    }))
    expect(output.sort()).toEqual(['conflict', 'winner'])
  } finally { for (const child of children) { child.kill(); await child.exited }; f.close() }
}, 15000)

test('Given 转移预期fence When 另一连接已接管 Then compare-and-swap在同一事务内拒绝',async()=>{
 const f=await fixture();try{
  const first=f.a.claim('s1','desktop'),second=f.b.claim('s1','mobile',true,first.fence)
  expect(()=>f.a.claim('s1','stale',true,first.fence)).toThrow('fence')
  expect(f.b.inspect('s1')?.holderId).toBe('mobile')
  const third=f.a.claim('s1','desktop',true,second.fence);expect(third.fence).toBe(second.fence+1)
 }finally{f.close()}
})
