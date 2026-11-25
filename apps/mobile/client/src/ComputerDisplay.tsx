import React, { useEffect, useState } from 'react';
import { control, plain, list } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice } from './ui';
export function ComputerDisplay() {
  const [themeMode, setMode] = useState('system'),
    [themeStyle, setStyle] = useState('default'),
    [typography, setTypography] = useState<RecordValue>({}),
    [activity, setActivity] = useState<RecordValue>({
      reasoning: 'balanced',
      operations: 'balanced'
    }),
    [models, setModels] = useState<RecordValue[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    void control('display.read').then(r => {
      if (alive) {
        setMode(String(r.themeMode ?? 'system'));
        setStyle(String(r.themeStyle ?? 'default'));
        setTypography(plain(r.typography));
        setActivity(plain(r.activity));
        setModels(list(r.translationModels));
      }
    }).catch(e => {
      if (alive) setError(String(e));
    }).finally(() => {
      if (alive) setBusy(false);
    });
    return () => {
      alive = false;
    };
  }, []);
  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await control('display.save', {
        themeMode,
        themeStyle,
        typography,
        activity
      });
      setSaved(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><h3>已连接电脑的外观</h3><p className="muted">这里修改桌面设置；手机阅读设置可在外观首页单独调整。</p><Notice text={error} />{busy && <Busy />}
    <label className="field">电脑主题模式<select value={themeMode} disabled={busy} onChange={e => setMode(e.target.value)}>{[['light', '浅色'], ['dark', '深色'], ['system', '跟随系统'], ['special', '特殊风格']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    {themeMode === 'special' && <label className="field">特殊风格<select value={themeStyle} onChange={e => setStyle(e.target.value)}>{[['default', '云朵舞者'], ['ocean-light', '晴空碧海'], ['ocean-dark', '深海'], ['forest-light', '森息晨光'], ['forest-dark', '夜间森林'], ['slate-light', '岩石浅色'], ['slate-dark', '岩石深色'], ['terminal-dark', '终端深色']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
    {([['uiFont', 'uiSize', '界面', 14, 11, 24], ['conversationFont', 'conversationSize', '对话', 16, 11, 32], ['codeFont', 'codeSize', '代码', 13, 10, 28]] as const).map(([font, size, label, fallback, min, max]) => <div className="settings-group" key={font}><label className="field">{label}字体<input value={String(typography[font] ?? '')} placeholder="留空沿用电脑默认字体" onChange={e => setTypography(p => ({
          ...p,
          [font]: e.target.value
        }))} /></label><label className="field">{label}字号 · {String(typography[size] ?? fallback)} px<input type="range" value={Number(typography[size] ?? fallback)} min={min} max={max} onChange={e => setTypography(p => ({
          ...p,
          [size]: Number(e.target.value)
        }))} /></label></div>)}
    {(['reasoning', 'operations'] as const).map(key => <label className="field" key={key}>{key === 'reasoning' ? '桌面推理过程' : '桌面工具与操作'}<select value={String(activity[key] ?? 'balanced')} onChange={e => setActivity(p => ({
        ...p,
        [key]: e.target.value
      }))}><option value="expanded">全部展开</option><option value="balanced">适中</option><option value="collapsed">默认折叠</option></select></label>)}
    <label className="setting-row"><span>推理中文显示<small>翻译已返回的非中文推理；原文保留，会产生所选模型 API 用量。</small></span><input type="checkbox" checked={activity.chineseReasoning === true} onChange={e => setActivity(p => ({
        ...p,
        chineseReasoning: e.target.checked
      }))} /></label>
    <label className="field">翻译模型<select value={activity.translationModel ? JSON.stringify(activity.translationModel) : ''} onChange={e => setActivity(p => {
        const next = {
          ...p
        };
        if (e.target.value) next.translationModel = JSON.parse(e.target.value);else delete next.translationModel;
        return next;
      })}><option value="">跟随当前可用模型</option>{models.map(m => <option key={String(m.channelId) + '/' + String(m.modelId)} value={JSON.stringify({
          channelId: m.channelId,
          modelId: m.modelId
        })}>{String(m.label)}</option>)}</select></label>
    <button className="primary full" disabled={busy} onClick={() => void save()}>保存电脑外观与过程设置</button>{saved && <p className="muted" role="status">已保存到电脑。</p>}
  </>;
}
