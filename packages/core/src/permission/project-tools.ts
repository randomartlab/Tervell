import { readdirSync, lstatSync, mkdirSync, realpathSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { execFile } from 'node:child_process'
import { PathBoundary } from './boundary.ts'
const git = (cwd:string,args:string[],signal:AbortSignal) => {
  const nullPath=process.platform==='win32'?'NUL':'/dev/null'
  const env:NodeJS.ProcessEnv={PATH:process.env.PATH??'',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:nullPath,GIT_TERMINAL_PROMPT:'0'}
  // Windows 系统加载器和 Git 子命令仍需要系统/临时目录；不继承模型密钥或全局 Git 配置。
  for(const key of ['SystemRoot','SYSTEMROOT','WINDIR','ComSpec','COMSPEC','PATHEXT','TEMP','TMP'])if(process.env[key])env[key]=process.env[key]
  return new Promise<string>((resolve,reject)=>execFile('git',['-c',`core.hooksPath=${nullPath}`,'-c','core.fsmonitor=false','-c','core.untrackedCache=false',...args],{cwd,signal,windowsHide:true,maxBuffer:1024*1024,timeout:30000,env},(error,stdout)=>error?reject(new Error(signal.aborted?'Git worktree 操作已取消':(error as NodeJS.ErrnoException).code==='ETIMEDOUT'?'Git worktree 操作超时':'Git worktree 操作失败')):resolve(stdout)))
}
export class ProjectTools {
  private readonly cwd:string
  constructor(cwd:string,private readonly boundary:PathBoundary) {this.cwd=boundary.assert(cwd,'read')}
  async search(query:string,limit:number,signal:AbortSignal):Promise<{files:string[];truncated:boolean}> {
    const files:string[]=[]; let visited=0,truncated=false
    const visit=(directory:string,depth:number)=>{
      if(depth>20){truncated=true;return}
      for(const entry of readdirSync(directory,{withFileTypes:true})){
        if(signal.aborted)throw new Error('检索已取消')
        if(++visited>10000||files.length>=limit){truncated=true;return}
        if(entry.name.startsWith('.')||entry.name==='node_modules')continue
        const path=join(directory,entry.name)
        if(entry.isSymbolicLink())continue
        this.boundary.assert(path,'read')
        if(entry.isDirectory())visit(path,depth+1)
        else if(entry.isFile()&&relative(this.cwd,path).toLowerCase().includes(query.toLowerCase()))files.push(relative(this.cwd,path))
      }
    }
    visit(this.boundary.assert(this.cwd,'read'),0);return {files,truncated}
  }
  async worktrees(signal:AbortSignal):Promise<Array<{path:string;branch:string;current:boolean}>> {
    const text=await git(this.boundary.assert(this.cwd,'read'),['worktree','list','--porcelain','-z'],signal)
    const values:Array<{path:string;branch:string;current:boolean}>=[]
    let current:{path:string;branch:string;current:boolean}|undefined
    for(const line of text.split('\0')){
      if(line.startsWith('worktree ')){try{const path=this.boundary.assert(line.slice(9),'read');current={path,branch:'',current:path===this.cwd};values.push(current)}catch{current=undefined}}
      else if(line.startsWith('branch ')&&current)current.branch=line.slice(7)
    }
    return values.slice(0,100)
  }
  async create(name:string,signal:AbortSignal):Promise<{path:string;branch:string}> {
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(name))throw new Error('Worktree 名称非法')
    const root=this.boundary.assert(this.cwd,'read')
    const top=(await git(root,['rev-parse','--show-toplevel'],signal)).trim()
    if(realpathSync.native(top)!==root)throw new Error('仅允许项目自身为 Git 根目录')
    const common=(await git(root,['rev-parse','--git-common-dir'],signal)).trim()
    this.boundary.assert(common,'read')
    const directory=join(root,'.worktrees');this.boundary.assert(directory,'write');mkdirSync(directory,{recursive:true})
    if(lstatSync(directory).isSymbolicLink())throw new Error('Worktree 目录不允许符号链接')
    const path=this.boundary.assert(join(directory,name),'write'),branch=`proma/${basename(name)}`
    await git(root,['worktree','add','-b',branch,'--',path],signal)
    this.boundary.assert(path,'read');return {path,branch}
  }
}
