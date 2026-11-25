/** 交叉打包内容检查；PE/N-API静态检查不冒充Windows启动验收。 */
const fs=require('fs'),p=require('path'),crypto=require('crypto'),asar=require('@electron/asar');
const repo=p.resolve(__dirname,'../../..'),root=p.join(repo,'apps/electron/out/windows-alpha/win-unpacked'),archive=p.join(root,'resources/app.asar');
const electronFuses=require('./harden-electron.cjs').inspectHardenedElectron(root,'win32');
function pe(file){const data=fs.readFileSync(file);if(data.toString('ascii',0,2)!=='MZ')throw Error('Not Windows PE: '+file);const offset=data.readUInt32LE(0x3c);if(data.toString('ascii',offset,offset+4)!=='PE\0\0'||data.readUInt16LE(offset+4)!==0x8664)throw Error('Not x64 PE: '+file);return{file:p.relative(root,file),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}}
const listing=asar.listPackage(archive).map(file=>file.replaceAll('\\','/')),required=['@earendil-works/pi-coding-agent','@earendil-works/pi-agent-core','@earendil-works/pi-ai','sharp','node-pty','esbuild','@img/sharp-win32-x64','@napi-rs/canvas-win32-x64-msvc'];for(const name of required)if(!listing.some(file=>file.endsWith('/node_modules/'+name+'/package.json')))throw Error('Missing runtime dependency: '+name);
const binaries=['Tervell Alpha.exe','resources/model-gateway/magpie.exe','resources/bin/proma.exe','resources/officecli/officecli.exe','resources/third-party/plugin-runtime/win32-x64/bun.exe','resources/app.asar.unpacked/node_modules/node-pty/prebuilds/win32-x64/conpty.node','resources/app.asar.unpacked/node_modules/node-pty/prebuilds/win32-x64/conpty_console_list.node','resources/app.asar.unpacked/node_modules/@earendil-works/pi-tui/native/win32/prebuilds/win32-x64/win32-platform.node','resources/app.asar.unpacked/node_modules/@esbuild/win32-x64/esbuild.exe'].map(name=>pe(p.join(root,name)));
for(const file of listing.filter(f=>f.endsWith('.node'))){if(!asar.statFile(archive,p.normalize(file.replace(/^\//,''))).unpacked)throw Error('Native binding left inside ASAR: '+file)}
const features=JSON.parse(fs.readFileSync(p.join(root,'resources/default-features/index.json')));for(const f of features.features){const source=p.join(root,'resources/default-features',f.id);if(crypto.createHash('sha256').update(fs.readFileSync(p.join(source,'client.js'))).update(fs.readFileSync(p.join(source,'server.js'))).digest('hex')!==f.digest)throw Error('Builtin mismatch: '+f.id)}
if(listing.some(f=>/dist\/.*-(?:verify|fixture)\./.test(f)))throw Error('QA harness packaged');
const metadata=JSON.parse(asar.extractFile(archive,'package.json'));if(metadata.promaReleaseChannel!=='alpha')throw Error('Not isolated Alpha metadata');
for(const file of ['icon.ico','icon.png','third-party/plugin-runtime/LICENSE.md','third-party/model-gateway-patches/build.json'])if(!fs.existsSync(p.join(root,'resources',file)))throw Error('Missing resource: '+file);
const R=require('resedit'),exe=R.NtExecutable.from(fs.readFileSync(p.join(root,'Tervell Alpha.exe'))),integrity=R.NtExecutableResource.from(exe).entries.find(e=>e.type==='INTEGRITY'&&e.id==='ELECTRONASAR');
const headerDigest=crypto.createHash('sha256').update(asar.getRawHeader(archive).headerString).digest('hex');
if(!integrity||!JSON.parse(Buffer.from(integrity.bin).toString()).some(e=>e.value===headerDigest))throw Error('Electron ASAR integrity resource mismatch');
for(const name of ['main.cjs','agent-runtime.cjs','terminal-runtime.cjs','pi-fork-runtime.cjs','preload.cjs','renderer/index.html'])if(!listing.includes('/dist/'+name))throw Error('Missing application runtime: '+name);
const optionalHelpers=[];
function audit(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const full=p.join(directory,item.name);if(item.isDirectory())audit(full);else if(/\.(exe|dll|node)$/i.test(item.name)){
 if(p.relative(root,full).replaceAll('\\','/')==='resources/elevate.exe'){const data=fs.readFileSync(full);if(data.toString('ascii',0,2)!=='MZ'||data.readUInt16LE(data.readUInt32LE(60)+4)!==0x14c)throw Error('Invalid NSIS elevate helper');optionalHelpers.push({file:'resources/elevate.exe',arch:'x86',reason:'electron-builder elevation helper, runs under Windows x64 WOW64'});continue;}
 if(!binaries.some(b=>b.file===p.relative(root,full)))binaries.push(pe(full));
}}}audit(root);
const visited=new Set(),pending=['package.json'];
while(pending.length){const file=pending.pop();if(visited.has(file))continue;visited.add(file);
 const pkg=JSON.parse(asar.extractFile(archive,p.normalize(file))),base=p.posix.dirname(file);
 for(const [dependency,isRequired] of [...Object.keys(pkg.dependencies??{}).map(n=>[n,true]),...Object.keys(pkg.optionalDependencies??{}).map(n=>[n,false])]){
  if(dependency.startsWith('@types/'))continue; // electron-builder剔除编译期声明；不作为可执行闭包。
  let current=base,resolved;
  while(current&&current!=='.'){const candidate=p.posix.join(current,'node_modules',dependency,'package.json');if(listing.includes('/'+candidate)){resolved=candidate;break;}current=p.posix.dirname(current);}
  if(!resolved&&listing.includes('/node_modules/'+dependency+'/package.json'))resolved='node_modules/'+dependency+'/package.json';
  if(resolved)pending.push(resolved);else if(isRequired&&!Object.hasOwn(pkg.optionalDependencies??{},dependency))throw Error('Missing transitive runtime: '+pkg.name+' -> '+dependency);
 }
}
const runtime=JSON.parse(fs.readFileSync(p.join(root,'resources/third-party/plugin-runtime/sources.json')));if(crypto.createHash('sha256').update(fs.readFileSync(p.join(root,'resources/third-party/plugin-runtime/win32-x64/bun.exe'))).digest('hex')!==runtime.binarySha256)throw Error('Bun checksum mismatch');
console.log(JSON.stringify({version:metadata.version,platform:'win32',arch:'x64',nativeWindowsStarted:false,asarIntegrityVerified:true,electronFuses,resolvedRuntimePackages:visited.size,requiredDependencies:required,asarFiles:listing.length,checkedBinaries:binaries,optionalHelpers,builtins:features.features.map(f=>f.id)},null,2));
