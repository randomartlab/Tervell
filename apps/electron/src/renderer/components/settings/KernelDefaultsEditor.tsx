import {kernelModelDependencies,isKernelModelDependency} from '@proma/shared';
import * as React from 'react';
import type {DesktopKernelCatalog,DesktopKernelSelectionDefaults,DesktopKernelPreferences,KernelSessionControl,KernelConfigValue} from '@proma/shared';
import {Button} from '@/components/ui/button';
import {KernelControlField,kernelControlRole,kernelControlValue} from '@/components/agent/KernelControlField';
import {useSetAtom} from 'jotai';
import {settingsTabAtom,modelRoutingTabAtom} from '@/atoms/settings-tab';
import {useCapabilityDraftGuard} from '@/hooks/useCapabilityDraftGuard';
export function KernelDefaultsEditor({kernelId,workspaceId}:{kernelId:string;workspaceId?:string}){
 const setTab=useSetAtom(settingsTabAtom),setRoutingTab=useSetAtom(modelRoutingTabAtom);
 const [state,setState]=React.useState<DesktopKernelPreferences>(),[catalog,setCatalog]=React.useState<DesktopKernelCatalog>(),[scope,setScope]=React.useState<'global'|'project'>('global'),[values,setValues]=React.useState<DesktopKernelSelectionDefaults>({}),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[notice,setNotice]=React.useState('');
 const generation=React.useRef(0),wid=scope==='project'?workspaceId:undefined;
 const load=React.useCallback(async()=>{const e=++generation.current;setBusy(true);setError('');try{const prefs=await window.electronAPI.desktopKernelPreferences(kernelId,wid);const actual=await window.electronAPI.probeDesktopKernel(kernelId,prefs.effective,wid);if(e!==generation.current)return;setState(prefs);setValues(wid?prefs.project:prefs.global);setCatalog(actual);}catch(cause){if(e===generation.current)setError(String(cause));}finally{if(e===generation.current)setBusy(false);}},[kernelId,wid]);
 React.useEffect(()=>{void load();return()=>{generation.current++;};},[load]);
 const dirty=!!state&&JSON.stringify(values)!==JSON.stringify(wid?state.project:state.global);useCapabilityDraftGuard(dirty);
 const inherited=(next:DesktopKernelSelectionDefaults)=>({...((wid?state?.global:undefined)??{}),...next,configValues:{...(wid&&(!next.modelId||next.modelId===state?.global.modelId)?state?.global.configValues:{}),...next.configValues}});
 const effective=inherited(values);
 const reprobe=async(next:DesktopKernelSelectionDefaults)=>{setValues(next);setError('');setNotice('');const e=++generation.current;setBusy(true);try{const actual=await window.electronAPI.probeDesktopKernel(kernelId,inherited(next),wid);if(e===generation.current)setCatalog(actual);}catch(cause){if(e===generation.current)setError(String(cause));}finally{if(e===generation.current)setBusy(false);}};
 const change=async(c:KernelSessionControl,value:KernelConfigValue)=>{
  const role=kernelControlRole(c,catalog?.controls??[]),next={...values};if(role==='model'){next.modelId=String(value);next.configValues=kernelModelDependencies(catalog?.controls??[],effective.configValues);}else if(role==='mode'){next.modeId=String(value);}else {if(isKernelModelDependency(c,catalog?.controls??[])){delete next.modelId;next.configValues={[c.id]:value};}else next.configValues={...next.configValues,[c.id]:value};}
  await reprobe(next);
 };
 const save=async()=>{setBusy(true);setError('');try{const next=await window.electronAPI.saveDesktopKernelPreferences(kernelId,wid,values);setState(next);setNotice('已保存。以后新建或切换到此内核的会话继承这些选项；当前会话保持自己的配置。');}catch(cause){setError(String(cause));}finally{setBusy(false);}};
 return <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4" data-testid="kernel-defaults-editor"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">模型、推理和权限默认值</h3><Button size="sm" variant="ghost" disabled={busy} onClick={()=>{if(!dirty||confirm('放弃未保存的内核选项并重新读取？'))void load();}}>重新读取</Button></div><p className="text-xs leading-5 text-muted-foreground">未覆盖的选项沿用 CLI 现有配置。项目继承全局，单个会话可再调整；安装与启用不会清除已有账号。</p><label className="block text-sm">保存范围<select aria-label="内核偏好范围" className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" value={scope} disabled={busy} onChange={e=>{if(!dirty||confirm('放弃当前范围未保存的内核选项？'))setScope(e.target.value as typeof scope);}}><option value="global">这台电脑的所有新会话</option>{workspaceId&&<option value="project">仅当前项目（继承全局）</option>}</select></label>
 {busy&&!catalog&&<p role="status" className="text-sm text-muted-foreground">正在读取内核的真实选项…</p>}
 {catalog?.notice&&<p role="status" className="rounded-md bg-primary/10 p-3 text-sm leading-6">{catalog.notice}</p>}
 {catalog?.routedModel&&<p className="text-xs leading-5 text-muted-foreground">模型由 Magpie 接管：{catalog.routedModel}。模型和推理档位在全局模型路由及会话栏调整；下方保留内核的模式、Fast 和其他选项。</p>}
 {catalog?.controls?.filter(c=>!catalog.routedModel||!isKernelModelDependency(c,catalog?.controls??[])&&!['model','reasoning'].includes(kernelControlRole(c,catalog?.controls??[]))).map(c=><KernelControlField key={c.id} control={c} value={kernelControlValue(c,effective,catalog?.controls??[])} disabled={busy} onChange={value=>void change(c,value)} onReset={()=>{const next={...values};const role=kernelControlRole(c,catalog?.controls??[]);if(role==='model'){delete next.modelId;next.configValues={};}else if(role==='mode')delete next.modeId;else{next.configValues={...next.configValues};delete next.configValues[c.id];}void reprobe(next);}}/>)}
 <label className="flex items-center justify-between gap-4 text-sm"><span>默认自动批准工具<small className="mt-1 block text-xs text-muted-foreground">与内核的沙盒/权限模式分别控制；手机授权仍独立检查。</small></span><input type="checkbox" checked={values.autoApprove??(wid?state?.global.autoApprove:false)??false} disabled={busy} onChange={e=>setValues(v=>({...v,autoApprove:e.target.checked}))}/></label>
 {error&&<p role="alert" className="text-sm text-destructive">{error.replace(/^Error invoking remote method '[^']+': (?:Error: )?/,'')}</p>}{notice&&<p role="status" className="text-sm text-primary">{notice}</p>}
 <Button variant="link" size="sm" className="h-auto px-0" onClick={()=>{setRoutingTab('accounts');setTab('routing');}}>已有官方账号？前往全局模型路由登录</Button>
 <div className="flex gap-2"><Button size="sm" disabled={busy||!!error||!dirty} onClick={()=>void save()}>保存默认选项</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>void reprobe({})}>全部恢复继承</Button></div></section>;
}
