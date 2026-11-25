import { constants, openSync, closeSync, fstatSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export interface RemotePlanPreview { text: string; canApprove: boolean }
/** 只返回提交时的同一版本；符号链接、文件替换和裁剪预览均不能远程批准。 */
export function remotePlanPreview(document: { filePath: string; contentHash: string } | undefined): RemotePlanPreview {
  let fd: number | undefined
  try {
    if (!document) throw new Error('缺少计划文件')
    fd = openSync(document.filePath, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('计划文件无效')
    const content = readFileSync(fd)
    if (content.length > 1024 * 1024 || createHash('sha256').update(content).digest('hex') !== document.contentHash) throw new Error('计划文件已改变')
    const text = content.toString('utf8')
    return text.length <= 32000 ? { text, canApprove: true } : { text: `${text.slice(0, 32000)}\n［计划较长，须在电脑阅读完整内容后审批］`, canApprove: false }
  } catch {
    return { text: '计划文件已变更或不可安全读取，请在电脑重新提交计划。', canApprove: false }
  } finally { if (fd !== undefined) closeSync(fd) }
}
