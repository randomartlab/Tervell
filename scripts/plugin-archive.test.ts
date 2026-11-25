import { test, expect } from 'bun:test';
import { gzipSync } from 'node:zlib';
import { archiveFiles } from '../apps/electron/src/main/lib/plugin-host/archive';

function archive(rows: Array<{ path: string; bytes: Buffer; type?: string;mode?:number }>): Buffer {
  const chunks: Buffer[] = [];
  for (const { path, bytes, type = '0',mode=0o644 } of rows) {
    const header = Buffer.alloc(512);
    header.write(path, 0, 100);
    header.write(mode.toString(8).padStart(7,'0')+'\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116);
    header.write(bytes.length.toString(8).padStart(11, '0') + '\0', 124);
    header.fill(32, 148, 156); header.write(type, 156);
    header.write('ustar\0', 257);
    const checksum = header.reduce((sum, value) => sum + value, 0);
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148);
    chunks.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512));
  }
  return gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]));
}
function pax(path: string): Buffer {
  const record = 'path=' + path + '\n';
  let size = Buffer.byteLength(record) + 3;
  for (;;) {
    const text = size + ' ' + record;
    if (Buffer.byteLength(text) === size) return Buffer.from(text);
    size = Buffer.byteLength(text);
  }
}

test('Given 带锁文件和任意资源的Paseo包 When 下载 Then 普通文件逐字节保留且不按扩展名裁剪', () => {
  const rows = ['package.json', 'bun.lockb', '.npmrc', 'font.woff2', 'module.wasm', 'data.bin', 'scripts/prepare', 'LICENSE.md'].map((name, index) => ({ path: 'package/' + name, bytes: Buffer.from([0, 255, index, 1]) }));
  const files = archiveFiles(archive(rows));
  expect(files.size).toBe(rows.length);
  for (const row of rows) expect(files.get(row.path.slice(8))).toEqual(row.bytes);
});

test('Given npm或Git生成的PAX长路径 When 提取 Then 使用完整相对文件名', () => {
  const path = 'package/assets/' + 'nested/'.repeat(20) + 'font.woff2';
  const files = archiveFiles(archive([{ path: 'PaxHeader', type: 'x', bytes: pax(path) }, { path: 'package/short', bytes: Buffer.from('actual') }]));
  expect(files.get(path.slice(8))?.toString()).toBe('actual');
});

test('Given 越界路径/链接/重复文件 When 提取 Then 明确拒绝而非生成残缺插件', () => {
  for (const path of ['package/../outside', '/absolute', 'package/a/../../x']) expect(() => archiveFiles(archive([{ path, bytes: Buffer.from('x') }]))).toThrow('路径');
  expect(() => archiveFiles(archive([{ path: 'package/link', type: '2', bytes: Buffer.alloc(0) }]))).toThrow('类型');
  expect(() => archiveFiles(archive([{ path: 'package/a', bytes: Buffer.from('1') }, { path: 'package/a', bytes: Buffer.from('2') }]))).toThrow('重复');
});

test('Given 包内可执行脚本 When 提取 Then 执行权限单独保留',()=>{
 const files=archiveFiles(archive([{path:'package/scripts/prepare',bytes:Buffer.from('#!/bin/sh'),mode:0o755}]));
 expect(files.executablePaths).toEqual(['scripts/prepare']);
});
