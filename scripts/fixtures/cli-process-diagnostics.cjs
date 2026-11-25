// 仅隔离回环验收启用；诊断Windows CLI内部派生进程，不读取环境值或用户账号。
const fs = require('node:fs')
const cp = require('node:child_process')
const path = process.env.TERVELL_QA_PROCESS_LOG
if (path) {
  const log = value => { try { fs.appendFileSync(path, JSON.stringify({ at:Date.now(),parent:process.pid,...value })+'\n') } catch {} }
  const original = cp.spawn
  cp.spawn = function (file,args,options) {
    log({kind:'spawn',file,args,cwd:options?.cwd,stdio:options?.stdio,windowsHide:options?.windowsHide})
    const child = original.apply(this,arguments)
    log({kind:'spawned',pid:child.pid})
    child.on('error',error=>log({kind:'error',pid:child.pid,error:String(error)}))
    child.on('exit',(code,signal)=>log({kind:'exit',pid:child.pid,code,signal}))
    child.on('close',(code,signal)=>log({kind:'close',pid:child.pid,code,signal}))
    child.stdout?.on('data',data=>log({kind:'stdout',pid:child.pid,text:data.toString().slice(0,2000)}))
    child.stderr?.on('data',data=>log({kind:'stderr',pid:child.pid,text:data.toString().slice(0,2000)}))
    return child
  }
  require('node:module').syncBuiltinESMExports()
}
