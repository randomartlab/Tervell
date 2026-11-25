import React, { useEffect, useState } from 'react';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Sheet } from './ui';
interface Node {
  name: string;
  relativePath: string;
  type?: string;
  children?: Node[];
}
const flatten = (rows: Node[]): Node[] => rows.flatMap(row => row.children ? flatten(row.children) : [row]);
export function ProjectMemory({
  workspaceId
}: {
  workspaceId: string;
}) {
  const [files, setFiles] = useState<Node[]>([]),
    [selected, setSelected] = useState(''),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void control('memory.files', {}, {
      workspaceId
    }).then(r => setFiles(flatten(list(r.files)))).catch(e => setError(String(e)));
  }, [workspaceId]);
  const open = async (path: string) => {
    setBusy(true);
    try {
      const r = await control(path === 'AGENTS.md' ? 'memory.instructions' : 'memory.read', path === 'AGENTS.md' ? {} : {
        path
      }, {
        workspaceId
      });
      if (r.isText === false) throw Error('此记忆文件不是文本');
      setContent(String(r.content ?? ''));
      setOriginal(String(r.content ?? ''));
      setSelected(path);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      await control(selected === 'AGENTS.md' ? 'memory.instructions-write' : 'memory.write', {
        ...(selected === 'AGENTS.md' ? {} : {
          path: selected
        }),
        content,
        expectedContent: original
      }, {
        workspaceId
      });
      setOriginal(content);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><h3>项目指令与自动记忆</h3><p className="muted">编辑当前项目实际使用的指令，不影响其他工作区；保存时核对原文。</p><Notice text={error} />{busy && <Busy />}<button className="setting-row" onClick={() => void open('AGENTS.md')}><span>项目 AGENTS.md</span></button>{files.map(f => <button className="setting-row" key={f.relativePath} onClick={() => void open(f.relativePath)}><span>{f.relativePath || f.name}</span></button>)}{selected && <Sheet title={selected} onClose={() => {
      if (content === original || confirm('放弃未保存的项目记忆修改？')) setSelected('');
    }} wide><Notice text={error} /><textarea className="file-editor" value={content} onChange={e => setContent(e.target.value)} aria-label="项目记忆正文" /><button className="primary full" disabled={busy || content === original} onClick={() => void save()}>保存到此工作区</button></Sheet>}</>;
}
