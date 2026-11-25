import { app } from 'electron'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { releasePolicy } from '@proma/shared/config'
import type { ReleasePolicy } from '@proma/shared/config'

let cached: ReleasePolicy | undefined
/** 从安装产物的 metadata 读取，不依赖用户启动时携带环境变量。 */
export function currentReleasePolicy(): ReleasePolicy {
  if (cached) return cached
  const metadata: unknown = JSON.parse(readFileSync(join(app.getAppPath(), 'package.json'), 'utf8'))
  const channel = metadata && typeof metadata === 'object' && 'promaReleaseChannel' in metadata ? metadata.promaReleaseChannel : undefined
  if (channel !== undefined && channel !== 'alpha' && channel !== 'stable') throw new Error('安装产物通道无效。')
  cached = releasePolicy(channel)
  return cached
}
