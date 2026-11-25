/** 内置增强提供功能，Proma 原生组件拥有消息排版和动作栏。外部插件仍按其声明注册。 */
const HOST_MESSAGE_TYPES = new Set(['assistant_message','user_message','reasoning','tool_call','todo','error','compaction','notification'])
export function usesNativeMessageLayout(pluginId:string,itemType:string):boolean {
 return HOST_MESSAGE_TYPES.has(itemType)&&(pluginId==='builtin-better-conversation'||pluginId==='builtin-vivid-activity')
}
