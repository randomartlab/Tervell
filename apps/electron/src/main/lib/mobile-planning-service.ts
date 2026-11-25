import { z } from 'zod';
import * as planning from './planning-manager';
import * as automation from './automation-manager';
import { broadcastPlanningChanged } from './planning-events';
import { broadcastChanged, runAutomationNow } from './automation-scheduler';
import type { MobileContext } from './mobile-control-policy';
import { getSettings } from './settings-service';
const id = z.string().min(1).max(200),
  title = z.string().trim().min(1).max(500),
  text = z.string().max(100000),
  timestamp = z.number().int().positive(),
  nullableId = id.nullable().optional();
const todo = {
  title,
  notes: text.optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueAt: timestamp.nullable().optional(),
  groupId: nullableId,
  tagIds: z.array(id).max(200).optional()
};
const calendar = {
  title,
  notes: text.optional(),
  startAt: timestamp,
  endAt: timestamp.nullable().optional(),
  allDay: z.boolean().optional(),
  groupId: nullableId,
  tagIds: z.array(id).max(200).optional()
};
const notification = z.strictObject({
  type: z.literal('feishu'),
  enabled: z.boolean(),
  trigger: z.enum(['always', 'success', 'error']),
  botId: id,
  chatId: id
});
const automationValues = {
  name: title,
  prompt: text,
  scheduleType: z.enum(['interval', 'daily', 'weekly', 'monthly', 'once']),
  intervalMinutes: z.number().int().min(1).max(525600),
  timeOfDay: z.string().regex(/^\d\d:\d\d$/).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  scheduledAt: timestamp.optional(),
  maxRuns: z.number().int().positive().nullable().optional(),
  activeWindowStart: z.string().regex(/^\d\d:\d\d$/).nullable().optional(),
  activeWindowEnd: z.string().regex(/^\d\d:\d\d$/).nullable().optional(),
  activeWeekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  channelId: id.optional(),
  modelId: id.optional(),
  sessionMode: z.enum(['daily', 'reuse']).optional(),
  active: z.boolean(),
  notificationTargets: z.array(notification).max(50).optional()
};
export const MobilePlanningSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('todo.save'),
  id: id.optional(),
  expectedUpdatedAt: timestamp.optional(),
  ...todo,
  status: z.enum(['open', 'completed']).optional()
}), z.strictObject({
  action: z.literal('calendar.save'),
  id: id.optional(),
  expectedUpdatedAt: timestamp.optional(),
  ...calendar
}), z.strictObject({
  action: z.literal('automation.save'),
  id: id.optional(),
  expectedUpdatedAt: timestamp.optional(),
  ...automationValues
}), z.strictObject({
  action: z.literal('automation.run'),
  id
}), z.strictObject({
  action: z.literal('remove'),
  kind: z.enum(['todo', 'calendar', 'automation']),
  id
}), z.strictObject({
  action: z.literal('group.save'),
  scope: z.enum(['todo', 'calendar']),
  id: id.optional(),
  name: title,
  color: z.string().regex(/^#[a-f0-9]{6}$/i).optional()
}), z.strictObject({
  action: z.literal('group.remove'),
  scope: z.enum(['todo', 'calendar']),
  id
}), z.strictObject({
  action: z.literal('tag.save'),
  id: id.optional(),
  name: title,
  color: z.string().regex(/^#[a-f0-9]{6}$/i).optional()
}), z.strictObject({
  action: z.literal('tag.remove'),
  id
}), z.strictObject({
  action: z.literal('reminder.create'),
  kind: z.enum(['todo', 'calendar']),
  id,
  triggerAt: timestamp
}), z.strictObject({
  action: z.literal('reminder.acknowledge'),
  id
}), z.strictObject({
  action: z.literal('reminder.snooze'),
  id,
  minutes: z.number().int().min(1).max(525600)
})]);
function workspace(c: MobileContext) {
  c.assertCurrent();
  if (!c.workspaceId || !c.device.workspaceIds.includes(c.workspaceId)) throw Error('项目未授权');
  return c.workspaceId;
}
export function mobilePlanningRead(c: MobileContext) {
  const wid = workspace(c);
  return {
    todos: planning.listTodos().filter(t => t.workspaceId === wid),
    calendar: planning.listCalendarEvents().filter(t => t.workspaceId === wid),
    automations: automation.listAutomations().filter(t => t.workspaceId === wid),
    groups: [...planning.listPlanningGroups('todo'), ...planning.listPlanningGroups('calendar')],
    tags: planning.listPlanningTags(),
    reminders: planning.listActivePlanningReminders().filter(r => {
      const row = r as unknown as {
        targetType: string;
        targetId: string;
      };
      const item = row.targetType === 'todo' ? planning.getTodo(row.targetId) : planning.getCalendarEvent(row.targetId);
      return item?.workspaceId === wid;
    })
  };
}
export async function mobilePlanningAction(raw: unknown, c: MobileContext) {
  const wid = workspace(c);
  if (!c.device.management) throw Error('整机管理未授权');
  const v = MobilePlanningSchema.parse(raw);
  const own = (kind: 'todo' | 'calendar' | 'automation', id: string) => {
    const item = kind === 'todo' ? planning.getTodo(id) : kind === 'calendar' ? planning.getCalendarEvent(id) : automation.getAutomation(id);
    if (item?.workspaceId !== wid) throw Error('项目未授权');
  };
  let result: unknown;
  switch (v.action) {
    case 'todo.save':
      {
        const {
          action,
          id,
          ...data
        } = v;
        if (id) {
          own('todo', id);
          result = planning.updateTodo({
            id,
            ...data
          });
        } else {
          const created = planning.createTodo({
            ...data,
            dueAt: data.dueAt ?? undefined,
            groupId: data.groupId ?? undefined,
            workspaceId: wid
          });
          result = data.status === 'completed' ? planning.updateTodo({
            id: created.id,
            status: 'completed',
            expectedUpdatedAt: created.updatedAt
          }) : created;
        }
        break;
      }
    case 'calendar.save':
      {
        const {
          action,
          id,
          ...data
        } = v;
        if (id) {
          own('calendar', id);
          result = planning.updateCalendarEvent({
            id,
            ...data
          });
        } else result = planning.createCalendarEvent({
          ...data,
          endAt: data.endAt ?? undefined,
          groupId: data.groupId ?? undefined,
          workspaceId: wid
        });
        break;
      }
    case 'automation.save':
      {
        const {
          action,
          id,
          expectedUpdatedAt,
          ...data
        } = v;
        if (id) {
          own('automation', id);
          if (expectedUpdatedAt !== automation.getAutomation(id)?.updatedAt) throw Error('自动化已在电脑更新，请重新读取');
          result = automation.updateAutomation({
            id,
            ...data
          });
        } else result = automation.createAutomation({
          ...data,
          activeWindowStart: data.activeWindowStart ?? undefined,
          activeWindowEnd: data.activeWindowEnd ?? undefined,
          channelId: data.channelId ?? getSettings().agentChannelId ?? 'tervell-routing',
          workspaceId: wid
        });
        broadcastChanged();
        break;
      }
    case 'automation.run':
      own('automation', v.id);
      await runAutomationNow(v.id);
      result = {
        started: true
      };
      break;
    case 'remove':
      own(v.kind, v.id);
      result = {
        removed: v.kind === 'todo' ? planning.deleteTodo(v.id) : v.kind === 'calendar' ? planning.deleteCalendarEvent(v.id) : automation.deleteAutomation(v.id)
      };
      if (v.kind === 'automation') broadcastChanged();
      break;
    case 'group.save':
      {
        const {
          action,
          ...data
        } = v;
        result = data.id ? planning.updatePlanningGroup({
          ...data,
          id: data.id
        }) : planning.createPlanningGroup(data);
        break;
      }
    case 'group.remove':
      result = {
        removed: planning.deletePlanningGroup(v.scope, v.id)
      };
      break;
    case 'tag.save':
      {
        const {
          action,
          ...data
        } = v;
        result = data.id ? planning.updatePlanningTag({
          ...data,
          id: data.id
        }) : planning.createPlanningTag(data);
        break;
      }
    case 'tag.remove':
      result = {
        removed: planning.deletePlanningTag(v.id)
      };
      break;
    case 'reminder.create':
      own(v.kind, v.id);
      result = planning.createPlanningReminder({
        targetType: v.kind === 'todo' ? 'todo' : 'calendar_event',
        targetId: v.id,
        triggerAt: v.triggerAt
      });
      break;
    case 'reminder.acknowledge':
    case 'reminder.snooze':
      {
        const row = planning.getPlanningReminder(v.id);
        if (!row) throw Error('提醒不存在');
        own(row.targetType === 'todo' ? 'todo' : 'calendar', row.targetId);
        result = v.action === 'reminder.acknowledge' ? planning.acknowledgePlanningReminder(v.id) : planning.snoozePlanningReminder(v.id, v.minutes);
        break;
      }
  }
  c.assertCurrent();
  broadcastPlanningChanged();
  return {
    result: result ?? null
  };
}
