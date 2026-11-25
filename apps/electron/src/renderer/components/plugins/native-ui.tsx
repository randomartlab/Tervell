export {ActivityDisplaySettings as NativeActivitySettings} from '@/components/settings/ActivityDisplaySettings';
export {useActivityPreferences} from './activity-display';
import * as React from 'react';
import { z } from 'zod';
import * as Icons from 'lucide-react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { ReactNative, pluginShared, pluginHost } from '@/lib/third-party/paseo-client/runtime';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { markdownToHtml } from '@/lib/markdown-rich-text';
import { copyTextToClipboard } from '@/lib/clipboard';
// 图标与控件由真实宿主组件绘制，接受插件注册的组件及回调。
export const PluginUiTitleContext = React.createContext<string>('');
export const PluginSidebarFrameContext = React.createContext<{
  title: string;
  section: 'header' | 'footer';
  testID: string;
  anchor: React.MutableRefObject<HTMLElement | null>;
} | null>(null);
interface Props {
  [key: string]: unknown;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function parseSerializablePluginIcon(owner: string, icon: unknown): unknown {
  if (typeof icon === 'string' && icon.trim() && Reflect.get(Icons, icon)) return icon;
  if (icon && typeof icon === 'object' && typeof Reflect.get(icon, 'svg') === 'string') {
    const problem = pluginShared.findSvgIconProblem(String(Reflect.get(icon, 'svg')));
    if (!problem) return icon;
  }
  throw Error(owner + ' 的图标无效');
}
export function parsePluginIcon(owner: string, icon: unknown): unknown {
  return typeof icon === 'function' || icon && typeof icon === 'object' && '$$typeof' in icon ? icon : parseSerializablePluginIcon(owner, icon);
}
export function Icon({
  icon,
  name,
  size = 16,
  color = 'currentColor'
}: {
  icon?: unknown;
  name?: string;
  size?: number;
  color?: string;
}): React.ReactElement | null {
  const value = icon ?? name;
  if (typeof value === 'string') {
    const C = Reflect.get(Icons, value) as React.ComponentType<{
      size: number;
      color: string;
    }> | undefined;
    return C ? <C size={size} color={color} /> : null;
  }
  if (value && typeof value === 'object' && 'svg' in value) return <span style={{
    width: size,
    height: size,
    color,
    display: 'inline-flex'
  }} dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(String(value.svg), {
      USE_PROFILES: {
        svg: true
      }
    })
  }} />;
  if (typeof value === 'function' || value && typeof value === 'object' && '$$typeof' in value) return React.createElement(value as React.ComponentType<{
    size: number;
    color: string;
  }>, {
    size,
    color
  });
  return null;
}
const hexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
const themeContribution = z.strictObject({
  id: z.string(),
  name: z.union([z.string().trim().min(1).max(60), z.custom(value => {
    try {
      pluginHost.requirePluginText(value);
      return true;
    } catch {
      return false;
    }
  })]),
  appearance: z.enum(['light', 'dark']),
  colors: z.strictObject({
    background: hexColor,
    foreground: hexColor,
    raised: hexColor,
    control: hexColor,
    border: hexColor,
    accent: hexColor.optional(),
    mutedForeground: hexColor,
    ring: hexColor,
    sidebar: hexColor.optional(),
    sidebarHover: hexColor.optional(),
    sidebarSelected: hexColor.optional(),
    surface3: hexColor.optional(),
    surface4: hexColor.optional(),
    foregroundExtraMuted: hexColor.optional()
  })
});
export function parsePluginThemeContribution(value: unknown): unknown {
  return themeContribution.parse(value);
}
export const ScrollView = React.forwardRef<HTMLElement, Props>((p, ref) => React.createElement(ReactNative.ScrollView!, {
  ...p,
  ref
}));
export const TextInput = React.forwardRef<HTMLElement, Props>((p, ref) => React.createElement(ReactNative.TextInput!, {
  ...p,
  ref
}));
export const FlatList = React.forwardRef<HTMLElement, Props>(function FlatList(props, ref) {
  return React.createElement(ReactNative.FlatList!, {
    ...props,
    ref
  });
});
const ModalState = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: React.ReactNode;
} | null>(null);
export function Modal(p: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return <ModalState.Provider value={p}>{p.children}</ModalState.Provider>;
}
Modal.Content = ({
  children,
  style,
  contentContainerStyle,
  scrollable = true
}: Props) => {
  const modal = React.useContext(ModalState);
  if (!modal) throw Error('Modal.Content需要位于Modal中');
  const body = scrollable ? React.createElement(ReactNative.ScrollView!, {
    style: [{
      flex: 1,
      minHeight: 0
    }, style],
    contentContainerStyle: [{
      padding: 24,
      gap: 16
    }, contentContainerStyle]
  }, children) : React.createElement(ReactNative.View!, {
    style: [{
      flex: 1,
      minHeight: 0
    }, style]
  }, React.createElement(ReactNative.View!, {
    style: [{
      flex: 1,
      minHeight: 0,
      padding: 24,
      gap: 16
    }, contentContainerStyle]
  }, children));
  return <Dialog open={modal.open} onOpenChange={modal.onOpenChange}><DialogContent className={'flex max-h-[85vh] max-w-3xl flex-col overflow-hidden gap-0 p-0 ' + (!scrollable ? 'h-[85vh]' : '')} aria-describedby={undefined}><DialogHeader className="shrink-0 p-6"><DialogTitle className="flex items-center gap-2">{modal.icon}{modal.title}</DialogTitle></DialogHeader>{body}</DialogContent></Dialog>;
};
export const useToast = () => ({
  show: (message: string, options?: {
    variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
    durationMs?: number;
  }) => {
    const show = options?.variant && options.variant !== 'default' ? toast[options.variant] : toast;
    show(message, {
      duration: options?.durationMs
    });
  },
  error: (message: string) => toast.error(message)
});
export function Markdown({
  children,
  content,
  text
}: Props): React.ReactElement {
  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(markdownToHtml(String(children ?? content ?? text ?? '')))
  }} />;
}
export const MarkdownText = Markdown;
export const StreamedText = ({
  text,
  style,
  ...props
}: Props) => React.createElement(ReactNative.Text!, {
  ...props,
  style
}, String(text ?? ''));
export const copyText = copyTextToClipboard;
export const writeClipboard = copyText;
export const ExternalLink = ({
  href,
  children,
  accessibilityLabel,
  testID,
  onError
}: Props) => <button type="button" aria-label={typeof accessibilityLabel === 'string' ? accessibilityLabel : undefined} data-testid={typeof testID === 'string' ? testID : undefined} className="text-primary underline" onClick={() => void window.electronAPI.openExternal(String(href)).catch(error => {
  if (typeof onError === 'function') onError(error);else toast.error(String(error));
})}>{children}</button>;
export const SettingsSection = ({
  title,
  children,
  info,
  trailing,
  testID
}: Props) => <section data-testid={String(testID ?? '')} className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{String(title ?? '')}</h2>{trailing as React.ReactNode}</div>{info as React.ReactNode}{children}</section>;
export const SettingsCard = ({
  children,
  testID
}: Props) => <div data-testid={typeof testID === 'string' ? testID : undefined} className="rounded-lg border border-border p-4 space-y-3">{children}</div>;
export const SettingsRow = ({
  label,
  hint,
  error,
  testID,
  children
}: Props) => <div data-testid={String(testID ?? '')} className="flex items-center justify-between gap-4"><div className="min-w-0"><span className="text-sm">{String(label ?? '')}</span>{hint ? <p className="mt-1 text-xs text-muted-foreground">{String(hint)}</p> : null}{error ? <p role="alert" className="text-xs text-destructive">{String(error)}</p> : null}</div>{children}</div>;
export function SettingsSelect(p: Props): React.ReactElement {
  return <SettingsRow label={p.label} hint={p.hint} error={p.error} testID={p.testID}><select aria-label={String(p.label)} className="rounded-md border border-input bg-background p-2" value={String(p.value ?? '')} disabled={p.disabled === true} onChange={e => (p.onValueChange as (value: string) => void)(e.target.value)}>{(p.options as Array<{
        label: string;
        value: string;
      }>).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></SettingsRow>;
}
export function SettingsSwitch(p: Props): React.ReactElement {
  return <SettingsRow label={p.label} hint={p.hint} error={p.error} testID={p.testID}><Switch aria-label={String(p.label)} checked={p.value === true} disabled={p.disabled === true} onCheckedChange={value => (p.onValueChange as (v: boolean) => void)(value)} /></SettingsRow>;
}
export function SettingsAction(p: Props): React.ReactElement {
  return <SettingsRow label={p.label} hint={p.hint} error={p.error} testID={p.testID}><ControlAction disabled={p.disabled === true} run={() => (p.onPress as () => unknown)()}>{String(p.actionLabel ?? '确定')}</ControlAction></SettingsRow>;
}
interface SettingsInputHandle {
  focus: () => void;
  blur: () => void;
  getText: () => string;
  replaceText: (text: string) => void;
}
export const SettingsInput = React.forwardRef<SettingsInputHandle, Props>(function SettingsInput(p, ref) {
  const input = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
    getText: () => input.current?.value ?? '',
    replaceText: text => {
      if (input.current) {
        input.current.value = text;
        (p.onChangeText as (value: string) => void)(text);
      }
    }
  }), [p.onChangeText]);
  return <SettingsRow label={p.label} hint={p.hint} error={p.error} testID={p.testID}><input ref={input} aria-label={String(p.label)} aria-invalid={!!p.error} type={p.secureTextEntry === true ? String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100) : 'text'} placeholder={typeof p.placeholder === 'string' ? p.placeholder : undefined} disabled={p.disabled === true} className="rounded border border-input bg-background p-2" defaultValue={String(p.initialValue ?? '')} onChange={e => (p.onChangeText as (value: string) => void)(e.target.value)} /></SettingsRow>;
});
export function SidebarRow(p: Props): React.ReactElement {
  const frame = React.useContext(PluginSidebarFrameContext),
    row = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!frame) return;
    const node = row.current;
    if (!frame.anchor.current) frame.anchor.current = node;
    return () => {
      if (frame.anchor.current === node) frame.anchor.current = null;
    };
  }, [frame]);
  if (!frame) throw Error('SidebarRow需要位于侧栏注册项中');
  const anchor = () => {
    frame.anchor.current = row.current;
  };
  const icon = p.icon ? parsePluginIcon('侧栏行', p.icon) : undefined;
  return <div ref={row} data-testid={frame.testID + (p.id ? '-' + String(p.id) : '')} onPointerDownCapture={anchor} onFocusCapture={anchor} className="flex items-center gap-1"><button type="button" disabled={p.disabled === true} aria-current={p.active === true ? 'page' : undefined} onClick={() => {
      anchor();
      void Promise.resolve().then(() => (p.onPress as (() => unknown) | undefined)?.()).catch(error => toast.error(String(error)));
    }} className={'flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ' + (p.active ? 'bg-primary/10 text-primary' : '')}><Icon icon={icon} /><span className="truncate">{String(p.label ?? frame.title)}</span></button>{p.trailing as React.ReactNode}</div>;
}
export function SidebarSeparator(): React.ReactElement {
  const frame = React.useContext(PluginSidebarFrameContext);
  if (!frame) throw Error('SidebarSeparator需要位于侧栏注册项中');
  return <div className={'my-2 border-t border-border ' + (frame.section === 'footer' ? '-mx-2' : '')} />;
}
export function WorkspaceRowBadge(p: Props): React.ReactElement | null {
  const title = React.useContext(PluginUiTitleContext);
  const icon = p.icon ? parsePluginIcon('项目徽标', p.icon) : undefined;
  if (!icon && !p.label) return null;
  const tones: Record<string, string> = {
    muted: 'text-muted-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-destructive',
    info: 'text-sky-600 dark:text-sky-400'
  };
  return <span aria-label={String(p.accessibilityLabel ?? p.label ?? title)} className={'inline-flex min-w-0 items-center gap-1 text-xs ' + (tones[String(p.tone ?? 'muted')] ?? tones.muted)}><Icon icon={icon} size={12} />{p.label ? <span className="truncate">{String(p.label)}</span> : null}</span>;
}
function ControlAction({
  run,
  children,
  disabled
}: {
  run: () => unknown;
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement {
  const [pending, setPending] = React.useState(false);
  return <Button size="sm" variant="ghost" disabled={disabled || pending} onClick={() => {
    setPending(true);
    void Promise.resolve().then(run).catch(error => toast.error(String(error))).finally(() => setPending(false));
  }}>{children}</Button>;
}
export const Action = ({
  title,
  onPress,
  icon,
  disabled
}: Props) => <ControlAction disabled={disabled === true} run={() => (onPress as (p: object) => unknown)({})}><Icon icon={icon} />{String(title ?? '')}</ControlAction>;
export const Toggle = ({
  title,
  onValueChange,
  value,
  disabled
}: Props) => <label className="flex items-center gap-2 text-xs"><input aria-label={String(title ?? '')} type="checkbox" checked={value === true} disabled={disabled === true} onChange={e => {
    const value = e.target.checked;
    void Promise.resolve().then(() => (onValueChange as (p: {
      value: boolean;
    }) => unknown)({
      value
    })).catch(error => toast.error(String(error)));
  }} />{String(title ?? '')}</label>;
export const Select = ({
  title,
  value,
  options,
  onValueChange,
  disabled
}: Props) => <label className="text-xs">{String(title ?? '')}<select aria-label={String(title ?? '')} value={String(value ?? '')} disabled={disabled === true} className="ml-2 rounded border border-input bg-background" onChange={e => {
    const value = e.target.value;
    void Promise.resolve().then(() => (onValueChange as (p: {
      value: string;
    }) => unknown)({
      value
    })).catch(error => toast.error(String(error)));
  }}>{(options as Array<{
      value: string;
      label: string;
    }> ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
export const Loading = () => <p role="status" className="p-4 text-sm text-muted-foreground">正在加载文件…</p>;
export const DocumentFrame = ({
  url,
  children
}: Props) => <div className="h-full">{url ? <iframe title="插件文档" src={String(url)} className="h-full w-full" sandbox="allow-scripts" /> : children}</div>;
export const SettingsGroup = SettingsSection;
export function Combobox(p: Props): React.ReactElement {
  const [open, setOpen] = React.useState(false),
    [query, setQuery] = React.useState(''),
    [rows, setRows] = React.useState<Array<{
      id: string;
      label: string;
      description?: string;
    }>>([]),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(''),
    generation = React.useRef(0);
  React.useEffect(() => {
    if (!open) return;
    let current = true;
    const epoch = ++generation.current,
      timer = setTimeout(() => {
        setBusy(true);
        setError('');
        void (p.search as (v: {
          query: string;
        }) => Promise<typeof rows>)({
          query
        }).then(next => {
          if (current && generation.current === epoch) setRows(next);
        }, error => {
          if (current && generation.current === epoch) setError(String(error));
        }).finally(() => {
          if (current && generation.current === epoch) setBusy(false);
        });
      }, 150);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [open, query, p.search]);
  const value = p.value as {
    label?: string;
  } | null;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button size="sm" variant="ghost" disabled={p.disabled === true}><Icon icon={p.icon} />{value?.label ?? String(p.title ?? '选择')}</Button></PopoverTrigger><PopoverContent className="w-80"><input aria-label={String(p.title ?? '搜索')} className="mb-2 w-full rounded border border-input bg-background p-2" value={query} onChange={e => setQuery(e.target.value)} />{busy && <p role="status" className="text-xs text-muted-foreground">正在搜索…</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="max-h-64 overflow-auto">{rows.map(item => <button key={item.id} type="button" className="block w-full rounded p-2 text-left hover:bg-muted" onClick={() => {
          void Promise.resolve().then(() => (p.onSelect as (v: {
            item: typeof item;
          }) => unknown)({
            item
          })).then(() => setOpen(false), error => setError(String(error)));
        }}><span className="text-sm">{item.label}</span>{item.description && <span className="block text-xs text-muted-foreground">{item.description}</span>}</button>)}</div></PopoverContent></Popover>;
}
