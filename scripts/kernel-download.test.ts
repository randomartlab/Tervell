import { expect, test } from 'bun:test'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { downloadCliFile } from '../apps/electron/src/main/lib/desktop-cli-download'

test('Given 下载503和流中断 When 一键安装重试 Then 校验后才留下完整发行物且清理临时文件', async () => {
  const root = mkdtempSync(join(tmpdir(), 'tervell-download-')), file = join(root, 'agent.bin')
  let calls = 0
  const fetcher = async () => {
    calls++
    if (calls === 1) return new Response('temporary', { status: 503 })
    if (calls === 2) return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('half')); controller.error(Error('network interrupted')) } }))
    return new Response('complete发行物')
  }
  try {
    const hash = createHash('sha256').update('complete发行物').digest('hex')
    expect(await downloadCliFile('https://example.invalid/agent', file, hash, { signal: new AbortController().signal, fetch: fetcher, output: () => {}, retryDelayMs: 1 })).toBe(hash)
    expect(calls).toBe(3); expect(readFileSync(file, 'utf8')).toBe('complete发行物'); expect(readdirSync(root)).toEqual(['agent.bin'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Given 摘要错误或用户取消 When 下载 Then 不重试校验错误且不残留半包', async () => {
  const root = mkdtempSync(join(tmpdir(), 'tervell-download-invalid-'))
  let calls = 0
  const fetcher = async () => { calls++; return new Response('invalid') }
  try {
    await expect(downloadCliFile('https://example.invalid/agent', join(root, 'agent'), '0'.repeat(64), { signal: new AbortController().signal, fetch: fetcher, output: () => {} })).rejects.toThrow('SHA-256')
    expect(calls).toBe(1); expect(readdirSync(root)).toEqual([])
    const controller = new AbortController(); controller.abort()
    await expect(downloadCliFile('https://example.invalid/agent', join(root, 'agent'), undefined, { signal: controller.signal, fetch: fetcher, output: () => {} })).rejects.toThrow()
    expect(calls).toBe(1); expect(readdirSync(root)).toEqual([])
  } finally { rmSync(root, { recursive: true, force: true }) }
})
