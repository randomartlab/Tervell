import {build} from 'esbuild'
import {resolve} from 'node:path'
await import('./build-default-features')
await build({entryPoints:[resolve(import.meta.dir,'../../../packages/tool-bridge/src/stdio.ts')],outfile:resolve(import.meta.dir,'../dist/plugin-stdio.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',banner:{js:"import {createRequire as __pluginCreateRequire} from 'node:module'; const require=__pluginCreateRequire(import.meta.url);"}})

await build({entryPoints:[resolve(import.meta.dir,'../resources/third-party/paseo-server/lifecycle.ts')],outfile:resolve(import.meta.dir,'../resources/third-party/plugin-host/lifecycle.cjs'),bundle:true,platform:'node',format:'cjs',target:'node22'})

await import('./build-plugin-core')

await import('./build-dsh-core')
