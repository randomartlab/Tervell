import { unlink } from 'node:fs/promises'
import { jsonlLines } from '../main/lib/jsonl-reader'
import { writeTextChunksAtomic } from '../main/lib/safe-file'
import type { PiForkRequest, PiForkResult } from '../main/lib/pi-fork-client'

const parent = (process as typeof process & { parentPort?: {
  on(event: 'message', handler: (event: { data: PiForkRequest }) => void): void
  postMessage(value: { result?: PiForkResult; error?: string }): void
} }).parentPort
if (!parent) throw Error('历史分叉需要独立 utility process')
parent.on('message', async (event) => {
  const input = event.data as PiForkRequest
  let path: string | undefined
  try {
    const { SessionManager } = await import('@earendil-works/pi-coding-agent')
    const manager = SessionManager.open(input.sourcePath, input.sessionDir, input.sourceCwd)
    path = manager.createBranchedSession(input.entryId)
    if (!path) throw Error('Pi 未能生成分叉 session artifact')
    const branchPath = path
    // createBranchedSession 已生成新的 session id；只改目标 cwd，避免 forkFrom 再读整棵树。
    async function* relocated(): AsyncGenerator<string> {
      let first = true
      for await (const { line } of jsonlLines(branchPath)) {
        if (first && line.trim()) {
          const header = JSON.parse(line)
          if (header.type !== 'session') throw Error('Pi 分叉文件头无效')
          yield JSON.stringify({ ...header, cwd: input.targetCwd, parentSession: input.sourcePath }) + '\n'
          first = false
        } else yield line + '\n'
      }
    }
    await writeTextChunksAtomic(path, relocated())
    const bindings = Object.fromEntries(Object.entries(input.bindings).filter(([, id]) => Boolean(manager.getEntry(id))))
    parent!.postMessage({ result: { path, id: manager.getSessionId(), bindings } })
  } catch (error) {
    if (path) await unlink(path).catch(() => undefined)
    parent!.postMessage({ error: error instanceof Error ? error.message : 'Pi 分叉失败' })
  }
})
