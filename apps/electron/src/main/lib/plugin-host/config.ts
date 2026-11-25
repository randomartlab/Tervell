import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getConfigDir } from '../config-paths';
import { writeJsonFileAtomic } from '../safe-file';
interface ProviderConfig {
  enabled?: boolean;
  env?: Record<string, string>;
  options?: Record<string, unknown>;
  providerOptions?: Record<string, unknown>;
  additionalModels?: Array<{
    id: string;
    label: string;
  }>;
  [key: string]: unknown;
}
interface Config {
  mcp: {
    enabled?: boolean;
    injectIntoAgents: boolean;
  };
  providers: Record<string, ProviderConfig>;
  appendSystemPrompt: string;
  envOverrides?: Record<string, string>;
  pluginsEnabled?: boolean;
  [key: string]: unknown;
}
const file = () => join(getConfigDir(), 'paseo-host-config.json');
export function paseoConfig(): Config {
  if (!existsSync(file())) return {
    mcp: {
      injectIntoAgents: true
    },
    providers: {},
    appendSystemPrompt: '',
    browserTools: {
      enabled: false
    },
    metadataGeneration: {
      providers: []
    },
    autoArchiveAfterMerge: false,
    enableTerminalAgentHooks: false
  };
  const raw = JSON.parse(readFileSync(file(), 'utf8')) as Partial<Config>;
  return {
    mcp: {
      injectIntoAgents: true
    },
    providers: {},
    appendSystemPrompt: '',
    ...raw
  };
}
function merge(previous: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const result = {
    ...previous
  };
  for (const [key, value] of Object.entries(patch)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('配置键无效');
    result[key] = value && typeof value === 'object' && !Array.isArray(value) ? merge(result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) ? result[key] as Record<string, unknown> : {}, value as Record<string, unknown>) : value;
  }
  return result;
}
export function patchPaseoConfig(patch: Record<string, unknown>): Config {
  const supported = new Set(['providers', 'removeProviders', 'appendSystemPrompt', 'envOverrides']);
  const keys = Object.keys(patch).filter(key => !supported.has(key));
  if (keys.length) throw Error('Tervell尚未接入这些Paseo宿主配置，未保存：' + keys.join('、'));
  const next = merge(paseoConfig(), patch) as Config;
  if (Array.isArray(patch.removeProviders)) for (const id of patch.removeProviders) delete next.providers[String(id)];
  delete next.removeProviders;
  if (Buffer.byteLength(JSON.stringify(next)) > 2 * 1024 * 1024) throw Error('宿主配置超过2MB');
  mkdirSync(getConfigDir(), {
    recursive: true
  });
  writeJsonFileAtomic(file(), next);
  return paseoConfig();
}
export function paseoProviderDefaults(id: string): ProviderConfig {
  return paseoConfig().providers[id] ?? {};
}
