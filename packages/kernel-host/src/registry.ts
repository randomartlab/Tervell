import {ACP_REGISTRY_AGENTS,ACP_REGISTRY_ALIASES,registryCommand} from './registry-distributions'
import { DESKTOP_REFERENCE_CATALOG } from './desktop-catalog.ts'
import { KernelDefinitionSchema } from '@proma/protocol'
import type { KernelDefinition, KernelDefinitionInput } from '@proma/protocol'

/**
 * 内置内核清单（方案 B：全覆盖）
 *
 * - acp-native：CLI 自带 ACP 子命令/参数
 * - acp-adapter：经独立适配器进程接入 ACP（cli 用于探测本体是否安装）
 * - pty：无 ACP，仅终端模式
 *
 * verified=true 表示启动参数已对照官方文档或 npm 包核实（2026-11-17 Pre-flight）。
 * 用户自定义内核与本清单同结构，可覆盖同 id 的内置项。
 */
const BUILTIN: KernelDefinitionInput[] = [
  // ── T2 适配器 ──
  { id: 'claude', name: 'Claude Code', tier: 'acp-adapter', cli: 'claude', acp: { command: 'claude-agent-acp' }, pty: {}, installHint: 'bun add -g @agentclientprotocol/claude-agent-acp', verified: true },
  { id: 'codex', name: 'Codex', tier: 'acp-adapter', cli: 'codex', acp: { command: 'codex-acp' }, pty: {}, installHint: 'bun add -g @agentclientprotocol/codex-acp', verified: true },
  { id: 'deepseek', name: 'DeepSeek Harness（旧会话兼容）', tier: 'acp-native', cli: 'dsh', acp: { args: ['--profile','acp'] }, verified: true },

  // ── T1 原生 ACP ──
  { id: 'omp', name: 'oh-my-pi', tier: 'acp-native', cli: 'omp', acp: { args: ['acp'], env: { PI_NO_PTY: '1' } }, pty: {}, verified: true },
  { id: 'kimi', name: 'Kimi Code', tier: 'acp-native', cli: 'kimi', acp: { args: ['acp'] }, pty: {}, verified: true },
  { id: 'gemini', name: 'Gemini CLI', tier: 'acp-native', cli: 'gemini', acp: { args: ['--acp'] }, pty: {}, installHint: 'bun add -g @google/gemini-cli', verified: true },
  { id: 'qwen', name: 'Qwen Code', tier: 'acp-native', cli: 'qwen', acp: { args: ['--acp', '--experimental-skills'] }, pty: {}, installHint: 'bun add -g @qwen-code/qwen-code', verified: true },
  { id: 'opencode', name: 'OpenCode', tier: 'acp-native', cli: 'opencode', acp: { args: ['acp'], env: { OPENCODE_CLIENT: 'acp', OPENCODE_ENABLE_QUESTION_TOOL: 'false' } }, pty: {}, installHint: 'bun add -g opencode-ai', verified: true },
  { id: 'opencode2', name: 'OpenCode 2.x（本地别名）', tier: 'acp-native', cli: 'opencode2', acp: { args: ['acp'], env: { OPENCODE_CLIENT: 'acp', OPENCODE_ENABLE_QUESTION_TOOL: 'false' } }, pty: {}, verified: false },
  { id: 'copilot', name: 'GitHub Copilot CLI', tier: 'acp-native', cli: 'copilot', acp: { args: ['--acp', '--stdio'] }, pty: {}, installHint: 'bun add -g @github/copilot', verified: true },
  { id: 'cursor', name: 'Cursor Agent', tier: 'acp-native', cli: 'cursor-agent', acp: { args: ['--disable-auto-update', 'acp'] }, pty: {}, verified: true },
  { id: 'grok', name: 'Grok CLI', tier: 'acp-native', cli: 'grok', acp: { args: ['agent', 'stdio'] }, pty: {}, verified: true },
  { id: 'antigravity', name: 'Antigravity（反重力）', tier: 'acp-native', cli: 'agy', acp: { args: ['acp'] }, pty: {}, verified: true },
  { id: 'kiro', name: 'Kiro CLI', tier: 'acp-native', cli: 'kiro-cli', acp: { args: ['acp'] }, pty: {}, verified: true },
  { id: 'mcode', name: 'MiniMax Code', tier: 'acp-native', cli: 'mcode', acp: { args: ['acp'] }, pty: {}, installHint: 'bun add -g @minimax-ai/code', verified: true },
  { id: 'hermes', name: 'Hermes Agent', tier: 'acp-native', cli: 'hermes', acp: { args: ['acp'] }, pty: { args: ['--tui'] }, verified: true },
  { id: 'dsh', name: 'DeepSeek Harness', tier: 'acp-native', cli: 'dsh', acp: { args: ['--profile', 'acp'] }, pty: { command: 'dsh-tui', args: ['.'] }, verified: true },

  // ── T3 仅 PTY（长尾，可继续由用户清单扩充） ──
  { id: 'aider', name: 'Aider', tier: 'pty', cli: 'aider', pty: {} },
  { id: 'goose', name: 'Goose', tier: 'acp-native', cli: 'goose', acp: { args:['acp'] }, pty: {} },
  { id: 'auggie', name: 'Augment Auggie', tier: 'acp-native', cli: 'auggie', acp:{args:['--acp']}, pty: {}, installHint: 'bun add -g @augmentcode/auggie' },
  { id: 'kilocode', name: 'Kilo Code', tier: 'pty', cli: 'kilocode', pty: {}, installHint: 'bun add -g @kilocode/cli' },
]

export class KernelRegistry {
  private readonly defs = new Map<string, KernelDefinition>()

  constructor(custom: KernelDefinitionInput[] = []) {
    const existing=new Set(BUILTIN.map(d=>d.id))
    const additions:KernelDefinitionInput[]=DESKTOP_REFERENCE_CATALOG.filter(d=>!existing.has(d.id)).map(d=>({id:d.id,name:d.name,cli:d.command,tier:d.transport==='acp'?'acp-native':'pty',...(d.transport==='acp'?{acp:{command:d.command,args:d.args,env:d.env}}:{pty:{command:d.command,args:d.args}}),verified:false}))
    const registered=new Set([...BUILTIN,...additions].map(d=>d.id)),aliases=new Set(Object.values(ACP_REGISTRY_ALIASES));
    const official:KernelDefinitionInput[]=ACP_REGISTRY_AGENTS.filter(agent=>!registered.has(agent.id)&&!aliases.has(agent.id)).map(agent=>{const command=registryCommand(agent);return {id:agent.id,name:agent.id==='glm-acp-agent'?'GLM ACP（社区 · 非 ZCode）':agent.id==='deepagents'?'LangChain DeepAgents（社区 ACP）':agent.name,cli:command.command,tier:'acp-native',acp:command,verified:false};});
    for (const def of [...BUILTIN, ...additions, ...official]) {
      if(def.id==='agoragentic-acp'){this.register({...def,tier:'pty',acp:undefined,pty:{command:def.cli,args:[]},verified:false});continue;}
      const agent=ACP_REGISTRY_AGENTS.find(a=>a.id===(ACP_REGISTRY_ALIASES[def.id]??def.id));
      if(agent){const command=registryCommand(agent);const nativeAlias=['antigravity','opencode2','mcode'].includes(def.id)?def.acp?.command??def.cli:command.command;this.register({...def,tier:def.tier==='acp-adapter'?'acp-adapter':'acp-native',acp:{...command,command:nativeAlias,env:{...command.env,...def.acp?.env}}});}
      else this.register(def);
    }
    for(const def of custom)this.register(def)
  }

  /** 注册或覆盖一个内核定义；结构非法时抛出 zod 错误 */
  register(input: KernelDefinitionInput): KernelDefinition {
    const def = KernelDefinitionSchema.parse(input)
    this.defs.set(def.id, def)
    return def
  }

  get(id: string): KernelDefinition | undefined {
    return this.defs.get(id)
  }

  list(): KernelDefinition[] {
    return [...this.defs.values()]
  }
}
