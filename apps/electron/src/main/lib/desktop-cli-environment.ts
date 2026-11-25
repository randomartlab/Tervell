import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { resolveLocalProfile } from '@proma/shared/config/local-profile'

/** 验收配置空间必须同时隔离外部 CLI 的账号/历史，不能只隔离 Tervell 自身数据。 */
export function cliProcessEnvironment(path: string, profileDirectory = process.env.TERVELL_PROFILE_DIR): Record<string,string> {
  const profile=resolveLocalProfile(profileDirectory)
  if(!profile)return Object.fromEntries(Object.entries({...process.env,PATH:path,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'}).filter((row):row is [string,string]=>typeof row[1]==='string'))
  const home=join(profile.root,'cli-home')
  const env:Record<string,string>={PATH:path,HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:join(home,'.config'),XDG_DATA_HOME:join(home,'.local/share'),XDG_CACHE_HOME:join(home,'.cache'),CODEX_HOME:join(home,'.codex'),CLAUDE_CONFIG_DIR:join(home,'.claude'),GEMINI_CLI_HOME:home,QWEN_CODE_HOME:join(home,'.qwen'),KIMI_CODE_HOME:join(home,'.kimi-code'),...(process.platform==='win32'?{APPDATA:join(home,'AppData/Roaming'),LOCALAPPDATA:join(home,'AppData/Local'),TEMP:join(home,'AppData/Local/Temp'),TMP:join(home,'AppData/Local/Temp')}:{})}
  for(const key of ['LANG','LC_ALL','LC_CTYPE','TERM','COLORTERM','TMPDIR','SHELL','SystemRoot','SYSTEMROOT','SystemDrive','SYSTEMDRIVE','WINDIR','windir','ComSpec','COMSPEC','PATHEXT','ProgramFiles','ProgramFiles(x86)','ProgramW6432','ProgramData','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])if(process.env[key])env[key]=process.env[key]!
  for(const directory of [home,env.XDG_CONFIG_HOME!,env.XDG_DATA_HOME!,env.XDG_CACHE_HOME!,env.CODEX_HOME!,env.CLAUDE_CONFIG_DIR!,env.APPDATA,env.LOCALAPPDATA,env.TEMP].filter((value):value is string=>!!value))mkdirSync(directory,{recursive:true,mode:0o700})
  return {...env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'}
}
