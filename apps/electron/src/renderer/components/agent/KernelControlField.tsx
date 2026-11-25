import * as React from 'react';
import type {KernelSessionControl,KernelConfigValue,KernelSessionSelection} from '@proma/shared';
import {isReasoningControl,kernelControlSelectionField} from '@proma/shared';
import {Switch} from '@/components/ui/switch';
export function kernelControlRole(control:KernelSessionControl,controls:readonly KernelSessionControl[]=[control]):'model'|'mode'|'reasoning'|'speed'|'other'{
 if(kernelControlSelectionField(control,controls)==='modelId')return 'model';
 if(kernelControlSelectionField(control,controls)==='modeId')return 'mode';
 if(isReasoningControl(control))return 'reasoning';
 return /speed|fast|service.?tier/i.test([control.id,control.category,control.name].join(' '))?'speed':'other';
}
export function kernelControlValue(control:KernelSessionControl,selection:KernelSessionSelection,controls:readonly KernelSessionControl[]=[control]){const role=kernelControlRole(control,controls);return role==='model'?selection.modelId??control.currentValue:role==='mode'?selection.modeId??control.currentValue:selection.configValues?.[control.id]??control.currentValue;}
export function KernelControlField({control,value,disabled,onChange,onReset}:{control:KernelSessionControl;value:KernelConfigValue|undefined;disabled?:boolean;onChange:(value:KernelConfigValue)=>void;onReset?:()=>void}){
 const id=React.useId(),[draft,setDraft]=React.useState(value===undefined?'':String(value)),[error,setError]=React.useState('');
 React.useEffect(()=>{setDraft(value===undefined?'':String(value));setError('');},[value,control.id]);
 const save=()=>{const next=control.type==='number'?Number(draft):draft;if(control.type==='number'&&(!draft.trim()||!Number.isFinite(next))){setError('请输入有效数字');return;}if(next!==value)onChange(next);};
 return <div className="space-y-1.5" data-kernel-control={control.id}><div className="flex items-center justify-between gap-3"><label htmlFor={id} className="text-sm font-medium">{control.name}</label>{onReset&&<button type="button" className="text-xs text-muted-foreground underline-offset-4 hover:underline" disabled={disabled} onClick={onReset}>继承默认</button>}</div>{control.description&&<p id={id+'-description'} className="text-xs leading-5 text-muted-foreground">{control.description}</p>}
 {control.type==='select'?<select id={id} aria-describedby={control.description?id+'-description':undefined} disabled={disabled||control.readOnly} value={value===undefined?'':JSON.stringify(value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={e=>{const option=control.options?.find(o=>JSON.stringify(o.value)===e.target.value);if(option)onChange(option.value);}}><option value="" disabled>沿用内核默认</option>{control.options?.map(o=><option key={JSON.stringify(o.value)} value={JSON.stringify(o.value)}>{o.group?o.group+' / ':''}{o.name}</option>)}</select>:control.type==='boolean'?<Switch id={id} checked={value===true} disabled={disabled||control.readOnly} onCheckedChange={onChange}/>:control.type==='number'||control.type==='string'?<input id={id} type={control.type==='number'?'number':'text'} min={control.minimum} max={control.maximum} value={draft} disabled={disabled||control.readOnly} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={e=>setDraft(e.target.value)} onBlur={save} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();save();}}}/>:<p className="text-xs text-muted-foreground">此版本内核返回了只读选项。</p>}{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}
