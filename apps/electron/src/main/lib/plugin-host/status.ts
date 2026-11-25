import type { DesktopPluginStatus } from '@proma/shared';
let statuses: DesktopPluginStatus[] = [];
export function pluginStatusSnapshot(): DesktopPluginStatus[] {
  return structuredClone(statuses);
}
export function setPluginStatusSnapshot(value: DesktopPluginStatus[]): void {
  statuses = structuredClone(value);
}
