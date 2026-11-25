package art.randomai.proma;
/** Vivid 的语义配色与三档展示策略；未知工具保留名称和正文。 */
final class ActivityPresentation {
 static boolean expanded(String policy, String status) {return "expanded".equals(policy)||"balanced".equals(policy)&&("running".equals(status)||"failed".equals(status));}
 static String category(String kind) {
  switch(kind){case "reasoning":return "推理";case "read":return "读取";case "edit":case "write":return "改动";case "shell":return "命令";case "search":return "搜索";case "fetch":return "网页";case "tool_call":return "工具";default:return "操作";}
 }
 static int color(String kind,String status,boolean dark) {
  if("failed".equals(status))return dark?0xffff9696:0xffb42318;
  switch(kind){case "reasoning":return dark?0xffc4b5fd:0xff6d28d9;case "edit":case "write":return dark?0xff86efac:0xff166534;case "shell":return dark?0xfffcd34d:0xff92400e;case "search":case "fetch":return dark?0xff67e8f9:0xff0e7490;default:return dark?0xff93c5fd:0xff1d4ed8;}
 }
}
