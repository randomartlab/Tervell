import * as React from 'react';
import { FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlugins, PluginComponent } from './native-registry';
export function BuiltinExportButton({
  id,
  workspaceId
}: {
  id: string;
  workspaceId?: string;
}): React.ReactElement | null {
  const [open, setOpen] = React.useState(false),
    installation = usePlugins().find(p => p.id === 'builtin-conversation-export' && !p.error),
    row = installation?.workspacePanels.find(p => p.id === 'export');
  if (!installation || !row) return null;
  return <><Button className="titlebar-no-drag" variant="ghost" size="sm" aria-label="导出会话" title="导出会话" onClick={() => setOpen(true)}><FileDown className="size-4" /><span className="hidden sm:inline">导出</span></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex h-[min(85vh,780px)] max-w-3xl min-h-0 flex-col overflow-hidden"><DialogHeader><DialogTitle>导出会话</DialogTitle></DialogHeader><PluginComponent installation={installation} row={row} props={{
          context: 'agent',
          agentId: id,
          workspaceId: workspaceId ?? 'builtin-chat',
          close: () => setOpen(false)
        }} /></DialogContent></Dialog></>;
}
