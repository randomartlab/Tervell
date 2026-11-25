export interface PluginProviderDescriptor {
  pluginId: string;
  id: string;
  label: string;
  description?: string;
  command?: string[];
  requiresConfiguration?: boolean;
}
export interface PluginUsageDescriptor {
  pluginId: string;
  id: string;
  label: string;
}
let providers: PluginProviderDescriptor[] = [],
  usage: PluginUsageDescriptor[] = [];
export function replacePluginRegistrations(pluginId: string, value: {
  providers?: Omit<PluginProviderDescriptor, 'pluginId'>[];
  usageSources?: Omit<PluginUsageDescriptor, 'pluginId'>[];
}): void {
  const next = providers.filter(p => p.pluginId !== pluginId);
  const ids = (value.providers ?? []).map(p => p.id);
  if (new Set(ids).size !== ids.length) throw Error('插件供应商标识重复');
  for (const row of value.providers ?? []) if (next.some(p => p.id === row.id)) throw Error('插件供应商标识冲突：' + row.id);
  providers = next;
  usage = usage.filter(p => p.pluginId !== pluginId);
  for (const row of value.providers ?? []) {
    if (providers.some(p => p.id === row.id)) throw Error('插件供应商标识冲突：' + row.id);
    providers.push({
      ...row,
      pluginId
    });
  }
  usage.push(...(value.usageSources ?? []).map(row => ({
    ...row,
    pluginId
  })));
}
export const pluginProviderDescriptors = (): PluginProviderDescriptor[] => providers.map(p => ({
  ...p
}));
export const pluginUsageDescriptors = (): PluginUsageDescriptor[] => usage.map(p => ({
  ...p
}));
export const pluginProviderDescriptor = (id: string): PluginProviderDescriptor | undefined => providers.find(p => p.id === id);
