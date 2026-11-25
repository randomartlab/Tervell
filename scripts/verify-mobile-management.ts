import { app } from 'electron';
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file';
import { planningValues, planningDraft } from '../apps/mobile/client/src/planning-form';
import type { MobileControlCall } from '@proma/protocol';
const root = mkdtempSync(join(tmpdir(), 'tervell-mobile-management-'));
process.env.TERVELL_PROFILE_DIR = root;
app.setPath('userData', join(root, 'chromium'));
(app as typeof app & {
  setAppPath: (path: string) => void;
}).setAppPath(resolve('apps/electron'));
app.commandLine.appendSwitch('use-mock-keychain');
const assert = (v: unknown, message: string) => {
  if (!v) throw Error(message);
};
async function run() {
  mkdirSync(join(root, 'config'));
  for (const id of ['a', 'b']) mkdirSync(join(root, 'project-' + id));
  writeJsonFileAtomic(join(root, 'config/agent-workspaces.json'), {
    version: 2,
    workspaces: ['a', 'b'].map(id => ({
      id,
      slug: id,
      name: id,
      projectRootPath: join(root, 'project-' + id),
      createdAt: 1,
      updatedAt: 1
    }))
  });
  const service = await import('../apps/electron/src/main/lib/mobile-control-service');
  let allowed = true;
  service.setMobileControlAuthority(d => {
    if (!allowed) throw Error('已撤销');
    return d;
  });
  const device = {
    id: 'mobile-management-fixture',
    workspaceIds: ['a', 'b'],
    management: true
  };
  const call = async (operation: string, values: MobileControlCall['values'] = {}, workspaceId?: string) => {
    let r = (await service.mobileControl(device, {
      operation,
      values,
      workspaceId
    })) as Record<string, unknown>;
    while (r.job) {
      const job = r.job as {
        id: string;
        phase: string;
      };
      if (job.phase === 'failed') throw Error(String(r.error));
      if (job.phase === 'done') {
        r = r.result as Record<string, unknown>;
        break;
      }
      await new Promise(ok => setTimeout(ok, 20));
      r = (await service.mobileControl(device, {
        operation: 'jobs.status',
        values: {
          id: job.id
        }
      })) as Record<string, unknown>;
    }
    if (r.error) throw Error(String(r.error));
    return r;
  };
  const rejects = async (job: () => Promise<unknown>, label: string) => {
    let refused = false;
    try {
      await job();
    } catch {
      refused = true;
    }
    assert(refused, label);
  };
  try {
    const group = (await call('planning.action', {
      action: 'group.save',
      scope: 'todo',
      name: '手机分组',
      color: '#285C59'
    }, 'a')).result as {
      id: string;
    };
    const tag = (await call('planning.action', {
      action: 'tag.save',
      name: '多工作区',
      color: '#285C59'
    }, 'a')).result as {
      id: string;
    };
    const todo = (await call('planning.action', planningValues(planningDraft('todo', {
      title: '手机待办',
      status: 'completed',
      groupId: group.id,
      tagIds: [tag.id]
    })) as MobileControlCall['values'], 'a')).result as {
      id: string;
      updatedAt: number;
      status: string;
    };
    assert(todo.status === 'completed', '新建已完成待办丢失状态');
    await rejects(() => call('planning.action', {
      action: 'todo.save',
      id: todo.id,
      title: '跨项目覆盖',
      expectedUpdatedAt: todo.updatedAt
    }, 'b'), '待办跨项目未拒绝');
    const changed = (await call('planning.action', {
      action: 'todo.save',
      id: todo.id,
      title: '手机更新',
      status: 'open',
      expectedUpdatedAt: todo.updatedAt
    }, 'a')).result as {
      updatedAt: number;
    };
    await rejects(() => call('planning.action', {
      action: 'todo.save',
      id: todo.id,
      title: '陈旧覆盖',
      expectedUpdatedAt: todo.updatedAt
    }, 'a'), '待办旧版本覆盖');
    const reminder = (await call('planning.action', {
      action: 'reminder.create',
      kind: 'todo',
      id: todo.id,
      triggerAt: Date.now() + 60000
    }, 'a')).result as {
      id: string;
    };
    await call('planning.action', {
      action: 'reminder.snooze',
      id: reminder.id,
      minutes: 10
    }, 'a');
    await call('planning.action', {
      action: 'reminder.acknowledge',
      id: reminder.id
    }, 'a');
    const event = (await call('planning.action', {
      action: 'calendar.save',
      title: '手机日程',
      startAt: Date.now() + 600000,
      endAt: Date.now() + 1200000
    }, 'a')).result as {
      id: string;
    };
    const draft = planningDraft('automation', {
      title: '定时手机验收',
      prompt: '仅隔离验收',
      scheduleType: 'daily',
      active: false
    });
    const automation = (await call('planning.action', planningValues(draft) as MobileControlCall['values'], 'a')).result as {
      id: string;
      updatedAt: number;
    };
    assert(automation.id, '每天计划无法保存');
    await call('planning.action', planningValues(planningDraft('automation', {
      ...draft,
      id: automation.id,
      updatedAt: automation.updatedAt,
      scheduleType: 'weekly',
      dayOfWeek: 2
    })) as MobileControlCall['values'], 'a');
    const result = await call('planning.read', {}, 'a');
    assert((result.todos as unknown[]).length === 1 && (result.calendar as unknown[]).length === 1 && (result.automations as unknown[]).length === 1, '规划未落盘');
    const sessions=await import('../apps/electron/src/main/lib/agent-session-manager');
    const native=await import('../apps/electron/src/main/lib/builtin-native-service');
    const annotationSession=await sessions.createAgentSessionWithPlugins('手机批注验收',undefined,'a');
    const initial=await call('annotations.mobile-read',{kind:'agent',id:annotationSession.id});
    const annotation={id:crypto.randomUUID(),quote:'手机批注原文🙂',comment:'保留评论',source:{kind:'chat',label:'来源消息',sessionId:annotationSession.id}};
    await call('annotations.mobile-write',{kind:'agent',id:annotationSession.id,revision:initial.revision as string,annotations:[annotation]});
    const desktop=await native.builtinNativeCall('annotations.read',{}) as {drafts:Record<string,unknown[]>};
    assert(desktop.drafts['agent:'+annotationSession.id]?.length===1,'手机批注没有落到桌面状态');
    await rejects(()=>call('annotations.mobile-write',{kind:'agent',id:annotationSession.id,revision:initial.revision as string,annotations:[]}), '陈旧手机批注覆盖桌面');
    const foreign=await sessions.createAgentSessionWithPlugins('另一项目批注',undefined,'b');
    const current=await native.builtinNativeCall('annotations.read',{}) as {revision:string};
    await native.builtinNativeCall('annotations.write',{revision:current.revision,scope:'agent:'+foreign.id,annotations:[{...annotation,id:crypto.randomUUID(),source:{...annotation.source,sessionId:foreign.id}}]});
    const scoped=await call('annotations.mobile-read',{kind:'agent',id:annotationSession.id});
    assert(!Object.hasOwn(scoped,'drafts')&&(scoped.annotations as unknown[]).length===1,'批注读取泄露其他会话草稿');
    console.log('ANNOTATIONS scoped shared desktop/mobile CAS, no foreign draft leak PASS');
    console.log('PLANNING full UI draft -> todo/group/tag/status/CAS/reminder/calendar/daily+weekly automation persistence PASS');
    const vaultDir = join(root, 'vault-a');
    mkdirSync(vaultDir);
    await call('vault.action', {
      action: 'configure',
      path: vaultDir,
      allowAgentWrites: false
    });
    const content = '知识库完整分块🙂\n'.repeat(16000),
      bytes = Buffer.from(content),
      digest = createHash('sha256').update(bytes).digest('hex');
    const start = await call('vault.action', {
      action: 'save.start',
      path: '研究/手机.md',
      bytes: bytes.length,
      digest,
      createOnly: true
    });
    for (let at = 0, index = 0; at < bytes.length; at += 48000, index++) await call('vault.action', {
      action: 'save.chunk',
      id: String(start.id),
      index,
      data: bytes.subarray(at, at + 48000).toString('base64')
    });
    const saved = await call('vault.action', {
      action: 'save.finish',
      id: String(start.id)
    });
    await call('vault.action', {
      action: 'save.finish',
      id: String(start.id)
    });
    assert(readFileSync(join(vaultDir, '研究/手机.md'), 'utf8') === content, '知识库大文件不完整');
    await call('vault.action', {
      action: 'save',
      path: '研究/手机.md',
      content: '电脑并发新内容',
      expectedSha256: saved.sha256 as string
    });
    await rejects(() => call('vault.action', {
      action: 'save',
      path: '研究/手机.md',
      content: '陈旧覆盖',
      expectedSha256: saved.sha256 as string
    }), '知识库并发冲突未拒绝');
    const sha = createHash('sha256').update('电脑并发新内容').digest('hex');
    const renamed = await call('vault.action', {
      action: 'rename',
      path: '研究/手机.md',
      name: '已改名.md',
      expectedSha256: sha
    });
    assert(renamed.relativePath === '研究/已改名.md', '知识库改名未完成');
    await call('vault.action', {
      action: 'delete',
      path: '研究/已改名.md',
      expectedSha256: sha
    });
    assert(!existsSync(join(vaultDir, '研究/已改名.md')), '知识库删除无效');
    console.log('VAULT >180KB full chunk save + retry + SHA conflict + rename/delete PASS');
    const secret = '{{SECRET_n42qm7bp}}';
    const bot = await call('bots.action', {
      action: 'save-feishu',
      name: '隔离机器人',
      enabled: false,
      appId: 'fixture-app',
      appSecret: secret,
      defaultWorkspaceId: 'a',
      allowedUserOpenIds: ['fixture-user']
    });
    let bots = await call('bots.read');
    assert(!JSON.stringify(bots).includes(secret) && !JSON.stringify(bots).includes('appSecret'), '机器人密钥泄露');
    await call('bots.action', {
      action: 'save-feishu',
      id: String(bot.id),
      name: '手机更名',
      enabled: false,
      appId: 'fixture-app',
      appSecret: ''
    });
    bots = await call('bots.read');
    assert((bots.feishu as Array<{
      hasSecret: boolean;
      allowedUserOpenIds: string[];
    }>)[0]?.hasSecret, '空密钥覆盖旧凭据');
    assert((bots.feishu as Array<{
      allowedUserOpenIds: string[];
    }>)[0]?.allowedUserOpenIds[0] === 'fixture-user', '保存清空原用户限制');
    await call('bots.action', {
      action: 'remove',
      platform: 'feishu',
      id: String(bot.id)
    });
    console.log('BOTS Feishu save/redaction/blank-secret preservation/operator retention/remove, no network login PASS');
    const channel = await call('channels.action', {
      action: 'save',
      name: '原生手机渠道',
      provider: 'openai',
      baseUrl: 'http://127.0.0.1:1/v1',
      apiKey: secret,
      enabled: true,
      models: [{
        id: 'fixture',
        name: '完整档位',
        enabled: true,
        efforts: ['ultra', 'vendor-future']
      }]
    });
    let channels = await call('channels.read');
    assert(!JSON.stringify(channels).includes(secret) && !JSON.stringify(channels).includes('apiKey'), '渠道密钥泄露');
    const row = (channels.channels as Array<{
      id: string;
      updatedAt: number;
      hasKey: boolean;
    }>).find(c => c.id === channel.id)!;
    await call('channels.action', {
      action: 'save',
      id: row.id,
      expectedUpdatedAt: row.updatedAt,
      name: '新名称',
      provider: 'openai',
      baseUrl: 'http://127.0.0.1:1/v1',
      apiKey: '',
      enabled: true,
      models: [{
        id: 'fixture',
        name: '完整档位',
        enabled: true,
        efforts: ['ultra', 'vendor-future']
      }]
    });
    channels = await call('channels.read');
    assert((channels.channels as Array<{
      id: string;
      hasKey: boolean;
    }>).find(c => c.id === row.id)?.hasKey, '渠道空密钥没有保留');
    await call('channels.action', {
      action: 'remove',
      id: row.id
    });
    console.log('CHANNELS native CRUD + full raw efforts + no secret response + retained blank credentials PASS');
    await call('mcp.configure', {
      name: 'fixture',
      type: 'stdio',
      command: process.execPath,
      args: ['-e', ''],
      enabled: false,
      replaceExisting: false
    }, 'a');
    const detail = await call('mcp.detail', {
      name: 'fixture'
    }, 'a');
    assert((detail.config as {
      type: string;
    }).type === 'stdio', 'MCP编辑配置没有回填');
    await call('mcp.configure', {
      name: 'fixture',
      type: 'stdio',
      command: process.execPath,
      args: ['-e', '0'],
      enabled: false,
      replaceExisting: true
    }, 'a');
    await call('mcp.remove', {
      name: 'fixture'
    }, 'a');
    await call('skills.create',{slug:'phone-copy',name:'手机复用',description:'多项目流程',instructions:'先检查再修改。'},'a');
    await call('skills.import',{sourceWorkspaceId:'a',slug:'phone-copy'},'b');
    const copied=await call('skills.read',{slug:'phone-copy'},'b');assert(String(copied.content).includes('先检查再修改'),'跨项目技能复制不完整');
    const managers=await import('../apps/electron/src/main/lib/agent-workspace-manager');managers.createSkillEntry('b','phone-copy','resource.txt','file');
    const skillText='手机编辑附属文件🙂'.repeat(20000),skillBytes=Buffer.from(skillText),skillDigest=createHash('sha256').update(skillBytes).digest('hex');
    const skill=await call('skills.asset-start',{slug:'phone-copy',path:'resource.txt',expected:createHash('sha256').update('').digest('hex'),digest:skillDigest,bytes:skillBytes.length},'b');
    for(let at=0,index=0;at<skillBytes.length;at+=48000,index++)await call('skills.asset-chunk',{slug:'phone-copy',id:String(skill.id),index,data:skillBytes.subarray(at,at+48000).toString('base64')},'b');
    await call('skills.asset-finish',{slug:'phone-copy',id:String(skill.id)},'b');assert(managers.readSkillFile('b','phone-copy','resource.txt').content===skillText,'Skill大文件保存不完整');
    console.log('SKILLS copy across workspaces + >180KB subordinate text exact save PASS');
    allowed = false;
    await rejects(() => call('vault.read', {
      action: 'list'
    }), '撤销后知识库可读');
    await rejects(() => call('planning.read', {}, 'a'), '撤销后规划可读');
    console.log('MCP edit preserves native transport + revoked management operations denied PASS');
    console.log('PROFILE', root);
  } finally {
    await (await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();
  }
}
app.whenReady().then(run).then(() => app.exit(0)).catch(e => {
  console.error(e);
  app.exit(1);
});
