import {expect,test} from 'bun:test'
import {mobileTextSlice,MobileResultPages} from '../apps/electron/src/main/lib/mobile-workspace-data'
import {mergeEntries,groupedSessions,textChunks} from '../apps/mobile/client/src/model'
import type {TimelineEntry} from '../apps/mobile/client/src/model'

test('Given 超过2MB的中文与emoji When 分段读取 Then 原文完整且代理对不拆开',()=>{
 const source=('中文\n🙂'+ 'A'.repeat(11992)).repeat(200);let offset=0,result='',revision=''
 for(;;){const page=mobileTextSlice(source,offset,revision);expect(page.content).not.toMatch(/[\uD800-\uDBFF]$/);result+=page.content;if(!page.hasMore)break;expect(page.nextOffset).toBeGreaterThan(offset);offset=page.nextOffset;revision=page.revision}
 expect(result).toBe(source)
 expect(()=>mobileTextSlice(source+'changed',offset,revision)).toThrow('内容已更新')
})
test('Given 大插件RPC结果 When 手机分页与撤销所有权 Then 结构完整且其他设备不能读取',()=>{
 let now=1;const pages=new MobileResultPages(()=>now),value={entries:Array.from({length:900},(_,i)=>({i,text:'记录🙂'.repeat(100)}))}
 const saved=pages.save('phone-a','plugin-a',value) as {resultPage:{id:string;content:string;nextOffset:number;hasMore:boolean}}
 let text=saved.resultPage.content,offset=saved.resultPage.nextOffset,more=saved.resultPage.hasMore
 expect(()=>pages.read('phone-b',saved.resultPage.id,offset)).toThrow()
 while(more){const page=pages.read('phone-a',saved.resultPage.id,offset);text+=page.content;offset=page.nextOffset;more=page.hasMore}
 expect(JSON.parse(text)).toEqual(value);now=700000;expect(()=>pages.read('phone-a',saved.resultPage.id,0)).toThrow('过期')
})
test('Given 手机查看旧记录 When 同一条工具状态更新或epoch重置 Then 不重复且替换旧记录',()=>{
 const row=(id:string,n:number,status:string):TimelineEntry=>({id,seqStart:n,item:{type:'tool_call',status},timestamp:'2026-11-23T00:00:00Z',turnId:'turn'})
 expect(mergeEntries([row('a',0,'running')],[row('a',0,'completed'),row('b',1,'running')])).toHaveLength(2)
 expect(mergeEntries([row('a',0,'running')],[row('b',0,'completed')],true).map(x=>x.id)).toEqual(['b'])
 expect(groupedSessions([{id:'archived',title:'隐藏',workspaceId:'w',updatedAt:10,archived:true},{id:'a',title:'测试',workspaceId:'w',updatedAt:1},{id:'b',title:'测试固定',workspaceId:'w',updatedAt:0,pinned:true}],'w','测试').map(s=>s.id)).toEqual(['b','a'])
})

test('Given emoji在预览截点 When 首屏裁剪 Then 不暴露半个Unicode字符',()=>{const value='a'.repeat(799)+'🙂';const slice=mobileTextSlice(value,0,undefined,800);expect(slice.content).toHaveLength(799);expect(slice.hasMore).toBe(true);expect(slice.nextOffset).toBe(799)})

test('Given 中文导出含emoji When 逐块写入UTF8 Then 不产生替换字符',()=>{const text='a'.repeat(59999)+'🙂中文';const chunks=textChunks(text);expect(Buffer.concat(chunks.map(t=>Buffer.from(t,'utf8'))).toString('utf8')).toBe(text);expect(chunks[0]).toHaveLength(59999)})

test('Given 两个请求同名问题 When 多选与自由回答 Then 按请求隔离且提交当前选项',async()=>{
 const {questionAnswers,questionKey,chooseQuestionOption,readQuestionDrafts}=await import('../apps/mobile/client/src/questions')
 const question={question:'选择验收项目',multiSelect:true,options:[{label:'文件'},{label:'终端'},{label:'模型'}]}
 let draft=chooseQuestionOption(undefined,'终端',true);draft=chooseQuestionOption(draft,'文件',true)
 const values={[questionKey('a',0)]:draft,[questionKey('b',0)]:{selected:['模型'],custom:''}}
 expect(questionAnswers({requestId:'a',sessionId:'s',kind:'question',questions:[question]},values)).toEqual({'选择验收项目':'文件, 终端'})
 expect(questionAnswers({requestId:'b',sessionId:'s',kind:'question',questions:[question]},values)).toEqual({'选择验收项目':'模型'})
 expect(questionAnswers({requestId:'a',sessionId:'s',kind:'question',questions:[question]},{...values,[questionKey('a',0)]:{...draft,custom:'只复查扫码'}})).toEqual({'选择验收项目':'只复查扫码'})
 expect(chooseQuestionOption(draft,'终端',true).selected).toEqual(['文件'])
 expect(chooseQuestionOption(draft,'模型',false).selected).toEqual(['模型'])
 expect(readQuestionDrafts(JSON.stringify(values))).toEqual(values)
 expect(readQuestionDrafts('{bad')).toEqual({})
})

test('Given 手机长操作 When 最后一次轮询才完成或仍运行 Then 只返回真实结果且不误报成功',async()=>{
 const {finishMobileOperation}=await import('../apps/mobile/client/src/operation-result')
 const running={job:{id:'job-a',phase:'running'}};let polls=0
 expect(await finishMobileOperation<{installed:boolean}>(running,async id=>{expect(id).toBe('job-a');polls++;return polls===2?{job:{id,phase:'done'},result:{installed:true}}:running},async()=>{},2)).toEqual({installed:true})
 expect(polls).toBe(2)
 await expect(finishMobileOperation(running,async()=>running,async()=>{},1)).rejects.toThrow('未确认完成')
 await expect(finishMobileOperation({job:{id:'job-a',phase:'failed'},error:'已撤销'},async()=>running,async()=>{})).rejects.toThrow('已撤销')
 expect(await finishMobileOperation<{ready:boolean}>({ready:true},async()=>running,async()=>{})).toEqual({ready:true})
})

test('Given 两个插件同名资源 When 选择、替换与持久化 Then 归属独立且正文完整不允许脚本地址',async()=>{
 const {withPluginResource,pluginResourceText}=await import('../apps/mobile/client/src/plugin-resources')
 const item={id:'same',identifier:'QA-1',title:'完整资源',url:'https://example.invalid/resource/1',text:'中文🙂'.repeat(12000),resourceType:'issue'}
 let rows=withPluginResource([],'plugin-a','issues',item)
 rows=withPluginResource(rows,'plugin-b','issues',item)
 rows=withPluginResource(rows,'plugin-a','issues',{...item,title:'更新标题'})
 expect(rows).toHaveLength(2);expect(rows[0]?.pluginId).toBe('plugin-b');expect(rows[1]?.item?.title).toBe('更新标题')
 expect(JSON.parse(JSON.stringify(rows))).toEqual(rows)
 expect(pluginResourceText(rows[0]!.item!)).toContain(item.text)
 expect(()=>withPluginResource(rows,'plugin-c','issues',{...item,url:'javascript:alert(1)'})).toThrow('HTTP')
 expect(()=>withPluginResource(rows,'plugin-c','issues',{...item,url:'https://'+['qa-user','qa-secret'].join(':')+'@example.invalid'})).toThrow('凭据')
})

test('Given 发送响应丢失后UI重载 When 同一正文再次发送 Then 复用发送身份且新正文使用新身份',async()=>{
 const {mobileSendIdentity}=await import('../apps/mobile/client/src/send-identity')
 let generated=0
 const create=()=>{generated++;return '12345678-1234-4234-8234-'+String(generated).padStart(12,'0')}
 const original=mobileSendIdentity(null,'完整正文🙂',create)
 expect(mobileSendIdentity(JSON.stringify(original),'完整正文🙂',create)).toEqual(original)
 expect(generated).toBe(1)
 expect(mobileSendIdentity(JSON.stringify(original),'新消息',create).id).not.toBe(original.id)
 expect(mobileSendIdentity('{broken','原文',create).text).toBe('原文')
})

test('Given 切换内核或重新探测模型 When 重建配置表单 Then 使用目录当前值且不串用旧内核参数',async()=>{
 const {kernelFormValues}=await import('../apps/mobile/client/src/model-settings')
 const catalog={currentModelId:'native/model',currentModeId:'ask',controls:[{id:'effort',name:'推理',type:'select',currentValue:'ultra'},{id:'model',name:'模型',category:'model',type:'select',currentValue:'native/model'},{id:'stream',name:'流式',type:'boolean',currentValue:true}]}
 expect(kernelFormValues(catalog)).toEqual({model:'native/model',mode:'ask',config:{effort:'ultra',stream:true}})
 expect(kernelFormValues(catalog,{modelId:'chosen/model',modeId:'plan',configValues:{effort:'vendor-future'}})).toEqual({model:'chosen/model',mode:'plan',config:{effort:'vendor-future',stream:true}})
 expect(kernelFormValues({...catalog,routedModel:'group/all'},{modelId:'old'}).model).toBe('group/all')
 expect(kernelFormValues({models:[],controls:[]})).toEqual({model:'',mode:'',config:{}})
})

test('Given 同一手机跨项目编辑多个文件 When 关闭面板与切换电脑 Then 每个草稿独立恢复且保存一个不清掉其他草稿',async()=>{
 const {readProjectDrafts,writeProjectDraft,removeProjectDraft}=await import('../apps/mobile/client/src/project-drafts');
 const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};
 const draft=(file:string,content:string)=>({file,content,original:'old',expected:'original-digest'});
 writeProjectDraft(storage,'host-a','project-a',draft('same.txt','项目甲'));
 writeProjectDraft(storage,'host-a','project-a',draft('second.txt','另一个文件'));
 writeProjectDraft(storage,'host-a','project-b',draft('same.txt','项目乙'));
 writeProjectDraft(storage,'host-b','project-a',draft('same.txt','另一台电脑'));
 expect(readProjectDrafts(storage,'host-a','project-a')).toHaveLength(2);
 expect(readProjectDrafts(storage,'host-a','project-b')[0]?.content).toBe('项目乙');
 expect(readProjectDrafts(storage,'host-b','project-a')[0]?.content).toBe('另一台电脑');
 writeProjectDraft(storage,'host-a','project-a',{...draft('same.txt','项目甲'),original:'项目甲'});
 expect(readProjectDrafts(storage,'host-a','project-a').map(d=>d.file)).toEqual(['second.txt']);
 removeProjectDraft(storage,'host-a','project-a','second.txt');expect(readProjectDrafts(storage,'host-a','project-a')).toEqual([]);
});

test('Given 模型高级操作的点号字段 When 手机提交 Then 恢复完整对象且保留空端点、布尔和数字类型',async()=>{
 const {prepareActionValues}=await import('../apps/mobile/client/src/action-values');
 const fields=[{key:'provider.id',label:'标识',type:'text',required:true},{key:'provider.chat',label:'地址',type:'text',required:true},{key:'provider.models',label:'模型',type:'json',required:true},{key:'provider.create',label:'新建',type:'boolean'},{key:'limit',label:'数量',type:'number'}];
 expect(prepareActionValues({fields},{'provider.id':'api','provider.chat':'','provider.models':'["model-a","model-b"]','provider.create':false,limit:'23'})).toEqual({provider:{id:'api',chat:'',models:['model-a','model-b'],create:false},limit:23});
 expect(()=>prepareActionValues({fields:[{key:'__proto__.polluted',label:'字段',type:'text'}]},{'__proto__.polluted':'yes'})).toThrow('路径');
 expect(()=>prepareActionValues({fields:[{key:'limit',label:'数量',type:'number'}]},{limit:'not-a-number'})).toThrow('有效数字');
});
test('Given 新模型不再声明旧特殊选项 When 构建手机参数 Then 不回传模型模式双份字段并保留布尔数字原值',async()=>{
 const {kernelFormValues}=await import('../apps/mobile/client/src/model-settings');
 expect(kernelFormValues({controls:[{id:'model',currentValue:'new',type:'select'},{id:'mode',currentValue:'ask',type:'select'},{id:'fast',currentValue:false,type:'boolean'},{id:'budget',currentValue:1234,type:'number'}]}).config).toEqual({fast:false,budget:1234});
});

test('Given 手机编辑不同周期自动化 When 转成电脑配置 Then 只提交该周期支持的字段且保留并发版本',async()=>{
 const {planningDraft,planningValues}=await import('../apps/mobile/client/src/planning-form');
 for(const scheduleType of ['daily','weekly','monthly','once']){
  const values=planningValues(planningDraft('automation',{id:'automation',updatedAt:42,title:'手机计划',prompt:'执行',scheduleType,scheduledAt:Date.now()+60000}));
  expect(values.activeWeekdays).toBeUndefined();expect(values.activeWindowStart).toBeUndefined();expect(values.expectedUpdatedAt).toBe(42);
  if(scheduleType==='weekly')expect(values.dayOfWeek).toBe(1);
  if(scheduleType==='once'){expect(values.timeOfDay).toBeUndefined();expect(Number(values.scheduledAt)).toBeGreaterThan(Date.now());}
 }
 const interval=planningValues(planningDraft('automation',{title:'间隔任务',weekdays:'1,3',scheduleType:'interval'}));expect(interval.timeOfDay).toBeUndefined();
 expect(planningValues(planningDraft('todo',{title:'已完成',status:'completed'})).status).toBe('completed');
});

test('Given 恢复上次电脑期间收到扫码 When 原恢复请求晚到 Then 不能覆盖新配对意图且确认后可重新恢复',async()=>{
 const {ConnectionIntent}=await import('../apps/mobile/client/src/connection-intent');
 const intent=new ConnectionIntent(),startup=intent.recovery();
 expect(intent.current(startup)).toBe(true);
 intent.pairing();expect(intent.current(startup)).toBe(false);
 const paired=intent.recovery();expect(intent.current(paired)).toBe(true);
 intent.pairing();expect(intent.current(paired)).toBe(false);
});

test('Given 手机与电脑同时编辑批注 When 合并待发送草稿 Then 不同条目可合并同条冲突保留原输入',async()=>{
 const {rebaseMobileAnnotations}=await import('../apps/mobile/client/src/annotation-drafts');
 const a={id:'a',quote:'原文',comment:'原评论',source:{kind:'chat' as const,label:'消息',sessionId:'session'}},b={...a,id:'b',quote:'另一条'};
 expect(rebaseMobileAnnotations([a],[{...a,comment:'手机修改'}],[a,b])).toEqual([{...a,comment:'手机修改'},b]);
 expect(()=>rebaseMobileAnnotations([a],[{...a,comment:'手机修改'}],[{...a,comment:'电脑修改'}])).toThrow('输入保留');
 expect(()=>rebaseMobileAnnotations([a],[{...a,comment:'手机修改'}],[])).toThrow();
 expect(rebaseMobileAnnotations([a],[],[a,b])).toEqual([b]);
});
