import React, { useEffect, useState } from 'react';
import { control, list } from './bridge';
import { Notice, Busy, Sheet } from './ui';
interface Node {
  name: string;
  relativePath: string;
  type: string;
  children?: Node[];
}
const flatten = (nodes: Node[]): Node[] => nodes.flatMap(n => n.type === 'directory' ? flatten(n.children ?? []) : [n]);
export function SkillFiles({
  workspaceId,
  slug
}: {
  workspaceId: string;
  slug: string;
}) {
  const [files, setFiles] = useState<Node[]>([]),
    [file, setFile] = useState(''),
    [content, setContent] = useState(''),
    [original, setOriginal] = useState(''),
    [expected, setExpected] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void control('skills.files', {
      slug
    }, {
      workspaceId
    }).then(r => setFiles(flatten(list(r.files)))).catch(e => setError(String(e)));
  }, [workspaceId, slug]);
  const open = async (path: string) => {
    setBusy(true);
    setError('');
    try {
      let content = '',
        offset = 0,
        revision = '';
      for (;;) {
        const r = await control('skills.asset-read', {
          slug,
          path,
          offset,
          ...(revision ? {
            revision
          } : {})
        }, {
          workspaceId
        });
        content += String(r.content);
        if (!r.hasMore) break;
        offset = Number(r.nextOffset);
        revision = String(r.revision);
      }
      const bytes = new TextEncoder().encode(content),
        sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
      setExpected(sha);
      setContent(content);
      setOriginal(content);
      setFile(path);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const bytes = new TextEncoder().encode(content);
      if (bytes.length > 10 * 1024 * 1024) throw Error('Skill 附属文件超过电脑端10MB上限');
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
      const started = await control('skills.asset-start', {
        slug,
        path: file,
        bytes: bytes.length,
        digest,
        expected
      }, {
        workspaceId
      });
      for (let at = 0, index = 0; at < bytes.length; at += 48000, index++) {
        let raw = '';
        for (const b of bytes.subarray(at, at + 48000)) raw += String.fromCharCode(b);
        await control('skills.asset-chunk', {
          slug,
          id: started.id,
          index,
          data: btoa(raw)
        }, {
          workspaceId
        });
      }
      await control('skills.asset-finish', {
        slug,
        id: started.id
      }, {
        workspaceId
      });
      setExpected(digest);
      setOriginal(content);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><Notice text={error} />{busy && <Busy />}{files.map(f => <button className="setting-row" key={f.relativePath} disabled={busy} onClick={() => void open(f.relativePath)}><span>{f.relativePath}</span></button>)}{file && <Sheet title={file} onClose={() => {
      if (content === original || confirm('放弃此附属文件未保存的修改？')) setFile('');
    }} wide><Notice text={error} /><textarea className="file-editor" aria-label="Skill 附属文件正文" value={content} onChange={e => setContent(e.target.value)} /><button className="primary full" disabled={busy} onClick={() => void save()}>核对版本并保存</button></Sheet>}</>;
}
