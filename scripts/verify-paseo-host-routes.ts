import {app} from 'electron';
import {createServer} from 'node:http';
const loadWs=createRequire(resolve('package.json'));
interface Socket {send:(data:string)=>void;on:(event:'message',callback:(bytes:Buffer)=>void)=>void;terminate:()=>void}
const {WebSocketServer}=loadWs('ws') as {WebSocketServer:new(options:{server:ReturnType<typeof createServer>})=>{on:(event:'connection',callback:(socket:Socket)=>void)=>void;clients:Set<Socket>;close:()=>void}};
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
const root=mkdtempSync(join(tmpdir(),'tervell-paseo-routes-'));process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));app.commandLine.appendSwitch('use-mock-keychain');
app.whenReady().then(run).catch(e=>{console.error(e);app.exit(1)});
async function run(){
 const http=createServer(),ws=new WebSocketServer({server:http});
 const wrap=(message:unknown)=>JSON.stringify({type:'session',message});
 const info=wrap({type:'status',payload:{status:'server_info',serverId:'srv_contract_remote',hostname:null,version:'0.16.0',features:{connectedHosts:true,hostMultiplexing:true,workspaceTerminals:true,workspaceMultiplicity:true}}});
 let routed=false;
 ws.on('connection',socket=>socket.on('message',bytes=>{
  const frame=JSON.parse(String(bytes));
  if(frame.type==='hello'){socket.send(info);return;}if(frame.type==='ping'){socket.send(JSON.stringify({type:'pong'}));return;}
  const message=frame.message;
  if(message?.type==='hosts.link.open.request')socket.send(wrap({type:'hosts.link.open.response',payload:{requestId:message.requestId,routeId:'upstream-route'}}));
  if(message?.type==='hosts.route.frame.request'){
   const inner=JSON.parse(message.data);
   if(inner.type==='ping'){socket.send(wrap({type:'hosts.route.frame',payload:{subscriptionId:'upstream-route',binary:false,data:JSON.stringify({type:'pong'})}}));return;}if(inner.type==='hello'){routed=inner.routed===true;socket.send(wrap({type:'hosts.route.frame',payload:{subscriptionId:'upstream-route',data:info,binary:false}}));}
   if(inner.message?.type==='fetch_agents_request')socket.send(wrap({type:'hosts.route.frame',payload:{subscriptionId:'upstream-route',binary:false,data:wrap({type:'fetch_agents_response',payload:{requestId:inner.message.requestId,entries:[],pageInfo:{hasMore:false,nextCursor:null,prevCursor:null}}})}}));
   if(inner.message?.type==='fetch_workspaces_request')socket.send(wrap({type:'hosts.route.frame',payload:{subscriptionId:'upstream-route',binary:false,data:wrap({type:'fetch_workspaces_response',payload:{requestId:inner.message.requestId,entries:[],pageInfo:{hasMore:false,nextCursor:null,prevCursor:null}}})}}));
  }
 }));
 await new Promise<void>(r=>http.listen(0,'127.0.0.1',r));
 const port=(http.address() as {port:number}).port;
 const {pluginConnectionOperation,closePluginConnections}=await import('../apps/electron/src/main/lib/plugin-host/connections');
 const require=createRequire(resolve('package.json')),{createLocalPaseoDriver}=require(resolve('apps/electron/resources/third-party/plugin-host/paseo-driver.cjs')),{createPaseoApi}=require(resolve('apps/electron/resources/third-party/plugin-host/paseo-api.cjs'));
 const entry={manifest:{id:'routes-fixture',name:'routes-fixture',description:'隔离路由契约验收',version:'1.0.0',capabilities:['runtime']},enabled:true,source:'fixture',digest:'0'.repeat(64),installedAt:1,access:{workspaceIds:[],network:true,runtime:'trusted'}} as import('@proma/shared').DesktopPluginEntry;
 const driver=createLocalPaseoDriver((method:string,input:Record<string,unknown>)=>pluginConnectionOperation(entry,method,input),{interval:30}),api=createPaseoApi(driver);
 try{
  const added=await api.hosts.add({connection:`127.0.0.1:${port}`,label:'isolated target'});
  for(let i=0;i<200;i++){const directory=await api.hosts.list();if(directory.hosts[0]?.status==='online')break;await new Promise(r=>setTimeout(r,25));}
  const directory=await api.hosts.list();if(directory.hosts[0]?.status!=='online')throw Error(JSON.stringify(directory));
  console.log('ONLINE identity verified');const remote=await api.hosts.client('srv_contract_remote');
  console.log('REMOTE CONNECTED');const result=await remote.workspaces.list();if(!Array.isArray(result.entries)||!routed)throw Error('原始Paseo路由未完成');
  await remote.dispose();await api.hosts.remove(added.registrationId);if((await api.hosts.list()).hosts.length)throw Error('移除连接失败');
  console.log('HOST_ROUTES original ConnectedHosts + SDK + real websocket list/add/identity/remote API/dispose/remove PASS',root);
 }finally{await api.dispose();await driver.close();await closePluginConnections();for(const s of ws.clients)s.terminate();ws.close();http.close();}
 app.exit(0);
}
