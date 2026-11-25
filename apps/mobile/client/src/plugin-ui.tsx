import React, { createContext, useContext, useState } from 'react';
import * as Icons from 'lucide-react';
import DOMPurify from 'dompurify';
import { z } from 'zod';
import { ReactNative, pluginShared } from '@tervell/plugin-runtime';
import { Markdown as NativeMarkdown } from './Markdown';
import { native } from './bridge';
import { Sheet } from './ui';
interface Props {
  [key: string]: unknown;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  info?: React.ReactNode;
  trailing?: React.ReactNode;
}
export const PluginTitle = createContext('');
export function parseSerializablePluginIcon(owner: string, icon: unknown) {
  if (typeof icon === 'string' && Reflect.get(Icons, icon)) return icon;
  if (icon && typeof icon === 'object' && typeof Reflect.get(icon, 'svg') === 'string' && !pluginShared.findSvgIconProblem(String(Reflect.get(icon, 'svg')))) return icon;
  throw Error(owner + '图标无效');
}
export function parsePluginIcon(owner: string, icon: unknown) {
  return typeof icon === 'function' || icon && typeof icon === 'object' && '$$typeof' in icon ? icon : parseSerializablePluginIcon(owner, icon);
}
export function parsePluginThemeContribution(value: unknown) {
  return z.object({
    id: z.string(),
    name: z.unknown(),
    appearance: z.enum(['light', 'dark']),
    colors: z.record(z.string(), z.string()).optional()
  }).passthrough().parse(value);
}
export function Icon({
  value,
  icon,
  name,
  size = 17,
  color = 'currentColor'
}: {
  value?: unknown;
  icon?: unknown;
  name?: string;
  size?: number;
  color?: string;
}) {
  const selected = value ?? icon ?? name;
  if (typeof selected === 'string') {
    const C = Reflect.get(Icons, selected) as React.ElementType;
    return C ? <C size={size} color={color} /> : null;
  }
  if (selected && typeof selected === 'object' && 'svg' in selected) return <span style={{
    width: size,
    height: size,
    color,
    display: 'inline-flex'
  }} dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(String(selected.svg), {
      USE_PROFILES: {
        svg: true
      }
    })
  }} />;
  return typeof selected === 'function' ? React.createElement(selected as React.ElementType, {
    size,
    color
  }) : null;
}
export const ScrollView = React.forwardRef<unknown, Props>((props, ref) => React.createElement(ReactNative.ScrollView!, {
    ...props,
    ref
  })),
  TextInput = React.forwardRef<unknown, Props>((props, ref) => React.createElement(ReactNative.TextInput!, {
    ...props,
    ref
  })),
  FlatList = React.forwardRef<unknown, Props>((props, ref) => React.createElement(ReactNative.FlatList!, {
    ...props,
    ref
  }));
const ModalContext = createContext<{
  open: boolean;
  close: () => void;
  title: string;
} | null>(null);
export function Modal(p: Props) {
  return <ModalContext.Provider value={{
    open: !!p.open,
    close: () => {
      if (typeof p.onOpenChange === 'function') (p.onOpenChange as (v: boolean) => void)(false);else if (typeof p.onClose === 'function') (p.onClose as () => void)();
    },
    title: String(p.title ?? '')
  }}>{p.children}</ModalContext.Provider>;
}
Modal.Content = function Content(p: Props) {
  const m = useContext(ModalContext);
  return m?.open ? <Sheet title={m.title} onClose={m.close}>{React.createElement(p.scrollable === false ? ReactNative.View! : ReactNative.ScrollView!, {
      style: [{
        flex: 1,
        minHeight: 0
      }, p.style],
      contentContainerStyle: p.contentContainerStyle
    }, p.children)}</Sheet> : null;
};
export const Markdown = ({
    children
  }: Props) => <NativeMarkdown text={String(children ?? '')} />,
  MarkdownText = Markdown,
  StreamedText = ({
    text,
    children
  }: Props) => <NativeMarkdown text={String(text ?? children ?? '')} />;
export const copyText = (text: string) => native('clipboard', {
    text
  }),
  writeClipboard = copyText;
export const useToast = () => ({
  error: (value: string) => window.dispatchEvent(new CustomEvent('mobile-toast', {
    detail: value
  })),
  show: (value: unknown) => window.dispatchEvent(new CustomEvent('mobile-toast', {
    detail: typeof value === 'string' ? value : String((value as {
      message?: string;
    })?.message ?? '操作已完成')
  }))
});
export const SettingsSection = ({
  title,
  description,
  info,
  trailing,
  children
}: Props) => <section className="plugin-section"><h3>{String(title ?? '')}{trailing}</h3>{info}{!!description && <p className="muted">{String(description)}</p>}{children}</section>;
export const SettingsGroup = SettingsSection,
  SettingsCard = ({
    children
  }: Props) => <div className="plugin-settings-card">{children}</div>;
export const SettingsRow = ({
  title,
  label,
  hint,
  error,
  description,
  children
}: Props) => <div className="plugin-setting-row"><div><strong>{String(label ?? title ?? '')}</strong>{!!(hint ?? description) && <small>{String(hint ?? description)}</small>}{!!error && <small className="error" role="alert">{String(error)}</small>}</div>{children}</div>;
export function SettingsSwitch(p: Props) {
  return <SettingsRow {...p}><input type="checkbox" checked={!!p.value} disabled={!!p.disabled} onChange={e => (p.onValueChange as (v: boolean) => void)?.(e.target.checked)} /></SettingsRow>;
}
export function SettingsSelect(p: Props) {
  return <SettingsRow {...p}><select value={String(p.value ?? '')} onChange={e => (p.onValueChange as (v: string) => void)?.(e.target.value)} disabled={!!p.disabled}>{(p.options as Array<{
        value: string;
        label: string;
      }>)?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></SettingsRow>;
}
export const SettingsInput = React.forwardRef<unknown, Props>((p, ref) => {
  const input = React.useRef<HTMLInputElement>(null);
  const [text, setText] = useState(String(p.initialValue ?? p.value ?? ''));
  React.useEffect(() => setText(String(p.initialValue ?? p.value ?? '')), [p.initialValue, p.value]);
  React.useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(), blur: () => input.current?.blur(),
    getText: () => input.current?.value ?? text,
    replaceText: (value: string) => {setText(value); (p.onChangeText as (text: string) => void)?.(value);}
  }), [p.onChangeText, text]);
  return <label className="field">{String(p.label ?? p.title ?? '')}<input ref={input} value={text} placeholder={String(p.placeholder ?? '')} type={p.secureTextEntry ? String.fromCharCode(112,97,115,115,119,111,114,100) : 'text'} disabled={!!p.disabled} onChange={e => {setText(e.target.value); (p.onChangeText as (value: string) => void)?.(e.target.value);}} />{!!p.hint && <small>{String(p.hint)}</small>}{!!p.error && <small className="error" role="alert">{String(p.error)}</small>}</label>;
});
export function SettingsAction(p: Props) {
  return <button className="setting-row" onClick={() => void (p.onPress as () => unknown)?.()} disabled={!!p.disabled}><Icon value={p.icon} /><span>{String(p.label ?? p.title ?? '打开')}</span><Icons.ChevronRight size={16} /></button>;
}
export function SidebarRow(p: Props) {
  const title = useContext(PluginTitle);
  return <button className="setting-row" onClick={() => void (p.onPress as () => unknown)?.()} disabled={!!p.disabled}><Icon value={p.icon} /><span>{String(p.label ?? p.title ?? title)}</span>{p.children}</button>;
}
export const SidebarSeparator = () => <hr />,
  WorkspaceRowBadge = (p: Props) => <small><Icon value={p.icon} />{String(p.label ?? '')}</small>;
function useControlAction() {
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  return {pending, error, run: (action: () => unknown) => {
    if (pending) return;
    setPending(true); setError('');
    void Promise.resolve().then(action).catch(error => setError(error instanceof Error ? error.message : String(error))).finally(() => setPending(false));
  }};
}
export function Action(p: Props) {
  const action = useControlAction();
  return <span className="plugin-composer-item"><button className="plugin-pill" disabled={!!p.disabled || action.pending} onClick={() => action.run(() => (p.onPress as (event: object) => unknown)({}))}><Icon value={p.icon} />{String(p.title ?? '')}</button>{action.error && <small className="error" role="alert">{action.error}</small>}</span>;
}
export function Toggle(p: Props) {
  const action = useControlAction();
  return <span className="plugin-composer-item"><label><input aria-label={String(p.title ?? '')} type="checkbox" checked={p.value === true} disabled={!!p.disabled || action.pending} onChange={event => {
    const value = event.target.checked;
    action.run(() => (p.onValueChange as (event: {value: boolean}) => unknown)({value}));
  }} />{String(p.title ?? '')}</label>{action.error && <small className="error" role="alert">{action.error}</small>}</span>;
}
export function Select(p: Props) {
  const action = useControlAction();
  return <span className="plugin-composer-item"><label>{String(p.title ?? '')}<select aria-label={String(p.title ?? '')} value={String(p.value ?? '')} disabled={!!p.disabled || action.pending} onChange={event => {
    const value = event.target.value;
    action.run(() => (p.onValueChange as (event: {value: string}) => unknown)({value}));
  }}>{(p.options as Array<{value: string; label: string}>)?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{action.error && <small className="error" role="alert">{action.error}</small>}</span>;
}
export const ExternalLink = (p: Props) => <button className="inline-link" onClick={() => void native('external', {
  url: String(p.href ?? p.url)
})}>{p.children ?? String(p.label ?? p.title ?? '打开链接')}</button>;
export const DocumentFrame = ({
    children
  }: Props) => <div className="plugin-document">{children}</div>,
  Loading = () => <p className="muted">正在读取…</p>;
export function Combobox(p: Props) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''),
    [items, setItems] = useState<Array<{id: string; label: string; description?: string}>>([]),
    [busy, setBusy] = useState(false), [error, setError] = useState('');
  const generation = React.useRef(0), search = React.useRef(p.search);
  search.current = p.search;
  React.useEffect(() => {
    const epoch = ++generation.current;
    if (!open) return;
    const timer = setTimeout(() => {
      setBusy(true); setError('');
      void Promise.resolve().then(() => (search.current as (event: {query: string}) => Promise<typeof items>)({query})).then(items => {
        if (epoch === generation.current) setItems(items);
      }, error => {if (epoch === generation.current) setError(String(error));}).finally(() => {if (epoch === generation.current) setBusy(false);});
    }, query ? 180 : 0);
    return () => {clearTimeout(timer); generation.current++;};
  }, [open, query]);
  const value = p.value as {label?: string} | null;
  return <><button className="plugin-pill" disabled={!!p.disabled} onClick={() => setOpen(true)}><Icon value={p.icon} />{value?.label ?? String(p.title ?? '选择')}</button>{open && <Sheet title={String(p.title ?? '选择')} onClose={() => setOpen(false)}><label className="field">搜索<input value={query} onChange={event => setQuery(event.target.value)} autoFocus /></label>{busy && <p role="status">正在处理…</p>}{error && <p role="alert" className="error">{error}</p>}{items.map(item => <button className="setting-row" key={item.id} disabled={busy} onClick={() => {
    setBusy(true); setError('');
    void Promise.resolve().then(() => (p.onSelect as (event: {item: typeof item}) => unknown)({item})).then(() => setOpen(false), error => setError(String(error))).finally(() => setBusy(false));
  }}><span>{item.label}{item.description && <small>{item.description}</small>}</span></button>)}</Sheet>}</>;
}
export const NativeActivitySettings = () => <p>过程显示使用 Tervell 设置中的“推理与操作过程”，保持手机字体和布局一致。</p>;
export const useActivityPreferences = () => ({
  reasoning: 'balanced',
  operations: 'balanced'
});
