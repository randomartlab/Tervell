import {FileAnnotationAction} from './Annotations';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, FileCode, Folder, Plus, RotateCw, Save, ChevronRight } from 'lucide-react';
import { control, list } from './bridge';
import { Busy, Empty, IconButton, Notice, CopyButton } from './ui';
import { Code, Markdown } from './Markdown';
import { readProjectDrafts, writeProjectDraft, removeProjectDraft } from './project-drafts';
import type { ProjectFileDraft } from './project-drafts';
const sha = async (value: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(value).buffer))).map(b => b.toString(16).padStart(2, '0')).join('');
export function ProjectFiles({
  workspaceId,
  hostId
}: {
  workspaceId: string;
  hostId: string;
}) {
  const [path, setPath] = useState('.'),
    [rows, setRows] = useState<Array<{
      path: string;
      name: string;
      kind: string;
    }>>([]),
    [next, setNext] = useState<number | null>(null),
    [directoryRevision, setDirectoryRevision] = useState(''),
    [file, setFile] = useState(''),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [expected, setExpected] = useState(''),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [diff, setDiff] = useState<string>(),
    [drafts, setDrafts] = useState<ProjectFileDraft[]>([]);
  const generation = useRef(0);
  const restored = useRef(false);
  const restore = (row: ProjectFileDraft) => {
    setFile(row.file);
    setContent(row.content);
    setOriginal(row.original);
    setExpected(row.expected);
    setEditing(true);
    setDiff(undefined);
  };
  useEffect(() => {
    try {
      const rows = readProjectDrafts(localStorage, hostId, workspaceId);
      setDrafts(rows);
      if (rows[0]) {
        restored.current = true;
        restore(rows[0]);
      }
    } catch {
      setError('文件草稿无法恢复，请先检查手机存储，未清除原数据。');
    }
  }, [hostId, workspaceId]);
  useEffect(() => {
    if (!file) return;
    try {
      setDrafts(writeProjectDraft(localStorage, hostId, workspaceId, {
        file,
        content,
        original,
        expected
      }));
    } catch {
      setError('本机草稿保存失败，请保存到电脑或复制正文后再离开此页。');
    }
  }, [hostId, workspaceId, file, content, original, expected]);
  const load = async (offset = 0) => {
    const epoch = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const r = await control('project.files', {
        path,
        offset,
        ...(offset ? {
          revision: directoryRevision
        } : {})
      }, {
        workspaceId
      });
      if (epoch !== generation.current) return;
      setRows(all => offset ? [...all, ...list<typeof rows[number]>(r.entries)] : list(r.entries));
      setNext(r.nextOffset === null ? null : Number(r.nextOffset));
      setDirectoryRevision(String(r.revision));
    } catch (error) {
      setError(String(error));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    if (!restored.current) {
      setFile('');
      setEditing(false);
    }
    restored.current = false;
    void load();
    return () => {
      generation.current++;
    };
  }, [workspaceId, path]);
  const open = async (path: string) => {
    const saved = drafts.find(row => row.file === path);
    if (saved) {
      restore(saved);
      return;
    }
    const epoch = ++generation.current;
    setBusy(true);
    setError('');
    try {
      let text = '',
        offset = 0,
        revision = '';
      for (;;) {
        const page = await control('project.read', {
          path,
          offset,
          ...(revision ? {
            revision
          } : {})
        }, {
          workspaceId
        });
        if (epoch !== generation.current) return;
        text += String(page.content);
        if (!page.hasMore) break;
        revision = String(page.revision);
        offset = Number(page.nextOffset);
      }
      setExpected(await sha(new TextEncoder().encode(text)));
      setFile(path);
      setContent(text);
      setOriginal(text);
      setEditing(false);
      setDiff(undefined);
    } catch (error) {
      setError(String(error));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError('');
    let uploadId = '';
    try {
      const bytes = new TextEncoder().encode(content),
        digest = await sha(bytes);
      const started = await control('project.edit-start', {
        path: file,
        expected,
        digest,
        bytes: bytes.length
      }, {
        workspaceId
      });
      uploadId = String(started.id);
      for (let at = 0, index = 0; at < bytes.length; at += 48000, index++) {
        let binary = '';
        for (const byte of bytes.subarray(at, at + 48000)) binary += String.fromCharCode(byte);
        await control('project.edit-chunk', {
          id: uploadId,
          index,
          data: btoa(binary)
        }, {
          workspaceId
        });
      }
      await control('project.edit-finish', {
        id: uploadId
      }, {
        workspaceId
      });
      uploadId = '';
      setExpected(digest);
      setOriginal(content);
      setEditing(false);
    } catch (error) {
      setError(String(error));
    } finally {
      if (uploadId) void control('project.edit-cancel', {
        id: uploadId
      }, {
        workspaceId
      }).catch(() => {});
      setBusy(false);
    }
  };
  if (file) return <div className="file-page"><div className="panel-toolbar"><button onClick={() => {
        setFile('');
        setEditing(false);
        void load();
      }}>返回目录</button><span>{file}</span><CopyButton text={content} /><FileAnnotationAction content={diff??content} path={file} digest={expected} kind={diff!==undefined?'diff':/\.md$/i.test(file)?'markdown':'file'}/><button className="danger" disabled={busy} onClick={() => {
        if (confirm('放弃此文件的手机草稿并重新读取电脑原文？')) {
          try {
            setDrafts(removeProjectDraft(localStorage, hostId, workspaceId, file));
            setFile('');
            setEditing(false);
            void load();
          } catch (e) {
            setError(String(e));
          }
        }
      }}>放弃修改</button></div><Notice text={error} />{content !== original && <p className="muted">未保存修改已保留在这台手机，关闭面板后可继续。保存时会核对电脑原文，避免覆盖其他编辑。</p>}<div className="panel-toolbar"><button disabled={busy} onClick={() => {
        setEditing(!editing);
        setDiff(undefined);
      }}>{editing ? '预览' : '编辑'}</button><button disabled={busy} onClick={() => void control('project.diff', {
        path: file
      }, {
        workspaceId
      }).then(r => {
        setDiff(String(r.diff || '没有未暂存的改动'));
        setEditing(false);
      }).catch(e => setError(String(e)))}>Git Diff</button>{editing && <button className="primary" disabled={busy} onClick={() => void save()}><Save size={16} />保存到电脑</button>}</div>{busy && <Busy text="正在核对并传输完整文件…" />}{editing ? <textarea className="file-editor" aria-label="项目文件正文" value={content} onChange={e => setContent(e.target.value)} spellCheck={false} /> : diff !== undefined ? <Code source={diff} language="diff" /> : /\.md$/i.test(file) ? <Markdown text={content} /> : <Code source={content} language={file.split('.').at(-1)} />}</div>;
  return <>{drafts.length > 0 && <div className="settings-group"><h3>未保存的手机草稿</h3>{drafts.map(row => <button className="file-row" key={row.file} onClick={() => restore(row)}><FileCode size={17} /><span>{row.file}</span><ChevronRight size={16} /></button>)}</div>}<div className="panel-toolbar"><IconButton label="上级目录" disabled={path === '.' || busy} onClick={() => setPath(path.split('/').slice(0, -1).join('/') || '.')}><ArrowUp size={18} /></IconButton><span>{path}</span><IconButton label="刷新项目文件" disabled={busy} onClick={() => void load()}><RotateCw size={18} /></IconButton></div><div className="button-row"><button disabled={busy} onClick={() => {
        const name = prompt('新文件名（相对当前目录）');
        if (!name?.trim()) return;
        setFile((path === '.' ? '' : path + '/') + name.trim());
        setContent('');
        setOriginal('');
        setExpected('new');
        setEditing(true);
      }}><Plus size={16} />新建文件</button><button disabled={busy} onClick={() => {
        const name = prompt('新文件夹名称');
        if (!name?.trim()) return;
        void control('project.mkdir', {
          path: (path === '.' ? '' : path + '/') + name.trim()
        }, {
          workspaceId
        }).then(() => load()).catch(e => setError(String(e)));
      }}><Folder size={16} />新建目录</button></div><Notice text={error} />{!rows.length && !busy && <Empty title="目录为空" detail="可新建文件与目录，不需要先建立对话。" />}{rows.map(row => <button key={row.path} className="file-row" disabled={busy} onClick={() => row.kind === 'directory' ? setPath(row.path) : void open(row.path)}>{row.kind === 'directory' ? <Folder size={18} /> : <FileCode size={18} />}<span>{row.name}</span><ChevronRight size={16} /></button>)}{busy && <Busy />}{next !== null && <button className="full" disabled={busy} onClick={() => void load(next)}>继续读取目录</button>}</>;
}
