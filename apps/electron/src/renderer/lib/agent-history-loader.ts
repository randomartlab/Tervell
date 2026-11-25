import type {AgentHistoryBatch,AgentHistoryBatchCursor,SDKMessage}from'@proma/shared'

/** 只在渲染端保留最后那份完整历史；顺序IPC控制主进程峰值，切换会话立即停止后续读取。 */
export async function loadAgentHistory(
  read:(cursor?:AgentHistoryBatchCursor)=>Promise<AgentHistoryBatch>,
  cancelled:()=>boolean,
):Promise<SDKMessage[]>{
  const messages:SDKMessage[]=[],positions=new Map<string,number>()
  let cursor:AgentHistoryBatchCursor|undefined
  do{
    if(cancelled())return []
    const page=await read(cursor)
    if(cancelled())return []
    for(const raw of page.messages){
      const value=raw as Record<string,unknown>,item=value.item as Record<string,unknown>|undefined
      if(value.type==='system'&&value.subtype==='plugin_timeline'&&typeof item?.id==='string'){
        const key=JSON.stringify([value.pluginId,item.id]),at=positions.get(key)
        if(at===undefined){positions.set(key,messages.length);messages.push(raw)}
        else{const first=messages[at]as Record<string,unknown>;messages[at]={...raw,uuid:String(first.uuid??value.uuid??''),timestamp:String(first.timestamp??value.timestamp??'')}as SDKMessage}
      }else messages.push(raw)
    }
    if(page.next&&cursor&&page.next.offset<=cursor.offset)throw Error('会话历史读取游标没有前进')
    cursor=page.next??undefined
  }while(cursor)
  return messages
}
