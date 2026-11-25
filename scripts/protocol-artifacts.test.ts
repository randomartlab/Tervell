import { expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalDeclarationEnums, compareArtifacts, protocolArtifacts } from './protocol-artifacts.ts'

test('Given 原生平台推导出不同枚举顺序 When 生成声明 Then 值与其他属性顺序不变且枚举产物一致', () => {
  const first = 'export declare const S: z.ZodObject<{ z: z.ZodString; a: z.ZodEnum<{ running: "running"; "end-turn": "end-turn"; failed: "failed"; }>; }, z.core.$strict>;'
  const second = first.replace('running: "running"; "end-turn": "end-turn"; failed: "failed";', 'failed: "failed"; running: "running"; "end-turn": "end-turn";')
  const result = canonicalDeclarationEnums(first)
  expect(result).toBe(canonicalDeclarationEnums(second))
  expect(result.indexOf('z: z.ZodString')).toBeLessThan(result.indexOf('a: z.ZodEnum'))
  expect(result).toContain('"end-turn": "end-turn"')
  expect(result.indexOf('failed: "failed"')).toBeLessThan(result.indexOf('running: "running"'))
  expect(canonicalDeclarationEnums(result)).toBe(result)
})

test('Given 公开 zod 契约 When 生成两次 Then TS 声明与 JSON Schema 确定一致', () => {
  const first = protocolArtifacts(); const second = protocolArtifacts()
  expect([...second]).toEqual([...first])
  expect(first.get('types/index.d.ts')).toContain('KernelEvent')
  expect(first.get('types/storage.d.ts')).toContain('SessionLease')
  expect(first.has('protocol.schema.json')).toBe(true)
  expect([...first.keys()].some((file) => file.includes('.test.'))).toBe(false)
  expect([...first.entries()].filter(([file])=>file.endsWith('.d.ts')).every(([,text])=>!text.includes('\r\n'))).toBe(true)
})
test('Given 缺失/多余/损坏产物 When 对比 Then 全部被检出', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-artifacts-'))
  try {
    const expected = new Map([['types/a.d.ts', 'export type A = string\n'], ['schema.json', '{}\n']])
    mkdirSync(join(directory, 'types'))
    await Bun.write(join(directory, 'types/a.d.ts'), 'export type A = number\n')
    await Bun.write(join(directory, 'extra.txt'), '多余文件')
    expect(compareArtifacts(expected, directory)).toEqual(['extra.txt', 'schema.json', 'types/a.d.ts'])
    rmSync(join(directory, 'extra.txt'))
    for (const [file, text] of expected) await Bun.write(join(directory, file), text)
    expect(compareArtifacts(expected, directory)).toEqual([])
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
