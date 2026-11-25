import { z } from 'zod';
import { browserController } from './browser-controller';
import { resolveBrowserProfileKey } from './browser-profile-policy';
import { getAgentSessionMeta, resolveAgentCwd } from './agent-session-manager';
import { getAgentWorkspace } from './agent-workspace-manager';
import { getSettings, updateSettings } from './settings-service';
import { BROWSER_RISK_DISCLAIMER_VERSION } from '../../types';
import { hasAcknowledgedBrowserRiskDisclaimer } from './browser-risk-disclaimer';
import type { MobileContext } from './mobile-control-policy';
const tabId = z.string().min(1).max(200).optional();
export const MobileBrowserReadSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('state')
}), z.strictObject({
  action: z.literal('observe'),
  tabId
}), z.strictObject({
  action: z.literal('screenshot'),
  tabId
})]);
export const MobileBrowserActionSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('acknowledge')
}), z.strictObject({
  action: z.literal('open')
}), z.strictObject({
  action: z.literal('close')
}), z.strictObject({
  action: z.literal('navigate'),
  tabId,
  url: z.string().min(1).max(4096)
}), z.strictObject({
  action: z.literal('tab'),
  url: z.string().min(1).max(4096).optional()
}), z.strictObject({
  action: z.literal('select'),
  tabId: z.string().min(1).max(200)
}), z.strictObject({
  action: z.literal('tab-close'),
  tabId: z.string().min(1).max(200)
}), ...(['back', 'forward', 'reload'] as const).map(action => z.strictObject({
  action: z.literal(action),
  tabId
})), z.strictObject({
  action: z.literal('click'),
  tabId,
  ref: z.string().max(200)
}), z.strictObject({
  action: z.literal('fill'),
  tabId,
  ref: z.string().max(200),
  text: z.string().max(10000)
}), z.strictObject({
  action: z.literal('press'),
  tabId,
  key: z.string().max(200)
}), z.strictObject({
  action: z.literal('scroll'),
  tabId,
  deltaY: z.number().finite().min(-50000).max(50000)
})]);
function session(context: MobileContext) {
  context.assertCurrent();
  if (!context.device.management) throw Error('整机管理未授权');
  const value = getAgentSessionMeta(context.sessionId ?? '');
  if (!value?.workspaceId || !context.device.workspaceIds.includes(value.workspaceId)) throw Error('会话未授权或不存在');
  const workspace = getAgentWorkspace(value.workspaceId);
  if (!workspace) throw Error('项目未授权');
  const cwd = resolveAgentCwd(workspace, value.id, value.agentCwdMode, value.activeWorktree);
  browserController.prepareRemoteSession(value.id);
  browserController.configureSession(value.id, {
    profileKey: resolveBrowserProfileKey(value.workspaceId, value.id),
    executionSource: value.sourceDelegationId ? 'delegation' : value.sourceAutomationId ? 'automation' : 'user',
    allowedRoots: cwd ? [cwd] : []
  });
  return value;
}
export async function mobileBrowserRead(raw: unknown, context: MobileContext) {
  const input = MobileBrowserReadSchema.parse(raw),
    current = session(context);
  if (input.action === 'state') return {
    acknowledged: hasAcknowledgedBrowserRiskDisclaimer(getSettings()),
    state: browserController.getState(current.id)
  };
  const state = browserController.getState(current.id),
    tab = input.tabId ?? state?.activeTabId;
  if (!state || !tab) throw Error('电脑浏览器尚未打开');
  browserController.prepareRemoteTab(current.id, tab);
  let result: unknown;
  try {
    result = input.action === 'observe' ? await browserController.observe(current.id, tab, 200) : await browserController.screenshot(current.id, tab);
  } catch (error) {
    console.warn('[手机浏览器]', input.action, error instanceof Error ? error.message : '读取未完成');
    throw error;
  }
  context.assertCurrent();
  return result;
}
export async function mobileBrowserAction(raw: unknown, context: MobileContext) {
  const input = MobileBrowserActionSchema.parse(raw),
    current = session(context);
  if (input.action === 'acknowledge') {
    updateSettings({
      browserRiskDisclaimerVersion: BROWSER_RISK_DISCLAIMER_VERSION
    });
    return {
      acknowledged: true
    };
  }
  const tab = ('tabId' in input ? input.tabId : undefined) ?? browserController.getState(current.id)?.activeTabId;
  if (tab && ['click', 'fill', 'press', 'scroll'].includes(input.action)) browserController.prepareRemoteTab(current.id, tab);
  let result: unknown;
  switch (input.action) {
    case 'open':
      result = await browserController.open(current.id);
      break;
    case 'close':
      await browserController.close(current.id);
      return {
        closed: true
      };
    case 'navigate':
      result = await browserController.navigateDisplay(current.id, input.url, tab);
      break;
    case 'tab':
      result = await browserController.createDisplayTab(current.id, input.url);
      break;
    case 'select':
      result = browserController.selectTab(current.id, input.tabId);
      break;
    case 'tab-close':
      result = await browserController.closeTab(current.id, input.tabId);
      break;
    case 'back':
      result = await browserController.goBack(current.id, tab);
      break;
    case 'forward':
      result = await browserController.goForward(current.id, tab);
      break;
    case 'reload':
      result = await browserController.reload(current.id, tab);
      break;
    case 'click':
      result = await browserController.click(current.id, input.ref, tab);
      break;
    case 'fill':
      result = await browserController.fill(current.id, input.ref, input.text, tab);
      break;
    case 'press':
      result = await browserController.press(current.id, input.key, tab);
      break;
    case 'scroll':
      result = await browserController.scroll(current.id, {
        deltaY: input.deltaY
      }, tab);
      break;
  }
  const final = browserController.getState(current.id);
  if (final?.activeTabId) browserController.prepareRemoteTab(current.id, final.activeTabId);
  context.assertCurrent();
  return {
    state: final,
    result
  };
}
