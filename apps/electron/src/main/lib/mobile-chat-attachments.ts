import { join, relative, extname, dirname, isAbsolute } from 'node:path';
import { mkdirSync, readFileSync, readSync, rmSync, existsSync, lstatSync, realpathSync, openSync, closeSync, fstatSync, constants } from 'node:fs';
import { z } from 'zod';
import { getConfigDir, getAttachmentsDir, getConversationAttachmentsDir } from './config-paths';
import { MobileAttachments } from './mobile-control-attachments';
import { writeJsonFileAtomic, readJsonFileSafe, writeBytesFileAtomic } from './safe-file';
import type { FileAttachment } from '@proma/shared';
const uploads = new MobileAttachments();
interface Owner {
  device: string;
  conversation: string;
  root: string;
  expires: number;
  staged?: ReturnType<MobileAttachments['finish']>;
  finished?: FileAttachment;
}
const owners = new Map<string, Owner>();
const root = () => {
  const path = join(getConfigDir(), 'mobile-chat-uploads');
  mkdirSync(path, {
    recursive: true
  });
  return path;
};
const ledgerPath = () => join(getConfigDir(), 'mobile-chat-attachments.json');
const stored = z.record(z.string().uuid(), z.strictObject({
  device: z.string(),
  conversation: z.string().uuid(),
  attachment: z.strictObject({
    id: z.string().uuid(),
    filename: z.string(),
    mediaType: z.string(),
    localPath: z.string(),
    size: z.number().int().nonnegative()
  })
}));
function records(): z.infer<typeof stored> {
  const path = ledgerPath();
  if (!existsSync(path)) return {};
  const parsed = stored.safeParse(readJsonFileSafe<unknown>(path));
  if (!parsed.success) throw Error('手机附件索引损坏，未覆盖原数据');
  return parsed.data;
}
export function beginChatAttachment(device: string, conversation: string, input: Parameters<MobileAttachments['start']>[3]) {
  for (const [id, value] of owners) if (value.expires <= Date.now()) {
    rmSync(value.root, {
      recursive: true,
      force: true
    });
    owners.delete(id);
  }
  if (owners.size >= 100) throw Error('请先完成当前附件上传');
  const value = uploads.start(device, 'chat', conversation, input),
    directory = join(root(), value.id);
  mkdirSync(directory, {
    recursive: true
  });
  owners.set(value.id, {
    device,
    conversation,
    root: directory,
    expires: Date.now() + 15 * 60 * 1000
  });
  return value;
}
function owner(device: string, conversation: string, id: string): Owner {
  const value = owners.get(id);
  if (!value || value.device !== device || value.conversation !== conversation || value.expires <= Date.now()) throw Error('附件上传已失效');
  return value;
}
export function chatAttachmentChunk(device: string, conversation: string, input: {
  id: string;
  index: number;
  data: string;
}) {
  owner(device, conversation, input.id);
  return uploads.chunk(device, 'chat', conversation, input);
}
export function finishChatAttachment(device: string, conversation: string, id: string, assertCurrent: () => void) {
  const value = owner(device, conversation, id);
  assertCurrent();
  if (value.finished) return {
    attachment: value.finished
  };
  const index = records();
  if (Object.keys(index).length >= 10000) throw Error('手机附件索引已达上限');
  value.staged ??= uploads.finish(device, 'chat', conversation, id, value.root, assertCurrent);
  const completed = value.staged,
    attachmentId = id;
  const extension = extname(completed.attachment.label).slice(0, 20) || '.bin',
    filename = attachmentId + extension;
  const target = join(getConversationAttachmentsDir(conversation), filename),
    bytes = readFileSync(completed.attachment.path);
  const attachment: FileAttachment = {
    id: attachmentId,
    filename: completed.attachment.label,
    mediaType: completed.attachment.mediaType,
    localPath: conversation + '/' + filename,
    size: bytes.length
  };
  assertCurrent();
  writeBytesFileAtomic(target, bytes);
  index[attachmentId] = {
    device,
    conversation,
    attachment
  };
  writeJsonFileAtomic(ledgerPath(), index);
  value.finished = attachment;
  rmSync(value.root, {
    recursive: true,
    force: true
  });
  return {
    attachment
  };
}
export function cancelChatAttachment(device: string, conversation: string, id: string) {
  const value = owner(device, conversation, id);
  if (!value.staged) uploads.cancel(device, 'chat', conversation, id);
  owners.delete(id);
  rmSync(value.root, {
    recursive: true,
    force: true
  });
  return {
    cancelled: true
  };
}
function attachmentPath(attachment: FileAttachment): string {
  // 分叉记录可引用原对话附件；只允许附件仓库内的独立普通文件。
  const base = realpathSync(getAttachmentsDir()),
    path = attachment.localPath;
  if (isAbsolute(path) || !/^[a-f0-9-]{36}\/[^/\\\x00-\x1f]+$/i.test(path)) throw Error('附件路径无效');
  const target = join(base, path),
    parent = realpathSync(dirname(target)),
    from = relative(base, parent);
  if (from.startsWith('..') || isAbsolute(from) || parent !== dirname(target)) throw Error('附件路径无效');
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw Error('附件不可读');
  return target;
}
export function resolveChatAttachments(device: string, conversation: string, ids: string[]): FileAttachment[] {
  const data = records();
  return [...new Set(ids)].map(id => {
    const row = data[id];
    if (!row || row.device !== device || row.conversation !== conversation) throw Error('附件不属于当前电脑对话');
    attachmentPath(row.attachment);
    return row.attachment;
  });
}
export function readChatAttachment(_conversation: string, attachment: FileAttachment, offset: number) {
  const target = attachmentPath(attachment),
    fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || offset > stat.size) throw Error('附件不可读');
    const bytes = Buffer.alloc(Math.min(24000, stat.size - offset));
    const length = readSync(fd, bytes, 0, bytes.length, offset);
    return {
      data: bytes.subarray(0, length).toString('base64'),
      mediaType: attachment.mediaType,
      filename: attachment.filename,
      total: stat.size,
      nextOffset: offset + length,
      hasMore: offset + length < stat.size
    };
  } finally {
    closeSync(fd);
  }
}
