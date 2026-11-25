import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { writeTextFileAtomic } from './safe-file'

const HERMES_LOCAL_SHA256 = '92384375cea9f015bbdd9dc020e637c1498511e1a69d0b19104463b664d716ec'
const marker = '# Tervell Windows ACP probe compatibility v1'
const original = `        result = subprocess.run(
            [bash, "--noprofile", "--norc", "-c", _BASH_EXTERNAL_PROGRAM_PROBE],
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=windows_hide_flags() if _IS_WINDOWS else 0,
        )`

/** 只用于短暂的启动探测：输出写临时文件，避免Windows超时后的无界管道reader join。 */
export const HERMES_BOUNDED_PROBE = `${marker}
def _tervell_bounded_bash_probe(argv, timeout=15):
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        flags = {"creationflags": windows_hide_flags()} if _IS_WINDOWS else {"start_new_session": True}
        proc = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=out, stderr=err, **flags)
        try:
            proc.wait(timeout=timeout)
        except BaseException:
            if _IS_WINDOWS:
                try:
                    subprocess.run(["taskkill.exe", "/PID", str(proc.pid), "/T", "/F"],
                                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL, timeout=2, creationflags=windows_hide_flags())
                except Exception:
                    pass
            else:
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except OSError:
                    pass
            try:
                proc.kill()
                proc.wait(timeout=1)
            except Exception:
                pass
            return subprocess.CompletedProcess(argv, -1, "", "Git Bash startup probe timed out")
        out.seek(0)
        err.seek(0)
        return subprocess.CompletedProcess(argv, proc.returncode,
            out.read(65536).decode("utf-8", errors="replace"),
            err.read(65536).decode("utf-8", errors="replace"))

`

/** 只修改受管0.19.0的已核验源码；未知版本失败并提示修复，绝不写用户系统安装。 */
export function applyManagedCliCompatibility(id: string, directory: string, version: string, platform = process.platform as string): void {
  if (id !== 'hermes' || platform !== 'win32' || version !== '0.19.0') return
  const file = join(directory, 'py/hermes-agent/Lib/site-packages/tools/environments/local.py')
  if (!existsSync(file)) throw Error('Hermes受管终端依赖缺失，请一键修复内核')
  const source = readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
  if (source.includes(marker)) {
    if (!source.includes(HERMES_BOUNDED_PROBE) || source.includes(original)) throw Error('Hermes终端兼容修复内容不完整，请一键修复内核')
    return
  }
  if (createHash('sha256').update(source).digest('hex') !== HERMES_LOCAL_SHA256 || !source.includes(original)) throw Error('Hermes终端依赖与核验版本不同，请重新安装内核后重试')
  const backup = file + '.tervell-original'
  if (!existsSync(backup)) writeTextFileAtomic(backup, source)
  const at = source.indexOf('def _bash_starts(')
  if (at < 0) throw Error('Hermes终端探测入口缺失')
  const patched = source.slice(0, at) + HERMES_BOUNDED_PROBE + source.slice(at)
  writeTextFileAtomic(file, patched.replace(original, `        result = _tervell_bounded_bash_probe(
            [bash, "--noprofile", "--norc", "-c", _BASH_EXTERNAL_PROGRAM_PROBE], timeout=15
        )`))
}
