import {FileAnnotationAction,useMobileAnnotations} from './Annotations';
import React, { useEffect, useRef, useState } from 'react';
import { Folder, ChevronRight, ArrowUp, Save, FileCode, Plus, SquareTerminal, RotateCw, Trash2, ArrowDownToLine } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { control, request, plain, list, readable, native } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Empty, Notice, Sheet, CopyButton, IconButton } from './ui';
import { Code, Markdown } from './Markdown';
import type { Action, Approval, Interaction, Catalog, Workspace } from './model';
import {chooseQuestionOption, questionAnswers, questionKey, readQuestionDrafts} from './questions';
import type {QuestionDrafts} from './questions';
import {prepareActionValues} from './action-values';
export function FilePanel({
  sessionId,
  insert
}: {
  sessionId: string;
  insert: (text: string) => void;
}) {
  const [fileRevision, setFileRevision] = useState('');
  const [path, setPath] = useState('.'),
    [rows, setRows] = useState<Array<{
      path: string;
      kind: string;
    }>>([]),
    [file, setFile] = useState(''),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [editing, setEditing] = useState(false),
    [more, setMore] = useState(false),
    [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [diff, setDiff] = useState(false);
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await control('files.list', {
        path
      }, {
        sessionId
      });
      setRows(list(r.entries));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [path, sessionId]);
  const open = async (name: string, start = 0) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('files.mobile-read', {
          path: name,
          offset: start,
          ...(start && fileRevision ? {
            revision: fileRevision
          } : {})
        }, {
          sessionId
        }),
        text = String(r.content ?? '');
      setFile(name);
      setContent(v => start ? v + text : text);
      setOriginal(v => start ? v + text : text);
      setFileRevision(String(r.revision));
      setOffset(Number(r.nextOffset));
      setMore(Boolean(r.hasMore));
      setEditing(false);
      setDiff(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  if (file) return <div className="file-page"><div className="panel-toolbar"><button onClick={() => {
        if (!editing || content === original || confirm('放弃未保存修改？')) {
          setFile('');
          setEditing(false);
        }
      }}>返回目录</button><span>{file}</span><FileAnnotationAction content={content} path={file} kind={diff?'diff':/\.md$/i.test(file)?'markdown':'file'}/><button onClick={() => insert('[文件] ' + file)}>引用</button></div><Notice text={error} /><div className="panel-toolbar"><button onClick={() => setEditing(!editing)} disabled={more || original.length > 100000 || diff}>{editing ? '预览' : '编辑'}</button><button onClick={() => {
        setBusy(true);
        void control('files.diff', {
          path: file
        }, {
          sessionId
        }).then(r => {
          setContent(String(r.diff ?? '没有未暂存改动'));
          setDiff(true);
          setEditing(false);
        }).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}>Git Diff</button>{editing && <button className="primary" disabled={busy} onClick={() => {
        setBusy(true);
        void control('files.write', {
          path: file,
          expected: original,
          content
        }, {
          sessionId
        }).then(() => {
          setOriginal(content);
          setEditing(false);
        }).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}><Save size={15} />保存</button>}</div>{original.length > 100000 && <p className="muted">此文件可完整阅读；手机编辑目前仅开放 100 KB 以内文本，避免覆盖大文件。</p>}{editing ? <textarea className="file-editor" value={content} onChange={e => setContent(e.target.value)} spellCheck={false} /> : diff ? <Code source={content} language="diff" /> : /\.md$/i.test(file) ? <Markdown text={content} /> : <Code source={content} language={file.split('.').at(-1)} />}<div className="panel-toolbar">{more && <button onClick={() => void open(file, offset)} disabled={busy}>加载更多内容</button>}<CopyButton text={content} /></div></div>;
  return <><div className="panel-toolbar"><IconButton label="上级目录" onClick={() => setPath(path.split('/').slice(0, -1).join('/') || '.')}><ArrowUp size={18} /></IconButton><span>{path}</span><IconButton label="刷新目录" onClick={() => void load()}><RotateCw size={17} /></IconButton></div><Notice text={error} retry={() => void load()} />{busy ? <Busy /> : !rows.length ? <Empty title="目录为空" /> : rows.map(row => <button className="file-row" key={row.path} onClick={() => row.kind === 'directory' ? setPath(row.path) : void open(row.path)}>{row.kind === 'directory' ? <Folder size={19} /> : <FileCode size={19} />}<span>{row.path.split(/[\\/]/).at(-1)}</span><ChevronRight size={16} /></button>)}</>;
}
export function TerminalPanel({
  sessionId
}: {
  sessionId: string;
}) {
  const annotations=useMobileAnnotations();
  const [rows, setRows] = useState<Array<{
      id: string;
      title: string;
      status: string;
    }>>([]),
    [selected, setSelected] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    term = useRef<Terminal>(),
    last = useRef(''),
    seq = useRef(0),
    input = useRef(Promise.resolve());
  const load = async () => {
    try {
      const r = await control('terminal.list', {}, {
        sessionId
      });
      setRows(list(r.terminals));
      if (!selected && list<{
        id: string;
      }>(r.terminals)[0]) setSelected(list<{
        id: string;
      }>(r.terminals)[0]!.id);
    } catch (e) {
      setError(String(e));
    }
  };
  useEffect(() => {
    void load();
  }, [sessionId]);
  useEffect(() => {
    if (!root.current || !selected) return;
    const t = new Terminal({
        fontSize: 13,
        fontFamily: 'monospace',
        cursorBlink: true,
        convertEol: false,
        theme: {
          background: '#111b1a',
          foreground: '#e3ece9',
          cursor: '#a5cec4'
        },
        scrollback: 3000
      }),
      fit = new FitAddon();
    t.loadAddon(fit);
    t.open(root.current);
    term.current = t;
    last.current = '';
    seq.current = 0;
    let live = true,
      timer: ReturnType<typeof setTimeout>,
      reading = false;
    const resize = () => {
      fit.fit();
      void control('terminal.mobile-resize', {
        terminalId: selected,
        cols: t.cols,
        rows: t.rows
      }, {
        sessionId
      }).catch(() => {});
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root.current);
    resize();
    const data = t.onData(value => {
      input.current = input.current.then(() => control('terminal.mobile-input', {
        terminalId: selected,
        data: value
      }, {
        sessionId
      }).then(() => {})).catch(e => setError(String(e)));
    });
    const poll = async () => {
      if (reading) return;
      reading = true;
      try {
        const r = await control('terminal.mobile-snapshot', {
          terminalId: selected,
          ack: seq.current
        }, {
          sessionId
        });
        if (live && Number(r.sequence) !== seq.current) {
          const out = String(r.output ?? '');
          if (out.startsWith(last.current)) t.write(out.slice(last.current.length));else {
            t.reset();
            t.write(out);
          }
          last.current = out;
          seq.current = Number(r.sequence);
        }
      } catch (e) {
        if (live) setError(String(e));
      } finally {
        reading = false;
        if (live) timer = setTimeout(() => void poll(), 800);
      }
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
      observer.disconnect();
      data.dispose();
      t.dispose();
    };
  }, [selected, sessionId]);
  return <div className="terminal-page"><div className="panel-toolbar"><select aria-label="选择终端" value={selected} onChange={e => setSelected(e.target.value)}><option value="">选择终端</option>{rows.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select><button disabled={busy} onClick={() => {
        setBusy(true);
        void control('terminal.mobile-create', {}, {
          sessionId
        }).then(r => {
          setSelected(String(r.terminalId));
          void load();
        }).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}><Plus size={16} />新建</button>{selected && <IconButton label="关闭终端" onClick={() => {
        if (confirm('关闭此终端？')) void control('terminal.mobile-close', {
          terminalId: selected
        }, {
          sessionId
        }).then(() => {
          setSelected('');
          void load();
        }).catch(e => setError(String(e)));
      }}><Trash2 size={17} /></IconButton>}</div><Notice text={error} />{selected ? <><div className="terminal-host" ref={root} /><div className="terminal-keys">{annotations&&<button onClick={()=>{const value=term.current?.getSelection();if(!value){setError('请先在终端中选中需要批注的输出。');return;}annotations.offer({quote:value,label:'终端输出',source:{kind:'terminal',label:'终端输出',sessionId,terminalId:selected,cols:term.current?.cols,rows:term.current?.rows}});}}>批注选中输出</button>}{[['Esc', '\u001b'], ['Tab', '\t'], ['Ctrl+C', '\u0003'], ['↑', '\u001b[A'], ['↓', '\u001b[B'], ['←', '\u001b[D'], ['→', '\u001b[C']].map(([label, data]) => <button key={label} onClick={() => void control('terminal.mobile-input', {
          terminalId: selected,
          data
        }, {
          sessionId
        }).catch(e => setError(String(e)))}>{label}</button>)}</div></> : <Empty title="交互终端" detail="选择电脑已有终端，或在获整机授权后新建。输入实时交给电脑 shell。" />}</div>;
}
export function ApprovalPanel({
  sessionId,
  hostId,
  onChanged
}: {
  sessionId?: string;
  hostId: string;
  onChanged: () => void;
}) {
  const [approvals, setApprovals] = useState<Approval[]>([]),
    [interactions, setInteractions] = useState<Interaction[]>([]),
    [answers, setAnswers] = useState<QuestionDrafts>(() => readQuestionDrafts(localStorage.getItem('question-drafts:' + hostId))),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (hostId) localStorage.setItem('question-drafts:' + hostId, JSON.stringify(answers));
  }, [answers, hostId]);
  const load = async () => {
    try {
      const a = await request('approvals'),
        i = await request('interactions');
      setApprovals(list(a.approvals));
      setInteractions(list(i.interactions));
    } catch (e) {
      setError(String(e));
    }
  };
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, []);
  const run = async (method: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const result = await request(method, values);
      if (result.resolved === false) throw Error('此操作已失效或已在另一端处理，请刷新后核对。');
      if (method === 'answer') setAnswers(all => Object.fromEntries(Object.entries(all).filter(([key]) => !key.startsWith(String(values.requestId) + ':'))));
      await load();
      onChanged();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const visibleApprovals = approvals.filter(a => !sessionId || a.sessionId === sessionId);
  const visibleInteractions = interactions.filter(a => !sessionId || a.sessionId === sessionId);
  return <><Notice text={error} />{!visibleApprovals.length && !visibleInteractions.length && <Empty title="目前没有等待确认的操作" detail="工具需要许可、Agent 有问题或计划待确认时，会显示在这里。" />}{visibleApprovals.map(a => <article className="approval-card" key={a.requestId}><h3>{a.toolName}</h3><Markdown text={a.description} />{a.command && <Code source={a.command} language="bash" />}{a.inputPreview && <pre>{a.inputPreview}</pre>}<div className="button-row"><button disabled={busy} onClick={() => void run('approve', {
          requestId: a.requestId,
          decision: 'deny'
        })}>拒绝</button><button className="primary" disabled={busy || a.canApprove === false} onClick={() => void run('approve', {
          requestId: a.requestId,
          decision: 'allow'
        })}>允许本次</button></div>{a.canApprove === false && <p>请到电脑查看完整参数后处理。</p>}</article>)}{visibleInteractions.map(i => <article className="approval-card" key={i.requestId}>{i.kind === 'plan' ? <><h3>确认执行计划</h3><Markdown text={i.planText ?? ''} /><div className="button-row"><button disabled={busy} onClick={() => void run('plan', {
            requestId: i.requestId,
            decision: 'deny'
          })}>退回修改</button><button className="primary" disabled={busy || i.canApprove === false} onClick={() => void run('plan', {
            requestId: i.requestId,
            decision: 'allow'
          })}>批准计划</button></div></> : <><h3>Agent 需要你的回答</h3>{i.questions?.map((q, index) => {
            const key = questionKey(i.requestId, index), draft = answers[key];
            return <fieldset className="field question-field" key={key}><legend>{q.question}</legend>{q.multiSelect && <small>可选择多项</small>}<div className="choice-list">{q.options.map(o => <button disabled={busy} aria-pressed={!draft?.custom && !!draft?.selected.includes(o.label)} className={!draft?.custom && draft?.selected.includes(o.label) ? 'selected' : ''} key={o.label} onClick={() => setAnswers(all => ({...all, [key]: chooseQuestionOption(all[key], o.label, !!q.multiSelect)}))}>{o.label}<small>{o.description}</small></button>)}</div><input aria-label={q.question + ' · 其他答案'} placeholder="或输入其他答案" maxLength={4000} value={draft?.custom ?? ''} onChange={e => setAnswers(all => ({...all, [key]: {selected: all[key]?.selected ?? [], custom: e.target.value}}))} /></fieldset>;
          })}<button className="primary" disabled={busy || !i.questions?.length || i.questions.some(q => !questionAnswers(i, answers)[q.question])} onClick={() => void run('answer', {
          requestId: i.requestId,
          answers: questionAnswers(i, answers)
        })}>提交回答</button></>}</article>)}</>;
}
export function ActionForm({
  action,
  workspaceId,
  sessionId,
  onDone
}: {
  action: Action;
  workspaceId?: string;
  sessionId?: string;
  onDone?: (value: RecordValue) => void;
}) {
  const [values, setValues] = useState<RecordValue>(() => Object.fromEntries(action.fields.filter(f => f.value !== undefined).map(f => [f.key, f.value]))),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState<RecordValue>();
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const prepared = prepareActionValues(action,values);
      if (action.effect === 'write' && action.confirm && !confirm('确认' + action.title + '？')) return;
      const r = await control(action.id, prepared, {
        ...(action.scope === 'session' ? {
          sessionId
        } : {}),
        ...(workspaceId ? {
          workspaceId
        } : {})
      });
      setResult(r);
      onDone?.(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (action.effect === 'read' && !action.fields.length) void submit();
  }, [action.id]);
  return <><p className="muted">{action.description}</p>{action.fields.map(f => <label className="field" key={f.key}>{f.label}{f.required ? ' *' : ''}{f.type === 'boolean' ? <input type="checkbox" checked={values[f.key] === true} onChange={e => setValues(v => ({
        ...v,
        [f.key]: e.target.checked
      }))} /> : f.options ? <select value={String(values[f.key] ?? '')} onChange={e => setValues(v => ({
        ...v,
        [f.key]: e.target.value
      }))}><option value="">请选择</option>{f.options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select> : f.type === 'multiline' || f.type === 'json' ? <textarea rows={f.type === 'json' ? 7 : 4} value={typeof values[f.key] === 'string' ? String(values[f.key]) : values[f.key] !== undefined ? JSON.stringify(values[f.key], null, 2) : ''} onChange={e => setValues(v => ({
        ...v,
        [f.key]: e.target.value
      }))} /> : <input type={f.type === 'secret' ? 'password' : f.type === 'number' ? 'number' : 'text'} value={String(values[f.key] ?? '')} onChange={e => setValues(v => ({
        ...v,
        [f.key]: e.target.value
      }))} />}<small>{f.hint}</small></label>)}<Notice text={error} /><button className="primary" disabled={busy || action.scope === 'session' && !sessionId || action.scope === 'project' && !workspaceId} onClick={() => void submit()}>{busy ? '正在处理…' : action.effect === 'read' ? '读取' : '保存并执行'}</button>{result && <div className="result-card"><CopyButton text={readable(result)} /><pre>{readable(result)}</pre></div>}</>;
}
