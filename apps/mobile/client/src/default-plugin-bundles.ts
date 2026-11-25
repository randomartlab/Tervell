import exporter from '@tervell/default-features/builtin-conversation-export/client.js?raw';
import better from '@tervell/default-features/builtin-better-conversation/client.js?raw';
import vivid from '@tervell/default-features/builtin-vivid-activity/client.js?raw';
/** 随APK离线分发默认客户端，仍与已配对电脑的实际代码摘要核对后才执行。 */
const bundled: Record<string, string> = {
  'builtin-conversation-export': exporter,
  'builtin-better-conversation': better,
  'builtin-vivid-activity': vivid
};
export function mobileBundledPlugin(id: string): string | undefined {
  return bundled[id];
}
