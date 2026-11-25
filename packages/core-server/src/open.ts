import {join} from 'node:path'
import {openJournal} from '@proma/core/store'
import type {JournalOptions} from '@proma/core/store'
import type {Session} from '@proma/protocol'
import {DeviceAuth} from './auth.ts'
import type {DevicePersistence} from './auth.ts'
import {ServiceRepository} from './repository.ts'
import {ServiceDispatcher} from './dispatcher.ts'
import type {DispatcherOptions} from './dispatcher.ts'
import {CoreServer} from './server.ts'
import type {CoreServerOptions} from './server.ts'
import {MobileTunnelService} from './mobile-tunnel.ts'
/** 宿主显式启动入口：注入真实内核/cwd/原子设备持久化；不安装、不读取桌面旧JSONL。 */
export async function openCoreService(input:{directory:string;devices:DevicePersistence;kernel:DispatcherOptions['kernel'];cwd:DispatcherOptions['cwd'];authorizeTool:DispatcherOptions['authorizeTool'];sessions?:readonly Session[];network?:Omit<CoreServerOptions,'dispatcher'|'auth'>;journalOptions?:JournalOptions;mobile?:Omit<ConstructorParameters<typeof MobileTunnelService>[0],'dispatcher'|'auth'>}){
 const journal=await openJournal(join(input.directory,'journal.db'),input.journalOptions)
 let dispatcher:ServiceDispatcher|undefined,server:CoreServer|undefined,mobile:MobileTunnelService|undefined
 try{
  const repository=new ServiceRepository(journal),auth=new DeviceAuth(input.devices)
  dispatcher=new ServiceDispatcher({repository,auth,kernel:input.kernel,cwd:input.cwd,authorizeTool:input.authorizeTool})
  for(const session of input.sessions??[])repository.upsert(session)
  server=new CoreServer({...input.network,dispatcher,auth})
  if(input.mobile){mobile=new MobileTunnelService({...input.mobile,dispatcher,auth});await mobile.start()}
  let closing:Promise<void>|undefined
  return {server,dispatcher,repository,auth,mobile,close:()=>{closing??=(async()=>{try{await mobile?.close();await server!.close()}finally{journal.close()}})();return closing}}
 }catch(error){await mobile?.close();await server?.close();await dispatcher?.close();journal.close();throw error}
}
