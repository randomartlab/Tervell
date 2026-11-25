import {expect,test} from 'bun:test'
import {createStore} from 'jotai'
import {pluginTargetKey,samePluginTarget,pluginTabStatesAtom,removePluginTabState} from '../apps/electron/src/renderer/components/plugins/native-state'
import {pluginAttachmentsAtom,addPluginAttachment,pluginAttachmentText} from '../apps/electron/src/renderer/components/plugins/native-attachments'
import {isPersistableSDKSystemMessage} from '../packages/shared/src/utils/agent-system-message'
import {groupIntoTurns} from '../packages/session-core/src/group'

test('Given 同一插件在不同会话打开 When 保存标签状态 Then 按项目与会话隔离并在关闭时清理脏状态',()=>{
 const store=createStore(),a={pluginId:'test',kind:'panel' as const,id:'editor',workspaceId:'a',agentId:'one'},b={...a,agentId:'two'}
 expect(samePluginTarget(a,b)).toBe(false);expect(samePluginTarget({...a},a)).toBe(true)
 store.set(pluginTabStatesAtom,{[pluginTargetKey(a)]:{state:{value:1},modified:true},[pluginTargetKey(b)]:{state:{value:2},modified:false}})
 const states=removePluginTabState(store.get(pluginTabStatesAtom),a);expect(states[pluginTargetKey(a)]).toBeUndefined();expect(states[pluginTargetKey(b)]?.state).toEqual({value:2})
})
test('Given 两个插件和会话的资源附件 When 重选相同资源 Then 去重且消息正文完整带入所选资源',()=>{
 const store=createStore(),value={pluginId:'one',sourceId:'issues',item:{id:'1',identifier:'ISSUE-1',title:'修复',url:'https://example.org/issues/1',text:'真实资源正文',resourceType:'issue'}}
 addPluginAttachment(store,'a',value);addPluginAttachment(store,'a',value);addPluginAttachment(store,'b',{...value,pluginId:'two'});
 expect(store.get(pluginAttachmentsAtom).a).toHaveLength(1);expect(store.get(pluginAttachmentsAtom).b?.[0]?.pluginId).toBe('two');expect(pluginAttachmentText(store.get(pluginAttachmentsAtom).a!)).toContain('真实资源正文');expect(()=>addPluginAttachment(store,'a',{...value,item:{...value.item,url:'file:///private/secret'}})).toThrow('HTTP');expect(()=>addPluginAttachment(store,'a',{...value,item:{...value.item,text:'a'.repeat(200001)}})).toThrow('过长')
})
test('Given 后端追加插件消息 When 会话恢复与分组 Then 保留独立时间线记录而不吞入普通回答',()=>{
 const row={type:'system' as const,subtype:'plugin_timeline',pluginId:'test',item:{type:'plugin',kind:'review',version:1,data:{text:'review'}}};expect(isPersistableSDKSystemMessage(row)).toBe(true);const groups=groupIntoTurns([row]);expect(groups).toHaveLength(1);expect(groups[0]?.type).toBe('system')
})

test('Given 打开插件设置 When 左侧渲染导航 Then 原生类别不再同时保持选中',()=>{const source=require('node:fs').readFileSync('apps/electron/src/renderer/components/settings/SettingsPanel.tsx','utf8');expect(source).toContain("aria-current={!pluginSettings&&activeTab === tab.id");})
