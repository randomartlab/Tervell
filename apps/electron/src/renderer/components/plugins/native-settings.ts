import * as React from 'react';
import { pluginClient, pluginShared, createDeviceSettings } from '@/lib/third-party/paseo-client/runtime';
interface Definition {
  id: string;
  scope?: string;
  version?: number;
  schema: {
    safeParse: (value: unknown) => {
      success: boolean;
      data?: unknown;
      error?: {
        message: string;
      };
    };
  };
}
interface ReadState {
  status: string;
  revision: string;
  values?: unknown;
  error?: string;
}
/** SDK hooks 保持同一安装实例的 RPC 上下文；保存携带 revision，冲突后由用户刷新。 */
const deviceSettings = createDeviceSettings({
  getItem: async key => localStorage.getItem(key),
  setItem: async (key, value) => {
    localStorage.setItem(key, value);
  }
});
export function useSettings(definition: Definition, installationId: string): Record<string, unknown> {
  const contracts = React.useMemo(() => pluginShared.settingsRpc(definition.id), [definition.id]),
    read = pluginClient.useRpc(contracts.read),
    write = pluginClient.useRpc(contracts.write),
    reset = pluginClient.useRpc(contracts.reset),
    local = React.useMemo(() => deviceSettings(installationId, definition), [installationId, definition]),
    device = definition.scope === 'device';
  const [state, setState] = React.useState<ReadState>({
      status: 'loading',
      revision: ''
    }),
    [saving, setSaving] = React.useState(false),
    [saveError, setSaveError] = React.useState<string | null>(null);
  const reload = React.useCallback(async () => {
    try {
      setState((await (device ? local.read() : read({}))) as ReadState);
    } catch (error) {
      setState({
        status: 'error',
        revision: '',
        error: String(error)
      });
    }
  }, [read, device, local]);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  const save = async (values: unknown, revision = state.revision) => {
    if (saving) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const input = {
        values,
        revision
      };
      const result = (await (device ? local.write(input) : write(input))) as ReadState;
      if (result.status !== 'saved') throw Error(result.error ?? '设置未保存');
      setState({
        ...result,
        status: 'ready'
      });
      return true;
    } catch (error) {
      setSaveError(String(error));
      return false;
    } finally {
      setSaving(false);
    }
  };
  const actions = {
    save,
    saving,
    saveError,
    reload,
    reset: async () => {
      const input = {
        revision: state.revision
      };
      const result = (await (device ? local.reset(input) : reset(input))) as ReadState;
      if (result.status !== 'saved') return false;
      setState({
        ...result,
        status: 'ready'
      });
      return true;
    }
  };
  if (state.status !== 'ready') return {
    ...state,
    ...actions
  };
  const parsed = definition.schema.safeParse(state.values);
  return parsed.success ? {
    ...state,
    values: parsed.data,
    ...actions
  } : {
    status: 'invalid',
    revision: state.revision,
    error: parsed.error?.message,
    ...actions
  };
}
