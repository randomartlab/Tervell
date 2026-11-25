import { describe, it, expect } from 'bun:test'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { jsonlLinesSync, jsonlLines } from '../apps/electron/src/main/lib/jsonl-reader'
import { writeHistorySnapshot } from '../apps/electron/src/main/lib/history-snapshot'
import { writeTextChunksAtomic } from '../apps/electron/src/main/lib/safe-file'
import { setSessionMessagesCache, messageArrayBytes, AGENT_MSG_CACHE_BYTES } from '../apps/electron/src/renderer/lib/message-cache'
import { createLocalSearchRecords, searchLocalSessionMessages } from '../apps/electron/src/renderer/lib/session-message-search'
import type { SDKMessage } from '@proma/shared'
import { unpackedResourcePath } from '../apps/electron/src/main/lib/packaged-path'
import { setSessionPreviewCache, SESSION_PREVIEW_CACHE_LIMIT } from '../apps/electron/src/renderer/lib/session-preview-cache'

describe('超长历史的完整性与内存预算', () => {
  it('Given 长期打开和关闭会话 When 保存悬浮预览 Then 淘汰旧会话且只复制220字符预览不保留完整正文', () => {
    let cache = new Map<string, Array<{id:string;role:string;preview:string}>>()
    const source = [{id:'long',role:'assistant',preview:'完整🙂'.repeat(100000)}]
    cache = setSessionPreviewCache(cache,'first',source)
    expect(cache.get('first')?.[0]?.preview).toBe(source[0]!.preview.slice(0,220))
    expect(cache.get('first')).not.toBe(source);expect(source[0]!.preview.length).toBeGreaterThan(220)
    for (let i=0;i<100;i++) cache=setSessionPreviewCache(cache,String(i),[{id:String(i),role:'user',preview:'当前预览'}])
    expect(cache.size).toBe(SESSION_PREVIEW_CACHE_LIMIT);expect(cache.has('first')).toBe(false);expect(cache.has('99')).toBe(true)
    cache=setSessionPreviewCache(cache,'large',Array.from({length:20000},(_,i)=>({id:String(i),role:'assistant',preview:'字'.repeat(220)})))
    expect(cache.has('large')).toBe(false);expect(cache.size).toBeLessThanOrEqual(SESSION_PREVIEW_CACHE_LIMIT)
  })
  it('Given Windows 和 macOS 安装路径，When 加载原生编译器，Then 均使用真实解包目录且保留中文空格', () => {
    expect(unpackedResourcePath('C:\\Tervell 安装\\resources\\app.asar\\node_modules\\esbuild\\lib\\main.js')).toBe('C:\\Tervell 安装\\resources\\app.asar.unpacked\\node_modules\\esbuild\\lib\\main.js')
    expect(unpackedResourcePath('/Tervell 安装/app.asar/node_modules/esbuild/lib/main.js')).toBe('/Tervell 安装/app.asar.unpacked/node_modules/esbuild/lib/main.js')
    expect(unpackedResourcePath('/folder/app.asar.unpacked/node_modules')).toBe('/folder/app.asar.unpacked/node_modules')
  })
  it('Given 跨块 Unicode、长单行和末尾无换行，When 逐行扫描，Then 字节和记录顺序完整', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tervell-jsonl-'))
    try {
      const file = join(root, 'history.jsonl')
      const expected = [' '.repeat(65535) + '中文😀', '单行'.repeat(80000), 'end']
      writeFileSync(file, expected.join('\r\n'))
      expect([...jsonlLinesSync(file)].map(r => r.line.replace(/\r$/, ''))).toEqual(expected)
      const actual: string[] = []
      for await (const row of jsonlLines(file)) actual.push(row.line)
      expect(actual).toEqual(expected)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
  it('Given 推理、工具输入结果及截止点，When 流式分叉，Then 保留全部相关内容且不包含后续记录', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tervell-snapshot-'))
    try {
      const file = join(root, 'snapshot.md')
      async function* messages(): AsyncGenerator<SDKMessage> {
        yield { type: 'assistant', uuid: 'tool', message: { content: [{ type: 'thinking', thinking: '原始推理' }, { type: 'tool_use', id: 't', name: 'read', input: { path: '完整文件' } }] } } as SDKMessage
        yield { type: 'user', uuid: 'result', message: { content: [{ type: 'tool_result', tool_use_id: 't', content: '完整结果'.repeat(200000) }] } } as SDKMessage
        yield { type: 'assistant', uuid: 'cut', message: { content: [{ type: 'text', text: '截止回答' }] } } as SDKMessage
        throw Error('不能读取截止点之后')
      }
      const result = await writeHistorySnapshot(file, messages(), 'cut')
      const text = readFileSync(file, 'utf8')
      expect(result.bytes).toBe(Buffer.byteLength(text))
      expect(text).toContain('原始推理'); expect(text).toContain('完整结果'.repeat(200000)); expect(text).toContain('截止回答')
      await expect(writeHistorySnapshot(file, (async function* () {})(), 'missing')).rejects.toThrow('截断消息不存在')
      expect(readFileSync(file, 'utf8')).toBe(text)
      expect(readdirSync(root)).toEqual(['snapshot.md'])
      await expect(writeTextChunksAtomic(file, (async function* () { yield 'partial'; throw Error('fixture') })())).rejects.toThrow('fixture')
      expect(readFileSync(file, 'utf8')).toBe(text)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
  it('Given 多条大历史与超大活动会话，When 切换缓存，Then 总容量和条数均有界', () => {
    let cache = new Map<string, SDKMessage[]>()
    for (let i = 0; i < 30; i++) cache = setSessionMessagesCache(cache, String(i), [{ type: 'assistant', uuid: String(i), message: { content: 'x'.repeat(1024 * 1024) } } as SDKMessage])
    expect(cache.size).toBeLessThanOrEqual(20)
    expect([...cache.values()].reduce((sum, messages) => sum + messageArrayBytes(messages), 0)).toBeLessThanOrEqual(AGENT_MSG_CACHE_BYTES)
    const large = [{ type: 'assistant', message: { content: 'x'.repeat(AGENT_MSG_CACHE_BYTES) } } as SDKMessage]
    cache = setSessionMessagesCache(cache, 'large', large)
    expect(cache.has('large')).toBe(false)
    expect(large[0]).toBeDefined()
  })
  it('Given 搜索未打开，When 准备记录，Then 不生成常驻逐字索引且搜索保持 Unicode 坐标', () => {
    const records = createLocalSearchRecords([{ messageId: 'a', role: 'assistant', text: '前缀，完整中文推理，后缀' }])
    expect(records[0]?.normalizedText).toBeUndefined()
    expect(searchLocalSessionMessages(records, '中文推理').results[0]?.messageId).toBe('a')
    expect(searchLocalSessionMessages(records, '中文推理').results[0]?.matchLength).toBe(4)
    const boundary = createLocalSearchRecords([{ messageId: 'b', role: 'assistant', text: 'x'.repeat(8190) + '中文' + ' '.repeat(20000) + '推理😀' }])
    expect(searchLocalSessionMessages(boundary, '中文推理').results[0]?.matchLength).toBe(20004)
  })
})
