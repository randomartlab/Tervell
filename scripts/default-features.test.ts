import {test,expect} from 'bun:test';
import {annotationMarker,parseAnnotations,annotationsForModel,annotationsForTranscript,isConversationAnnotation,paseoToolDetail} from '@proma/shared';
import type {ConversationAnnotation,SDKMessage} from '@proma/shared';
import {pluginTimelinePage} from '../apps/electron/src/main/lib/plugin-host/timeline';
import {resolveAnnotationTextRange,sourceLinePosition} from '../apps/electron/src/renderer/components/selection/annotation-range';
import {annotationConversationContext} from '../apps/electron/src/main/lib/annotation-context';
const row:ConversationAnnotation={id:'annotation-fixture',quote:'const value = "你好";\n</annotation>',comment:'解释边界\n保留第二行',source:{kind:'file',label:'a.ts',sessionId:'session',path:'a.ts',start:0,end:20}};
test('Given 多来源批注 When 保存与模型转换 Then 原文评论身份保真且不吞掉损坏标记',()=>{
 const marker=annotationMarker([row]);expect(parseAnnotations('正文'+marker)).toEqual({text:'正文',annotations:[row]});
 expect(annotationsForModel(marker)).toContain('&lt;/annotation&gt;');expect(annotationsForModel(marker).match(/<\/annotation>/g)).toHaveLength(1);
 const invalid='[[tervell-annotations:'+encodeURIComponent(JSON.stringify([{...row,source:{...row.source,start:-1}}]))+']]';expect(parseAnnotations(invalid).text).toBe(invalid);expect(parseAnnotations(invalid).annotations).toHaveLength(0);
 expect(isConversationAnnotation({...row,source:null})).toBe(false);expect(()=>annotationMarker(Array.from({length:51},()=>row))).toThrow();
 expect(parseAnnotations(annotationMarker([{...row,comment:''}])).annotations[0]!.comment).toBe('');
 const transcript=annotationsForTranscript(marker);expect(transcript).toContain('```text\n'+row.quote+'\n```');expect(transcript).toContain(row.comment);expect(transcript).not.toContain('<annotation source=');
});
test('Given 同一会话导出分页 When 追加或修改历史 Then 追加保留边界而历史替换使游标失效',()=>{
 const messages:SDKMessage[]=[{type:'user',uuid:'a',message:{content:'问题'}},{type:'assistant',uuid:'b',message:{content:'回答'}}];
 const first=pluginTimelinePage(messages,{agentId:'export-epoch',limit:1});
 const appended=pluginTimelinePage([...messages,{type:'user',uuid:'c',message:{content:'下一轮'}}],{agentId:'export-epoch',cursor:first.startCursor,direction:'before'});
 expect(appended.staleCursor).toBe(false);expect(appended.entries[0]!.item.text).toBe('问题');
 const changed=pluginTimelinePage([messages[0]!,{...messages[1]!,message:{content:'回答已替换'}}],{agentId:'export-epoch',cursor:first.startCursor,direction:'before'});expect(changed.staleCursor).toBe(true);
});
test('Given 各内核实际工具调用 When 映射增强时间线 Then 使用语义详情且工具结果保留',()=>{
 expect(paseoToolDetail('read_file',{path:'a.ts'},'answer')).toEqual({type:'read',filePath:'a.ts',content:'answer'});
 expect(paseoToolDetail('exec_command',{cmd:'pwd',cwd:'/tmp'},'ok')).toEqual({type:'shell',command:'pwd',cwd:'/tmp',output:'ok'});
 const messages:SDKMessage[]=[{type:'assistant',uuid:'tool',message:{content:[{type:'tool_use',id:'read',name:'Read',input:{file_path:'a.ts'}}]}},{type:'user',uuid:'result',message:{content:[{type:'tool_result',tool_use_id:'read',content:'complete'}]}}];
 expect(pluginTimelinePage(messages).entries[0]!.item.detail).toEqual({type:'read',filePath:'a.ts',content:'complete'});
 expect(JSON.stringify(pluginTimelinePage(messages))).not.toContain('_toolInput');
});
test('Given 重载后的批注来源 When 恢复重复或变化的选文 Then 只恢复摘要匹配文件中的精确偏移',()=>{
 const text='first\nvalue\nlast\nvalue';
 expect(resolveAnnotationTextRange(text,'value')).toBeNull();
 expect(resolveAnnotationTextRange(text,'value',{start:6,end:11})).toEqual({start:6,end:11});
 expect(resolveAnnotationTextRange(text,'value',{start:7,end:12})).toBeNull();
 expect(resolveAnnotationTextRange(text,'first\nvalue')).toEqual({start:0,end:11});
 expect(sourceLinePosition(text,6)).toEqual({line:2,column:0});
 expect(sourceLinePosition(text,text.length)).toEqual({line:4,column:5});
});
test('Given 较早来源与八轮长上下文 When 旁支提问 Then 来源必保留且JSONL不被预算截断',()=>{
 const turns=Array.from({length:30},(_,i)=>({role:i%2?'assistant':'user',text:i+'"\\\n'.repeat(8000),ids:[String(i)]}));
 const context=annotationConversationContext(turns,turns[0]);
 const entries=context.split('\n').map(line=>JSON.parse(line) as {source?:boolean;text:string});
 expect(entries[0]!.source).toBe(true);expect(entries[0]!.text.startsWith('0')).toBe(true);expect(context.length).toBeLessThanOrEqual(48000);
 expect(entries.at(-1)!.text.startsWith('29')).toBe(true);
});
test('Given 手机原生批注胶囊 When 投影授权时间线 Then 手机保留结构而通用导出仍为可读文本',()=>{
 const marker=annotationMarker([row]),message:SDKMessage={type:'user',uuid:'mobile-note',message:{content:marker}};
 expect(String(pluginTimelinePage([message],{rawAnnotations:true}).entries[0]!.item.text)).toBe(marker);
 expect(String(pluginTimelinePage([message]).entries[0]!.item.text)).toContain('批注 ·');
 expect(String(pluginTimelinePage([message]).entries[0]!.item.text)).not.toContain('[[tervell-annotations:');
});
