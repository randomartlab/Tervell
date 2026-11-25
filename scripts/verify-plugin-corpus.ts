import { app } from 'electron';
import { mkdtempSync, mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = mkdtempSync(join(tmpdir(), 'tervell-plugin-corpus-'));
process.env.TERVELL_PROFILE_DIR = root;
app.setPath('userData', join(root, 'chromium'));
app.commandLine.appendSwitch('use-mock-keychain');
app.whenReady().then(run).catch(error => {
  console.error(error);
  app.exit(1);
});
async function run() {
  const {
    writeJsonFileAtomic
  } = await import('../apps/electron/src/main/lib/safe-file');
  const config = join(root, 'config'),
    cwd = join(root, 'project');
  mkdirSync(cwd, {
    recursive: true
  });
  mkdirSync(config, {
    recursive: true
  });
  writeJsonFileAtomic(join(config, 'agent-workspaces.json'), {
    version: 2,
    workspaces: [{
      id: 'project-a',
      name: 'Corpus project',
      slug: 'a',
      projectRootPath: cwd,
      createdAt: 1,
      updatedAt: 1
    }]
  });
  execFileSync('/usr/bin/git', ['init', '-q'], {
    cwd
  });
  execFileSync('/usr/bin/git', ['-c', 'user.name=QA', '-c', 'user.email=qa@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture'], {
    cwd
  });
  const service = await import('../apps/electron/src/main/lib/desktop-extension-service'),
    runtime = await import('../apps/electron/src/main/lib/plugin-host/runtime');
  const examples = resolve('../paseo-src/plugin-examples'),
    results = [];
  for (const name of readdirSync(examples).sort()) {
    const path = join(examples, name);
    if (!existsSync(join(path, 'index.server.ts')) && !existsSync(join(path, 'index.server.tsx'))) continue;
    const before = Date.now();
    let id = '';
    try {
      const offer = service.previewDesktopPlugin(path);
      id = offer.manifest.id;
      service.installDesktopPlugin(offer);
      service.configureDesktopPlugin(id, {
        access: {
          workspaceIds: ['project-a'],
          network: false,
          runtime: 'trusted'
        }
      });
      await service.activateDesktopPlugin(id, true);
      results.push({
        name,
        ok: true,
        ms: Date.now() - before
      });
      console.log('CORPUS PASS', name, runtime.pluginStatuses().find(p => p.id === id));
    } catch (error) {
      results.push({
        name,
        ok: false,
        error: String(error),
        ms: Date.now() - before
      });
      console.error('CORPUS FAIL', name, String(error));
    } finally {
      if (id) await service.activateDesktopPlugin(id, false).catch(() => {});
    }
  }
  writeJsonFileAtomic(join(root, 'corpus.json'), results);
  console.log('CORPUS', JSON.stringify({
    root,
    results
  }));
  app.exit(results.some(r => !r.ok) ? 1 : 0);
}
