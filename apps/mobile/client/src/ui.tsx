import React, { useEffect, useRef } from 'react';
import { X, LoaderCircle, ChevronLeft, Folder, FolderOpen, FileCode, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { native } from './bridge';
export function IconButton({
  label,
  onClick,
  children,
  disabled = false
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>;
}
export function Busy({
  text = '正在读取…'
}: {
  text?: string;
}) {
  return <div className="loading" role="status"><LoaderCircle size={18} className="spin" />{text}</div>;
}
export function Empty({
  title,
  detail,
  children
}: {
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return <div className="empty"><FolderOpen size={34} /><h3>{title}</h3>{detail && <p>{detail}</p>}{children}</div>;
}
export function Notice({
  text,
  retry
}: {
  text: string;
  retry?: () => void;
}) {
  return text ? <div className="notice" role="status"><AlertCircle size={16} /><span>{text}</span>{retry && <button onClick={retry}>重试</button>}</div> : null;
}
export function Sheet({
  title,
  children,
  onClose,
  wide = false
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const close = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    el.addEventListener('cancel', close);
    return () => {
      el.removeEventListener('cancel', close);
      el.close();
    };
  }, []);
  return <dialog className={'sheet ' + (wide ? 'sheet-wide' : '')} ref={ref} onClick={e => {
    if (e.target === e.currentTarget) onClose();
  }}><div className="sheet-frame"><header><h2>{title}</h2><IconButton label="关闭面板" onClick={onClose}><X size={21} /></IconButton></header><div className="sheet-body">{children}</div></div></dialog>;
}
export function PageHeader({
  title,
  subtitle,
  onBack,
  actions
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return <header className="page-header">{onBack && <IconButton label="返回" onClick={onBack}><ChevronLeft /></IconButton>}<div className="page-heading"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions}</header>;
}
export function SearchBox({
  value,
  onChange,
  placeholder = '搜索'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return <label className="search-field"><Search size={17} /><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
export function PathIcon({
  directory
}: {
  directory: boolean;
}) {
  return directory ? <Folder size={18} /> : <FileCode size={18} />;
}
export function CopyButton({
  text
}: {
  text: string;
}) {
  const [done, setDone] = React.useState(false);
  return <button className="text-button" onClick={() => void native('clipboard', {
    text
  }).then(() => {
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  })}>{done ? <><CheckCircle2 size={14} />已复制</> : '复制'}</button>;
}
