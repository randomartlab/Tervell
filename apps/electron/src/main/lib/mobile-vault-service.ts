import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getVaultSummary, getVaultConfig, getConfiguredVaultFileSystem, selectDefaultVault, configureVault, createVaultFolder } from './vault-service';
import type { MobileContext } from './mobile-control-policy';
const path = z.string().min(1).max(4096),
  digest = z.string().regex(/^[a-f0-9]{64}$/);
export const MobileVaultReadSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('list')
}), z.strictObject({
  action: z.literal('read'),
  path
})]);
export const MobileVaultWriteSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('save.start'),
  path,
  vaultId: z.string().optional(),
  bytes: z.number().int().min(0).max(2 * 1024 * 1024),
  digest,
  expectedSha256: digest.optional(),
  createOnly: z.boolean().optional()
}), z.strictObject({
  action: z.literal('save.chunk'),
  id: z.uuid(),
  index: z.number().int().min(0),
  data: z.string().max(64000)
}), z.strictObject({
  action: z.literal('save.finish'),
  id: z.uuid()
}), z.strictObject({
  action: z.literal('save.cancel'),
  id: z.uuid()
}), z.strictObject({
  action: z.literal('default')
}), z.strictObject({
  action: z.literal('configure'),
  path,
  inboxPath: path.optional(),
  allowAgentWrites: z.boolean()
}), z.strictObject({
  action: z.literal('save'),
  path,
  content: z.string().max(3 * 1024 * 1024),
  expectedSha256: digest.optional(),
  createOnly: z.boolean().optional()
}), z.strictObject({
  action: z.literal('rename'),
  path,
  name: z.string().min(1).max(200),
  expectedSha256: digest
}), z.strictObject({
  action: z.literal('delete'),
  path,
  expectedSha256: digest
}), z.strictObject({
  action: z.literal('mkdir'),
  path
})]);
interface VaultUpload {
  device: string;
  root: string;
  path: string;
  bytes: number;
  digest: string;
  expectedSha256?: string;
  createOnly?: boolean;
  parts: Map<number, Buffer>;
  expires: number;
  result?: unknown;
}
const uploads = new Map<string, VaultUpload>();
function currentUpload(c: MobileContext, id: string) {
  const row = uploads.get(id);
  if (!row || row.device !== c.device.id || row.expires < Date.now() || row.root !== getVaultConfig()?.rootPath) throw Error('知识库保存已失效，请保留草稿后重新保存');
  return row;
}
function check(c: MobileContext) {
  c.assertCurrent();
  if (!c.device.management) throw Error('整机管理未授权');
}
export function mobileVaultRead(raw: unknown, c: MobileContext) {
  check(c);
  const v = MobileVaultReadSchema.parse(raw);
  if (v.action === 'list') return {
    summary: getVaultSummary(),
    files: getVaultConfig() ? getConfiguredVaultFileSystem().listFiles() : []
  };
  return getConfiguredVaultFileSystem().readFile(v.path);
}
export function mobileVaultWrite(raw: unknown, c: MobileContext) {
  check(c);
  const v = MobileVaultWriteSchema.parse(raw);
  if (v.action === 'save.start') {
    for (const [id, row] of uploads) if (row.expires < Date.now()) uploads.delete(id);
    if (uploads.size >= 8) throw Error('请先完成当前文件保存');
    if (!v.createOnly && !v.expectedSha256) throw Error('知识库保存需要原文摘要');
    if (v.vaultId && v.vaultId !== getVaultSummary()?.vaultId) throw Error('电脑知识库已切换，请保留草稿后重新读取');
    const config = getVaultConfig();
    if (!config) throw Error('电脑尚未选择知识库');
    const id = randomUUID();
    uploads.set(id, {
      device: c.device.id,
      root: config.rootPath,
      path: v.path,
      bytes: v.bytes,
      digest: v.digest,
      expectedSha256: v.expectedSha256,
      createOnly: v.createOnly,
      parts: new Map(),
      expires: Date.now() + 15 * 60 * 1000
    });
    return {
      id,
      chunkBytes: 48000
    };
  }
  if (v.action === 'save.chunk') {
    const row = currentUpload(c, v.id),
      bytes = Buffer.from(v.data, 'base64'),
      previous = row.parts.get(v.index);
    if (v.index >= Math.ceil(row.bytes / 48000) || bytes.toString('base64') !== v.data || bytes.length !== Math.min(48000, row.bytes - v.index * 48000) || previous && !previous.equals(bytes)) throw Error('知识库分块无效');
    row.parts.set(v.index, bytes);
    return {
      received: row.parts.size
    };
  }
  if (v.action === 'save.cancel') {
    currentUpload(c, v.id);
    uploads.delete(v.id);
    return {
      cancelled: true
    };
  }
  if (v.action === 'save.finish') {
    const row = currentUpload(c, v.id);
    if (row.result) return row.result;
    const count = Math.ceil(row.bytes / 48000);
    if (row.parts.size !== count) throw Error('文件尚未上传完整');
    const bytes = Buffer.concat(Array.from({
      length: count
    }, (_, i) => row.parts.get(i)!));
    if (createHash('sha256').update(bytes).digest('hex') !== row.digest) throw Error('文件完整性校验失败');
    const content = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true
    }).decode(bytes);
    check(c);
    const result = getConfiguredVaultFileSystem().writeFile({
      relativePath: row.path,
      content,
      expectedSha256: row.expectedSha256,
      createOnly: row.createOnly
    });
    if (!result.ok) throw Error('知识库文件已变化，未覆盖电脑新内容');
    row.result = result;
    row.parts.clear();
    return result;
  }
  if (v.action === 'default') return {
    summary: selectDefaultVault()
  };
  if (v.action === 'configure') return {
    summary: configureVault(v.path, {
      inboxPath: v.inboxPath,
      allowAgentWrites: v.allowAgentWrites
    })
  };
  const fs = getConfiguredVaultFileSystem();
  if (v.action === 'save') {
    if (!v.createOnly && !v.expectedSha256) throw Error('知识库保存需要原文摘要');
    const r = fs.writeFile({
      relativePath: v.path,
      content: v.content,
      expectedSha256: v.expectedSha256,
      createOnly: v.createOnly
    });
    if (!r.ok) throw Error('知识库文件已变化，未覆盖电脑新内容');
    return r;
  }
  if (v.action === 'rename') return fs.renameFile({
    relativePath: v.path,
    name: v.name,
    expectedSha256: v.expectedSha256
  });
  if (v.action === 'delete') {
    fs.deleteFile({
      relativePath: v.path,
      expectedSha256: v.expectedSha256
    });
    return {
      removed: true
    };
  }
  createVaultFolder(v.path);
  return {
    created: true
  };
}
