import {existsSync} from 'node:fs';
import {KernelRegistry} from '@proma/kernel-host';
import {verifyManagedCliHandshake}from'./desktop-cli-handshake';
import { DesktopCliInstallJob } from './desktop-cli-install-job';
import { desktopKernelState,refreshDesktopKernels,saveDesktopKernel,desktopCliEnvironment,resolveDesktopCommand } from './desktop-extension-service';
import { provisionDesktopCli } from './desktop-cli-provision';
import {writeManagedCli} from './desktop-cli-managed';
import type {ManagedCli} from './desktop-cli-managed';
import {getMainWindow} from './main-window-store';
import {DESKTOP_EXTENSION_IPC} from '@proma/shared';
const candidates=new Map<string,{managed:ManagedCli;signature:string}>();
/** 安装在私有版本目录；取消/失败保留旧版本，只在复检及配置签名仍一致时切换。 */
export const desktopCliInstaller=new DesktopCliInstallJob({
 async run(job,output){
  const entry=desktopKernelState().entries.find(e=>e.id===job.kernelId);if(!entry?.installable)throw Error(entry?.installDiagnostic??'当前内核没有此平台的可安装发行物');
  const signature=JSON.stringify([entry.command,entry.args,entry.enabled]),controller=new AbortController();
  const exit=provisionDesktopCli(job.kernelId,{signal:controller.signal,output,env:desktopCliEnvironment(),existingCli:process.env.TERVELL_PROFILE_DIR?undefined:resolveDesktopCommand('codex')}).then(managed=>{controller.signal.throwIfAborted();candidates.set(job.id,{managed,signature});return 0;},error=>{if(!controller.signal.aborted)output((error instanceof Error?error.message:String(error))+'\r\n');return controller.signal.aborted?130:1;});
  return {exit,cancel:()=>controller.abort()};
 },
 async verify(id,signal){
  const job=desktopCliInstaller.state(),candidate=job?candidates.get(job.id):undefined,entry=desktopKernelState().entries.find(e=>e.id===id);
  if(!candidate||!entry||signal.aborted||JSON.stringify([entry.command,entry.args,entry.enabled])!==candidate.signature)return false;
  if(!existsSync(candidate.managed.command))return false;
  // 先独立验证实际ACP启动，避免把下载完成当成可用；未登录时保留已安装入口供用户登录。
  const verification=await verifyManagedCliHandshake(candidate.managed,candidate.managed.directory,desktopCliEnvironment(),signal);
  candidate.managed.verification=verification;
  const current=desktopKernelState().entries.find(e=>e.id===id);if(!current||JSON.stringify([current.command,current.args,current.enabled])!==candidate.signature)return false;
  signal.throwIfAborted();writeManagedCli(candidate.managed);const definition=new KernelRegistry().get(entry.id);saveDesktopKernel({id:entry.id,name:definition?.name??entry.name,command:definition?.acp?.command??definition?.cli??entry.command,args:definition?.acp?.args??entry.args,enabled:true});
  const state=await refreshDesktopKernels();candidates.delete(job!.id);
  return !signal.aborted&&state.entries.some(e=>e.id===id&&e.available);
 },
 changed(job){if(['succeeded','failed','cancelled'].includes(job.phase))candidates.delete(job.id);const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(DESKTOP_EXTENSION_IPC.cliInstallChanged,job);},
});
