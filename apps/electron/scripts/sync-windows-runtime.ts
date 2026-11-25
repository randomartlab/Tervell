import { join } from 'node:path'
import { homedir } from 'node:os'
import { syncRuntimeDeps } from './sync-runtime-deps'

const cache = process.env.TERVELL_WINDOWS_BUILD_CACHE ?? join(homedir(), '.cache/tervell/windows-build')
const result = syncRuntimeDeps({ targetNodeModules: join(cache, 'app/node_modules') })
console.log(`Windows组装目录已同步 ${result.copiedPackageCount} 个运行依赖；未修改应用依赖目录。`)
