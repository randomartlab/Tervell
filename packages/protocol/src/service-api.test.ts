import {test,expect} from 'bun:test'
import {ApiRequestSchema,parseApiResponse} from './api.ts'
import {SERVICE_API_CONTRACTS} from './service-api.ts'
import type {ServiceApiMethod} from './service-api.ts'
const requests:Record<ServiceApiMethod,unknown>={
 'session.events':{id:'s1'},'lease.status':{id:'s1'},'lease.acquire':{id:'s1'},'lease.renew':{id:'s1',fence:1},'lease.release':{id:'s1',fence:1},'lease.transfer':{id:'s1',expectedFence:1,confirm:'transfer-writer'},
 'module.catalog':{clientKind:'mobile'},'files.tree':{id:'s1'},'files.diff':{id:'s1',path:'src/a.ts'},'terminal.list':{id:'s1'},'terminal.create':{id:'s1',command:'pwd'},'terminal.attach':{id:'s1',termId:'00000000-0000-4000-8000-000000000001'},'terminal.kill':{id:'s1',termId:'00000000-0000-4000-8000-000000000001'},'terminal.release':{id:'s1',termId:'00000000-0000-4000-8000-000000000001'},
}
for(const method of Object.keys(requests) as ServiceApiMethod[])test(`Given ${method} When mobile请求 Then 注册且参数严格校验`,()=>{
 expect(ApiRequestSchema.safeParse({clientKind:'mobile',requestId:'r1',method,params:requests[method]}).success).toBe(true)
 expect(SERVICE_API_CONTRACTS[method].request.safeParse({...requests[method] as object,permissionModeOverride:'auto'}).success).toBe(false)
 expect(()=>parseApiResponse(method,'mobile',{})).toThrow()
})
test('Given 错误转移确认/负seq/过大分页 When 契约解析 Then 拒绝',()=>{
 for(const [method,params]of [['lease.transfer',{id:'s1',expectedFence:1,confirm:'yes'}],['session.events',{id:'s1',afterSeq:-1}],['files.tree',{id:'s1',depth:4}],['terminal.create',{id:'s1',command:'pwd',env:{SECRET:'fake'}}]])expect(ApiRequestSchema.safeParse({clientKind:'mobile',requestId:'r1',method,params}).success).toBe(false)
})
