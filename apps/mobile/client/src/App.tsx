import {AnnotationProvider,AnnotationDrafts} from './Annotations';
import type {AnnotationContext} from './Annotations';
import {ConnectionIntent} from './connection-intent';
import {exportMobileText} from './export-file';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScanLine, Menu, Plus, Search, Settings as SettingsIcon, MessageSquare, FolderOpen, ShieldCheck, ArrowUp, Square, Paperclip, Mic, ChevronDown, MoreHorizontal, Files, SquareTerminal, GitFork, Download, Archive, Pin, Trash2, ArrowDown, Wifi, Check, LoaderCircle, Send, X, Server, RefreshCw, LayoutGrid, Puzzle } from 'lucide-react';
import { native, request, control, list, plain, readable } from './bridge';
import type { RecordValue } from './bridge';
import type { Session, Workspace, TimelineEntry, Timeline, Cursor, Activity, LocalSettings, Catalog, Action } from './model';
import { groupedSessions, mergeEntries } from './model';
import { Entry, LiveProcesses } from './Timeline';
import { FilePanel, TerminalPanel, ApprovalPanel, ActionForm } from './Panels';
import {Browser} from './Browser';
import {ProjectFiles} from './ProjectFiles';
import {Chats} from './Chats';
import { SessionSettings } from './SessionSettings';
import { Settings } from './Settings';
import {Workspaces,WorkspaceCreator} from './Workspaces';
import { Sheet, Busy, Notice, Empty, SearchBox, IconButton, PageHeader } from './ui';
import { Markdown } from './Markdown';
import { PluginBrowser, updateMobilePluginContext, MobilePluginControls, MobileComposerItems, MobileResourcePicker, stopMobilePlugins, submitMobilePluginSlash, MobileSlashHints } from './Plugins';
import {withPluginResource, pluginResourceText} from './plugin-resources';
import type {ComposerAttachment} from './plugin-resources';
import {mobileSendIdentity} from './send-identity';
const defaults: LocalSettings = {
  theme: 'system',
  uiSize: 14,
  bodySize: 16,
  codeSize: 13,
  reasoning: 'balanced',
  tools: 'balanced'
};
function loadPrefs(): LocalSettings {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem('tervell-mobile-preferences') ?? '{}')
    };
  } catch {
    return defaults;
  }
}
function Logo() {
  return <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true"><path fill="currentColor" d="M19 43C19 32 25 26 36 23L79 12C83 11 86 13 85 17L83 27C81 35 77 38 69 40L31 50C24 52 19 56 19 60ZM19 60C19 55 24 52 31 50L44 47V83L27 68C22 64 19 63 19 60ZM49 47L66 57C72 60 75 65 75 73V92C75 96 73 97 69 95L59 89C55 86 52 83 49 80Z" /></svg>;
}
interface Snapshot {
  messages: unknown[];
  liveText: string;
  liveActivity: Activity[];
  running: boolean;
  unchanged?: boolean;
  revision: string;
  hasOlder: boolean;
}
export function MobileApp() {
  const annotationRef=useRef<AnnotationContext>();
  const connectionIntent=useRef(new ConnectionIntent());
  const [hostId, setHostId] = useState(''),
    [draftScope, setDraftScope] = useState('');
  const [prefs, setPrefs] = useState(loadPrefs),
    [connected, setConnected] = useState(false),
    [recovering, setRecovering] = useState(false),
    [booting, setBooting] = useState(true),
    [pairing, setPairing] = useState(false),
    [link, setLink] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [transport, setTransport] = useState('正在连接'),
    [view, setView] = useState<'sessions' | 'chat' | 'tasks' | 'approvals' | 'settings' | 'projects' | 'directChat'>('sessions'),
    [drawer, setDrawer] = useState(false),
    [sheet, setSheet] = useState(''),
    [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [project, setProject] = useState(''),
    [sessions, setSessions] = useState<Session[]>([]),
    [query, setQuery] = useState(''),
    [session, setSession] = useState<Session>(),
    [entries, setEntries] = useState<TimelineEntry[]>([]),
    [cursor, setCursor] = useState<Cursor | null>(null),
    [hasOlder, setHasOlder] = useState(false),
    [snapshot, setSnapshot] = useState<Snapshot>(),
    [loading, setLoading] = useState(false),
    [draft, setDraft] = useState(''),
    [attachments, setAttachments] = useState<ComposerAttachment[]>([]),
    [sessionDetail, setSessionDetail] = useState<RecordValue>({}),
    [catalog, setCatalog] = useState<Catalog>({
      management: false,
      actions: []
    }),
    [action, setAction] = useState<Action>(),
    [approvalCount, setApprovalCount] = useState(0),
    [queue, setQueue] = useState<RecordValue[]>([]),
    [newWorkspace, setNewWorkspace] = useState(false),
    [annotationCount,setAnnotationCount]=useState(0),
    [historyRows, setHistoryRows] = useState<RecordValue[]>([]),
    [exportContent, setExportContent] = useState(''),
    [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');
  const loadedDraft = useRef('');
  useEffect(() => {
    const toast = (event: Event) => {
      const value = String((event as CustomEvent<unknown>).detail ?? '').slice(0, 2000);
      if (value) setNotice(value);
    };
    const openTerminal = () => {
      if (!activeId.current) return;
      setView('chat');
      setSheet('terminal');
    };
    const openProject = (event: Event) => {
      const id = String((event as CustomEvent<{id: string}>).detail?.id ?? '');
      if (!workspaces.some(w => w.id === id)) return;
      setProject(id);
      setView('sessions');
      setSheet('');
    };
    window.addEventListener('mobile-open-terminal', openTerminal);
    window.addEventListener('mobile-open-project', openProject);
    window.addEventListener('mobile-toast', toast);
    return () => {
      window.removeEventListener('mobile-open-terminal', openTerminal);
      window.removeEventListener('mobile-open-project', openProject);
      window.removeEventListener('mobile-toast', toast);
    };
  }, [workspaces]);
  const viewport = useRef<HTMLDivElement>(null),
    follow = useRef(true),
    [newContent, setNewContent] = useState(false),
    pollBusy = useRef(false),
    revision = useRef(''),
    activeId = useRef(''),
    fileInput = useRef<HTMLInputElement>(null),
    draftRef = useRef(draft),
    entryCursor = useRef<Cursor | null>(null),
    messageId = useRef<{
      text: string;
      id: string;
    }>(),
    requestCount = useRef(0),
    [requestStatus, setRequestStatus] = useState('');
  useEffect(() => {
    updateMobilePluginContext({
      sessions,
      workspaces,
      sessionId: session?.id,
      detail: sessionDetail,
      attachments,
      addResource: (pluginId, sourceId, item) => setAttachments(withPluginResource(attachments, pluginId, sourceId, item)),
      removeResource: (pluginId, sourceId, itemId) => setAttachments(all => all.filter(row => row.pluginId !== pluginId || row.sourceId !== sourceId || row.item?.id !== itemId)),
      refreshDetail: async () => {
        const id = activeId.current;
        if (!id) return;
        const detail = await control('session.detail', {}, {sessionId: id});
        if (activeId.current === id) setSessionDetail(detail);
      },
      draft,
      setDraft,
      openSession: id => {
        const next = sessions.find(s => s.id === id);
        if (next) openSession(next);
      }
    });
  }, [sessions, workspaces, session?.id, draft, sessionDetail, attachments]);
  draftRef.current = draft;
  activeId.current = session?.id ?? '';
  const updatePreferences = (v: LocalSettings) => {
    setPrefs(v);
    localStorage.setItem('tervell-mobile-preferences', JSON.stringify(v));
  };
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)'),
      apply = () => {
        document.documentElement.dataset.theme = prefs.theme === 'system' ? media.matches ? 'dark' : 'light' : prefs.theme;
        void native('ui.theme', {dark: document.documentElement.dataset.theme === 'dark'}).catch(() => {});
        document.documentElement.style.setProperty('--ui-size', prefs.uiSize + 'px');
        document.documentElement.style.setProperty('--body-size', prefs.bodySize + 'px');
        document.documentElement.style.setProperty('--code-size', prefs.codeSize + 'px');
      };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [prefs]);
  const work = async <T,>(job: () => Promise<T>, label = '正在处理…'): Promise<T | undefined> => {
    setError('');
    setRequestStatus(label);
    requestCount.current++;
    setBusy(true);
    try {
      return await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作未完成');
      return undefined;
    } finally {
      requestCount.current--;
      setBusy(requestCount.current > 0);
      setRequestStatus('');
    }
  };
  const refreshDirectory = async (isCurrent:()=>boolean=()=>true) => {
    const status = await request('status'),projects=list<Workspace>(status.workspaces),all:Session[]=[];
    // 多工作区一次读取，不按项目逐个产生公网往返。
    try {const directory=await control('sessions.directory');all.push(...list<Session>(directory.sessions));}
    catch {for(const workspace of projects){const directory=await control('workspace.mobile',{}, {workspaceId:workspace.id});all.push(...list<Session>(directory.sessions));}}
    if(!isCurrent())return status;
    const state = await native('state');
    if(!isCurrent())return status;
    setWorkspaces(projects);
    setSessions(all);
    setTransport(String(state.transport ?? '已连接'));
    setHostId(String(state.hostId ?? ''));
    setConnected(true);
    return status;
  };
  const initialize = async () => {
    const epoch=connectionIntent.current.recovery(),isCurrent=()=>connectionIntent.current.current(epoch);
    setBooting(true);
    setError('');
    try {
      const state = await native('state');
      if(!isCurrent())return;
      if (state.confirmed) {
        setRecovering(true);
        setPairing(false);
        setHostId(String(state.hostId ?? ''));
        await refreshDirectory(isCurrent);
        if(!isCurrent())return;
        const c = await control<Catalog>('catalog');
        if(!isCurrent())return;
        setCatalog(c);
        setPairing(false);
        setRecovering(false);
      } else {setRecovering(false); setPairing(true);}
    } catch (e) {
      if(isCurrent())setError(e instanceof Error ? e.message : String(e));
    } finally {
      if(isCurrent())setBooting(false);
    }
  };
  useEffect(() => {
    const offer=(value:string)=>{connectionIntent.current.pairing();setLink(value);setPairing(true);setRecovering(false);setBooting(false);setDrawer(false);};
    window.__tervellIncomingPairing = offer;
    void native<string>('ui.ready').then(value => {
      if(value)offer(value);else void initialize();
    }).catch(e=>{setError(String(e));setBooting(false);setPairing(true);});
    return () => {
      delete window.__tervellIncomingPairing;
    };
  }, []);
  useEffect(() => {
    window.__tervellBack = () => {
      if (action) {
        setAction(undefined);
        return true;
      }
      if (sheet) {
        setSheet('');
        return true;
      }
      if (drawer) {
        setDrawer(false);
        return true;
      }
      if (pairing && connected) {
        setPairing(false);
        return true;
      }
      if (view !== 'sessions') {
        setView('sessions');
        return true;
      }
      return false;
    };
    return () => {
      delete window.__tervellBack;
    };
  }, [action, sheet, drawer, pairing, connected, view]);
  React.useLayoutEffect(() => {
    if (session) {
      loadedDraft.current = '';
      try {
        setDraft(localStorage.getItem('draft:' + hostId + ':' + session.id) ?? '');
        setAttachments(JSON.parse(localStorage.getItem('attachments:' + hostId + ':' + session.id) ?? '[]'));
      } catch {
        setDraft('');
        setAttachments([]);
      }
      loadedDraft.current = hostId + ':' + session.id;
      setDraftScope(loadedDraft.current);
    }
  }, [session?.id, hostId]);
  useEffect(() => {
    if (session && activeId.current === session.id && draftScope === hostId + ':' + session.id) {
      localStorage.setItem('draft:' + hostId + ':' + session.id, draft);
      localStorage.setItem('attachments:' + hostId + ':' + session.id, JSON.stringify(attachments));
    }
  }, [draft, attachments, session?.id, hostId, draftScope]);
  const loadTimeline = async (id: string, older = false) => {
    setLoading(true);
    try {
      const page = await control<Timeline>('session.timeline', {
        direction: older ? 'before' : 'tail',
        limit: 40,
        ...(older && cursor ? {
          cursor
        } : {})
      }, {
        sessionId: id
      });
      if (activeId.current !== id) return;
      setEntries(all => mergeEntries(older ? all : [], page.entries, !older || page.reset));
      if (!older) entryCursor.current = page.endCursor;
      if (!older || page.entries.length) setCursor(page.startCursor);
      setHasOlder(page.hasOlder);
    } catch (e) {
      if (activeId.current === id) setError(String(e));
    } finally {
      setLoading(false);
    }
  };
  const openSession = (next: Session) => {
    setSession(next);
    activeId.current = next.id;
    entryCursor.current = null;
    setEntries([]);
    setSnapshot(undefined);
    revision.current = '';
    setView('chat');
    setDrawer(false);
    setSheet('');
    follow.current = true;
    setNewContent(false);
    void work(async () => {
      await loadTimeline(next.id);
      await control('session.mobile-read', {}, {
        sessionId: next.id
      });
      const d = await control('session.detail', {}, {
        sessionId: next.id
      });
      if (activeId.current === next.id) setSessionDetail(d);
    }, '正在打开会话…');
  };
  const connectPairing = async (value: string) => {
    if (!value.trim() || busy) return;
    await work(async () => {
      const preview = await native('pair.preview', {
        link: value
      });
      setLink(value);
      if (!confirm('确认连接这台电脑？\n' + String(preview.service) + '\n电脑身份：' + String(preview.hostHint) + '\n只信任你本人刚刚生成的二维码或链接。')) return;
      await native('pair', {
        link: value
      });
      await stopMobilePlugins();
      setLink('');
      setPairing(false);
      setSession(undefined);
      setView('sessions');
      await initialize();
    }, '正在核对身份并建立连接…');
  };
  const scanPairing = async () => {
    setError('');
    try {
      const value = await native<string>('scan');
      if (value) await connectPairing(value);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };
  const refreshActive = async () => {
    const id = activeId.current;
    if (!id || pollBusy.current || pairing || view !== 'chat' || document.hidden || ['files', 'terminal', 'plugins','browser'].includes(sheet)) return;
    pollBusy.current = true;
    try {
      const data = await request<Snapshot>('messages', {
        sessionId: id,
        ...(revision.current ? {
          knownRevision: revision.current
        } : {})
      });
      if (activeId.current !== id) return;
      if (!data.unchanged) {
        revision.current = data.revision;
        setSnapshot(data);
        void control('session.detail',{}, {sessionId:id}).then(detail=>{if(activeId.current===id)setSessionDetail(detail);}).catch(()=>{});
        const page = await control<Timeline>('session.timeline', {
          direction: 'tail',
          limit: 40,
          ...(entryCursor.current ? {
            cursor: entryCursor.current
          } : {})
        }, {
          sessionId: id
        });
        if (activeId.current === id) {
          setEntries(all => mergeEntries(all, page.entries, !!(page.reset || all[0] && entryCursor.current?.epoch !== page.epoch)));
          if (page.reset) {
            setCursor(page.startCursor);
            setHasOlder(page.hasOlder);
          }
          entryCursor.current = page.endCursor;
          if (!follow.current) setNewContent(true);
        }
      }
      const state = await native('state');
      setTransport(String(state.transport));
    } catch (e) {
      setError(String(e));
    } finally {
      pollBusy.current = false;
    }
  };
  useEffect(() => {
    if (view === 'chat' && session) void refreshActive();
    const t = setInterval(() => {
      if (requestCount.current) return;
      if (view === 'chat') void refreshActive();else if (connected && !pairing && !document.hidden) void refreshDirectory().catch(e => setError(String(e)));
    }, view === 'chat' ? 1300 : 7000);
    return () => clearInterval(t);
  }, [view, session?.id, pairing, connected, sheet]);
  useEffect(() => {
    if (!connected || pairing) return;
    let alive = true;
    const read = () => document.hidden ? Promise.resolve() : request('approvals').then(r => {
      if (alive) setApprovalCount(list(r.approvals).length);
    }).catch(() => {});
    void read();
    const t = setInterval(() => void read(), 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [connected, pairing]);
  useEffect(() => {
    if (follow.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [entries, snapshot?.liveText, snapshot?.liveActivity]);
  const send = async () => {
    if (!session || busy || !draft.trim() && !attachments.length && !annotationCount) return;
    const submitted = draft,
      assets = attachments,
      annotationsController=annotationRef.current,
      id = session.id;
    await work(async () => {
      const markers: string[] = [];
      for (const asset of assets) {
        if (asset.item && !asset.prepared) {
          const file = new File([pluginResourceText(asset.item)], 'plugin-resource-' + crypto.randomUUID() + '.md', {type: 'text/markdown'});
          const uploaded = await uploadFile(file, id);
          markers.push(uploaded.marker);
          if (activeId.current === id) setAttachments(all => all.map(row => row === asset ? {...row, marker: uploaded.marker, prepared: true} : row));
        } else markers.push(asset.marker);
      }
      const submittedAnnotations=annotationsController?.id===id?await annotationsController.prepareSubmission():undefined;
      const text = [...markers, submitted,submittedAnnotations?.marker??''].filter(Boolean).join('\n');
      if (!assets.length && (await submitMobilePluginSlash(text))) {
        if (draftRef.current === submitted) setDraft('');
        return;
      }
      const operationKey = 'send-identity:' + hostId + ':' + id;
      messageId.current = mobileSendIdentity(localStorage.getItem(operationKey), text, () => crypto.randomUUID());
      localStorage.setItem(operationKey, JSON.stringify(messageId.current));
      if (snapshot?.running) await control('session.queue', {
        text,
        clientMessageId: messageId.current!.id
      }, {
        sessionId: id
      });else await request('send', {
        sessionId: id,
        text,
        clientMessageId: messageId.current!.id
      });
      if(submittedAnnotations?.rows.length)await annotationsController?.clearSubmitted(submittedAnnotations.rows).catch(()=>setError('消息已发送，批注清理未完成；请核对待发送批注。'));
      if (activeId.current === id) {
        if (draftRef.current === submitted) setDraft('');
        setAttachments(all => all.filter(a => !assets.some(x => x === a || !!x.marker && x.marker === a.marker || !!x.item && x.pluginId === a.pluginId && x.sourceId === a.sourceId && x.item.id === a.item?.id)));
        setNotice(snapshot?.running ? '消息已排队' : '消息已发送');
        localStorage.removeItem(operationKey);
        messageId.current = undefined;
        follow.current = true;
        await refreshActive();
      }
    }, snapshot?.running ? '正在排队…' : '正在发送…');
  };
  const uploadFile = async (file: File, id: string): Promise<{marker: string; label: string}> => {
      const data = new Uint8Array(await file.arrayBuffer()),
        hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data))).map(v => v.toString(16).padStart(2, '0')).join('');
      const started = await control('attachments.start', {
        filename: file.name,
        mediaType: file.type || 'application/octet-stream',
        bytes: data.length,
        digest: hash
      }, {
        sessionId: id
      });
      const uploadId = String(started.id),
        chunkBytes = Number(started.chunkBytes ?? 49152);
      try {
        for (let start = 0, index = 0; start < data.length; start += chunkBytes, index++) {
          setRequestStatus('上传 ' + file.name + ' · ' + Math.min(100, Math.round(start / data.length * 100)) + '%');
          const chunk = data.subarray(start, start + chunkBytes);
          let raw = '';
          for (const b of chunk) raw += String.fromCharCode(b);
          await control('attachments.chunk', {
            id: uploadId,
            index,
            data: btoa(raw)
          }, {
            sessionId: id
          });
        }
        const result = await control('attachments.finish', {
          id: uploadId
        }, {
          sessionId: id
        });
        const marker = String(result.marker ?? result.inlineMarker ?? '');
        if (!marker) throw Error('电脑未返回附件标记');
        return {marker, label: file.name};
      } catch (e) {
        await control('attachments.cancel', {
          id: uploadId
        }, {
          sessionId: id
        }).catch(() => {});
        throw e;
      }
  };
  const upload = async (file: File) => {
    if (!session) return;
    const id = session.id;
    await work(async () => {
      const asset = await uploadFile(file, id);
      if (activeId.current === id) setAttachments(all => [...all, asset]);
    }, '正在准备附件…');
  };
  const create = async (workspaceId: string) => {
    await work(async () => {
      const s = await request<Session>('create', {
        workspaceId
      });
      setSessions(a => [s, ...a]);
      openSession(s);
    }, '正在创建会话…');
  };
  const fork = async (messageId: string) => {
    if (!session) return;
    await work(async () => {
      const r = await control('session.fork', {
          messageId
        }, {
          sessionId: session.id
        }),
        next = r.session as unknown as Session;
      await refreshDirectory();
      openSession(next);
      if (r.marker) setAttachments([{
        marker: String(r.marker),
        label: '分叉对话历史'
      }]);
    }, '正在分叉…');
  };
  const rename = () => {
    if (!session) return;
    const title = prompt('修改会话名称', session.title);
    if (title?.trim()) void work(async () => {
      await control('session.rename', {
        title
      }, {
        sessionId: session.id
      });
      setSession({
        ...session,
        title
      });
      setSessions(a => a.map(s => s.id === session.id ? {
        ...s,
        title
      } : s));
      setSheet('');
    });
  };
  const currentWorkspace = workspaces.find(w => w.id === session?.workspaceId),
    menu = <><button className="setting-row" onClick={()=>setSheet('browser')}>电脑浏览器</button><button className="setting-row" onClick={() => setSheet('move')}>移动到另一工作区</button><button className="setting-row" onClick={() => setSheet('plugins')}><Puzzle size={17} />插件与工作区面板</button><button className="setting-row" onClick={rename}>修改会话名称<ChevronDown size={16} /></button><button className="setting-row" onClick={() => {
        setSheet('model');
      }}>内核、模型与推理档位</button><button className="setting-row" onClick={() => {
        setSheet('history');
        void control('history.mobile-list', {}, {
          sessionId: session!.id
        }).then(r => setHistoryRows(list(r.entries))).catch(e => setError(String(e)));
      }}>导入对话历史</button><button className="setting-row" onClick={() => {
        setSheet('export');
        setExportContent('');
      }}><Download size={17} />导出会话</button><button className="setting-row" onClick={() => {
        setSheet('queue');
        void control('queue.list', {}, {
          sessionId: session!.id
        }).then(r => setQueue(list(r.messages))).catch(e => setError(String(e)));
      }}>排队消息</button><button className="setting-row" onClick={() => void work(async () => {
        await control('session.pin', {
          pinned: !session?.pinned
        }, {
          sessionId: session!.id
        });
        setSheet('');
        await refreshDirectory();
      })}><Pin size={17} />{session?.pinned ? '取消固定' : '固定会话'}</button><button className="setting-row" onClick={() => {
        if (confirm('归档当前会话？')) void work(async () => {
          await control('session.archive', {
            archived: true
          }, {
            sessionId: session!.id
          });
          setView('sessions');
          setSheet('');
          await refreshDirectory();
        });
      }}><Archive size={17} />归档会话</button><button className="setting-row danger" onClick={() => {
        if (confirm('删除当前会话及电脑记录？此操作不可恢复。')) void work(async () => {
          await control('session.remove', {id: session!.id});
          setSession(undefined);
          setView('sessions');
          setSheet('');
          await refreshDirectory();
        });
      }}><Trash2 size={17} />删除会话</button></>;
  const navigation = <><div className="drawer-brand"><Logo /><strong>Tervell</strong><span>移动工作区</span></div><button className="host-switch" onClick={() => {
      setSheet('hosts');
      setDrawer(false);
    }}><span className={'status-dot ' + (connected ? 'online' : '')} /><span>已配对电脑<small>{transport}</small></span><ChevronDown size={17} /></button><button className="primary new-task" onClick={() => {
      setSheet('new');
      setDrawer(false);
    }}><Plus size={18} />新建工作区任务</button><nav>{[['sessions', 'Agent 会话', MessageSquare], ['directChat','Chat 对话',MessageSquare], ['projects', '全部工作区', FolderOpen], ['tasks', '任务看板', LayoutGrid], ['approvals', '等待确认', ShieldCheck], ['settings', '设置', SettingsIcon]].map(([id, label, Icon]) => {
        const C = Icon as React.ElementType;
        return <button className={view === id ? 'active' : ''} key={String(id)} onClick={() => {
          setView(id as typeof view);
          setDrawer(false);
        }}><C size={18} />{String(label)}{id === 'approvals' && approvalCount > 0 && <span className="count">{approvalCount}</span>}</button>;
      })}</nav><div className="drawer-section">项目</div>{workspaces.map(w => <button className={'project-row ' + (project === w.id ? 'selected' : '')} key={w.id} onClick={() => {
      setProject(w.id);
      setView('sessions');
      setDrawer(false);
    }}><FolderOpen size={18} /><span>{w.name}</span><small>{sessions.filter(s => s.workspaceId === w.id).length}</small></button>)}<div className="drawer-footer"><span className="status-dot online" />端到端加密 · 凭据留在本机</div></>;
  if (booting) return <main className="boot"><Logo /><h1>Tervell</h1><Busy text="恢复安全连接…" /><Notice text={error} /></main>;
  if (pairing) return <main className="pair-page"><div className="pair-brand"><Logo /><strong>Tervell</strong><span>你的工作，在手边继续</span></div><h1>连接你的电脑</h1><p className="lead">打开电脑生成的二维码，扫码并确认信任即可连接。配对一次，以后自动恢复。</p><ol className="pair-steps"><li><span>1</span><div><strong>在电脑开启手机连接</strong><p>设置 → 远程连接 → Random创造集市</p></div></li><li><span>2</span><div><strong>生成手机配对二维码</strong><p>网站确认码用于电脑登记。这里需要的是完整手机配对链接。</p></div></li><li><span>3</span><div><strong>扫码并确认信任</strong><p>手机与电脑可以在不同网络。</p></div></li></ol><button className="primary full scan-pairing" disabled={busy} onClick={() => void scanPairing()}><ScanLine size={23} />扫码连接电脑</button><p className="pair-alternative">也可以粘贴完整配对链接</p><label className="field">手机配对链接<textarea rows={3} value={link} onChange={e => setLink(e.target.value)} placeholder="tervell://pair?code=…" autoComplete="off" spellCheck={false} /></label><div className="button-row"><button onClick={() => void native<string>('paste').then(setLink)}>从剪贴板粘贴</button>{connected && <button onClick={() => setPairing(false)}>返回已配对电脑</button>}</div><Notice text={error} /><button className="primary full" disabled={busy || !link.trim()} onClick={() => void connectPairing(link)}>{busy ? <LoaderCircle size={18} className="spin" /> : <ShieldCheck size={18} />}信任并连接电脑</button><button className="full ghost" disabled={busy} onClick={() => void work(async () => {
      await native('retry');
      await initialize();
    }, '正在恢复上次连接…')}>恢复上次连接</button><p className="privacy-note">密钥由 Android Keystore 加密保存。连接服务不读取对话正文。</p></main>;
  if (recovering) return <main className="pair-page connection-recovery"><div className="pair-brand"><Logo /><strong>Tervell</strong></div><h1>恢复已配对电脑</h1><p className="lead">配对仍保存在这台手机。请保持电脑上的 Tervell 开启，并检查两端网络；暂时离线不需要重新授权。</p><Notice text={error} /><button className="primary full" disabled={busy} onClick={() => void work(initialize, '正在恢复已有连接…')}><RefreshCw size={18} />重新连接这台电脑</button><button className="full ghost" onClick={() => setPairing(true)}>连接另一台电脑或使用新二维码</button><p className="privacy-note">若电脑已撤销手机授权，请在电脑重新生成二维码。旧消息和草稿会保留。</p></main>;
  const app=<div className="app-shell"><aside className="desktop-nav">{navigation}</aside><main className="main-view">{view === 'chat' && session ? <><header className="conversation-header"><IconButton label="打开项目导航" onClick={() => setDrawer(true)}><Menu size={22} /></IconButton><button className="conversation-title" onClick={() => setSheet('menu')}><small>{currentWorkspace?.name ?? '项目'}</small><strong>{session.title}</strong></button><MobilePluginControls placement="header" /><button className="header-tab" onClick={() => setSheet('files')} aria-label="文件与改动"><Files size={20} /></button><button className="header-tab" onClick={() => setSheet('terminal')} aria-label="终端"><SquareTerminal size={20} /></button><IconButton label="会话菜单" onClick={() => setSheet('menu')}><MoreHorizontal size={21} /></IconButton></header><div className="connection-strip"><span className={'status-dot ' + (error ? '' : 'online')} /><span>{snapshot?.running ? 'Agent 正在处理' : transport}</span>{approvalCount > 0 && <button onClick={() => setSheet('approvals')}>{approvalCount} 项待确认</button>}</div><section className="conversation-scroll" ref={viewport} onScroll={() => {
          const el = viewport.current;
          if (el) {
            follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            if (follow.current) setNewContent(false);
          }
        }}><div className="conversation-inner">{hasOlder && <button className="load-history" disabled={loading} onClick={() => void loadTimeline(session.id, true)}>加载更早记录</button>}{!entries.length && !loading && !snapshot?.running && <Empty title="开始这一轮协作" detail="描述目标、标记文件或附上图片，模型在电脑运行。" />}{entries.map(e => <Entry key={e.id} entry={e} preferences={prefs} sessionId={session.id} onFork={id => void fork(id)} onQuote={text => setDraft(v => v + (v ? '\n\n' : '') + text.split('\n').map(l => '> ' + l).join('\n') + '\n\n')} />)}{snapshot?.running && <><LiveProcesses rows={snapshot.liveActivity ?? []} preferences={prefs} sessionId={session.id} />{snapshot.liveText && <article className="message assistant-message"><div className="message-label">Tervell · 正在生成</div><Markdown text={snapshot.liveText} /></article>}<div className="stream-status"><LoaderCircle size={14} className="spin" />正在处理…</div></>}{loading && <Busy />}</div></section>{newContent && <button className="new-content" onClick={() => {
          follow.current = true;
          setNewContent(false);
          viewport.current?.scrollTo({
            top: viewport.current.scrollHeight,
            behavior: 'smooth'
          });
        }}><ArrowDown size={16} />回到最新</button>}<div className="composer-zone"><MobileSlashHints text={draft} onPick={setDraft} /><Notice text={error} retry={() => void refreshActive()} />{attachments.length > 0 && <div className="attachment-chips">{attachments.map((a, i) => <span key={i}><Paperclip size={14} />{a.label}<button aria-label={'移除' + a.label} onClick={() => setAttachments(all => all.filter((_, n) => n !== i))}><X size={13} /></button></span>)}</div>}<div className="composer"><AnnotationDrafts/><textarea aria-label="发送给 Agent 的消息" value={draft} rows={2} placeholder="给 Agent 发消息，或引用文件…" onChange={e => setDraft(e.target.value)} onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }} /><div className="mobile-plugin-track"><MobilePluginControls placement="composer" /><MobileComposerItems /><MobileResourcePicker /></div><div className="composer-tools"><IconButton label="插入图片或文件" onClick={() => fileInput.current?.click()} disabled={busy}><Plus size={21} /></IconButton><button className="model-pill" onClick={() => setSheet('model')}><span>{String(sessionDetail.kernelId ?? 'Pi')} · {String(sessionDetail.modelId ?? '选择模型').split('/').at(-1)}</span><ChevronDown size={13} /></button><button className="effort-pill" onClick={() => setSheet('model')}><BrainIcon />{String(plain(sessionDetail.gatewayReasoning).effort ?? plain(sessionDetail.modelReasoning).effort ?? '自动')}</button><span className="spacer" /><IconButton label="语音输入" disabled={busy} onClick={() => void native<string>('voice').then(text => setDraft(v => v + (v ? ' ' : '') + text)).catch(e => setError(String(e)))}><Mic size={19} /></IconButton>{snapshot?.running && <IconButton label="停止当前任务" onClick={() => void work(() => request('stop', {
                sessionId: session.id
              }))}><Square size={17} /></IconButton>}<button className="send-button" aria-label={snapshot?.running ? '排队消息' : '发送消息'} disabled={busy || !draft.trim() && !attachments.length && !annotationCount} onClick={() => void send()}>{busy ? <LoaderCircle size={20} className="spin" /> : <ArrowUp size={22} />}</button></div></div><div className="composer-caption">{requestStatus || notice || (snapshot?.running ? '输入后发送会排队，当前任务继续运行' : '电脑执行 · 手机随时接续')}</div><input type="file" multiple hidden ref={fileInput} onChange={e => {
            const files = Array.from(e.target.files ?? []);
            void (async () => {
              for (const f of files) await upload(f);
            })();
            e.target.value = '';
          }} /></div></> : view === 'directChat' ? <><PageHeader title="Chat 对话" onBack={()=>setView('sessions')}/><div className="page-scroll chat-page"><Chats key={hostId} hostId={hostId} preferences={prefs}/></div></> : view === 'projects' ? <><PageHeader title="工作区" subtitle="全部项目自动连接 · 文件和配置同步电脑" /><div className="page-scroll"><Workspaces hostId={hostId} management={catalog.management} onChanged={() => void refreshDirectory()} onOpen={id => {setProject(id);setView('sessions');void refreshDirectory();}} /></div></> : view === 'settings' ? <Settings key={hostId} hostId={hostId} preferences={prefs} setPreferences={updatePreferences} catalog={catalog} workspaces={workspaces} project={project} sessionId={session?.id} pair={() => setPairing(true)} disconnect={() => void native('forget').then(() => {
        setConnected(false);
        setPairing(true);
      })} onHostChanged={() => {
        void stopMobilePlugins();
        activeId.current='';setProject('');setSessions([]);setWorkspaces([]);setSheet('');
        setSession(undefined);setEntries([]);setView('sessions');
        void initialize();
      }} /> : view === 'approvals' ? <><PageHeader title="等待确认" subtitle="核对操作后再允许" actions={<IconButton label="打开导航" onClick={() => setDrawer(true)}><Menu /></IconButton>} /><div className="page-scroll"><ApprovalPanel key={hostId} hostId={hostId} onChanged={() => void refreshActive()} /></div></> : <><PageHeader title={view === 'tasks' ? '任务看板' : project ? workspaces.find(w => w.id === project)?.name ?? '会话' : '你的工作区'} subtitle={transport} actions={<><IconButton label="打开导航" onClick={() => setDrawer(true)}><Menu /></IconButton><IconButton label="新建任务" onClick={() => setSheet('new')}><Plus /></IconButton></>} /><div className="page-scroll directory-page">{view==='sessions'&&<div className="button-row"><button className="selected">Agent 工作区会话</button><button onClick={()=>setView('directChat')}>Chat 对话</button></div>}<SearchBox value={query} onChange={setQuery} placeholder="搜索项目和会话" /><div className="project-filters"><button className={!project ? 'selected' : ''} onClick={() => setProject('')}>全部项目</button>{workspaces.map(w => <button className={project === w.id ? 'selected' : ''} key={w.id} onClick={() => setProject(w.id)}>{w.name}</button>)}</div>{view === 'tasks' ? <div className="task-board">{[['draft', '待输入'], ['running', '运行中'], ['review', '待查看'], ['done', '已完成']].map(([key, label]) => <section key={key}><h2><span className={'status-dot ' + (key === 'running' ? 'online' : '')} />{label}<small>{groupedSessions(sessions, project, query).filter(s => !s.archived && (key === 'running' ? s.running : !s.running && s.status === key)).length}</small></h2>{groupedSessions(sessions, project, query).filter(s => !s.archived && (key === 'running' ? s.running : !s.running && s.status === key)).map(s => <SessionCard key={s.id} session={s} workspace={workspaces.find(w => w.id === s.workspaceId)} onOpen={() => openSession(s)} />)}</section>)}</div> : <><div className="section-caption">最近会话<span>{groupedSessions(sessions, project, query).length}</span></div>{groupedSessions(sessions, project, query).map(s => <SessionCard key={s.id} session={s} workspace={workspaces.find(w => w.id === s.workspaceId)} onOpen={() => openSession(s)} />)}{!groupedSessions(sessions, project, query).length && <Empty title="还没有会话" detail="全部项目自动连接，新建任务开始。"><button className="primary" onClick={() => setSheet('new')}><Plus size={17} />新建任务</button></Empty>}</>}<Notice text={error} retry={() => void work(refreshDirectory)} /></div></>}<nav className="bottom-nav">{[['sessions', '会话', MessageSquare], ['projects', '工作区', FolderOpen], ['tasks', '任务', LayoutGrid], ['approvals', '确认', ShieldCheck], ['settings', '设置', SettingsIcon]].map(([id, label, Icon]) => {
          const C = Icon as React.ElementType;
          return <button className={view === id || id === 'sessions' && (view === 'chat'||view==='directChat') ? 'active' : ''} key={String(id)} onClick={() => setView(id as typeof view)}><C size={21} /><span>{String(label)}{id === 'approvals' && approvalCount > 0 && <b>{approvalCount}</b>}</span></button>;
        })}</nav></main>{newWorkspace && <WorkspaceCreator onClose={() => setNewWorkspace(false)} onCreated={async (workspace, created) => {setNewWorkspace(false);setSheet('');await refreshDirectory();setProject(workspace.id);openSession(created);}} />}{drawer && <Sheet title="工作区" onClose={() => setDrawer(false)}>{navigation}</Sheet>}{connected && catalog.management && <PluginBrowser key={hostId} visible={sheet === 'plugins'} onClose={() => setSheet('')} />} {sheet && sheet !== 'plugins' && <Sheet title={{
      menu: '会话操作',
      plugins: '插件与工作区面板',
      files: '文件与 Git 改动',
      terminal: '交互终端',
      model: '会话配置',
      approvals: '等待确认',
      new: '新建任务',
      move: '移动会话到工作区',
      export: '导出会话',
      history: '导入对话历史',
      queue: '排队消息',
      hosts: '电脑与连接',browser:'电脑浏览器'
    }[sheet] ?? '工作区'} onClose={() => setSheet('')} wide={sheet === 'terminal' || sheet === 'files'||sheet==='browser'}>{sheet === 'menu' ? menu : sheet === 'move' && session ? <><p className="muted">会话与子会话一起移动；运行或排队期间不可迁移。</p>{workspaces.filter(w => w.id !== session.workspaceId).map(w => <button className="setting-row" key={w.id} disabled={busy} onClick={() => void work(async () => {const result = await control('session.move', {targetWorkspaceId: w.id}, {sessionId: session.id});await refreshDirectory();openSession(result.session as unknown as Session);})}><FolderOpen size={18}/><span>{w.name}</span><ChevronDown size={17}/></button>)}</> : sheet === 'new' ? <><button className="primary full" onClick={() => setNewWorkspace(true)}><Plus size={18}/>新建项目 / 工作区</button><p className="muted">也可以在已有项目建立会话，新会话继承项目默认内核。</p>{workspaces.map(w => <button className="setting-row" key={w.id} disabled={busy} onClick={() => void create(w.id)}><FolderOpen /><span>{w.name}</span><Plus size={18} /></button>)}</> : sheet==='browser'&&session?<Browser sessionId={session.id}/>: sheet === 'files' && session ? <><details className="settings-group"><summary>项目文件：跨会话编辑、新建与完整保存</summary><ProjectFiles key={hostId+session.workspaceId} hostId={hostId} workspaceId={session.workspaceId}/></details><FilePanel sessionId={session.id} insert={text => {
        setDraft(v => v + (v ? '\n' : '') + text);
        setSheet('');
      }} /></> : sheet === 'terminal' && session ? <TerminalPanel sessionId={session.id} /> : sheet === 'model' && session ? <SessionSettings sessionId={session.id} onChanged={() => {
        void control('session.detail', {}, {
          sessionId: session.id
        }).then(setSessionDetail);
      }} /> : sheet === 'approvals' ? <ApprovalPanel key={hostId} hostId={hostId} sessionId={session?.id} onChanged={() => void refreshActive()} /> : sheet === 'export' && session ? <><label className="field">格式<select value={exportFormat} onChange={e => {
            setExportFormat(e.target.value as typeof exportFormat);
            setExportContent('');
          }}><option value="markdown">Markdown</option><option value="json">JSON</option></select></label><button className="full" disabled={busy} onClick={() => void work(async () => {
          let offset = 0,
            revision = '',
            content = '';
          for (;;) {
            const r = await control('session.export', {
              format: exportFormat,
              offset,
              ...(revision ? {
                revision
              } : {})
            }, {
              sessionId: session.id
            });
            content += String(r.content ?? '');
            if (!r.hasMore) break;
            revision = String(r.revision);
            offset = Number(r.nextOffset);
            setRequestStatus('读取完整历史 · ' + offset.toLocaleString() + ' 字符');
          }
          setExportContent(content);
        })}>生成完整导出</button>{exportContent && <><div className="button-row"><button className="primary" onClick={() => void work(async () => {
              await exportMobileText(session.title.replace(/[\\/:*?"<>|]/g, '-') + '.' + (exportFormat === 'json' ? 'json' : 'md'), exportFormat === 'json' ? 'application/json' : 'text/markdown', exportContent);
            })}>浏览文件位置并保存</button><button onClick={() => void native('clipboard', {
              text: exportContent
            })}>复制</button></div><Markdown text={exportContent.slice(0, 16000)} />{exportContent.length > 16000 && <p>此处为预览，文件保存完整内容。</p>}</>}</> : sheet === 'history' && session ? <>{!historyRows.length && <Empty title="没有可导入的其他会话" detail="只列出此手机已获项目授权的会话，源会话不会改变。" />}{historyRows.map(r => <button className="setting-row" key={String(r.id)} onClick={() => void work(async () => {
          const a = await control('history.mobile-attach', {
            sourceId: r.id
          }, {
            sessionId: session.id
          });
          setAttachments(v => [...v, {
            marker: String(a.marker),
            label: '对话历史 · ' + String(r.title)
          }]);
          setSheet('');
        })}><MessageSquare size={18} /><span>{String(r.title)}<small>{String(r.provider)}</small></span><Plus size={16} /></button>)}</> : sheet === 'queue' && session ? <>{!queue.length ? <Empty title="没有排队消息" /> : queue.map(r => <div className="queue-row" key={String(r.id)}><p>{String(r.text ?? '')}</p><button onClick={() => void control('queue.cancel', {
            queueMessageId: r.id
          }, {
            sessionId: session.id
          }).then(() => setQueue(a => a.filter(x => x.id !== r.id)))}>移除</button></div>)}</> : sheet === 'hosts' ? <><p>配对凭据由 Android Keystore 管理，不会交给网页或插件。</p><button className="full" onClick={() => void work(async () => {
          await native('retry');
          await refreshDirectory();
          setSheet('');
        })}>重新连接</button><button className="full" onClick={() => {
          setSheet('');
          setPairing(true);
        }}>添加另一台电脑</button></> : null}<Notice text={error} /></Sheet>}{action && <Sheet title={action.title} onClose={() => setAction(undefined)}><ActionForm action={action} sessionId={session?.id} workspaceId={project} /></Sheet>}</div>;
  return session&&view==='chat'&&catalog.management?<AnnotationProvider key={hostId+session.id} hostId={hostId} kind="agent" id={session.id} controllerRef={annotationRef} onCountChanged={setAnnotationCount} onQuestion={result=>{void refreshDirectory();if(result.session)openSession(result.session as unknown as Session);}} onRewind={sessionDetail.canRewind===true?async messageId=>{await work(async()=>{await control('session.rewind',{messageId},{sessionId:session.id});await refreshActive();});}:undefined}>{app}</AnnotationProvider>:app;
}
function SessionCard({
  session,
  workspace,
  onOpen
}: {
  session: Session;
  workspace?: Workspace;
  onOpen: () => void;
}) {
  return <button className="session-card" onClick={onOpen}><div className="session-card-icon"><MessageSquare size={19} /></div><div><strong>{session.title || '新会话'}</strong><p>{workspace?.name ?? '项目'}{session.kernelId ? ' · ' + session.kernelId : ''}</p><small>{new Date(session.updatedAt).toLocaleString([], {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</small></div>{session.running ? <span className="running-indicator"><LoaderCircle size={14} className="spin" />运行中</span> : <ChevronDown size={16} className="chevron-side" />}</button>;
}
function BrainIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5c-5-5-9 3-5 5-6 4-1 11 5 8M12 5c5-5 9 3 5 5 6 4 1 11-5 8M12 3v18" /></svg>;
}
