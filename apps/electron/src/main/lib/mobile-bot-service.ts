import { wechatBridge } from './wechat-bridge';
import { getWeChatConfig, updateWeChatDefaultWorkspace } from './wechat-config';
import { z } from 'zod';
import { getFeishuMultiBotConfig, saveFeishuBotConfig, removeFeishuBot } from './feishu-config';
import { getDingTalkMultiBotConfig, saveDingTalkBotConfig, removeDingTalkBot } from './dingtalk-config';
import { getSlackConfig, getSlackSettingsConfig, saveSlackBotConfig, removeSlackBot } from './slack-config';
import { feishuBridgeManager } from './feishu-bridge-manager';
import { dingtalkBridgeManager } from './dingtalk-bridge-manager';
import { slackBridgeManager } from './slack-bridge-manager';
import { getSettings, updateSettings } from './settings-service';
import type { MobileContext } from './mobile-control-policy';
const id = z.string().min(1).max(200),
  secret = z.string().max(65536),
  platform = z.enum(['feishu', 'dingtalk', 'slack']);
const defaults = {
  defaultWorkspaceId: id.optional(),
  defaultChannelId: id.optional(),
  defaultModelId: id.optional()
};
export const MobileBotActionSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('wechat'),
  operation: z.enum(['login', 'connect', 'stop', 'logout', 'workspace']),
  workspaceId: id.optional()
}), z.strictObject({
  action: z.literal('save-feishu'),
  id: id.optional(),
  name: id,
  enabled: z.boolean(),
  appId: id,
  appSecret: secret,
  domain: z.enum(['feishu', 'lark']).optional(),
  operatorOpenId: id.optional(),
  allowedUserOpenIds: z.array(id).max(100).optional(),
  ...defaults
}), z.strictObject({
  action: z.literal('save-dingtalk'),
  id: id.optional(),
  name: id,
  enabled: z.boolean(),
  clientId: id,
  clientSecret: secret,
  ...defaults
}), z.strictObject({
  action: z.literal('save-slack'),
  id: id.optional(),
  name: id,
  enabled: z.boolean(),
  botToken: secret,
  appToken: secret,
  homeChannelId: id.optional(),
  defaultChannelId: id.optional(),
  defaultModelId: id.optional()
}), z.strictObject({
  action: z.literal('connect'),
  platform,
  id
}), z.strictObject({
  action: z.literal('disconnect'),
  platform,
  id
}), z.strictObject({
  action: z.literal('remove'),
  platform,
  id
}), z.strictObject({
  action: z.literal('mirror'),
  mode: z.enum(['off', 'stream']),
  botId: id.optional()
})]);
function check(c: MobileContext) {
  c.assertCurrent();
  if (!c.device.management) throw Error('整机管理未授权');
}
export function mobileBots(c: MobileContext) {
  check(c);
  return {
    wechat: {
      enabled: getWeChatConfig().enabled,
      hasCredentials: !!getWeChatConfig().credentials,
      defaultWorkspaceId: getWeChatConfig().defaultWorkspaceId,
      state: wechatBridge.getStatus()
    },
    feishu: getFeishuMultiBotConfig().bots.map(({
      appSecret,
      ...bot
    }) => ({
      ...bot,
      hasSecret: !!appSecret
    })),
    dingtalk: getDingTalkMultiBotConfig().bots.map(({
      clientSecret,
      ...bot
    }) => ({
      ...bot,
      hasSecret: !!clientSecret
    })),
    slack: getSlackSettingsConfig().bots,
    states: {
      feishu: feishuBridgeManager.getStates(),
      dingtalk: dingtalkBridgeManager.getStates(),
      slack: slackBridgeManager.getStates()
    },
    mirror: getSettings().feishuSessionMirror ?? {
      mode: 'off'
    }
  };
}
export async function mobileBotAction(raw: unknown, c: MobileContext) {
  check(c);
  const v = MobileBotActionSchema.parse(raw);
  if (v.action === 'wechat') {
    if (v.operation === 'login') {
      void wechatBridge.startLogin(() => check(c)).catch(() => {});
      return {
        started: true
      };
    }
    if (v.operation === 'connect') await wechatBridge.start();else if (v.operation === 'stop') wechatBridge.stop();else if (v.operation === 'logout') wechatBridge.logout();else {
      if (!v.workspaceId || !c.device.workspaceIds.includes(v.workspaceId)) throw Error('项目未授权');
      updateWeChatDefaultWorkspace(v.workspaceId);
    }
    check(c);
    return {
      saved: true
    };
  }
  if ('defaultWorkspaceId' in v && v.defaultWorkspaceId && !c.device.workspaceIds.includes(v.defaultWorkspaceId)) throw Error('项目未授权');
  if (v.action === 'mirror') {
    updateSettings({
      feishuSessionMirror: {
        mode: v.mode,
        ...(v.botId ? {
          botId: v.botId
        } : {})
      }
    });
    return {
      saved: true
    };
  }
  if (v.action === 'save-feishu') {
    const {
      action,
      ...input
    } = v;
    const bot = saveFeishuBotConfig(input);
    return {
      id: bot.id,
      saved: true
    };
  }
  if (v.action === 'save-dingtalk') {
    const {
      action,
      ...input
    } = v;
    const bot = saveDingTalkBotConfig(input);
    return {
      id: bot.id,
      saved: true
    };
  }
  if (v.action === 'save-slack') {
    const {
      action,
      ...input
    } = v;
    const bot = saveSlackBotConfig(input);
    slackBridgeManager.updateConfig(bot);
    return {
      id: bot.id,
      saved: true
    };
  }
  const exists = v.platform === 'feishu' ? getFeishuMultiBotConfig().bots.some(b => b.id === v.id) : v.platform === 'dingtalk' ? getDingTalkMultiBotConfig().bots.some(b => b.id === v.id) : getSlackConfig().bots.some(b => b.id === v.id);
  if (!exists) throw Error('机器人不存在');
  const manager = v.platform === 'feishu' ? feishuBridgeManager : v.platform === 'dingtalk' ? dingtalkBridgeManager : slackBridgeManager;
  if (v.action === 'connect') await manager.restartBot(v.id);else {
    await manager.stopBot(v.id);
    if (v.action === 'remove') {
      if (v.platform === 'feishu') removeFeishuBot(v.id);else if (v.platform === 'dingtalk') removeDingTalkBot(v.id);else removeSlackBot(v.id);
    }
  }
  check(c);
  return {
    completed: true
  };
}
