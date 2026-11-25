import React, { useEffect, useState } from 'react';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import { Sheet, Notice, Busy } from './ui';
export function SkillImport({
  workspaceId,
  onClose,
  onSaved
}: {
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [workspaces, setWorkspaces] = useState<RecordValue[]>([]),
    [source, setSource] = useState(''),
    [skills, setSkills] = useState<RecordValue[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void control('workspaces.directory').then(r => setWorkspaces(list(r.workspaces).filter(w => w.id !== workspaceId))).catch(e => setError(String(e)));
  }, [workspaceId]);
  useEffect(() => {
    if (!source) return;
    let alive = true;
    setSkills([]);
    setBusy(true);
    void control('skills.list', {}, {
      workspaceId: source
    }).then(r => {
      if (alive) setSkills(list(r.skills));
    }).catch(e => {
      if (alive) setError(String(e));
    }).finally(() => {
      if (alive) setBusy(false);
    });
    return () => {
      alive = false;
    };
  }, [source]);
  return <Sheet title="从其他工作区复制 Skill" onClose={onClose}><Notice text={error} /><label className="field">来源工作区<select value={source} onChange={e => setSource(e.target.value)}><option value="">选择工作区</option>{workspaces.map(w => <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>)}</select></label>{busy && <Busy />}{skills.map(s => <button className="setting-row" key={String(s.slug)} disabled={busy} onClick={() => {
      setBusy(true);
      void control('skills.import', {
        sourceWorkspaceId: source,
        slug: s.slug
      }, {
        workspaceId
      }).then(() => {
        onSaved();
        onClose();
      }).catch(e => setError(String(e))).finally(() => setBusy(false));
    }}><span><strong>{String(s.name)}</strong><small>{String(s.description ?? s.slug)}</small></span><span>复制</span></button>)}{source && !busy && !skills.length && <p className="muted">来源工作区没有可复制的 Skill。</p>}</Sheet>;
}
