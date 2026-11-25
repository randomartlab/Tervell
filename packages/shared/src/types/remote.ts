export const REMOTE_IPC = { STATUS: 'remote:status', CONFIGURE: 'remote:configure', PAIR: 'remote:pair', REVOKE: 'remote:revoke', IMPORT_CONNECTION:'remote:import-connection', HOSTED_AUTHORIZE:'remote:hosted-authorize', HOSTED_REAUTHORIZE:'remote:hosted-reauthorize', RECONNECT:'remote:reconnect', CONTROL_CHANGED:'remote:control-changed' } as const
export interface RemoteControlChange { operation:string;sessionId?:string;workspaceId?:string }
export type { RemoteSettingsInput } from '@proma/protocol'
export interface RemoteStatus {
  allowManagement?: boolean
  enabled: boolean
  workspaceIds: string[]
  allWorkspaces?: boolean
  connected: boolean
  configured: boolean
  connectionMode?: 'auto'|'lan'|'random'
  hosted?: { phase: 'idle'|'starting'|'approval'|'connecting'|'online'|'reconnecting'|'revoked'|'error'; userCode?: string; approvalExpiresAt?: number; error?: string }
  localReady?: boolean
  pairedAt?: number
  lastSeenAt?: number
  error?: string
  devices: Array<{ id: string; paired: boolean; revoked: boolean; expiresAt: number; management?:boolean;pairedAt?:number;lastSeenAt?:number }>
}
