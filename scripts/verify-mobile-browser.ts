import {app, BrowserWindow} from 'electron';
import {createServer} from 'node:http';
import {mkdtempSync, mkdirSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file';

const root = mkdtempSync(join(tmpdir(), 'tervell-mobile-browser-'));
process.env.TERVELL_PROFILE_DIR = root;
app.setPath('userData', join(root, 'chromium'));
(app as typeof app & {setAppPath: (path: string) => void}).setAppPath(resolve('apps/electron'));
app.commandLine.appendSwitch('use-mock-keychain');
const assert = (value: unknown, message: string) => {if (!value) throw Error(message);};
async function run() {
  const server = createServer((_req, res) => {
    res.writeHead(200, {'content-type': 'text/html;charset=utf-8'});
    res.end(`<!doctype html><meta charset="utf-8"><title>手机浏览器验收</title>
      <label>姓名<input aria-label="姓名" id="name"></label>
      <button onclick="document.querySelector('#result').innerText='提交结果：'+document.querySelector('#name').value">提交</button>
      <p id="result">等待填写</p>`);
  });
  await new Promise<void>(ok => server.listen(0, '127.0.0.1', ok));
  mkdirSync(join(root, 'config'));
  for (const name of ['a', 'b']) mkdirSync(join(root, 'project-' + name));
  writeJsonFileAtomic(join(root, 'config/agent-workspaces.json'), {version: 2, workspaces: ['a', 'b'].map(id => ({id, slug: id, name: '浏览器项目' + id, projectRootPath: join(root, 'project-' + id), createdAt: 1, updatedAt: 1}))});
  const window = new BrowserWindow({show: false, width: 1200, height: 850});
  const {browserController} = await import('../apps/electron/src/main/lib/browser-controller');
  browserController.setOwnerWindow(window);
  const sessions = await import('../apps/electron/src/main/lib/agent-session-manager');
  const session = sessions.createAgentSession('手机浏览器', undefined, 'a');
  const service = await import('../apps/electron/src/main/lib/mobile-browser-service');
  let allowed = true;
  const context = {device: {id: 'phone', workspaceIds: ['a', 'b'], management: true}, sessionId: session.id, assertCurrent: () => {if (!allowed) throw Error('已撤销');}};
  try {
    let refusedBeforeConsent=false;try{await service.mobileBrowserAction({action:'tab',url:'https://example.invalid'},context);}catch{refusedBeforeConsent=true;}assert(refusedBeforeConsent,'首次告知未确认即访问网页');assert(browserController.getState(session.id)===null,'首次拒绝后留下零标签会话');
    await service.mobileBrowserAction({action: 'acknowledge'}, context);
    const port = (server.address() as {port: number}).port;
    await service.mobileBrowserAction({action:'tab',url:`http://127.0.0.1:${port}`},context);
    await service.mobileBrowserAction({action:'navigate',url:`http://127.0.0.1:${port}`},context);
    await new Promise(r=>setTimeout(r,2000));
    const initial = await service.mobileBrowserRead({action: 'observe'}, context) as {elements: Array<{ref: string; name: string; editable: boolean}>};
    const field = initial.elements.find(e => e.editable);
    assert(field, '网页输入字段未返回');
    await service.mobileBrowserAction({action: 'fill', ref: field!.ref, text: '手机真实填写🙂'}, context);
    await new Promise(r=>setTimeout(r,1500));
    const next = await service.mobileBrowserRead({action: 'observe'}, context) as typeof initial;
    const submit = next.elements.find(e => e.name === '提交');
    assert(submit, '网页按钮未返回');
    await service.mobileBrowserAction({action: 'click', ref: submit!.ref}, context);
    await new Promise(r=>setTimeout(r,150));
    const page = await service.mobileBrowserRead({action: 'observe'}, context) as typeof initial;
    console.log('PAGE',JSON.stringify(page.elements));
    assert(page.elements.some(e => e.name.includes('提交结果：手机真实填写')), '浏览器填写点击没有实际生效');
    const image = await service.mobileBrowserRead({action: 'screenshot'}, context) as {base64: string};
    assert(Buffer.from(image.base64, 'base64').subarray(1, 4).toString() === 'PNG', '未返回真实PNG');
    const carrier=BrowserWindow.getAllWindows().find(w=>w!==window);assert(carrier&&!carrier.isVisible(),'远程浏览器承载抢占桌面');
    const state=browserController.getState(session.id)!;
    assert(state.tabs.find(t=>t.tabId===state.activeTabId)?.offscreen,'未标记电脑继续呈现的离屏标签');
    const frame=await browserController.remoteFrame({sessionId:session.id,tabId:state.activeTabId,width:900,height:700});assert(frame.dataUrl.startsWith('data:image/png;base64,'),'电脑续接帧无效');
    await browserController.remoteInput({sessionId:session.id,tabId:state.activeTabId,kind:'click',x:80,y:18});
    await browserController.remoteInput({sessionId:session.id,tabId:state.activeTabId,kind:'text',text:'desktop-resume'});
    const continued=await service.mobileBrowserRead({action:'observe'},context)as typeof initial;assert(continued.elements.some(e=>e.name.includes('desktop-resume')),'电脑输入没有作用于手机原页面');
    allowed = false;
    let denied = false;
    try {await service.mobileBrowserRead({action: 'observe'}, context);} catch {denied = true;}
    assert(denied, '撤销后仍可访问网页');
    allowed = true;
    await (await import('../apps/electron/src/main/lib/agent-removal-service')).removeAgentWorkspace('a');
    assert(!sessions.getAgentSessionMeta(session.id), '工作区删除遗留会话');
    assert(!browserController.getState(session.id), '工作区删除遗留浏览器');
    assert(existsSync(join(root, 'project-a')), '删除工作区误删外部项目目录');
    console.log('MOBILE BROWSER real page -> observe -> fill -> click -> PNG -> revoke PASS');
    console.log('REMOVAL shared desktop/mobile cleanup, no orphan session/browser, external directory preserved PASS');
    console.log('PROFILE', root);
  } finally {
    await browserController.close(session.id);
    server.closeAllConnections();
    await new Promise<void>(ok => server.close(() => ok()));
    await (await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();
    window.destroy();
  }
}
app.whenReady().then(run).then(() => app.exit(0)).catch(e => {console.error(e); app.exit(1);});
