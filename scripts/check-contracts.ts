import { mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contractSnapshot, snapshotPath } from './contracts.ts'
import { artifactDirectory, compareArtifacts, protocolArtifacts } from './protocol-artifacts.ts'

const actual = contractSnapshot()
if (process.argv.includes('--write')) {
  mkdirSync(dirname(fileURLToPath(snapshotPath)), { recursive: true })
  // 生成物通过临时文件替换；不会触碰用户配置或会话元数据。
  const temp = fileURLToPath(snapshotPath) + '.tmp'
  await Bun.write(temp, actual)
  renameSync(temp, snapshotPath)
  console.log('gen:write OK：W1 契约快照已生成')
} else {
  let expected: string
  try { expected = readFileSync(snapshotPath, 'utf8') } catch (error) { throw new Error('契约快照缺失，请运行 bun run gen:write', { cause: error }) }
  if (actual !== expected) throw new Error('契约快照漂移：请审查变更后运行 bun run gen:write')
  console.log('gen:check OK：公共 schema、领域 API、产品工具及四端白名单无漂移')
}

const generated = protocolArtifacts()
if (process.argv.includes('--write')) {
  // 目录先暂存完整产物，再替换；不把测试文件或旧版本残留混入声明包。
  const staged = artifactDirectory + '.tmp'
  rmSync(staged, { recursive: true, force: true })
  try {
    for (const [name, text] of generated) {
      mkdirSync(dirname(join(staged, name)), { recursive: true })
      await Bun.write(join(staged, name), text)
    }
    rmSync(artifactDirectory, { recursive: true, force: true })
    renameSync(staged, artifactDirectory)
  } finally { rmSync(staged, { recursive: true, force: true }) }
  console.log(`gen:write OK：${generated.size} 个 TypeScript/JSON Schema 产物`)
} else {
  const drift = compareArtifacts(generated)
  if (drift.length) throw new Error(`协议生成物漂移：${drift.join(', ')}`)
  console.log(`gen:check OK：${generated.size} 个 TypeScript/JSON Schema 产物无缺失、无多余、无内容漂移`)
}
