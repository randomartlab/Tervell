import { test, expect } from 'bun:test';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { preparePluginDependencies, dependencyArchive, platformAllows } from '../apps/electron/src/main/lib/plugin-host/dependencies';
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file';
function archive(name: string, text: string): Buffer {
  const body = Buffer.from(text),
    h = Buffer.alloc(512);
  h.write(name);
  h.write('0000644\0', 100);
  h.write(body.length.toString(8).padStart(11, '0') + '\0', 124);
  h.fill(32, 148, 156);
  h.write('0', 156);
  const checksum = h.reduce((sum, b) => sum + b, 0);
  h.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148);
  return gzipSync(Buffer.concat([h, body, Buffer.alloc((512 - body.length % 512) % 512), Buffer.alloc(1024)]));
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tervell-dependencies-'));
  mkdirSync(join(root, 'source'));
  writeJsonFileAtomic(join(root, 'source/package.json'), {
    dependencies: {
      alpha: '^1.0.0',
      beta: '^1.0.0'
    }
  });
  let requests = 0;
  const packages: Record<string, {
    version: string;
    dependencies?: Record<string, string>;
  }> = {
    alpha: {
      version: '1.0.0',
      dependencies: {
        shared: '^1.0.0'
      }
    },
    beta: {
      version: '1.0.0',
      dependencies: {
        shared: '^2.0.0'
      }
    },
    'shared-1': {
      version: '1.0.0'
    },
    'shared-2': {
      version: '2.0.0'
    }
  };
  const tarballs = new Map<string, Buffer>();
  const metadata: Record<string, Record<string, unknown>> = {};
  for (const [key, p] of Object.entries(packages)) {
    const name = key.startsWith('shared') ? 'shared' : key,
      bytes = archive('package/package.json', JSON.stringify({
        name,
        scripts: {
          postinstall: 'must-never-run'
        },
        ...p
      }));
    const url = `https://registry.npmjs.org/${name}/-/${name}-${p.version}.tgz`;
    tarballs.set(url, bytes);
    (metadata[name] ??= {})[p.version] = {
      name,
      ...p,
      dist: {
        tarball: url,
        integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64')
      }
    };
  }
  return {
    root,
    get requests() {
      return requests;
    },
    async fetch(url: string) {
      requests++;
      if (tarballs.has(url)) return new Response(Uint8Array.from(tarballs.get(url)!));
      return Response.json({
        versions: metadata[decodeURIComponent(new URL(url).pathname.slice(1))] ?? {}
      });
    },
    tarballs
  };
}
test('Given 插件间不兼容依赖 When 独立解析和离线重启 Then 两个版本并存且不运行脚本', async () => {
  const f = fixture();
  try {
    await preparePluginDependencies(f.root, f.fetch);
    const alpha = join(f.root, 'source/node_modules/alpha'),
      beta = join(f.root, 'source/node_modules/beta');
    expect(JSON.parse(readFileSync(join(alpha, 'node_modules/shared/package.json'), 'utf8')).version).toBe('1.0.0');
    expect(JSON.parse(readFileSync(join(beta, 'node_modules/shared/package.json'), 'utf8')).version).toBe('2.0.0');
    await preparePluginDependencies(f.root, async () => {
      throw Error('离线不得访问网络');
    });
    expect(existsSync(join(f.root, 'dependency-lock.json'))).toBe(true);
  } finally {
    rmSync(f.root, {
      recursive: true,
      force: true
    });
  }
});
test('Given SRI错误发行包 When 安装 Then 拒绝且不写成功锁', async () => {
  const f = fixture();
  try {
    await expect(preparePluginDependencies(f.root, async url => url.endsWith('.tgz') ? new Response(Uint8Array.from(archive('package/pwn', 'bad'))) : f.fetch(url))).rejects.toThrow('integrity');
    expect(existsSync(join(f.root, 'dependency-lock.json'))).toBe(false);
  } finally {
    rmSync(f.root, {
      recursive: true,
      force: true
    });
  }
});
test('Given 平台否定选择和越界tar When 解析 Then 按标准限制并拒绝路径穿越', () => {
  expect(platformAllows(['!win32'], 'darwin')).toBe(true);
  expect(platformAllows(['!darwin'], 'darwin')).toBe(false);
  expect(platformAllows(['linux'], 'darwin')).toBe(false);
  expect(() => dependencyArchive(archive('package/../../escape', 'bad'))).toThrow('路径无效');
});
