/**
 * 崩溃安全的 JSON 文件读写工具
 *
 * 解决系统强制关机/崩溃时 JSON 索引文件被截断导致数据丢失的问题。
 * - 写入：write-to-temp → rename（POSIX 原子操作）+ .bak 备份
 * - 读取：主文件 → .tmp 残留 → .bak 回退，多层容错
 */

import { closeSync, copyFileSync, existsSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync, readSync, writeSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import { open, rename, unlink } from 'node:fs/promises'

/**
 * 原子写入 JSON 文件：write-to-temp → rename
 * 写入前自动保留 .bak 备份
 */
export function writeJsonFileAtomic(filePath: string, data: object, skipBackup = false): void {
  const tmpPath = filePath + '.tmp'
  const bakPath = filePath + '.bak'

  // 备份当前文件（如果存在且可读）
  if (!skipBackup && existsSync(filePath)) {
    try {
      copyFileSync(filePath, bakPath)
    } catch {
      // 备份失败不阻塞写入
    }
  }

  // 写入临时文件
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')

  // 原子重命名（POSIX rename 是原子操作）
  renameSync(tmpPath, filePath)
}

/**
 * 原子重写文本文件（用于 JSONL 会话等非单个 JSON 文档）。
 *
 * Never use a predictable `<target>.tmp`: an attacker with access to the
 * directory could pre-create it as a symlink. `wx` creates a private sibling
 * exclusively, and rename replaces the target itself rather than following it.
 */
export function writeTextFileAtomic(filePath: string, content: string): void {
  writeBytesFileAtomic(filePath, Buffer.from(content, 'utf-8'))
}

/** 与文本写入共享独占临时文件及原子替换，用于插件文件编辑器。 */
export function writeBytesFileAtomic(filePath: string, content: Uint8Array): void {
  const parent = dirname(filePath)
  const stem = basename(filePath)
  let tmpPath: string | null = null
  let descriptor: number | null = null
  try {
    for (let attempt = 0; attempt < 16; attempt++) {
      const candidate = join(parent, `.${stem}.proma-${randomBytes(12).toString('hex')}.tmp`)
      try {
        descriptor = openSync(candidate, 'wx', 0o600)
        tmpPath = candidate
        break
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') continue
        throw error
      }
    }
    if (descriptor === null || tmpPath === null) throw new Error(`无法为原子写入创建临时文件: ${filePath}`)
    writeFileSync(descriptor, content)
    closeSync(descriptor)
    descriptor = null
    renameSync(tmpPath, filePath)
    tmpPath = null
  } finally {
    if (descriptor !== null) closeSync(descriptor)
    if (tmpPath !== null) {
      try { unlinkSync(tmpPath) } catch { /* best-effort cleanup */ }
    }
  }
}

/**
 * 安全读取 JSON 索引文件
 * 优先读主文件，损坏则尝试 .tmp / .bak，都失败返回 null
 */
export function readJsonFileSafe<T>(filePath: string): T | null {
  const tmpPath = filePath + '.tmp'
  const bakPath = filePath + '.bak'

  // 1. 尝试读取主文件
  if (existsSync(filePath)) {
    try {
      const raw = readFileSync(filePath, 'utf-8')
      if (raw.trim().length > 0) {
        return JSON.parse(raw) as T
      }
    } catch {
      console.warn(`[数据恢复] 主索引文件损坏: ${filePath}`)
    }
  }

  // 2. 检查是否有未完成的 .tmp 文件（上次 rename 前崩溃）
  if (existsSync(tmpPath)) {
    try {
      const raw = readFileSync(tmpPath, 'utf-8')
      if (raw.trim().length > 0) {
        const parsed = JSON.parse(raw) as T
        // .tmp 有效 → 提升为主文件
        renameSync(tmpPath, filePath)
        console.log(`[数据恢复] 从 .tmp 文件恢复: ${filePath}`)
        return parsed
      }
    } catch {
      // .tmp 也损坏，继续 fallback
    }
    // 清理无效的 .tmp
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
  }

  // 3. Fallback 到 .bak
  if (existsSync(bakPath)) {
    try {
      const raw = readFileSync(bakPath, 'utf-8')
      if (raw.trim().length > 0) {
        const parsed = JSON.parse(raw) as T
        // 用 .bak 恢复主文件（跳过备份，避免用损坏的主文件覆盖好的 .bak）
        writeJsonFileAtomic(filePath, parsed as object, true)
        console.log(`[数据恢复] 从 .bak 文件恢复: ${filePath}`)
        return parsed
      }
    } catch {
      console.error(`[数据恢复] .bak 文件也损坏: ${bakPath}`)
    }
  }

  return null // 全部失败，需要上层从 JSONL 重建
}

/** 大文件快照：固定内存逐块复制，独占临时文件，完成后原子替换。 */
export function copyFileAtomic(sourcePath: string, targetPath: string): void {
  const temporary = join(dirname(targetPath), `.${basename(targetPath)}.proma-${randomBytes(12).toString('hex')}.tmp`)
  let source: number | undefined, destination: number | undefined
  try {
    source = openSync(sourcePath, 'r')
    destination = openSync(temporary, 'wx', 0o600)
    const buffer = Buffer.allocUnsafe(256 * 1024)
    for (;;) {
      const count = readSync(source, buffer, 0, buffer.length, null)
      if (!count) break
      let offset = 0
      while (offset < count) offset += writeSync(destination, buffer, offset, count - offset, null)
    }
    closeSync(source); source = undefined
    closeSync(destination); destination = undefined
    renameSync(temporary, targetPath)
  } finally {
    if (source !== undefined) closeSync(source)
    if (destination !== undefined) closeSync(destination)
    try { unlinkSync(temporary) } catch { /* 成功 rename 后临时文件不存在。 */ }
  }
}

/** 有背压的逐块写入；失败不发布部分历史，使用独占同目录临时文件。 */
export async function writeTextChunksAtomic(filePath: string, chunks: AsyncIterable<string>): Promise<void> {
  const temporary = join(dirname(filePath), `.${basename(filePath)}.tervell-${randomBytes(12).toString('hex')}.tmp`)
  const file = await open(temporary, 'wx', 0o600)
  try {
    for await (const chunk of chunks) await file.writeFile(chunk, 'utf8')
    await file.close()
    await rename(temporary, filePath)
  } finally {
    await file.close().catch(() => undefined)
    await unlink(temporary).catch(() => undefined)
  }
}
