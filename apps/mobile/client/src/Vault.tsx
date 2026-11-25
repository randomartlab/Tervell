import React, { useEffect, useState } from 'react';
import { FileText, Plus, Folder, Settings } from 'lucide-react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Empty, Sheet, SearchBox } from './ui';
import { Markdown } from './Markdown';
import { ComputerFolderPicker } from './Workspaces';
export function Vault({
  hostId
}: {
  hostId: string;
}) {
  const [summary, setSummary] = useState<RecordValue>(),
    [files, setFiles] = useState<RecordValue[]>([]),
    [query, setQuery] = useState(''),
    [file, setFile] = useState(''),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [digest, setDigest] = useState(''),
    [draftFiles, setDraftFiles] = useState<string[]>([]),
    [creating, setCreating] = useState(false),
    [editor, setEditor] = useState(false),
    [picker, setPicker] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const draftPrefix = 'tervell-vault-draft:' + hostId + ':' + String(summary?.vaultId ?? '') + ':';
  const refreshDrafts = () => setDraftFiles(Object.keys(localStorage).filter(k => k.startsWith(draftPrefix)).map(k => k.slice(draftPrefix.length)));
  useEffect(() => {
    refreshDrafts();
  }, [draftPrefix]);
  const load = async () => {
    setBusy(true);
    try {
      const r = await control('vault.read', {
        action: 'list'
      });
      setSummary(r.summary ? plain(r.summary) : undefined);
      setFiles(list(r.files));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [hostId]);
  const key = 'tervell-vault-draft:' + hostId + ':' + String(summary?.vaultId ?? '') + ':' + file;
  useEffect(() => {
    if (!file || !summary) return;
    try {
      if (creating || content !== original) localStorage.setItem(key, JSON.stringify({
        content,
        original,
        digest,
        creating
      }));else localStorage.removeItem(key);
      refreshDrafts();
    } catch {
      setError('手机草稿存储不可用，请先复制正文。');
    }
  }, [key, content, original, digest, creating]);
  const open = async (path: string) => {
    setBusy(true);
    setError('');
    try {
      let r: RecordValue = {};
      const cached = localStorage.getItem(draftPrefix + path);
      if (!cached || JSON.parse(cached).creating !== true) r = await control('vault.read', {
        action: 'read',
        path
      });
      const saved = localStorage.getItem('tervell-vault-draft:' + hostId + ':' + String(summary?.vaultId ?? '') + ':' + path);
      let draft: RecordValue = {};
      try {
        draft = saved ? JSON.parse(saved) : {};
      } catch {/* 损坏草稿不覆盖电脑。 */}
      setFile(path);
      setContent(typeof draft.content === 'string' ? draft.content : String(r.content));
      setOriginal(typeof draft.original === 'string' ? draft.original : String(r.content));
      setDigest(typeof draft.digest === 'string' ? draft.digest : String(r.sha256));
      setCreating(draft.creating === true);
      setEditor(!!saved);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const run = async (action: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('vault.action', {
        action,
        ...values
      });
      await load();
      return r;
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError('');
    let uploadId = '';
    try {
      const bytes = new TextEncoder().encode(content);
      if (bytes.length > 2 * 1024 * 1024) throw Error('知识库笔记超过电脑端 2MB 上限，请拆分为多条笔记。');
      const digestValue = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
      const started = await control('vault.action', {
        action: 'save.start',
        path: file,
        bytes: bytes.length,
        digest: digestValue,
        vaultId: summary?.vaultId,
        ...(creating ? {
          createOnly: true
        } : {
          expectedSha256: digest
        })
      });
      uploadId = String(started.id);
      for (let offset = 0, index = 0; offset < bytes.length; offset += 48000, index++) {
        let raw = '';
        for (const b of bytes.subarray(offset, offset + 48000)) raw += String.fromCharCode(b);
        await control('vault.action', {
          action: 'save.chunk',
          id: uploadId,
          index,
          data: btoa(raw)
        });
      }
      const r = await control('vault.action', {
        action: 'save.finish',
        id: uploadId
      });
      if (r) {
        setDigest(String(r.sha256));
        setOriginal(content);
        setCreating(false);
        setEditor(false);
        localStorage.removeItem(key);
        await load();
      }
    } catch (e) {
      setError(String(e));
      if (uploadId) await control('vault.action', {
        action: 'save.cancel',
        id: uploadId
      }).catch(() => {});
    } finally {
      setBusy(false);
    }
  };
  return <><Notice text={error} />{busy && <Busy />}<div className="panel-toolbar"><h3>{String(summary?.displayName ?? '电脑知识库')}</h3><span /><button onClick={() => setPicker(true)}><Settings size={16} />选择电脑目录</button></div>{!summary ? <Empty title="电脑尚未选择知识库" detail="可以使用内置知识库，或选择电脑已有 Markdown / Obsidian 文件夹。"><button className="primary" disabled={busy} onClick={() => void run('default', {})}>使用内置知识库</button></Empty> : <><SearchBox value={query} onChange={setQuery} placeholder="搜索知识库文件" />{draftFiles.length > 0 && <div className="settings-group"><h3>手机未保存草稿</h3>{draftFiles.map(path => <button className="full" key={path} onClick={() => void open(path)}>{path} · 继续编辑</button>)}</div>}<div className="button-row"><button onClick={() => {
          const path = prompt('新笔记相对路径，例如：研究/笔记.md');
          if (path?.trim()) {
            setFile(path.trim());
            setContent('');
            setOriginal('');
            setDigest('');
            setCreating(true);
            setEditor(true);
          }
        }}><Plus size={17} />新笔记</button><button onClick={() => {
          const path = prompt('新文件夹相对路径');
          if (path?.trim()) void run('mkdir', {
            path: path.trim()
          });
        }}><Folder size={17} />新文件夹</button></div>{files.filter(f => (String(f.relativePath) + ' ' + String(f.name)).toLowerCase().includes(query.toLowerCase())).map(f => <button className="file-row" key={String(f.relativePath)} disabled={f.kind !== 'file'} onClick={() => void open(String(f.relativePath))}>{f.kind === 'file' ? <FileText size={17} /> : <Folder size={17} />}<span>{String(f.relativePath)}</span></button>)}</>}
 {file && <Sheet title={file} onClose={() => setFile('')} wide><Notice text={error} /><div className="button-row"><button onClick={() => setEditor(!editor)}>{editor ? '预览' : '编辑'}</button><button className="primary" disabled={busy} onClick={() => void save()}>保存到电脑</button><button disabled={busy || creating} onClick={() => {
          const name = prompt('新文件名', file.split('/').at(-1));
          if (name) void run('rename', {
            path: file,
            name,
            expectedSha256: digest
          }).then(r => {
            if (r) setFile('');
          });
        }}>重命名</button><button className="danger" disabled={busy || creating} onClick={() => {
          if (confirm('删除这条电脑笔记？')) void run('delete', {
            path: file,
            expectedSha256: digest
          }).then(r => {
            if (r) {
              localStorage.removeItem(key);
              setFile('');
            }
          });
        }}>删除</button></div>{content !== original && <p className="muted">未保存内容保留在手机；保存时核对电脑原文。</p>}{editor ? <textarea className="file-editor" value={content} onChange={e => setContent(e.target.value)} aria-label="知识库笔记正文" /> : <Markdown text={content} />}</Sheet>}
 {picker && <ComputerFolderPicker onClose={() => setPicker(false)} onPick={path => {
      setPicker(false);
      void run('configure', {
        path,
        allowAgentWrites: false
      });
    }} />}
 </>;
}
