/** 合成记录，不读取日常会话。分别用独立进程运行 before / after，避免 GC 互相污染。 */
import { createHash } from 'node:crypto'
import { mkdtempSync, openSync, writeSync, closeSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { jsonlLines } from '../apps/electron/src/main/lib/jsonl-reader'
import { writeHistorySnapshot } from '../apps/electron/src/main/lib/history-snapshot'
import type { SDKMessage } from '@proma/shared'

const mode = process.argv[2]
if (!['fixture', 'before', 'after'].includes(mode ?? '')) throw Error('使用 fixture 或 before/after <fixture-directory>')
const directory = mode === 'fixture' ? mkdtempSync(join(tmpdir(), 'tervell-long-history-')) : resolve(process.argv[3] ?? '')
const input = join(directory, 'history.jsonl')
if (mode === 'fixture') {
  const file = openSync(input, 'wx', 0o600)
  try {
    for (let i = 0; i < 8000; i++) writeSync(file, JSON.stringify({ type: i % 2 ? 'assistant' : 'user', uuid: 'msg-' + i,
      message: { content: [{ type: 'text', text: ('完整中文上下文 abcdefghijklmnopqrstuvwxyz ' + i + '\n').repeat(160) }] }, _createdAt: i }) + '\n')
  } finally { closeSync(file) }
  console.log(JSON.stringify({ directory, inputBytes: statSync(input).size }))
} else {
  const cutoff = 'msg-5999', output = join(directory, mode + '.md'), start = performance.now()
  const sourceHash = createHash('sha256').update(readFileSync(input)).digest('hex')
  let contentHash = ''
  if (mode === 'before') {
    const messages = readFileSync(input, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line) as { uuid: string; type: string; message: { content: Array<{ text: string }> } })
    const end = messages.findIndex(message => message.uuid === cutoff)
    const text = messages.slice(0, end + 1).map(message => `[${message.type === 'user' ? 'user_message' : 'assistant_message'}]\n${message.message.content.map(part => part.text).join('')}\n\n`).join('')
    writeFileSync(output, text, { mode: 0o600 })
    contentHash = createHash('sha256').update(text).digest('hex')
  } else {
    async function* messages(): AsyncGenerator<SDKMessage> {
      for await (const { line } of jsonlLines(input)) if (line.trim()) yield JSON.parse(line) as SDKMessage
    }
    contentHash = (await writeHistorySnapshot(output, messages(), cutoff)).digest
  }
  console.log(JSON.stringify({ mode, inputBytes: statSync(input).size, outputBytes: statSync(output).size, contentHash, sourceHash,
    durationMs: performance.now() - start, peakRssKiB: process.resourceUsage().maxRSS, heapBytes: process.memoryUsage().heapUsed,
    rssBytes: process.memoryUsage().rss }))
}
