import type { RecordValue } from './bridge';
export function mobileDateInput(value: unknown): string {
  if (!value) return '';
  const date = new Date(Number(value));
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function planningDraft(kind: string, row: RecordValue = {}): RecordValue {
  return {
    ...row,
    kind,
    title: String(row.title ?? row.name ?? ''),
    notes: String(row.notes ?? ''),
    priority: row.priority ?? 'medium',
    status: row.status ?? 'open',
    due: mobileDateInput(row.dueAt),
    start: mobileDateInput(row.startAt),
    end: mobileDateInput(row.endAt),
    prompt: row.prompt ?? '',
    scheduleType: row.scheduleType ?? 'interval',
    intervalMinutes: row.intervalMinutes ?? 60,
    timeOfDay: row.timeOfDay ?? '09:00',
    dayOfWeek: row.dayOfWeek ?? 1,
    dayOfMonth: row.dayOfMonth ?? 1,
    scheduled: mobileDateInput(row.scheduledAt),
    active: row.active ?? false,
    activeWindowStart: row.activeWindowStart ?? '',
    activeWindowEnd: row.activeWindowEnd ?? '',
    weekdays: Array.isArray(row.activeWeekdays) ? row.activeWeekdays.join(',') : '',
    maxRuns: row.maxRuns ?? '',
    sessionMode: row.sessionMode ?? 'daily',
    notifications: JSON.stringify(row.notificationTargets ?? [], null, 2)
  };
}
const timestamp = (value: unknown) => {
  const time = new Date(String(value)).getTime();
  if (!Number.isSafeInteger(time) || time <= 0) throw Error('请填写有效日期与时间');
  return time;
};
export function planningValues(edit: RecordValue): RecordValue {
  const value: RecordValue = {
    action: String(edit.kind) + '.save',
    ...(edit.id ? {
      id: edit.id
    } : {})
  };
  if (edit.kind === 'automation') {
    Object.assign(value, {
      ...(edit.id ? {
        expectedUpdatedAt: edit.updatedAt
      } : {}),
      name: String(edit.title).trim(),
      prompt: edit.prompt,
      scheduleType: edit.scheduleType,
      intervalMinutes: Number(edit.intervalMinutes),
      active: edit.active === true,
      sessionMode: edit.sessionMode,
      maxRuns: edit.maxRuns === '' ? null : Number(edit.maxRuns),
      ...(edit.scheduleType === 'interval' ? {
        activeWindowStart: edit.activeWindowStart || null,
        activeWindowEnd: edit.activeWindowEnd || null,
        activeWeekdays: String(edit.weekdays).trim() ? String(edit.weekdays).split(',').map(v => Number(v.trim())) : []
      } : {}),
      ...(edit.channelId ? {
        channelId: edit.channelId
      } : {}),
      ...(edit.modelId ? {
        modelId: edit.modelId
      } : {}),
      notificationTargets: JSON.parse(String(edit.notifications))
    });
    if (['daily', 'weekly', 'monthly'].includes(String(edit.scheduleType))) value.timeOfDay = edit.timeOfDay;
    if (edit.scheduleType === 'weekly') value.dayOfWeek = Number(edit.dayOfWeek);
    if (edit.scheduleType === 'monthly') value.dayOfMonth = Number(edit.dayOfMonth);
    if (edit.scheduleType === 'once') value.scheduledAt = timestamp(edit.scheduled);
  } else {
    Object.assign(value, {
      title: String(edit.title).trim(),
      notes: edit.notes,
      ...(edit.id ? {
        expectedUpdatedAt: edit.updatedAt
      } : {}),
      groupId: edit.groupId || null,
      tagIds: Array.isArray(edit.tagIds) ? edit.tagIds : []
    });
    if (edit.kind === 'todo') Object.assign(value, {
      priority: edit.priority,
      status: edit.status,
      dueAt: edit.due ? timestamp(edit.due) : null
    });else Object.assign(value, {
      startAt: timestamp(edit.start),
      endAt: edit.end ? timestamp(edit.end) : null,
      allDay: edit.allDay === true
    });
  }
  return value;
}
