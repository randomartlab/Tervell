import { spawn } from 'node:child_process';
const spawnPortable: typeof spawn = require('cross-spawn');

/** Windows的npm .cmd/.bat启动器必须按argv转义；不能直接execFile或拼接shell字符串。 */
export const spawnAcpProcess: typeof spawn = spawnPortable;
import type { ChildProcess } from 'node:child_process';

/** ACP会创建app-server等子进程；只关根进程会遗留账号服务和内存。 */
export function terminateAcpProcess(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    killer.once('error', () => { child.kill('SIGKILL'); });
    return;
  }
  try { process.kill(-child.pid, 'SIGKILL'); }
  catch { child.kill('SIGKILL'); }
}
