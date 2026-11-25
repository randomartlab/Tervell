import React, { useEffect, useState } from 'react';
import { Plus, BookOpen, Plug, RefreshCw, ChevronRight, Check, Trash2, Save } from 'lucide-react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Empty, Sheet, SearchBox } from './ui';
import { Markdown } from './Markdown';
import { McpEditor } from './McpEditor';
import { SkillFiles } from './SkillFiles';
import { SkillImport } from './SkillImport';
import { McpLogin } from './McpLogin';
interface Skill {
  slug: string;
  name: string;
  description?: string;
  enabled: boolean;
}
interface Mcp {
  name: string;
  type: string;
  enabled: boolean;
  verified?: boolean;
  lastTestResult?: {
    success: boolean;
    timestamp: number;
  };
}
export function ProjectTools({
  workspaceId,
  management
}: {
  workspaceId: string;
  management: boolean;
}) {
  const [skills, setSkills] = useState<Skill[]>([]),
    [servers, setServers] = useState<Mcp[]>([]),
    [query, setQuery] = useState(''),
    [tab, setTab] = useState<'skills' | 'mcp'>('skills'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [editing, setEditing] = useState<Skill>(),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [form, setForm] = useState(''),
    [importing, setImporting] = useState(false),
    [mcpEditing, setMcpEditing] = useState(''),
    [login, setLogin] = useState(''),
    [values, setValues] = useState<RecordValue>({
      type: 'http',
      enabled: false
    });
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const s = await control('skills.list', {}, {
          workspaceId
        }),
        m = await control('mcp.list', {}, {
          workspaceId
        });
      setSkills(list(s.skills));
      setServers(list(m.servers));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [workspaceId]);
  const run = async (job: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await job();
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><div className="button-row"><button className={tab === 'skills' ? 'selected' : ''} onClick={() => setTab('skills')}><BookOpen size={17} />Skills</button><button className={tab === 'mcp' ? 'selected' : ''} onClick={() => setTab('mcp')}><Plug size={17} />MCP</button><button onClick={() => void load()} aria-label="刷新项目扩展"><RefreshCw size={17} /></button></div><SearchBox value={query} onChange={setQuery} placeholder="搜索技能与工具服务" /><Notice text={error} />{busy && <Busy />}{tab === 'skills' ? <><button className="full" onClick={() => {
        setForm('skill');
        setValues({});
      }}><Plus size={17} />新建 Skill</button><button className="full" disabled={busy} onClick={() => setImporting(true)}>从其他工作区复制 Skill</button>{skills.filter(s => (s.name + ' ' + s.slug + ' ' + s.description).toLowerCase().includes(query.toLowerCase())).map(s => <div className="extension-row" key={s.slug}><button onClick={() => void run(async () => {
          const r = await control('skills.read', {
            slug: s.slug
          }, {
            workspaceId
          });
          setContent(String(r.content));
          setOriginal(String(r.content));
          setEditing(s);
        })}><BookOpen size={18} /><span><strong>{s.name}</strong><small>{s.description ?? s.slug}</small></span><ChevronRight size={16} /></button><label className="toggle-label"><input aria-label={'启用 ' + s.name} type="checkbox" checked={s.enabled} onChange={e => void run(() => control('skills.toggle', {
            slug: s.slug,
            enabled: e.target.checked
          }, {
            workspaceId
          }))} /></label></div>)}{!skills.length && !busy && <Empty title="这个项目还没有 Skill" detail="创建可重复使用的指令与流程，桌面和手机使用同一份文件。" />}</> : <><button className="full" disabled={!management} onClick={() => {
        setForm('mcp');
        setValues({
          type: 'http',
          enabled: false
        });
      }}><Plus size={17} />添加 MCP 服务</button>{!management && <p className="muted">查看项目工具不需要整机授权；启动服务、修改连接与凭据需要电脑授予整机管理。</p>}{servers.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).map(s => <div className="extension-row" key={s.name}><button className="extension-description" onClick={() => {
          setMcpEditing(s.name);
        }}><Plug size={19} /><span><strong>{s.name}</strong><small>{s.type} · {s.verified ? '最近握手成功' : s.lastTestResult ? s.lastTestResult.success ? '最近握手成功' : '最近握手失败' : '尚未验证'}</small></span></button><label className="toggle-label"><input type="checkbox" aria-label={'启用 ' + s.name} checked={s.enabled} disabled={!management || busy} onChange={e => void run(() => control('mcp.toggle', {
            name: s.name,
            enabled: e.target.checked
          }, {
            workspaceId
          }))} /></label><button className="icon-button" disabled={!management} aria-label={'删除 ' + s.name} onClick={() => {
          if (confirm('从项目移除 ' + s.name + '？')) void run(() => control('mcp.remove', {
            name: s.name
          }, {
            workspaceId
          }));
        }}><Trash2 size={17} /></button></div>)}{!servers.length && !busy && <Empty title="项目尚未配置 MCP" detail="添加服务后，电脑完成真实握手，再提供给当前项目的 Agent。" />}</>}{editing && <Sheet title={editing.name} onClose={() => {
      if (content === original || confirm('放弃未保存修改？')) setEditing(undefined);
    }} wide><label className="field">Skill 原文<textarea className="skill-editor" rows={18} value={content} onChange={e => setContent(e.target.value)} spellCheck={false} /></label><Notice text={error} /><div className="button-row"><button className="primary" disabled={busy} onClick={() => void run(async () => {
          await control('skills.write', {
            slug: editing.slug,
            content,
            expectedContent: original
          }, {
            workspaceId
          });
          setOriginal(content);
        })}><Save size={16} />保存</button><button className="danger" disabled={busy} onClick={() => {
          if (confirm('删除此 Skill？')) void run(async () => {
            await control('skills.delete', {
              slug: editing.slug
            }, {
              workspaceId
            });
            setEditing(undefined);
          });
        }}><Trash2 size={16} />删除</button></div><details className="settings-group"><summary>附属文件与脚本</summary><SkillFiles workspaceId={workspaceId} slug={editing.slug} /></details></Sheet>}{form && <Sheet title={form === 'skill' ? '新建 Skill' : '添加 MCP 服务'} onClose={() => setForm('')}><label className="field">{form === 'skill' ? '标识（英文小写和连字符）' : '服务名称'}<input value={String(values.name ?? '')} onChange={e => setValues(v => ({
          ...v,
          name: e.target.value
        }))} /></label>{form === 'skill' ? <><label className="field">说明<input value={String(values.description ?? '')} onChange={e => setValues(v => ({
            ...v,
            description: e.target.value
          }))} /></label><label className="field">执行指令<textarea rows={9} value={String(values.instructions ?? '')} onChange={e => setValues(v => ({
            ...v,
            instructions: e.target.value
          }))} /></label></> : <><label className="field">连接方式<select value={String(values.type)} onChange={e => setValues(v => ({
            ...v,
            type: e.target.value
          }))}><option value="http">HTTPS / Streamable HTTP</option><option value="sse">SSE</option><option value="stdio">电脑本地命令</option></select></label>{values.type === 'stdio' ? <><label className="field">电脑上的可执行命令<input value={String(values.command ?? '')} onChange={e => setValues(v => ({
              ...v,
              command: e.target.value
            }))} /></label><label className="field">参数（每行一个）<textarea rows={4} value={String(values.args ?? '')} onChange={e => setValues(v => ({
              ...v,
              args: e.target.value
            }))} /></label></> : <label className="field">服务 URL<input inputMode="url" value={String(values.url ?? '')} onChange={e => setValues(v => ({
            ...v,
            url: e.target.value
          }))} /></label>}<label className="setting-row"><span>保存后握手并启用</span><input type="checkbox" checked={values.enabled === true} onChange={e => setValues(v => ({
            ...v,
            enabled: e.target.checked
          }))} /></label><p className="muted">密钥不会随此表单回显。保存后可点击服务名称，在手机浏览器完成账号授权。</p></>}<Notice text={error} /><button className="primary full" disabled={busy || !String(values.name ?? '').trim()} onClick={() => void run(async () => {
        if (form === 'skill') await control('skills.create', {
          slug: String(values.name).trim(),
          name: String(values.name).trim(),
          description: String(values.description ?? '项目技能'),
          instructions: String(values.instructions ?? '')
        }, {
          workspaceId
        });else await control('mcp.configure', {
          name: String(values.name),
          type: values.type,
          enabled: values.enabled,
          replaceExisting: false,
          ...(values.type === 'stdio' ? {
            command: values.command,
            args: String(values.args ?? '').split('\n').filter(Boolean)
          } : {
            url: values.url
          })
        }, {
          workspaceId
        });
        setForm('');
      })}>{busy ? '正在保存并验证…' : '保存到项目'}</button></Sheet>}{importing && <SkillImport workspaceId={workspaceId} onClose={() => setImporting(false)} onSaved={() => void load()} />}{mcpEditing && <McpEditor workspaceId={workspaceId} name={mcpEditing} onClose={() => setMcpEditing('')} onSaved={() => void load()} onLogin={() => {
      setLogin(mcpEditing);
      setMcpEditing('');
    }} />}{login && <McpLogin workspaceId={workspaceId} name={login} onClose={() => setLogin('')} onChanged={() => void load()} />}</>;
}
