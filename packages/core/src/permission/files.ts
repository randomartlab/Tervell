import { constants, openSync, closeSync, readSync, fstatSync, lstatSync, writeFileSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { PathBoundary } from './boundary.ts'
import { ToolGate } from './gate.ts'
import type { GateOptions } from './gate.ts'
/** 在实际 I/O 前后复核边界；不承诺抵御同 OS 用户的并发目录替换。 */
export class GatedFiles {
  constructor(private readonly boundary: PathBoundary, private readonly gate: ToolGate) {}
  read(path: string, options: GateOptions, line = 1, limit = 10000): Promise<string> {
    return this.gate.run({ name: 'Read', kind: 'read', effect: 'read' }, { path, line, limit }, options, () => {
      const target = this.boundary.assert(path, 'read'), fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
      try {
        const stat = fstatSync(fd)
        if (!stat.isFile() || stat.nlink > 1 || stat.size > 1024 * 1024 || !Number.isInteger(line) || line < 1 || !Number.isInteger(limit) || limit < 1) throw new Error('文件或读取范围无效')
        if (this.boundary.assert(path, 'read') !== target) throw new Error('文件路径已改变')
        const buffer=Buffer.alloc(1024*1024+1);let length=0
        for(;;){const count=readSync(fd,buffer,length,buffer.length-length,null);if(!count)break;length+=count;if(length===buffer.length)throw new Error('文件超过限制')}
        const bytes=buffer.subarray(0,length)
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes).split('\n').slice(line - 1, line - 1 + limit).join('\n')
      } finally { closeSync(fd) }
    })
  }
  write(path: string, content: string, options: GateOptions): Promise<void> {
    if (Buffer.byteLength(content) > 1024 * 1024) return Promise.reject(new Error('文件超过限制'))
    return this.gate.run({ name: 'Write', kind: 'edit', effect: 'write' }, { path, content }, options, () => {
      const target = this.boundary.assert(path, 'write'), parent = dirname(target), temp = join(parent, `.proma-${randomUUID()}.tmp`)
      let fd: number | undefined
      try {
        let mode = 0o600
        try { const stat = lstatSync(target); if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1) throw new Error('拒绝非常规或硬链接目标'); mode = stat.mode & 0o777 } catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error }
        fd = openSync(temp, 'wx', mode); writeFileSync(fd, content, 'utf8'); closeSync(fd); fd = undefined
        if (options.signal.aborted || this.boundary.assert(path, 'write') !== target) throw new Error('操作已取消或路径改变')
        options.assertContext?.(); renameSync(temp, target)
      } finally { if (fd !== undefined) closeSync(fd); try { unlinkSync(temp) } catch { /* 已重命名 */ } }
    })
  }
}
