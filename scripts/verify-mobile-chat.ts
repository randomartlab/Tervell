import {app,BrowserWindow} from 'electron';
import {createServer} from 'node:http';
import type {ServerResponse} from 'node:http';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import type {MobileControlCall} from '@proma/protocol';
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-chat-'));
process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain');
const assert=(value:unknown,message:string)=>{if(!value)throw Error(message);};
async function run(){
 let upstreamCalls=0,requestBody:Record<string,unknown>={},pending:ServerResponse|undefined;
 const packet=(response:ServerResponse,delta:object,finish:string|null=null)=>response.write('data: '+JSON.stringify({id:'mobile-chat-fixture',model:'fixture',choices:[{index:0,delta,finish_reason:finish}]})+'\n\n');
 const server=createServer(async(req,res)=>{let text='';for await(const bytes of req)text+=String(bytes);requestBody=JSON.parse(text);upstreamCalls++;res.writeHead(200,{'content-type':'text/event-stream'});packet(res,{reasoning_content:'真实移动推理🙂',content:'回复开头。'});pending=res;});
 await new Promise<void>(ok=>server.listen(0,'127.0.0.1',ok));
 const window=new BrowserWindow({show:false,webPreferences:{sandbox:true}});(await import('../apps/electron/src/main/lib/main-window-store')).setMainWindow(window);
 const control=await import('../apps/electron/src/main/lib/mobile-control-service');let allowed=true;control.setMobileControlAuthority(d=>{if(!allowed)throw Error('已撤销');return d;});
 const device={id:'phone-chat-fixture',workspaceIds:[],management:true};
 const call=async(operation:string,values:MobileControlCall['values'])=>{
  let reply=await control.mobileControl(device,{operation,values}) as Record<string,unknown>;
  while(reply.job){const ticket=reply.job as {id:string;phase:string};if(ticket.phase==='failed')throw Error(String(reply.error));if(ticket.phase==='done'){reply=reply.result as Record<string,unknown>;break;}await new Promise(r=>setTimeout(r,20));reply=await control.mobileControl(device,{operation:'jobs.status',values:{id:ticket.id}}) as Record<string,unknown>;}
  if(reply.error)throw Error(String(reply.error));return reply;
 };
 const read=async(values:MobileControlCall['values'])=>{const r=await call('chat.read',values);const p=r.resultPage as {id:string;content:string;hasMore:boolean;nextOffset:number}|undefined;if(!p)return r.result as Record<string,unknown>;let text=p.content,offset=p.nextOffset,more=p.hasMore;while(more){const v=await call('chat.read',{action:'result',id:p.id,offset});text+=v.content;more=v.hasMore===true;offset=Number(v.nextOffset);}return JSON.parse(text) as Record<string,unknown>;};
 try{
  mkdirSync(join(root,'config'),{recursive:true});const port=(server.address() as {port:number}).port;
  const {createChannel}=await import('../apps/electron/src/main/lib/channel-manager');
  const channel=createChannel({name:'手机Chat真实回环',provider:'openai',baseUrl:`http://127.0.0.1:${port}/v1`,apiKey:'local-fixture',enabled:true,models:[{id:'fixture',name:'完整档位模型',enabled:true,efforts:['low','ultra','vendor-future']}]});
  const created=await call('chat.action',{action:'create',title:'手机Chat回环'}),conversation=created.conversation as {id:string};
  await call('chat.action',{action:'configure',id:conversation.id,channelId:channel.id,modelId:'fixture',effort:'ultra',contextLength:'infinite'});
  assert((await read({action:'capabilities',channelId:channel.id,modelId:'fixture'})).efforts,'模型能力未返回');
  const file=Buffer.from('手机文档中文🙂\n'.repeat(8000)), image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6M1sAAAAASUVORK5CYII=','base64');
  const upload=async(filename:string,mediaType:string,bytes:Buffer)=>{
   const start=await call('chat.action',{action:'attachment.start',id:conversation.id,filename,mediaType,bytes:bytes.length,digest:createHash('sha256').update(bytes).digest('hex')});
   for(let at=0,index=0;at<bytes.length;at+=49152,index++){const chunk={action:'attachment.chunk',id:conversation.id,uploadId:String(start.id),index,data:bytes.subarray(at,at+49152).toString('base64')};await call('chat.action',chunk);await call('chat.action',chunk);}
   const done=await call('chat.action',{action:'attachment.finish',id:conversation.id,uploadId:String(start.id)}),again=await call('chat.action',{action:'attachment.finish',id:conversation.id,uploadId:String(start.id)});
   assert(JSON.stringify(done)===JSON.stringify(again),'附件重试产生不同身份');return done.attachment as {id:string};
  };
  const document=await upload('手机附件.txt','text/plain',file),picture=await upload('手机图片.png','image/png',image);
  const identity=randomUUID(),input={action:'send',id:conversation.id,text:'同一请求只能发一次',attachmentIds:[document.id,picture.id],clientMessageId:identity,enabledToolIds:[]};
  await call('chat.action',input);
  for(let i=0;i<200&&!pending;i++)await new Promise(r=>setTimeout(r,20));
  assert(pending,'没有真实模型请求');assert(requestBody.reasoning_effort==='ultra','推理档位被截断');assert(JSON.stringify(requestBody).includes(image.toString('base64')),'图片字节未进入真实模型请求');assert(JSON.stringify(requestBody).includes('手机文档中文'),'文档没有解码进入真实模型请求');
  const duplicate=await call('chat.action',input);assert(duplicate.duplicate===true&&upstreamCalls===1,'重复请求重复执行模型');
  let active:Record<string,unknown>={};for(let i=0;i<100;i++){active=await read({action:'read',id:conversation.id});if((active.live as {content?:string}|undefined)?.content==='回复开头。')break;await new Promise(ok=>setTimeout(ok,20));}assert((active.live as {content:string}).content==='回复开头。','断线重连没有真实快照');
  packet(pending!,{content:'回复结尾。'});packet(pending!,{},'stop');pending!.end('data: [DONE]\n\n');
  let final:Record<string,unknown>={};for(let i=0;i<200;i++){final=await read({action:'read',id:conversation.id});if(!final.running)break;await new Promise(r=>setTimeout(r,20));}
  const messages=final.messages as Array<{id:string;content:string;reasoning?:string}>;assert(messages.length===2&&messages[1]?.content==='回复开头。回复结尾。','消息重复或丢失');assert(messages[1]?.reasoning==='真实移动推理🙂','推理未落盘');
  let downloaded=Buffer.alloc(0),offset=0;for(;;){const row=await call('chat.read',{action:'attachment',id:conversation.id,messageId:messages[0]!.id,attachmentId:document.id,offset});downloaded=Buffer.concat([downloaded,Buffer.from(String(row.data),'base64')]);if(!row.hasMore)break;offset=Number(row.nextOffset);}
  assert(downloaded.equals(file),'历史附件下载不完整');
  const other=await call('chat.action',{action:'create'});await call('chat.action',{action:'configure',id:(other.conversation as {id:string}).id,channelId:channel.id,modelId:'fixture'});let rejected=false;try{await call('chat.action',{action:'send',id:(other.conversation as {id:string}).id,text:'wrong conversation',attachmentIds:[document.id],clientMessageId:randomUUID()});}catch{rejected=true;}assert(rejected,'跨对话附件没有拒绝');
  const fork=await call('chat.action',{action:'fork',id:conversation.id,messageId:messages[1]!.id});assert((await read({action:'read',id:(fork.conversation as {id:string}).id})).total===2,'Chat分叉不完整');
  const chats=await import('../apps/electron/src/main/lib/conversation-manager');for(let i=0;i<65;i++)chats.appendMessage(conversation.id,{id:randomUUID(),role:'assistant',content:'大消息中文🙂'.repeat(2500)+i,createdAt:Date.now()+i});
  const page=await read({action:'read',id:conversation.id});assert((page.messages as unknown[]).length===30&&page.hasOlder,'长历史没有分页');assert(String((page.messages as Array<{content:string}>)[0]?.content).length>10000,'长消息被截断');
  const annotationModule=await import('../apps/electron/src/main/lib/mobile-annotations');
  const context={device,assertCurrent:()=>{if(!allowed)throw Error('已撤销');}};
  pending=undefined;
  const questionId=randomUUID(),sourceMessages=chats.getConversationMessagesStrict(conversation.id);
  const question={kind:'chat',id:conversation.id,messageId:sourceMessages[1]!.id,quote:'原始ultra已到达',question:'解释这段话',clientMessageId:questionId};
  const side=await annotationModule.mobileAnnotationQuestion(question,context);
  const repeated=await annotationModule.mobileAnnotationQuestion(question,context);
  assert((side.conversation as {id:string}).id===(repeated.conversation as {id:string}).id,'旁问重试创建重复对话');
  const child=(side.conversation as {id:string});
  for(let i=0;i<150&&!pending;i++)await new Promise(ok=>setTimeout(ok,20));
  const sideResponse=pending as ServerResponse|undefined;if(sideResponse){packet(sideResponse,{content:'旁问已继承模型'});packet(sideResponse,{},'stop');sideResponse.end('data: [DONE]\n\n');pending=undefined;}
  for(let i=0;i<100;i++){const result=await read({action:'read',id:child.id});if(!result.running)break;await new Promise(ok=>setTimeout(ok,20));}
  assert(chats.getConversationMessagesStrict(child.id).some(m=>m.role==='assistant'&&m.content.includes('旁问已继承模型')),'旁问实际回复未落盘');
  console.log('ANNOTATION CHAT real child + inherited model + retry single child PASS');
  allowed=false;let refused=false;try{await call('chat.read',{action:'read',id:conversation.id});}catch{refused=true;}assert(refused,'撤销后Chat仍可读');
  console.log('MOBILE CHAT chunked file/image bytes + attachment download + idempotent finish + real SSE + raw ultra + dedupe + resumed snapshot + persisted reasoning + fork + full long pages + revoke PASS');console.log('PROFILE',root);
 }finally{pending?.end();server.closeAllConnections();await new Promise<void>(ok=>server.close(()=>ok()));(await import('../apps/electron/src/main/lib/main-window-store')).setMainWindow(null);window.destroy();await(await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();}
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(e=>{console.error(e);app.exit(1);});
