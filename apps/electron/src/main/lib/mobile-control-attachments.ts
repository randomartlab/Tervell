import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, closeSync, openSync, writeSync, lstatSync } from 'node:fs'
import { join,dirname } from 'node:path'
import { PathBoundary } from '@proma/core/permission'
import { serializeInlineAttachment,inlineAttachmentParts,inlineAttachmentsForModel } from '@proma/shared'

export function prepareMobileMessage(text:string,sessionRoot:string){
  const boundary=new PathBoundary({cwd:sessionRoot,attachedDirectories:[],worktrees:[]},()=>{})
  const additionalDirectories:string[]=[]
  for(const part of inlineAttachmentParts(text)){
    if(part.attachment?.path)additionalDirectories.push(dirname(boundary.assert(part.attachment.path,'read')))
    else if(part.attachment&&!part.attachment.url)throw new Error('附件尚未准备好')
  }
  return {userMessage:inlineAttachmentsForModel(text),rawUserMessage:text,additionalDirectories:[...new Set(additionalDirectories)]}
}

const CHUNK_BYTES = 48 * 1024
const MAX_FILE_BYTES = 20 * 1024 * 1024
interface Upload {
  id: string
  device: string
  session: string
  workspace: string
  filename: string
  mediaType: string
  bytes: number
  digest: string
  parts: Map<number, Buffer>
  expires: number
}

/** 分块通过现有加密通道；只保存声明的大小并校验摘要，不能接受手机自选电脑路径。 */
export class MobileAttachments {
  private readonly uploads = new Map<string, Upload>()

  start(device: string, workspace: string, session: string, input: { filename: string; mediaType: string; bytes: number; digest: string }) {
    for (const [id, upload] of this.uploads) if (upload.expires <= Date.now()) this.uploads.delete(id)
    if (!input.filename || input.filename.length > 200 || /[\\/\x00-\x1f\x7f]/.test(input.filename) || input.filename === '.' || input.filename === '..') throw new Error('附件名称无效')
    if (!Number.isSafeInteger(input.bytes) || input.bytes < 1 || input.bytes > MAX_FILE_BYTES || !/^[a-f0-9]{64}$/.test(input.digest) || !/^[\w.+-]+\/[\w.+-]+$/.test(input.mediaType)) throw new Error('附件格式或大小无效')
    if (this.uploads.size >= 12 || [...this.uploads.values()].reduce((sum, upload) => sum + upload.bytes, input.bytes) > 64 * 1024 * 1024 || [...this.uploads.values()].filter(upload => upload.device === device).length >= 3) throw new Error('请先完成当前附件上传')
    const id = randomUUID()
    this.uploads.set(id, { id, device, workspace, session, ...input, parts: new Map(), expires: Date.now() + 15 * 60 * 1000 })
    return { id, chunkBytes: CHUNK_BYTES, chunks: Math.ceil(input.bytes / CHUNK_BYTES) }
  }

  private require(device: string, workspace: string, session: string, id: string): Upload {
    const upload = this.uploads.get(id)
    if (!upload || upload.device !== device || upload.workspace !== workspace || upload.session !== session || upload.expires <= Date.now()) throw new Error('附件上传已失效')
    return upload
  }

  chunk(device: string, workspace: string, session: string, input: { id: string; index: number; data: string }) {
    const upload = this.require(device, workspace, session, input.id)
    if (!Number.isSafeInteger(input.index) || input.index < 0 || input.index >= Math.ceil(upload.bytes / CHUNK_BYTES) || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.data) || input.data.length > 65536) throw new Error('附件分块无效')
    const bytes = Buffer.from(input.data, 'base64'), expected = Math.min(CHUNK_BYTES, upload.bytes - input.index * CHUNK_BYTES)
    if (bytes.length !== expected || bytes.toString('base64') !== input.data) throw new Error('附件分块大小不符')
    const previous = upload.parts.get(input.index)
    if (previous && !previous.equals(bytes)) throw new Error('相同附件分块内容不一致')
    upload.parts.set(input.index, bytes)
    return { received: upload.parts.size, total: Math.ceil(upload.bytes / CHUNK_BYTES) }
  }

  finish(device: string, workspace: string, session: string, id: string, sessionRoot: string, assertCurrent: () => void) {
    const upload = this.require(device, workspace, session, id), total = Math.ceil(upload.bytes / CHUNK_BYTES)
    if (upload.parts.size !== total) throw new Error('附件尚未完整上传')
    const bytes = Buffer.concat(Array.from({ length: total }, (_, index) => upload.parts.get(index)!))
    if (createHash('sha256').update(bytes).digest('hex') !== upload.digest) throw new Error('附件校验失败')
    assertCurrent()
    const boundary = new PathBoundary({ cwd: sessionRoot, attachedDirectories: [], worktrees: [] }, () => {})
    const directory = boundary.assert('attachments', 'write')
    mkdirSync(directory, { recursive: true })
    if (lstatSync(directory).isSymbolicLink()) throw new Error('附件目录无效')
    const target = boundary.assert(join(directory, upload.id + '-' + upload.filename), 'write')
    // wx 拒绝覆盖；同一上传 ID 即使误发不同请求 ID 也不会写出第二份附件。
    const fd = openSync(target, 'wx', 0o600)
    try { let offset = 0; while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset) } finally { closeSync(fd) }
    this.uploads.delete(id)
    return { attachment: { id, label: upload.filename, mediaType: upload.mediaType, path: target }, marker: serializeInlineAttachment({ id, label: upload.filename, mediaType: upload.mediaType, path: target }) }
  }

  cancel(device: string, workspace: string, session: string, id: string) {
    this.require(device, workspace, session, id)
    this.uploads.delete(id)
    return { cancelled: true }
  }
}
