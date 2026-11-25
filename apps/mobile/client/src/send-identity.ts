export interface SendIdentity {id: string; text: string}

/** UI 重载后仍沿用同一发送身份，电脑可回读已接受结果而不会再次执行。 */
export function mobileSendIdentity(saved: string | null, text: string, createId: () => string): SendIdentity {
  if (saved) try {
    const value: unknown = JSON.parse(saved);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const row = value as Record<string, unknown>;
      if (typeof row.id === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(row.id) && row.text === text) return {id: row.id, text};
    }
  } catch { /* 损坏的 UI 草稿不提供有效的幂等身份。 */ }
  return {id: createId(), text};
}
