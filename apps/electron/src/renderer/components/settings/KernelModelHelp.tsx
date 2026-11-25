import { useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { settingsOpenAtom, settingsTabAtom, modelRoutingTabAtom } from '@/atoms/settings-tab';

/** 安装与模型认证分别说明，设置页和首次引导使用同一入口。 */
export function KernelModelHelp() {
  const setOpen = useSetAtom(settingsOpenAtom), setTab = useSetAtom(settingsTabAtom), setRoutingTab = useSetAtom(modelRoutingTabAtom);
  return <aside className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6" data-testid="kernel-model-help">
    <strong>内核安装后，模型由哪里提供？</strong>
    <p className="m-0 text-muted-foreground">已登录的工具可沿用原有账号。未登录而无法创建会话时，Tervell 自动尝试用内置 Magpie 和已配置的默认模型接管；不会覆盖系统工具的账号文件。</p>
    <p className="m-0 text-muted-foreground">已有官方账号，可到“全局模型路由 → 订阅与账号”登录。没有账号，可在“供应商”配置模型。厂商锁定或尚无端点适配的内核会明确提示；这时可用内置 Pi 继续工作。</p>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => { setRoutingTab('accounts'); setTab('routing'); setOpen(true); }}>登录官方账号</Button>
      <Button size="sm" variant="ghost" onClick={() => { setRoutingTab('providers'); setTab('routing'); setOpen(true); }}>配置模型供应商</Button>
    </div>
  </aside>;
}
