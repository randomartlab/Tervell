/* 仅审核过的内置能力可用；操作仍由主进程检查目标会话。 */
exports.createBuiltinHost = host => {
 const invoke=(method,input={})=>host('builtin.host',{method,...input});
 return {
  cli:args=>invoke('cli',{args}),
  tokens:agentId=>invoke('tokens',{agentId}),
  daemon:{
   fetchAgents:options=>invoke('agents',{options}),
   fetchAgent:agentId=>invoke('agent',{agentId}),
   updateAgent:(agentId,updates)=>invoke('rename',{agentId,updates}),
   deleteAgent:agentId=>invoke('delete',{agentId}),
   clearAgentAttention:agentIds=>invoke('read',{agentIds:Array.isArray(agentIds)?agentIds:[agentIds]}),
   markAgentUnread:agentId=>invoke('unread',{agentId}),
   inspectWorkspaceRecovery:workspaceId=>invoke('workspace.recovery',{workspaceId}),
   restoreWorkspace:workspaceId=>invoke('workspace.restore',{workspaceId}),
   listWorkspaceLabels:()=>invoke('labels'),
   getProjectIcon:projectId=>invoke('project.icon',{projectId}),
   listProviderSubagents:parentAgentId=>invoke('subagents',{parentAgentId}),
   fetchProviderSubagentTimeline:(parentAgentId,subagentId,options)=>invoke('subagent.timeline',{parentAgentId,subagentId,options}),
   listPlugins:()=>invoke('features'),
   // 本地能力租约没有外部 socket；释放不终止应用或其他租约。
   close:()=>Promise.resolve()
  }
 };
};
