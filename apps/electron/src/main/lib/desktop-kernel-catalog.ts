import { primaryKernelControl } from '@proma/shared';
import { sessionControls } from '@proma/kernel-host';
import type { DesktopKernelCatalog } from '@proma/shared';
import type { JsonValue } from '@proma/protocol';
interface Cached {
  kernelId: string;
  catalog: DesktopKernelCatalog;
}
const catalogs = new Map<string, Cached>(),
  listeners = new Set<(value: DesktopKernelCatalog) => void>();
interface KernelCommand {
  name: string;
  description: string;
  argumentHint: string;
  kind?: 'command' | 'skill';
}
const commands = new Map<string, {
  kernelId: string;
  values: KernelCommand[];
}>();
export function rememberKernelCommands(sessionId: string, kernelId: string, value: unknown): void {
  if (!Array.isArray(value)) return;
  const values: KernelCommand[] = value.flatMap(raw => {
    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string') return [];
    const input = raw.input && typeof raw.input === 'object' ? raw.input : {};
    return [{
      name: raw.name,
      description: typeof raw.description === 'string' ? raw.description : '',
      argumentHint: typeof raw.argumentHint === 'string' ? raw.argumentHint : typeof input.hint === 'string' ? input.hint : '',
      ...(raw.kind === 'skill' ? {
        kind: 'skill' as const
      } : {
        kind: 'command' as const
      })
    }];
  });
  commands.set(sessionId, {
    kernelId,
    values
  });
  if (commands.size > 100) commands.delete(commands.keys().next().value!);
}
export function cachedKernelCommands(sessionId: string, kernelId: string): KernelCommand[] | undefined {
  const row = commands.get(sessionId);
  return row?.kernelId === kernelId ? structuredClone(row.values) : undefined;
}
export function publishKernelCatalog(sessionId: string, kernelId: string, metadata: Record<string, JsonValue>): DesktopKernelCatalog {
  const commandUpdate = metadata.available_commands_update;
  if (commandUpdate && typeof commandUpdate === 'object' && !Array.isArray(commandUpdate)) rememberKernelCommands(sessionId, kernelId, commandUpdate.availableCommands);else if (Array.isArray(metadata.availableCommands)) rememberKernelCommands(sessionId, kernelId, metadata.availableCommands);
  const controls = sessionControls(metadata),
    model = primaryKernelControl(controls,'model'),
    mode = primaryKernelControl(controls,'mode');
  const catalog: DesktopKernelCatalog = {
    kernelId,
    sessionId,
    observedAt: Date.now(),
    controls,
    models: (model?.options ?? []).filter(o => typeof o.value === 'string').map(o => ({
      id: String(o.value),
      name: o.name
    })),
    modes: (mode?.options ?? []).filter(o => typeof o.value === 'string').map(o => ({
      id: String(o.value),
      name: o.name
    })),
    currentModelId: typeof model?.currentValue === 'string' ? model.currentValue : null,
    currentModeId: typeof mode?.currentValue === 'string' ? mode.currentValue : null
  };
  catalogs.set(sessionId, {
    kernelId,
    catalog
  });
  if (catalogs.size > 100) catalogs.delete(catalogs.keys().next().value!);
  for (const listen of listeners) listen(structuredClone(catalog));
  return catalog;
}
export function cachedKernelCatalog(sessionId: string, kernelId: string): DesktopKernelCatalog | undefined {
  const v = catalogs.get(sessionId);
  return v?.kernelId === kernelId ? structuredClone(v.catalog) : undefined;
}
export function onKernelCatalogChanged(fn: (v: DesktopKernelCatalog) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function rememberKernelCatalog(sessionId: string, kernelId: string, catalog: DesktopKernelCatalog): void {
  const next = {
    ...catalog,
    sessionId,
    kernelId,
    observedAt: Date.now()
  };
  catalogs.set(sessionId, {
    kernelId,
    catalog: next
  });
  if (catalogs.size > 100) catalogs.delete(catalogs.keys().next().value!);
  for (const fn of listeners) fn(structuredClone(next));
}
export function clearKernelCatalogs(): void {
  catalogs.clear();
  commands.clear();
}
