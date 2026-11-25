import {constants, openSync, closeSync, fstatSync, readSync, readFileSync, readdirSync, lstatSync, mkdirSync, existsSync, realpathSync} from 'node:fs';
import {join, relative, dirname} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {PathBoundary} from '@proma/core/permission';
import {writeBytesFileAtomic} from './safe-file';

const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
function boundary(root: string) {return new PathBoundary({cwd: root, attachedDirectories: [], worktrees: []}, () => {});}
function readBytes(root: string, path: string): Buffer {
  const target = boundary(root).assert(path, 'read');
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink > 1) throw Error('文件不是可编辑的独立普通文件');
    return readFileSync(fd);
  } finally {closeSync(fd);}
}
export function mobileProjectTree(root: string, path: string, offset = 0, expected?: string) {
  const guard = boundary(root), cwd = realpathSync(root), directory = guard.assert(path || '.', 'read');
  const entries = readdirSync(directory, {withFileTypes: true}).filter(row => !row.isSymbolicLink()).map(row => ({
    path: relative(cwd, join(directory, row.name)).split('\\').join('/'), name: row.name,
    kind: row.isDirectory() ? 'directory' : 'file'
  })).sort((a, b) => Number(b.kind === 'directory') - Number(a.kind === 'directory') || a.name.localeCompare(b.name));
  const revision = hash(JSON.stringify(entries));
  if (expected && expected !== revision) throw Error('目录已更新，请刷新目录');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > entries.length) throw Error('目录读取位置无效');
  return {path, entries: entries.slice(offset, offset + 100), revision, total: entries.length, nextOffset: offset + 100 < entries.length ? offset + 100 : null};
}
export function mobileProjectRead(root: string, path: string, offset = 0, expected?: string) {
  const guard = boundary(root), target = guard.assert(path, 'read'), fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink > 1) throw Error('文件不可读');
    const revision = hash(JSON.stringify([stat.size, stat.mtimeMs, stat.ino]));
    if (expected && expected !== revision) throw Error('文件已变化，请重新读取');
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > stat.size) throw Error('文件读取位置无效');
    const bytes = Buffer.alloc(Math.min(24000, stat.size - offset));
    let count = readSync(fd, bytes, 0, bytes.length, offset), content = '';
    if (bytes.includes(0)) throw Error('二进制文件请从附件下载');
    for (let cut = 0; cut < 4; cut++) {
      try {content = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes.subarray(0, count)); break;}
      catch {if (cut === 3 || offset + count === stat.size) throw Error('文件不是 UTF-8 文本'); count--;}
    }
    return {path, content, revision, offset, nextOffset: offset + count, hasMore: offset + count < stat.size, total: stat.size};
  } finally {closeSync(fd);}
}
interface Edit {device: string; workspace: string; root: string; path: string; expected: string; digest: string; bytes: number; chunks: Map<number, Buffer>; expires: number}
/** 编辑结果先分块校验，再比较原文件摘要。跨项目/设备不能取用同一编辑事务。 */
export class MobileProjectEdits {
  private readonly edits = new Map<string, Edit>();
  begin(device: string, workspace: string, root: string, input: {path: string; expected: string; digest: string; bytes: number}) {
    for (const [id, edit] of this.edits) if (edit.expires < Date.now()) this.edits.delete(id);
    if (!/^[a-f0-9]{64}$/.test(input.digest) || !/^(?:[a-f0-9]{64}|new)$/.test(input.expected) || !Number.isSafeInteger(input.bytes) || input.bytes < 0 || input.bytes > 64 * 1024 * 1024) throw Error('编辑摘要或大小无效');
    const target = boundary(root).assert(input.path, 'write');
    if (input.expected === 'new' ? existsSync(target) : hash(readBytes(root, input.path)) !== input.expected) throw Error('文件已变化，未覆盖电脑上的内容');
    if (this.edits.size >= 8 || [...this.edits.values()].reduce((sum, edit) => sum + edit.bytes, input.bytes) > 128 * 1024 * 1024) throw Error('请先完成当前文件保存');
    const id = randomUUID();
    this.edits.set(id, {...input, device, workspace, root: realpathSync(root), chunks: new Map(), expires: Date.now() + 15 * 60 * 1000});
    return {id, chunkBytes: 48000};
  }
  private require(device: string, workspace: string, id: string, root: string) {
    const edit = this.edits.get(id);
    if (!edit || edit.device !== device || edit.workspace !== workspace || edit.expires < Date.now() || edit.root !== realpathSync(root)) throw Error('编辑事务已失效或不属于此项目');
    return edit;
  }
  chunk(device: string, workspace: string, id: string, root: string, index: number, data: string) {
    const edit = this.require(device, workspace, id, root), bytes = Buffer.from(data, 'base64');
    if (!Number.isSafeInteger(index) || index < 0 || index >= Math.ceil(edit.bytes / 48000) || bytes.toString('base64') !== data || bytes.length !== Math.min(48000, edit.bytes - index * 48000)) throw Error('编辑分块无效');
    const previous = edit.chunks.get(index);
    if (previous && !previous.equals(bytes)) throw Error('同一分块内容不一致');
    edit.chunks.set(index, bytes); return {received: edit.chunks.size};
  }
  finish(device: string, workspace: string, id: string, root: string, assertCurrent: () => void) {
    const edit = this.require(device, workspace, id, root), count = Math.ceil(edit.bytes / 48000);
    if (edit.chunks.size !== count) throw Error('文件尚未上传完整');
    const bytes = Buffer.concat(Array.from({length: count}, (_, i) => edit.chunks.get(i)!));
    if (hash(bytes) !== edit.digest) throw Error('文件完整性校验失败');
    new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    const target = boundary(root).assert(edit.path, 'write');
    if (edit.expected === 'new' ? existsSync(target) : hash(readBytes(root, edit.path)) !== edit.expected) throw Error('电脑文件已更新，未覆盖其他编辑');
    assertCurrent();
    if (!existsSync(dirname(target))) throw Error('请先创建父目录');
    if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw Error('拒绝写入符号链接');
    writeBytesFileAtomic(target, bytes); this.edits.delete(id);
    return {saved: true, digest: edit.digest};
  }
  cancel(device: string, workspace: string, id: string, root: string) {this.require(device, workspace, id, root); this.edits.delete(id); return {cancelled: true};}
}
export const mobileProjectDigest = (root: string, path: string) => hash(readBytes(root, path));
export function mobileProjectMkdir(root: string, path: string) {const target = boundary(root).assert(path, 'write'); mkdirSync(target, {recursive: false}); return {created: true};}
