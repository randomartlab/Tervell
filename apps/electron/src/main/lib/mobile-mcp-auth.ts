import {randomUUID} from 'node:crypto'
import type {StartMcpOAuthInput} from '@proma/shared'
import {startMcpOAuth} from './mcp-oauth-service'
interface Flow {id:string;device:string;workspace:string;state:'preparing'|'waiting'|'done'|'failed';url?:string;finish?:(url:string)=>void;reject?:(e:Error)=>void;expires:number;expireTimer?:ReturnType<typeof setTimeout>}
const flows=new Map<string,Flow>()
export function startMobileMcpAuth(device:string,workspace:string,input:StartMcpOAuthInput,assertAuthorized:()=>void){
 assertAuthorized()
 for(const [id,f]of flows)if(f.expires<Date.now())flows.delete(id)
 if(flows.size>=10)throw new Error('授权操作过多，请稍后重试')
 const flow:Flow={id:randomUUID(),device,workspace,state:'preparing',expires:Date.now()+5*60*1000};flows.set(flow.id,flow);flow.expireTimer=setTimeout(()=>{flow.reject?.(new Error('授权超时'));flow.state='failed';flow.url=undefined},5*60*1000);flow.expireTimer.unref()
 const assertCurrent=()=>{assertAuthorized();if(flow.state==='failed'||flow.expires<Date.now())throw new Error('授权已失效')}
 void startMcpOAuth(input,{assertCurrent,authorize:async(url)=>{assertCurrent();flow.url=url;flow.state='waiting';return new Promise<string>((resolve,reject)=>{flow.finish=resolve;flow.reject=reject})}}).then(()=>{flow.state='done';clearTimeout(flow.expireTimer);delete flow.url;flow.finish=undefined;flow.reject=undefined},()=>{flow.state='failed';clearTimeout(flow.expireTimer);delete flow.url;flow.finish=undefined;flow.reject=undefined})
 return {id:flow.id,state:flow.state}
}
export function mobileMcpAuth(device:string,workspace:string,id:string,url?:string,cancel=false){const flow=flows.get(id);if(!flow||flow.device!==device||flow.workspace!==workspace||flow.expires<Date.now())throw new Error('授权已失效');if(cancel){flow.state='failed';flow.url=undefined;flow.reject?.(new Error('已取消'));return {id,state:flow.state}}if(url){if(flow.state!=='waiting'||!flow.finish)throw new Error('当前授权不接受回调');flow.finish(url);flow.finish=undefined}return {id,state:flow.state,url:flow.url,pasteCallback:true,instructions:'在手机浏览器授权后，将最终无法打开的回调地址粘贴回来。授权凭据只保存在电脑。'}}
