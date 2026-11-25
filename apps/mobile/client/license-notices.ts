import {existsSync, readFileSync, readdirSync, realpathSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import type {Plugin} from 'vite';

/** 离线客户端连同实际打入代码的许可证分发，插件预编译资源另计来源。 */
export function mobileLicenseNotices(): Plugin {
  return {
    name: 'tervell-mobile-license-notices',
    generateBundle() {
      const packages = new Map<string, {name: string; version: string; license: string; notices: string[]}>();
      for (const id of this.getModuleIds()) {
        const file = id.replace(/^\0/, '').split('?')[0]!;
        if (!file.includes('/node_modules/') || !existsSync(file)) continue;
        let directory = dirname(realpathSync(file));
        while (directory !== dirname(directory) && !existsSync(join(directory, 'package.json'))) directory = dirname(directory);
        if (!existsSync(join(directory, 'package.json'))) continue;
        const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as {name?: string; version?: string; license?: string};
        if (!pkg.name || !pkg.version) continue;
        const key = pkg.name + '@' + pkg.version;
        if (packages.has(key)) continue;
        const notices = readdirSync(directory).filter(name => /^(?:license|licence|copying|notice)(?:\.|$)/i.test(name)).flatMap(name => {
          try { return [readFileSync(join(directory, name), 'utf8')]; } catch { return []; }
        });
        packages.set(key, {name: pkg.name, version: pkg.version, license: pkg.license ?? '见上游声明', notices});
      }
      const vendor = resolve(import.meta.dirname, '../../electron/resources/third-party');
      const notices: string[] = [];
      const append = (file: string, label: string) => notices.push('\n===== ' + label + ' =====\n' + readFileSync(file, 'utf8'));
      append(join(vendor, 'paseo-client/NOTICE'), 'Paseo client source');
      append(join(vendor, 'paseo-client/Paseo-LICENSE'), 'Paseo Apache-2.0');
      const collect = (directory: string) => {
        for (const entry of readdirSync(directory, {withFileTypes: true})) {
          const file = join(directory, entry.name);
          if (entry.isDirectory()) collect(file); else append(file, file.slice(vendor.length + 1));
        }
      };
      collect(join(vendor, 'paseo-client/licenses'));
      append(join(vendor, 'default-features/dependencies/remend/LICENSE'), 'remend Apache-2.0');
      for (const name of ['exporter', 'better-paseo', 'vivid-activity']) append(join(vendor, 'default-features', name, 'LICENSE'), name);
      for (const item of [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))) notices.push('\n===== ' + item.name + '@' + item.version + ' (' + item.license + ') =====\n' + item.notices.join('\n'));
      this.emitFile({type: 'asset', fileName: 'third-party-notices.txt', source: notices.join('\n')});
      this.emitFile({type: 'asset', fileName: 'third-party-sources.json', source: JSON.stringify({
        generatedFrom: '实际 Vite 模块图、保留的上游源码与客户端预编译资源',
        packages: [...packages.values()].map(({notices: _notices, ...item}) => item),
        clientRuntime: JSON.parse(readFileSync(join(vendor, 'paseo-client/npm-sources.json'), 'utf8')) as unknown,
        defaultFeatures: (JSON.parse(readFileSync(join(vendor, 'default-features/sources.json'), 'utf8')) as {projects: Array<{id: string; commit: string; path: string}>}).projects.map(({id, commit, path}) => ({id, commit, path}))
      }, null, 2)});
    }
  };
}
