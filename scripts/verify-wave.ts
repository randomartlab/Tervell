import { spawnSync } from 'node:child_process'

const wave = process.argv.find((arg) => arg.startsWith('--wave='))?.slice(7)
if (!wave || !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(wave)) throw new Error('支持 W1–W9：bun run verify:wave --wave=<n>')
const headless = ['3', '4', '5', '6', '7', '8', '9'].includes(wave) || process.argv.includes('--headless')
const tests = wave === '1'
  ? ['packages/protocol', 'packages/core/src/store', 'packages/core/src/permission', 'packages/core/src/w1.integration.test.ts']
  : ['packages/core/src/store', 'packages/kernel-host', 'scripts/protocol-artifacts.test.ts', `tests/w${wave}.integration.test.ts`]
const checks = [
  ['bun', 'run', 'gen:check'],
  ...(['6','7','8','9'].includes(wave) ? [['bun', 'scripts/check-acp-drift.ts']] : []),
  headless ? ['bun', 'scripts/test-headless.ts'] : ['bun', 'test', ...tests],
  ['bun', 'run', 'typecheck'], ['bun', 'run', 'lint'],
  ...(wave === '9' ? [['./node_modules/.bin/tsc', '--noEmit', '-p', 'scripts/tsconfig.w9.json']] : []),
  ...(wave === '9' ? [['bun', 'run', '--cwd', 'apps/web', 'build']] : []),
]
for (const command of checks) {
  const [executable, ...args] = command
  if (!executable) throw new Error('空验证命令')
  const result = spawnSync(executable, args, { stdio: 'inherit', env: process.env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
console.log(`verify:wave W${wave} OK：${wave === '1' ? 'PR-02/03/04/05、ST-01、SEC-01' : wave === '2' ? 'ST-02/03/04、KH-01/06、PR-06' : wave === '3' ? 'KH-02/03a/03b/03/04/05/07、ST-05/06（无桌面验证）' : wave === '4' ? 'AC-01/02a/02/06、SEC-02/04（无桌面验证）' : wave === '5' ? 'AC-07..12、AC-14（开发门禁；五家真实CLI验收待补）' : wave === '6' ? 'TL-01/02/03、AC-15、SEC-03（无桌面验证；五家真实CLI与系统密钥环待验）' : wave === '7' ? 'AC-03/04/05、TL-04/05/06/07（无桌面验证；真实CLI与桌面待验）' : wave === '8' ? 'API-01..07（无桌面验证；真实CLI/桌面/云TLS待验）' : 'WB-01/02/03/07/09、ST-07（无桌面验证；真实内核/云TLS待验）'} 和跨卡检查通过`)
