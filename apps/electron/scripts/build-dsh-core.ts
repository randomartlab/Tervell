import { build } from 'esbuild';
import { resolve, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
const root = resolve(import.meta.dir, '../resources/third-party/dsh-runtime'),
  output = resolve(import.meta.dir, '../resources/third-party/plugin-host');
const modules: Record<string, string> = {
  '@deepseek-ai/dsh-tools': 'packages/core/tools/src/index.ts',
  '@deepseek-ai/dsh-scope': 'packages/core/scope/src/index.ts',
  '@deepseek-ai/dsh-system-prompt': 'packages/core/system-prompt/src/index.ts',
  '@deepseek-ai/dsh-util-values': 'packages/util/values/src/index.ts',
  '@deepseek-ai/dsh-error': 'packages/util/error/src/index.ts',
  '@deepseek-ai/dsh-llm': 'packages/llm/llm/src/error.ts',
  '@deepseek-ai/cordis-plugin-loader': 'vendor/loader/src/index.ts'
};
await build({
  entryPoints: [join(root, 'vendor/cordis/src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: join(output, 'cordis.cjs'),
  plugins: [{
    name: 'cosmokit-source',
    setup(b) {
      b.onResolve({
        filter: /^@deepseek-ai\/cosmokit$/
      }, () => ({
        path: join(root, 'vendor/cosmokit/src/index.ts')
      }));
    }
  }]
});
await build({
  stdin: {
    contents: `export * as tools from ${JSON.stringify(join(root, modules['@deepseek-ai/dsh-tools']!))};export * as scope from ${JSON.stringify(join(root, modules['@deepseek-ai/dsh-scope']!))};export {SystemPrompt} from ${JSON.stringify(join(root, modules['@deepseek-ai/dsh-system-prompt']!))};export {Loader} from ${JSON.stringify(join(root, modules['@deepseek-ai/cordis-plugin-loader']!))}`,
    resolveDir: root,
    loader: 'ts'
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: join(output, 'dsh-core.cjs'),
  external: ['node-addon-require-builtin'],
  define: {
    'import.meta.url': '__dshModuleUrl'
  },
  banner: {
    js: 'const __dshModuleUrl=require("node:url").pathToFileURL(__filename).href;'
  },
  plugins: [{
    name: 'dsh-framework-boundary',
    setup(b) {
      b.onResolve({
        filter: /^@deepseek-ai\//
      }, args => {
        if (args.path === '@deepseek-ai/cordis') return {
          path: './cordis.cjs',
          external: true
        };
        if (args.path === '@deepseek-ai/schemastery') return {
          path: './schemastery.cjs',
          external: true
        };
        if (args.path === '@deepseek-ai/cosmokit') return {
          path: join(root, 'vendor/cosmokit/src/index.ts')
        };
        if (modules[args.path]) return {
          path: join(root, modules[args.path]!)
        };
      });
    }
  }]
});

// 仅转换宿主选择器；保留上游全部token，语义颜色跟随Tervell主题。
const styles = join(root, 'packages/client/ui-theme/src/styles');
let css = ['base.css', 'design-platform.css'].map(name => readFileSync(join(styles, name), 'utf8')).join('\n').replaceAll('body[data-ds-dark-theme]', ':root.dark').replaceAll("html[data-platform='darwin'] :root.dark", ":root.dark").replaceAll("html[data-platform='darwin'] body", ":root").replace(/\bbody\s*\{/g, ':root {');
css += '\n:root, :root.dark {--dsw-alias-bg-base:hsl(var(--background));--dsw-alias-bg-layer-1:hsl(var(--card));--dsw-alias-bg-layer-2:hsl(var(--muted));--dsw-alias-bg-layer-3:hsl(var(--background));--dsw-alias-bg-overlay:hsl(var(--popover));--dsw-alias-label-primary:hsl(var(--foreground));--dsw-alias-label-secondary:hsl(var(--muted-foreground));--dsw-alias-label-tertiary:hsl(var(--muted-foreground));--dsw-alias-label-primary-foreground:hsl(var(--primary-foreground));--dsw-alias-brand-primary:hsl(var(--foreground));--dsw-alias-link:hsl(var(--primary));--dsw-alias-state-business-primary:hsl(var(--primary));--dsw-alias-button-primary-fill:hsl(var(--primary));--dsw-alias-button-primary-hover:color-mix(in srgb,hsl(var(--primary)) 90%,hsl(var(--foreground)));--dsw-alias-state-error-primary:hsl(var(--destructive));--dsw-alias-border-l1:hsl(var(--border));--dsw-alias-border-l2:hsl(var(--border));--dsw-alias-border-l3:hsl(var(--border));--dsw-alias-border-l4:hsl(var(--border));--dsw-alias-settings-card-fill:hsl(var(--card));--dsw-alias-settings-card-stroke:hsl(var(--border));--dsw-alias-switch-thumb:hsl(var(--muted-foreground));--dsw-specific-sidebar-fill:hsl(var(--sidebar-surface));--dsw-font-family:inherit;--dsw-focus-ring-width:2px;}\n';
writeFileSync(resolve(import.meta.dir, '../src/renderer/lib/third-party/paseo-client/dsh-tokens.css'), css);
