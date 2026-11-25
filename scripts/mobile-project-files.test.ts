import {test,expect} from 'bun:test';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {MobileProjectEdits,mobileProjectTree,mobileProjectRead,mobileProjectDigest} from '../apps/electron/src/main/lib/mobile-project-files';
import {remoteWorkspaceIds} from '../packages/core/src/remote/host';
const sha=(s:string|Uint8Array)=>createHash('sha256').update(s).digest('hex');

test('Given 配对后新增工作区 When 读取默认全部项目 Then 新旧工作区自动可用且显式限制仍生效',()=>{
 const device={workspaceIds:['old'],allWorkspaces:true};expect(remoteWorkspaceIds(device,['old','new'])).toEqual(['old','new']);
 expect(remoteWorkspaceIds({...device,allWorkspaces:false},['old','new'])).toEqual(['old']);
 expect(remoteWorkspaceIds(device,['new'])).toEqual(['new']);
});
test('Given 大项目目录与中文文本 When 分页和保存 Then 超过100个文件不遗漏且原文完整',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-project-files-'));try{
 for(let i=0;i<205;i++)writeFileSync(join(root,'f'+String(i).padStart(3,'0')+'.txt'),'file');
 const first=mobileProjectTree(root,'.'),second=mobileProjectTree(root,'.',first.nextOffset!,first.revision),last=mobileProjectTree(root,'.',second.nextOffset!,first.revision);
 expect([...first.entries,...second.entries,...last.entries]).toHaveLength(205);expect(last.nextOffset).toBeNull();
 const original='中文🙂'.repeat(30000);writeFileSync(join(root,'unicode.txt'),original);let output='',offset=0,revision='';for(;;){const p=mobileProjectRead(root,'unicode.txt',offset,revision);output+=p.content;if(!p.hasMore)break;offset=p.nextOffset;revision=p.revision;}expect(output).toBe(original);
 const updated=original+'\n手机编辑完成',bytes=Buffer.from(updated),edits=new MobileProjectEdits(),started=edits.begin('a','w',root,{path:'unicode.txt',expected:mobileProjectDigest(root,'unicode.txt'),digest:sha(bytes),bytes:bytes.length});
 for(let at=0;at<bytes.length;at+=48000)edits.chunk('a','w',started.id,root,at/48000,bytes.subarray(at,at+48000).toString('base64'));
 expect(edits.finish('a','w',started.id,root,()=>{}).saved).toBe(true);expect(readFileSync(join(root,'unicode.txt'),'utf8')).toBe(updated);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Given 两个项目同名文件 When 并发编辑、越权或撤销 Then 不串写、不覆盖外部内容',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-project-boundary-'));try{const a=join(root,'a'),b=join(root,'b');mkdirSync(a);mkdirSync(b);writeFileSync(join(a,'same.txt'),'A');writeFileSync(join(b,'same.txt'),'B');const edits=new MobileProjectEdits(),bytes=Buffer.from('new');
 const first=edits.begin('phone','project-a',a,{path:'same.txt',expected:sha('A'),digest:sha(bytes),bytes:3});edits.chunk('phone','project-a',first.id,a,0,bytes.toString('base64'));
 expect(()=>edits.finish('other','project-a',first.id,a,()=>{})).toThrow('失效');expect(()=>edits.finish('phone','project-b',first.id,b,()=>{})).toThrow('失效');
 writeFileSync(join(a,'same.txt'),'external');expect(()=>edits.finish('phone','project-a',first.id,a,()=>{})).toThrow('更新');expect(readFileSync(join(a,'same.txt'),'utf8')).toBe('external');expect(readFileSync(join(b,'same.txt'),'utf8')).toBe('B');
 const fresh=edits.begin('phone','project-a',a,{path:'same.txt',expected:sha('external'),digest:sha(bytes),bytes:3});edits.chunk('phone','project-a',fresh.id,a,0,bytes.toString('base64'));expect(()=>edits.finish('phone','project-a',fresh.id,a,()=>{throw Error('已撤销');})).toThrow('已撤销');
 symlinkSync(b,join(a,'escape'));expect(()=>mobileProjectRead(a,'escape/same.txt')).toThrow('边界');expect(()=>edits.begin('phone','project-a',a,{path:'../b/same.txt',expected:'new',digest:sha(bytes),bytes:3})).toThrow();
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Given 带BOM的UTF8项目文件 When 手机逐页读取后保存 Then BOM与正文保留且摘要一致',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-project-bom-'));try{
 const value='\uFEFF中文🙂\n',bytes=Buffer.from(value);writeFileSync(join(root,'bom.txt'),bytes);
 expect(mobileProjectRead(root,'bom.txt').content).toBe(value);
 expect(sha(new TextEncoder().encode(mobileProjectRead(root,'bom.txt').content))).toBe(mobileProjectDigest(root,'bom.txt'));
 const next=Buffer.from(value+'更新'),edits=new MobileProjectEdits(),entry=edits.begin('p','w',root,{path:'bom.txt',expected:sha(bytes),digest:sha(next),bytes:next.length});edits.chunk('p','w',entry.id,root,0,next.toString('base64'));edits.finish('p','w',entry.id,root,()=>{});expect(readFileSync(join(root,'bom.txt'))).toEqual(next);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Given 控制操作结果超过包体 When 分页读取 Then 原始结构完整且不能跨设备或越过原操作授权',async()=>{
 const {MobileControlPages}=await import('../apps/electron/src/main/lib/mobile-workspace-data');const pages=new MobileControlPages();
 const data={models:Array.from({length:1500},(_,i)=>({id:'model-'+i,name:'模型🙂'+i,efforts:['ultra','custom']}))};
 const saved=pages.save('phone',{operation:'gateway.snapshot',values:{private:'never retained'}},data) as {controlResult:{id:string;content:string;nextOffset:number;hasMore:boolean}};
 expect(saved.controlResult).toBeDefined();expect(pages.access('phone',saved.controlResult.id).values).toEqual({});
 expect(()=>pages.access('other',saved.controlResult.id)).toThrow('不属于');let output='',offset=0;for(;;){const page=pages.read('phone',saved.controlResult.id,offset);output+=page.content;if(!page.hasMore)break;offset=page.nextOffset;}expect(JSON.parse(output)).toEqual(data);
});
