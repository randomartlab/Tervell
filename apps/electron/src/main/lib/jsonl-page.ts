import { open, stat } from 'node:fs/promises'

export interface JsonlPageCursor { revision: string; offset: number; line: number }
export interface JsonlPage { lines: Array<{line:string;number:number}>; next: JsonlPageCursor | null }
export async function jsonlRevision(path:string):Promise<string>{
  const value=await stat(path)
  return `${value.ino}:${value.size}:${value.mtimeMs}:${value.ctimeMs}`
}

/** IPC 分批传输完整记录；不保留全文件字符串，也不把一条 JSON 记录从中间截断。 */
export async function readJsonlPage(path:string,cursor?:JsonlPageCursor,budget=512*1024):Promise<JsonlPage>{
  const revision=await jsonlRevision(path)
  if(cursor&&(cursor.revision!==revision||!Number.isSafeInteger(cursor.offset)||cursor.offset<0||!Number.isSafeInteger(cursor.line)||cursor.line<0))throw Error('会话历史已变化，请重新读取')
  const file=await open(path,'r'),buffer=Buffer.allocUnsafe(64*1024),pieces:Buffer[]=[],lines:JsonlPage['lines']=[]
  let offset=cursor?.offset??0,line=cursor?.line??0,pageBytes=0
  try{
    const size=(await file.stat()).size
    if(offset>size)throw Error('会话历史游标无效')
    while(offset<size){
      const {bytesRead}=await file.read(buffer,0,buffer.length,offset)
      if(!bytesRead)break
      let start=0
      for(let end=buffer.indexOf(10,0);end>=0&&end<bytesRead;end=buffer.indexOf(10,start)){
        const part=buffer.subarray(start,end);pieces.push(Buffer.from(part));
        const bytes=pieces.reduce((sum,value)=>sum+value.length,0)
        lines.push({line:Buffer.concat(pieces,bytes).toString('utf8').replace(/\r$/,''),number:++line});pieces.length=0
        pageBytes+=bytes+1;offset+=end-start+1;start=end+1
        if(pageBytes>=budget){if(await jsonlRevision(path)!==revision)throw Error('会话历史已变化，请重新读取');return {lines,next:offset<size?{revision,offset,line}:null}}
      }
      if(start<bytesRead){pieces.push(Buffer.from(buffer.subarray(start,bytesRead)));offset+=bytesRead-start}
    }
    if(pieces.length)lines.push({line:Buffer.concat(pieces).toString('utf8').replace(/\r$/,''),number:++line})
    if(await jsonlRevision(path)!==revision)throw Error('会话历史已变化，请重新读取')
    return {lines,next:null}
  }finally{await file.close()}
}
