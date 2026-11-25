/** Windows Alpha 必须在原生 Runner 构建和安装验收。 */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const repo=path.resolve(__dirname,'../../..'),cache=process.env.TERVELL_WINDOWS_BUILD_CACHE||path.join(require('os').homedir(),'.cache/tervell/windows-build');
const bun=process.env.TERVELL_BUILD_BUN||(process.versions.bun?process.execPath:'bun');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Windows Alpha 请使用 .github/workflows/alpha-windows.yml 的原生 Windows x64 构建与安装验收');
function run(file,args){const result=cp.spawnSync(file,args,{cwd:repo,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
if(!process.argv.includes('--skip-build')){
 run(process.execPath,[path.join(__dirname,'prepare-windows-assets.cjs')]);
 run(process.execPath,[path.join(__dirname,'build-windows-gateway.cjs')]);
 for(const script of ['generate:icons','build:main','build:agent-runtime','build:terminal-runtime','build:preload','build:renderer'])run(bun,['run','--cwd','apps/electron',script]);
 run(bun,['run','--cwd','apps/electron','build:cli']);
}
run(bun,[path.join(__dirname,'sync-windows-runtime.ts')]);
const result=cp.spawnSync(process.execPath,[path.join(__dirname,'stage-windows.cjs')],{cwd:repo,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
const builder=require('electron-builder'),{Arch}=require('builder-util');
const config=JSON.parse(fs.readFileSync(path.join(cache,'builder.json')));
builder.build({projectDir:config.directories.app,config,targets:builder.Platform.WINDOWS.createTarget(['nsis'],Arch.x64),publish:'never'}).then(files=>{
 run(process.execPath,[path.join(__dirname,'check-windows-package.cjs')]);
 console.log(JSON.stringify(files));
}).catch(error=>{console.error(error);process.exitCode=1;});
