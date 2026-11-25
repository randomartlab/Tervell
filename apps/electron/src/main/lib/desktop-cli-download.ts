import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { setTimeout as delay } from 'node:timers/promises'

interface DownloadOptions {
  signal: AbortSignal
  fetch: (url: string, init?: RequestInit) => Promise<Response>
  output: (message: string) => void
  retryDelayMs?: number
}

/** 发行物先写独立临时文件，校验后才启用；网络中断不会留下被误认成完整下载的文件。 */
export async function downloadCliFile(url: string, file: string, expected: string | undefined, options: DownloadOptions): Promise<string> {
  if (new URL(url).protocol !== 'https:') throw Error('安装发行物必须使用 HTTPS')
  if (existsSync(file)) throw Error('安装下载目标已存在，未覆盖原文件')
  mkdirSync(dirname(file), { recursive: true })
  for (let attempt = 1; attempt <= 3; attempt++) {
    options.signal.throwIfAborted()
    const temporary = file + '.' + randomUUID() + '.part'
    let retryable = false
    try {
      options.output(`下载 ${new URL(url).hostname} · 第 ${attempt} 次…\r\n`)
      let response: Response
      try { response = await options.fetch(url, { signal: AbortSignal.any([options.signal, AbortSignal.timeout(180000)]) }) }
      catch (error) { retryable = true; throw error }
      if (!response.ok || !response.body) {
        retryable = [408, 425, 429].includes(response.status) || response.status >= 500
        await response.body?.cancel()
        throw Error(`下载未完成 (${response.status})`)
      }
      const hash = createHash('sha256')
      let count = 0, oversized = false
      const source = Readable.fromWeb(response.body as unknown as import('node:stream/web').ReadableStream<Uint8Array>)
      source.on('data', (chunk: Buffer) => {
        hash.update(chunk); count += chunk.length
        if (count > 1024 * 1024 * 1024) { oversized = true; source.destroy(Error('安装发行物超过 1GB')) }
      })
      try { await pipeline(source, createWriteStream(temporary, { flags: 'wx', mode: 0o600 }), { signal: options.signal }) }
      catch (error) { retryable = !oversized && !(error && typeof error === 'object' && 'code' in error && ['ENOSPC', 'EACCES', 'EPERM'].includes(String(error.code))); throw error }
      const digest = hash.digest('hex')
      if (expected && digest !== expected) throw Error('发行物 SHA-256 校验失败，未启用内核')
      options.signal.throwIfAborted()
      if (existsSync(file)) throw Error('安装下载目标已存在，未覆盖原文件')
      renameSync(temporary, file)
      options.output(expected ? '发行物校验通过\r\n' : '上游未提供摘要；已记录实际下载 SHA-256\r\n')
      return digest
    } catch (error) {
      if (options.signal.aborted) options.signal.throwIfAborted()
      if (!retryable || attempt === 3) throw error
      options.output('网络下载中断，正在自动重试…\r\n')
      await delay((options.retryDelayMs ?? 600) * attempt, undefined, { signal: options.signal })
    } finally { rmSync(temporary, { force: true }) }
  }
  throw Error('安装下载未完成')
}
