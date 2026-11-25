import {test,expect} from 'bun:test'
import {mkdtempSync,writeFileSync,mkdirSync,symlinkSync,rmSync,realpathSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {ProjectTools} from './project-tools.ts'
import {PathBoundary} from './boundary.ts'
test('Given 授权项目 When 文件检索与真实git worktree Then 不遍历符号链接且名称不注入命令',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-project-'));const signal=new AbortController().signal
 try{
  execFileSync('git',['init','-q',root]);execFileSync('git',['-C',root,'-c','user.name=Proma Test','-c','user.email=test@localhost','commit','--allow-empty','-qm','init'])
  mkdirSync(join(root,'src'));writeFileSync(join(root,'src','hello.ts'),'code');writeFileSync(join(root,'.env'),'private');symlinkSync(tmpdir(),join(root,'escape'))
  const tools=new ProjectTools(root,new PathBoundary({cwd:root},()=>{}))
  expect((await tools.search('hello',10,signal)).files).toEqual([join('src','hello.ts')])
  expect((await tools.search('.env',10,signal)).files).toEqual([])
  const created=await tools.create('feature',signal);expect(created.branch).toBe('proma/feature');expect(realpathSync.native(created.path)).toBe(realpathSync.native(join(root,'.worktrees','feature')))
  expect((await tools.worktrees(signal)).some(w=>w.branch==='refs/heads/proma/feature')).toBe(true)
  await expect(tools.create('../bad;rm',signal)).rejects.toThrow('非法')
 }finally{rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
},40000)
