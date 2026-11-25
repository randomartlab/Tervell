import { win32 } from 'node:path'

/** 官方便携发行物；只解压到Tervell受管目录，不修改注册表、系统PATH或用户Git配置。 */
export function windowsGitDistribution(arch: string): { version: string; url: string; sha256: string } {
  const hashes: Record<string, string> = {
    x64: '9dd04a608ceb5f6ab32a73709e0ecb159d211da71b697c45ff81f6dd0c6b49c7',
    arm64: '0dca0d9f760924a7e6752235d7dd6eb1a9b508ee714b6ed15d89252e5a58c5c9',
  }
  if (!hashes[arch]) throw Error('此Windows架构没有已核验Git Bash运行时')
  return { version: '2.56.1', url: `https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/PortableGit-2.56.1-${arch === 'x64' ? '64-bit' : 'arm64'}.7z.exe`, sha256: hashes[arch] }
}
export function requiresWindowsGit(id: string): boolean {
  return ['hermes', 'pi-acp', 'omp', 'claude', 'cline', 'qwen', 'gemini', 'kimi', 'dsh', 'deepseek'].includes(id)
}
export function windowsGitEnvironment(root: string, path: string): Record<string, string> {
  const bash = win32.join(root, 'bin/bash.exe')
  return { PATH: [win32.join(root, 'cmd'), win32.join(root, 'bin'), path].join(';'), HERMES_GIT_BASH_PATH: bash, CLAUDE_CODE_GIT_BASH_PATH: bash, PI_BASH_PATH: bash }
}
