import { z } from 'zod'
import * as protocol from '../packages/protocol/src/index.ts'

/** W1 契约快照；PR-06 再扩展 SDK、文档及发布生成流程。 */
export function contractSnapshot(): string {
  const schemas = Object.fromEntries(Object.entries(protocol)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([name, schema]) => name.endsWith('Schema') && schema instanceof z.ZodType
      ? [[name, z.toJSONSchema(schema, { io: 'input', reused: 'inline' })]] : []))
  const methods = Object.fromEntries(Object.entries(protocol.API_CONTRACTS).map(([name, contract]) => [name, {
    request: z.toJSONSchema(contract.request, { io: 'input' }), response: z.toJSONSchema(contract.response),
  }]))
  const productTools = Object.fromEntries(Object.entries({...protocol.PRODUCT_TOOL_CONTRACTS,...protocol.EXTENDED_TOOL_CONTRACTS}).map(([name, contract]) => [name, { input: z.toJSONSchema(contract.input, { io: 'input' }), output: z.toJSONSchema(contract.output) }]))
  return JSON.stringify({ productTools, format: 1, sessionSchemaVersion: protocol.SCHEMA_VERSION, schemas, methods, clients: protocol.CLIENT_METHODS }, null, 2) + '\n'
}
export const snapshotPath = new URL('../packages/protocol/contracts/w1.json', import.meta.url)
