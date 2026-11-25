import { pluginBun } from './paseo-dependencies';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, delimiter, isAbsolute, resolve as absolutePath } from 'node:path';
import { createHash } from 'node:crypto';
import { writeJsonFileAtomic } from '../safe-file';
import { desktopCliEnvironment, resolveDesktopCommand } from '../desktop-extension-service';
interface Manifest {
  id: string;
  requirements?: {
    paseo?: string;
  };
  build?: string[][];
}
/** 插件清单中的准备命令按argv执行一次；失败不写成功标记，重试可恢复。 */
export async function preparePaseoSource(directory: string, manifest: Manifest, trusted: boolean): Promise<void> {
  if (!manifest.build?.length) return;
  if (!trusted) throw Error('插件清单包含准备命令，需要标准受信任插件授权');
  const source = join(directory, 'source'),
    stamp = join(directory, 'preparation.json');
  const signature = createHash('sha256').update(JSON.stringify(manifest)).update(existsSync(join(source, 'package.json')) ? readFileSync(join(source, 'package.json')) : '').digest('hex');
  if (existsSync(stamp) && JSON.parse(readFileSync(stamp, 'utf8')).signature === signature) return;
  for (const command of manifest.build) {
    const [file, ...args] = command;
    if (!file) throw Error('插件准备命令为空');
    await new Promise<void>((resolve, reject) => {
      let output = '';
      const env = desktopCliEnvironment();
      env.PATH = join(source, 'node_modules/.bin') + delimiter + (env.PATH ?? '');
      const executable = file === 'bun' ? pluginBun() : file.startsWith('.') ? absolutePath(source, file) : isAbsolute(file) ? file : resolveDesktopCommand(file) ?? file;
      const child = spawn(executable, args, {
        cwd: source,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      const append = (chunk: Buffer) => {
        output = (output + chunk.toString()).slice(-65536);
      };
      child.stdout.on('data', append);
      child.stderr.on('data', append);
      child.once('error', reject);
      child.once('close', code => code === 0 ? resolve() : reject(Error(`插件准备命令失败 (${code})：${JSON.stringify(command)}\n${output}`)));
    });
  }
  writeJsonFileAtomic(stamp, {
    signature,
    preparedAt: new Date().toISOString()
  });
}
