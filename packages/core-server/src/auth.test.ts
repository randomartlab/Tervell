import {test,expect} from 'bun:test'
import {DeviceAuth} from './auth.ts'
import type {DeviceRecord} from './auth.ts'
test('Given 设备注册持久化 When 重新载入、撤销和写失败 Then token不落盘且失败不放行',()=>{
 let records:DeviceRecord[]=[],now=1000,fail=false
 const persistence={read:()=>records,write:(next:DeviceRecord[])=>{if(fail)throw new Error('write failed');records=next}}
 const auth=new DeviceAuth(persistence,()=>now),issued=auth.issue({name:'phone',kind:'mobile',workspaceIds:['w1'],control:true,ttlMs:100})
 expect(JSON.stringify(records)).not.toContain(issued.token)
 const reloaded=new DeviceAuth(persistence,()=>now);expect(reloaded.authenticate(issued.token)).toMatchObject({deviceId:issued.device.id,kind:'mobile',workspaceIds:['w1']})
 fail=true;expect(()=>auth.revoke(issued.device.id)).toThrow('write failed');expect(()=>auth.authenticate(issued.token)).not.toThrow()
 fail=false;auth.revoke(issued.device.id);expect(()=>auth.authenticate(issued.token)).toThrow('失效')
 now=1200;expect(()=>reloaded.authenticate(issued.token)).toThrow('失效')
 expect(()=>auth.issue({name:'invalid',kind:'mobile',workspaceIds:['w1'],control:true,ttlMs:0})).toThrow('期限')
})

test('Given 多次重新打开真实设备文件 When 设备过期/撤销 Then 服务不恢复已撤销权限',async()=>{
 const {mkdtempSync,readFileSync,writeFileSync,renameSync,rmSync,existsSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os')
 const root=mkdtempSync(join(tmpdir(),'w8-devices-')),path=join(root,'devices.json')
 const persistence={read:()=>existsSync(path)?JSON.parse(readFileSync(path,'utf8')) as unknown:[],write:(value:DeviceRecord[])=>{writeFileSync(path+'.tmp',JSON.stringify(value),{mode:0o600});renameSync(path+'.tmp',path)}}
 try{
  const auth=new DeviceAuth(persistence),issued=auth.issue({name:'phone',kind:'mobile',workspaceIds:['w1'],control:true})
  expect(readFileSync(path,'utf8')).not.toContain(issued.token)
  const reopened=new DeviceAuth(persistence);expect(reopened.authenticate(issued.token).deviceId).toBe(issued.device.id)
  reopened.revoke(issued.device.id);expect(()=>new DeviceAuth(persistence).authenticate(issued.token)).toThrow('失效')
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 设备文件包含重复标识或hash When 启动 Then 拒绝模糊的认证配置',()=>{
 let records:DeviceRecord[]=[];const auth=new DeviceAuth({read:()=>records,write:next=>{records=next}})
 auth.issue({name:'first',kind:'mobile',workspaceIds:['w1'],control:true})
 expect(()=>new DeviceAuth({read:()=>[records[0],records[0]],write:()=>{}})).toThrow('重复')
})
