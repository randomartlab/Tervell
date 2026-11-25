import { describe, expect, test } from 'bun:test'
import { ApiRequestSchema, ApiMethodSchema, assertApiMethodAllowed, parseApiResponse, CLIENT_METHODS } from './api.ts'
import {SERVICE_API_CONTRACTS} from './service-api.ts'
import type { ApiMethod, ApiResult } from './api.ts'

const requests = {
  'session.list': {}, 'session.detail': { id: 's1' },
  'session.timeline': { id: 's1', direction: 'tail', limit: 40, wholeTurns: true },
  'session.send': { id: 's1', text: '继续', clientMessageId: 'm1' }, 'session.queue': { id: 's1', text: '排队' },
  'session.interrupt': { id: 's1' }, 'session.subscribe': { ids: ['s1'] },
  'approval.list': {}, 'approval.respond': { requestId: 'a1', decision: 'allow-session' },
  'revision.probe': { entity: 'sessions', scope: 'workspace-1' }, 'host.status': {},
}
const timeline = { epoch: 'e1', rows: [{ id: 'row1', turnId: 't1', seqStart: 1, seqEnd: 2, kind: 'text' as const, summary: '完成', sourceSeqRanges: [{ start: 1, end: 2 }] }], hasOlder: false, hasNewer: false }
const responses = {
  'session.list': { generation: 'g1', headSeq: 0, mode: 'snapshot', entries: [], removals: [], pageInfo: { hasMore: false } },
  'session.detail': { session: null }, 'session.timeline': timeline,
  'session.send': { clientMessageId: 'm1', accepted: true }, 'session.queue': { queuedMessageId: 'm2' },
  'session.interrupt': { interrupted: true }, 'session.subscribe': { subscriptionId: 'sub1' },
  'approval.list': { approvals: [] }, 'approval.respond': { requestId: 'a1', resolved: true },
  'revision.probe': { revision: 'rev1' }, 'host.status': { hostId: 'host1', status: 'online', version: '1.0.0' },
} satisfies Partial<{ [M in ApiMethod]: ApiResult<M> }>

describe('PR-05 领域 API', () => {
  for (const method of Object.keys(responses) as Array<keyof typeof responses>) {
    test(`Given ${method} 响应 When 解析 Then 合法响应保留且空响应拒绝`, () => {
      expect(parseApiResponse(method, 'desktop', responses[method])).toEqual(responses[method])
      expect(() => parseApiResponse(method, 'desktop', {})).toThrow()
    })
  }
  for (const [method, params] of Object.entries(requests)) {
    test(`Given ${method} When mobile 调用 Then 请求通过白名单和校验`, () => {
      expect(String(ApiRequestSchema.parse({ clientKind: 'mobile', method, params, requestId: 'req1' }).method)).toBe(method)
      expect(() => assertApiMethodAllowed('mobile', method)).not.toThrow()
    })
  }
  test('Given clientKind 白名单 When 枚举 Then 四端均显式注册', () => {
    expect(ApiMethodSchema.options).toHaveLength(11+Object.keys(SERVICE_API_CONTRACTS).length)
    for (const kind of ['desktop', 'web', 'mobile', 'cli'] as const) expect(CLIENT_METHODS[kind]).toHaveLength(11+Object.keys(SERVICE_API_CONTRACTS).length)
  })
  test('Given 未列方法或未知客户端 When 鉴权 Then 403 且不继承对象原型', () => {
    for (const method of ['workspace.delete', 'constructor', 'toString', '__proto__']) {
      expect(() => assertApiMethodAllowed('mobile', method)).toThrow('403')
    }
    expect(() => assertApiMethodAllowed('watch', 'host.status')).toThrow('403')
    expect(ApiRequestSchema.safeParse({ clientKind: 'mobile', method: 'workspace.delete', params: {}, requestId: 'r' }).success).toBe(false)
  })
  test('Given 移动端时间线 When 解析响应 Then 删除 sourceSeqRanges 且保留原输入', () => {
    const result = parseApiResponse('session.timeline', 'mobile', timeline)
    expect(result.rows[0]).not.toHaveProperty('sourceSeqRanges')
    expect(result.rows[0]?.seqStart).toBe(1)
    expect(timeline.rows[0]?.sourceSeqRanges).toHaveLength(1)
    expect(parseApiResponse('session.timeline', 'desktop', timeline).rows[0]?.sourceSeqRanges).toHaveLength(1)
  })
  for (const [method, params] of [
    ['session.send', { id: 's1', text: '缺幂等 ID' }],
    ['session.send', { id: 's1', text: '', clientMessageId: 'm1' }],
    ['session.timeline', { id: 's1', direction: 'tail', limit: 201, wholeTurns: true }],
    ['session.timeline', { id: 's1', direction: 'unknown', limit: 40, wholeTurns: true }],
    ['session.subscribe', { ids: [] }], ['approval.respond', { requestId: 'a1', decision: 'always' }],
  ]) {
    test(`Given ${method} 非法参数 When 解析 Then 拒绝`, () => {
      expect(ApiRequestSchema.safeParse({ clientKind: 'mobile', method, params, requestId: 'r' }).success).toBe(false)
    })
  }
  test('Given 响应缺少必要字段或序号倒置 When 解析 Then 拒绝', () => {
    expect(() => parseApiResponse('host.status', 'mobile', {})).toThrow()
    expect(() => parseApiResponse('session.timeline', 'mobile', { ...timeline, rows: [{ ...timeline.rows[0], seqStart: 3, seqEnd: 1 }] })).toThrow()
  })
  test('Given 发送或审批响应 When 解析 Then 使用对应响应契约', () => {
    expect(parseApiResponse('session.send', 'cli', { clientMessageId: 'm1', accepted: true })).toEqual({ clientMessageId: 'm1', accepted: true })
    expect(parseApiResponse('approval.respond', 'mobile', { requestId: 'a1', resolved: true }).resolved).toBe(true)
  })
})
