import ts from 'typescript'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contractSnapshot } from './contracts.ts'

export const artifactDirectory = fileURLToPath(new URL('../packages/protocol/generated', import.meta.url))
const protocolDirectory = fileURLToPath(new URL('../packages/protocol', import.meta.url))

/** 推导出的枚举对象顺序受 TS 内部 union ID 影响；只规范这些无序成员，保留其他声明顺序。 */
export function canonicalDeclarationEnums(text: string): string {
  const source = ts.createSourceFile('contract.d.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const transformed = ts.transform(source, [(context) => {
    const visit: ts.Visitor = (node) => {
      const visited = ts.visitEachChild(node, visit, context)
      if (!ts.isTypeReferenceNode(visited) || !ts.isQualifiedName(visited.typeName)
        || visited.typeName.right.text !== 'ZodEnum' || visited.typeArguments?.length !== 1) return visited
      const argument = visited.typeArguments[0]
      if (!argument || !ts.isTypeLiteralNode(argument)
        || !argument.members.every((member) => ts.isPropertySignature(member)
          && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)))) return visited
      const name = (member: ts.TypeElement): string => {
        if (!ts.isPropertySignature(member)) throw new Error('枚举成员必须是属性')
        return (member.name as ts.Identifier | ts.StringLiteral).text
      }
      const members = [...argument.members].sort((left, right) => name(left) < name(right) ? -1 : name(left) > name(right) ? 1 : 0)
      return context.factory.updateTypeReferenceNode(visited, visited.typeName, [context.factory.updateTypeLiteralNode(argument, members)])
    }
    return (node) => ts.visitNode(node, visit, ts.isSourceFile) ?? node
  }])
  try {
    const result = transformed.transformed[0]
    if (!result) throw new Error('契约声明生成失败')
    return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(result)
  } finally { transformed.dispose() }
}

/** TS 自己为 zod 推导类型生成声明，避免自制 JSON Schema -> TS 丢失 refine/默认值类型。 */
export function protocolArtifacts(): Map<string, string> {
  const sourceDirectory = join(protocolDirectory, 'src')
  const sources = readdirSync(sourceDirectory).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts')).map((name) => join(sourceDirectory, name))
  const configFile = ts.readConfigFile(join(protocolDirectory, 'tsconfig.json'), ts.sys.readFile)
  if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, protocolDirectory)
  // TypeScript默认采用宿主换行；Windows的CRLF不能造成同一契约生成物漂移。
  const options: ts.CompilerOptions = { ...parsed.options, newLine: ts.NewLineKind.LineFeed, noEmit: false, declaration: true, emitDeclarationOnly: true, rootDir: sourceDirectory, outDir: join(artifactDirectory, 'types') }
  const host = ts.createCompilerHost(options)
  const files = new Map<string, string>()
  host.writeFile = (file, text) => { files.set(relative(artifactDirectory, resolve(file)).split('\\').join('/'), file.endsWith('.d.ts') ? canonicalDeclarationEnums(text) : text) }
  const program = ts.createProgram(sources, options, host)
  const before = ts.getPreEmitDiagnostics(program)
  const emit = program.emit()
  const diagnostics = [...parsed.errors, ...before, ...emit.diagnostics]
  if (emit.emitSkipped || diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => protocolDirectory, getCanonicalFileName: (file) => file, getNewLine: () => '\n' }))
  files.set('protocol.schema.json', contractSnapshot())
  return new Map([...files].sort(([left], [right]) => left.localeCompare(right)))
}

export function compareArtifacts(expected: ReadonlyMap<string, string>, directory = artifactDirectory): string[] {
  const actual = new Map<string, string>()
  function visit(folder: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name)
      if (entry.isDirectory()) visit(path)
      else actual.set(relative(directory, path).split('\\').join('/'), readFileSync(path, 'utf8'))
    }
  }
  try { visit(directory) } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
  }
  return [...new Set([...actual.keys(), ...expected.keys()])].sort().flatMap((file) => actual.get(file) !== expected.get(file) ? [file] : [])
}
