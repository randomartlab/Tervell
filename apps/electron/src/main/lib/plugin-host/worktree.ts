import { execFile } from 'node:child_process';
import { mkdirSync, realpathSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runPluginBeforeHook } from './session-events';
const git = (cwd: string, args: string[]) => new Promise<string>((resolve, reject) => execFile('/usr/bin/git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', ...args], {
  cwd,
  timeout: 30000,
  maxBuffer: 1024 * 1024,
  env: {
    PATH: process.env.PATH ?? '',
    GIT_TERMINAL_PROMPT: '0'
  }
}, (error, out) => error ? reject(error) : resolve(out.trim())));
export async function createPluginWorktree(cwd: string, branch: string, baseRef = 'HEAD', workspaceId?: string): Promise<{
  path: string;
  branch: string;
}> {
  const root = await git(realpathSync(cwd), ['rev-parse', '--show-toplevel']);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,99}$/.test(branch) || baseRef.startsWith('-')) throw Error('worktree分支或来源无效');
  const parent = join(root, '.worktrees');
  mkdirSync(parent, {
    recursive: true
  });
  const slug = branch.replace(/[^a-zA-Z0-9-]/g, '-');
  const request = await runPluginBeforeHook('worktree.create.before', {
    kind: 'branch-off',
    repoRoot: root,
    sourceCheckout: root,
    baseRef,
    branch,
    slug,
    path: join(parent, slug)
  }, {
    workspaceId,
    cwd: root
  });
  const target = String(request.path),
    nextBranch = String(request.branch);
  if (!require('node:path').isAbsolute(target) || existsSync(target)) throw Error('worktree目标必须是不存在的绝对路径');
  await git(root, ['worktree', 'add', '-b', nextBranch, '--', target, String(request.baseRef)]);
  try {
    await runPluginBeforeHook('worktree.create.after', {
      worktree: {
        path: target,
        branch: nextBranch,
        sourceCheckout: root
      }
    }, {
      workspaceId,
      cwd: root
    });
  } catch (error) {
    await git(root, ['worktree', 'remove', '--force', '--', target]).catch(() => {});
    throw error;
  }
  return {
    path: target,
    branch: nextBranch
  };
}
