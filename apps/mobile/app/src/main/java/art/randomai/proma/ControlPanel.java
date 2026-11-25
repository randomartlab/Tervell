package art.randomai.proma;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.net.Uri;
import android.text.InputType;
import android.view.View;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

/** 宿主提供能力目录，原生表单复用同一协议；不执行网页脚本或暴露连接基础设施。 */
final class ControlPanel {
    interface Request { void run(String operation, String workspace, String session, JSONObject values, Result result); }
    interface Result { void accept(JSONObject value) throws Exception; }
    private final Activity activity;
    private final LinearLayout content;
    private final Request request;
    private final String selectedSession;
    private String workspace;
    private JSONArray actions = new JSONArray();
    private boolean management;
    private String currentGroup;
    private String sessionWorkspace;
    private final ArrayList<String> workspaceIds = new ArrayList<>();
    private final ArrayList<String> workspaceNames = new ArrayList<>();
    private final LinkedHashMap<String, Object> fieldViews = new LinkedHashMap<>();
    private final LinkedHashMap<String, JSONObject> fieldDefinitions = new LinkedHashMap<>();
    private EditText search;
    private String searchValue = "";
    private JSONObject activeAction;
    private JSONObject lastValues = new JSONObject();

    ControlPanel(Activity activity, LinearLayout content, String selectedSession, JSONArray workspaces, Request request) throws Exception {
        this.activity = activity; this.content = content; this.request = request; this.selectedSession = selectedSession;
        for (int i=0;i<workspaces.length();i++) { JSONObject w=workspaces.getJSONObject(i); workspaceIds.add(w.getString("id")); workspaceNames.add(w.getString("name")); }
        if (!workspaceIds.isEmpty()) workspace=workspaceIds.get(0);
    }
    private int dp(int n) { return Math.round(n * activity.getResources().getDisplayMetrics().density); }
    private TextView label(String title,int size) { TextView view=new TextView(activity);view.setText(title);view.setTextSize(size);view.setPadding(0,dp(8),0,dp(8));return view; }
    private Button button(String title,Runnable run) { Button b=new Button(activity);b.setText(title);b.setMinHeight(dp(48));b.setOnClickListener(v->run.run());return b; }
    private JSONObject data() { return new JSONObject(); }
    private void fail() { Toast.makeText(activity,"填写内容无效，请检查必填项与 JSON 格式。",Toast.LENGTH_LONG).show(); }
    void open() {
        content.removeAllViews();content.addView(label("正在读取电脑功能…",16));
        request.run("catalog",null,null,data(),result->{actions=result.getJSONArray("actions");management=result.optBoolean("management");home();});
    }
    private void navigation(String title,Runnable back) { content.removeAllViews();content.addView(button("返回 · "+title,back)); }
    private void home() {
        content.removeAllViews();content.addView(label("电脑控制台",22));
        content.addView(label(management?"整机管理已授权 · 操作仍受项目权限限制":"项目访问权限 · 全局功能需在电脑授权后重新配对",14));
        if (!workspaceIds.isEmpty()) {
            content.addView(label("当前项目",14));Spinner picker=new Spinner(activity);
            picker.setAdapter(new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,workspaceNames));
            picker.setSelection(Math.max(0,workspaceIds.indexOf(workspace)));
            picker.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){public void onNothingSelected(android.widget.AdapterView<?> p){} public void onItemSelected(android.widget.AdapterView<?> p,View v,int position,long id){workspace=workspaceIds.get(position);}});content.addView(picker);
        }
        search=new EditText(activity);search.setHint("搜索功能、模型、插件、MCP…");search.setContentDescription("搜索手机控制功能");search.setSingleLine(true);search.setText(searchValue);content.addView(search);
        content.addView(button("搜索",()->{searchValue=search.getText().toString().trim();showSearch();}));
        LinkedHashMap<String,Integer> groups=new LinkedHashMap<>();
        for(int i=0;i<actions.length();i++){JSONObject a=actions.optJSONObject(i);if(a==null)continue;String group=a.optString("group");groups.put(group,groups.containsKey(group)?groups.get(group)+1:1);}
        for(Map.Entry<String,Integer> group:groups.entrySet())content.addView(button(group.getKey()+" · "+group.getValue(),()->showGroup(group.getKey())));
        content.addView(button("重新同步功能目录",this::open));
    }
    private void showSearch() {
        navigation("功能目录",this::home);content.addView(label("搜索："+searchValue,20));
        int count=0;for(int i=0;i<actions.length();i++){JSONObject a=actions.optJSONObject(i);if(a!=null&&(a.optString("title")+a.optString("group")+a.optString("id")).toLowerCase(java.util.Locale.ROOT).contains(searchValue.toLowerCase(java.util.Locale.ROOT))){renderActionButton(a);count++;}}
        if(count==0)content.addView(label("没有匹配功能。",16));
    }
    private void showGroup(String group) {
        currentGroup=group;navigation("控制台",this::home);content.addView(label(group,22));
        for(int i=0;i<actions.length();i++){JSONObject a=actions.optJSONObject(i);if(a!=null&&group.equals(a.optString("group")))renderActionButton(a);}
    }
    private void renderActionButton(JSONObject action) {
        if(action.optString("id").startsWith("attachments."))return;
        boolean unavailable="session".equals(action.optString("scope"))&&selectedSession==null;
        Button b=button(action.optString("title")+(unavailable?" · 先进入会话":""),()->openAction(action));b.setEnabled(!unavailable);content.addView(b);
    }
    private void openAction(JSONObject action) {
        activeAction=action;String scope=action.optString("scope");
        if("session".equals(scope)&&selectedSession==null){Toast.makeText(activity,"请先打开一个会话",Toast.LENGTH_SHORT).show();return;}
        if("project".equals(scope)&&workspace==null){Toast.makeText(activity,"电脑没有授权项目",Toast.LENGTH_SHORT).show();return;}
        if("session".equals(scope)&&sessionWorkspace==null){request.run("session.detail",null,selectedSession,data(),result->{sessionWorkspace=result.optString("workspaceId");form(action);});return;}
        form(action);
    }
    private void form(JSONObject action) {
        navigation(currentGroup==null?"控制台":currentGroup,()->{if(currentGroup==null)home();else showGroup(currentGroup);});
        content.addView(label(action.optString("title"),22));if(!action.optString("description").isEmpty())content.addView(label(action.optString("description"),14));
        fieldViews.clear();fieldDefinitions.clear();JSONArray fields=action.optJSONArray("fields");
        if(fields!=null)for(int i=0;i<fields.length();i++){JSONObject f=fields.optJSONObject(i);if(f!=null)addField(f);}
        content.addView(button("read".equals(action.optString("effect"))?"读取 / 刷新":"确认操作",()->submit(action)));
    }
    private void addField(JSONObject f) {
        String key=f.optString("key"),type=f.optString("type"),title=f.optString("label",key);Object initial=f.opt("value");fieldDefinitions.put(key,f);
        if("boolean".equals(type)&&!f.optBoolean("required")&&(initial==null||initial==JSONObject.NULL)){
            content.addView(label(title,14));Spinner picker=new Spinner(activity);ArrayList<String> values=new ArrayList<>();values.add("");values.add("true");values.add("false");ArrayList<String> names=new ArrayList<>();names.add("不修改");names.add("开启");names.add("关闭");picker.setAdapter(new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,names));picker.setTag(values);picker.setContentDescription(title);content.addView(picker);fieldViews.put(key,picker);return;
        }
        if("boolean".equals(type)) { CheckBox check=new CheckBox(activity);check.setText(title);check.setMinHeight(dp(48));check.setChecked(Boolean.TRUE.equals(initial));content.addView(check);fieldViews.put(key,check);return; }
        content.addView(label(title+(f.optBoolean("required")?" *":""),14));if(!f.optString("hint").isEmpty())content.addView(label(f.optString("hint"),13));
        if("select".equals(type)) { Spinner spinner=new Spinner(activity);ArrayList<String> values=new ArrayList<>(),names=new ArrayList<>();JSONArray opts=f.optJSONArray("options");if(!f.optBoolean("required")){values.add("");names.add("不修改 / 未设置");}if(opts!=null)for(int i=0;i<opts.length();i++){JSONObject o=opts.optJSONObject(i);if(o!=null){values.add(o.optString("value"));names.add(o.optString("label"));}}
            spinner.setAdapter(new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,names));if(initial!=null)spinner.setSelection(Math.max(0,values.indexOf(String.valueOf(initial))));spinner.setTag(values);spinner.setContentDescription(title);content.addView(spinner);fieldViews.put(key,spinner);return; }
        EditText edit=new EditText(activity);edit.setMinHeight(dp(48));edit.setTextSize(16);edit.setContentDescription(title);
        boolean multi="json".equals(type)||"multiline".equals(type);edit.setInputType("secret".equals(type)?InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD:"number".equals(type)?InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL|InputType.TYPE_NUMBER_FLAG_SIGNED:InputType.TYPE_CLASS_TEXT|(multi?InputType.TYPE_TEXT_FLAG_MULTI_LINE:0));
        edit.setSingleLine(!multi);if(multi){edit.setMinLines(3);edit.setMaxLines(8);edit.setGravity(android.view.Gravity.TOP);}
        if(initial!=null&&initial!=JSONObject.NULL){try{edit.setText("json".equals(type)&&initial instanceof JSONObject?((JSONObject)initial).toString(2):"json".equals(type)&&initial instanceof JSONArray?((JSONArray)initial).toString(2):String.valueOf(initial));}catch(Exception ignored){edit.setText(String.valueOf(initial));}}
        edit.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);content.addView(edit);fieldViews.put(key,edit);
    }
    private JSONObject readForm() throws Exception {
        JSONObject values=data();for(Map.Entry<String,Object> entry:fieldViews.entrySet()) { String name=entry.getKey();Object view=entry.getValue();JSONObject def=fieldDefinitions.get(name);String type=def.optString("type");Object value;
            if(view instanceof CheckBox)value=((CheckBox)view).isChecked();
            else if(view instanceof Spinner){Spinner s=(Spinner)view;ArrayList<?> list=(ArrayList<?>)s.getTag();int at=s.getSelectedItemPosition();String v=at>=0&&at<list.size()?String.valueOf(list.get(at)):"";if(v.isEmpty()&&!def.optBoolean("required"))continue;value="boolean".equals(type)?Boolean.valueOf(v):v;}
            else {EditText e=(EditText)view;String v=e.getText().toString();if(v.trim().isEmpty()&&!(def.has("value")&&"".equals(def.optString("value")))){if(def.optBoolean("required")){e.setError("请填写此项");e.requestFocus();throw new IllegalArgumentException();}continue;}
                value="json".equals(type)?new JSONTokener(v).nextValue():"number".equals(type)?Double.valueOf(v):v;}
            String[] path=name.split("\\.");JSONObject target=values;
            for(int i=0;i<path.length-1;i++){JSONObject child=target.optJSONObject(path[i]);if(child==null){child=new JSONObject();target.put(path[i],child);}target=child;}
            target.put(path[path.length-1],value);
        }return values;
    }
    private void submit(JSONObject action) {
        try { JSONObject values=readForm();Runnable run=()->perform(action,values);
            if(action.optBoolean("confirm"))new AlertDialog.Builder(activity).setTitle(action.optString("title")).setMessage("将在已连接电脑执行此操作。请核对项目、账号和影响范围。").setNegativeButton("取消",null).setPositiveButton("继续",(d,w)->run.run()).show();else run.run();
        }catch(Exception e){fail();}
    }
    private String scopedWorkspace(JSONObject action) { return "session".equals(action.optString("scope"))?sessionWorkspace:"project".equals(action.optString("scope"))?workspace:null; }
    private void perform(JSONObject action,JSONObject values) {lastValues=values;request.run(action.optString("id"),scopedWorkspace(action),"session".equals(action.optString("scope"))?selectedSession:null,values,result->showResult(action,result));}
    private void showResult(JSONObject action,JSONObject result) throws Exception {
        navigation(action.optString("title"),()->openAction(action));content.addView(label(action.optString("title"),22));
        if(result.optJSONObject("job")!=null){JSONObject job=result.getJSONObject("job");String jobId=job.optString("id");content.addView(label("操作进度 · "+job.optString("phase"),18));if("running".equals(job.optString("phase")))content.addView(button("刷新长操作进度",()->request.run("jobs.status",null,null,json("id",jobId),next->{if(next.optJSONObject("result")!=null)showResult(action,next.getJSONObject("result"));else showResult(action,next);})));}
        if(result.has("mcpSignIn"))mcpAuthResult(result.getJSONObject("mcpSignIn"));
        if(result.has("signIn"))authResult(result.getJSONObject("signIn"));
        if(result.has("platformSignIn")){JSONObject flow=result.getJSONObject("platformSignIn");String provider=lastValues.optString("id");content.addView(label("平台授权 · "+flow.optString("state"),18));String url=flow.optString("url");if(url.startsWith("https://"))content.addView(button("打开平台授权页",()->activity.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)))));content.addView(button("刷新平台授权",()->scopedCall("gateway.platform.poll",json("id",provider))));}
        if(result.has("prompt")&&!result.isNull("prompt"))promptResult(result);
        if(result.has("subscriptions"))subscriptionList(result);
        if(result.has("presets"))presetList(result.getJSONArray("presets"));
        if(result.has("providers"))providerList(result.getJSONArray("providers"));
        if(result.has("providerDraft")){JSONObject provider=result.getJSONObject("providerDraft");content.addView(button("编辑供应商配置",()->prefilledAction("gateway.provider.save",json("provider",provider))));}
        if(result.has("catalog")&&result.optJSONObject("catalog")!=null)pluginList(result.getJSONObject("catalog").optJSONArray("listings"));
        if(result.has("models")&&!result.has("controls"))modelList(result.optJSONArray("models"));
        if(result.has("installed"))desktopPlugins(result.getJSONArray("installed"));
        if(result.has("sources")&&result.has("entries"))desktopMarketList(result.getJSONArray("entries"));
        if(result.has("worktrees"))worktreeList(result.getJSONArray("worktrees"));
        if(result.has("pages"))pluginPages(result.getJSONArray("pages"));
        if(result.has("prompts"))promptList(result.getJSONArray("prompts"));
        if(result.has("todos"))planningList(result.getJSONArray("todos"),"todo.update","待办");
        if(result.has("events"))planningList(result.getJSONArray("events"),"calendar.update","日程");
        if(result.has("automations"))planningList(result.getJSONArray("automations"),"automation.update","自动化");
        if(result.has("nextOffset")&&!result.isNull("nextOffset")){
            JSONObject next=new JSONObject(lastValues.toString());next.put("offset",result.getInt("nextOffset"));
            content.addView(button("加载下一页",()->perform(action,next)));
        }
        if(result.has("preview")){
            JSONObject preview=result.getJSONObject("preview");String id=preview.optString("id");
            content.addView(button("安装此插件",()->confirmScoped("安装插件",preview.optString("name")+"\n"+preview.optString("permissions"),"plugins.market-install",json("id",id))));
        }
        if(result.has("entries")&&("kernels.list".equals(action.optString("id"))||"kernels.refresh".equals(action.optString("id"))||"session.kernels".equals(action.optString("id"))))kernelList(result.getJSONArray("entries"));
        if(result.has("controls"))kernelControls(result);
        if(result.has("skills"))skillList(result.getJSONArray("skills"));
        if(result.has("servers"))mcpList(result.getJSONArray("servers"));
        if(result.has("entries")&&"files.list".equals(action.optString("id")))fileList(result.getJSONArray("entries"));
        if(result.has("content")){String body=result.optString("content");content.addView(button("复制正文",()->copy(body)));}
        if(result.has("content")&&"skills.read".equals(action.optString("id"))){
            String body=result.optString("content");Object slug=lastValues.opt("slug");
            content.addView(button("编辑此技能",()->{JSONObject values=json("slug",slug);try{values.put("content",body).put("expectedContent",body);}catch(Exception ignored){}prefilledAction("skills.write",values);}));
        }
        if(result.has("content")&&"files.read".equals(action.optString("id"))){
            String body=result.optString("content"),path=result.optString("path");
            content.addView(button("编辑此文件",()->{JSONObject values=json("path",path);try{values.put("content",body).put("expected",body);}catch(Exception ignored){}prefilledAction("files.write",values);}));
        }
        if(result.has("content")&&("memory.read".equals(action.optString("id"))||"memory.instructions".equals(action.optString("id")))){
            String body=result.optString("content"),operation="memory.read".equals(action.optString("id"))?"memory.write":"memory.instructions-write";JSONObject values=new JSONObject(lastValues.toString());values.put("content",body).put("expectedContent",body);
            content.addView(button("编辑此项目记忆",()->prefilledAction(operation,values)));
        }
        if(result.has("themeMode")&&"settings.read".equals(action.optString("id")))content.addView(button("编辑这些设置",()->prefilledAction("settings.save",result)));
        if(result.has("config")&&"routing.state".equals(action.optString("id")))content.addView(button("编辑全局路由",()->prefilledAction("routing.save",result.optJSONObject("config"))));
        if(result.has("config")&&"mcp.detail".equals(action.optString("id")))content.addView(button("编辑 MCP 配置",()->prefilledAction("mcp.configure",result.optJSONObject("config"))));
        String formatted=result.toString(2);TextView output=label(formatted.length()>100000?formatted.substring(0,100000)+"\n内容已裁剪":formatted,14);output.setTextIsSelectable(true);content.addView(output);
        if("read".equals(action.optString("effect")))content.addView(button("刷新结果",()->perform(action,lastValues)));
        else content.addView(button("返回操作表单",()->openAction(action)));
    }
    private JSONObject findAction(String id) {
        for(int i=0;i<actions.length();i++){JSONObject action=actions.optJSONObject(i);if(action!=null&&id.equals(action.optString("id")))return action;}
        return null;
    }
    private Object nestedValue(JSONObject values,String path) {
        String[] keys=path.split("\\.");Object current=values;
        for(String key:keys){if(!(current instanceof JSONObject))return null;current=((JSONObject)current).opt(key);}
        return current;
    }
    private void prefilledAction(String operation,JSONObject values) {
        JSONObject original=findAction(operation);if(original==null){Toast.makeText(activity,"当前设备未获此功能授权",Toast.LENGTH_SHORT).show();return;}
        try{
            JSONObject action=new JSONObject(original.toString());JSONArray fields=action.getJSONArray("fields");
            for(int i=0;i<fields.length();i++){JSONObject field=fields.getJSONObject(i);Object value=nestedValue(values,field.optString("key"));if(value!=null)field.put("value",value);}
            lastValues=values;activeAction=action;openAction(action);
        }catch(Exception failure){fail();}
    }
    private void presetList(JSONArray presets) throws Exception {
        for(int i=0;i<presets.length();i++){
            JSONObject preset=presets.getJSONObject(i);
            content.addView(button("添加 API · "+preset.optString("name"),()->{
                try{
                    JSONObject provider=new JSONObject(preset.toString());provider.put("preset",preset.optString("id"));provider.put("create",true);provider.put("routing","order");provider.put("fallback",new JSONArray());
                    if(!provider.has("models"))provider.put("models",new JSONArray());
                    prefilledAction("gateway.provider.save",json("provider",provider));
                }catch(Exception failure){fail();}
            }));
        }
    }
    private void providerList(JSONArray providers) throws Exception {
        for(int i=0;i<providers.length();i++){
            JSONObject provider=providers.getJSONObject(i);String id=provider.optString("id");
            if(!provider.optBoolean("subscription"))content.addView(button("编辑供应商 · "+provider.optString("name",id),()->scopedCall("gateway.provider-detail",json("id",id))));
            content.addView(button("同步模型 · "+provider.optString("name",id),()->request.run("gateway.provider.refresh",null,null,json("id",id),result->showResult(activeAction,result))));
        }
    }
    private void scopedCall(String operation,JSONObject values) {
        JSONObject action=findAction(operation);
        if(action==null){Toast.makeText(activity,"当前设备未获此能力授权",Toast.LENGTH_SHORT).show();return;}
        if("session".equals(action.optString("scope"))&&selectedSession==null){Toast.makeText(activity,"请先进入会话",Toast.LENGTH_SHORT).show();return;}
        lastValues=values;activeAction=action;
        request.run(operation,scopedWorkspace(action),"session".equals(action.optString("scope"))?selectedSession:null,values,result->showResult(action,result));
    }
    private void fileList(JSONArray entries) throws Exception {
        for(int i=0;i<entries.length();i++){
            JSONObject file=entries.getJSONObject(i);String path=file.optString("path");boolean directory="directory".equals(file.optString("kind"));
            content.addView(button((directory?"打开目录 · ":"阅读 · ")+path,()->scopedCall(directory?"files.list":"files.read",json("path",path))));
        }
    }
    private void skillList(JSONArray skills) throws Exception {
        for(int i=0;i<skills.length();i++){
            JSONObject skill=skills.getJSONObject(i);String slug=skill.optString("slug");
            content.addView(button("阅读技能 · "+skill.optString("name",slug),()->scopedCall("skills.read",json("slug",slug))));
            content.addView(button((skill.optBoolean("enabled")?"停用":"启用")+" · "+skill.optString("name",slug),()->{
                JSONObject values=json("slug",slug);try{values.put("enabled",!skill.optBoolean("enabled"));}catch(Exception ignored){}
                new AlertDialog.Builder(activity).setTitle("改变技能状态？").setNegativeButton("取消",null).setPositiveButton("确认",(dialog,which)->scopedCall("skills.toggle",values)).show();
            }));
        }
    }
    private void mcpList(JSONArray servers) throws Exception {
        for(int i=0;i<servers.length();i++){
            JSONObject server=servers.getJSONObject(i);String name=server.optString("name");
            if(findAction("mcp.detail")!=null)content.addView(button("编辑 MCP · "+name,()->scopedCall("mcp.detail",json("name",name))));
            if(findAction("mcp.oauth-start")!=null)content.addView(button("登录 MCP · "+name,()->confirmScoped("MCP 账号授权","在手机打开该服务的授权页。","mcp.oauth-start",json("name",name))));
            content.addView(button((server.optBoolean("enabled")?"停用":"验证并启用")+" MCP · "+name,()->{
                JSONObject values=json("name",name);try{values.put("enabled",!server.optBoolean("enabled"));}catch(Exception ignored){}
                new AlertDialog.Builder(activity).setTitle("改变 MCP 状态？").setMessage("启用时电脑会连接该服务并发现工具。").setNegativeButton("取消",null).setPositiveButton("确认",(dialog,which)->scopedCall("mcp.toggle",values)).show();
            }));
        }
    }
    private void kernelControls(JSONObject catalog) throws Exception {
        if(findAction("session.kernel")==null)return;
        if(!catalog.optString("routedModel").isEmpty()){
            content.addView(label("当前使用全局路由模型 · "+catalog.optString("routedModel"),16));
            content.addView(label("原生模型可能被全局路由覆盖，档位请在“模型推理档位”中修改。",14));
            JSONArray efforts=catalog.optJSONArray("routedEfforts");ArrayList<String> names=new ArrayList<>(),values=new ArrayList<>();names.add("自动");values.add("");
            if(efforts!=null)for(int i=0;i<efforts.length();i++){names.add(efforts.optString(i));values.add(efforts.optString(i));}
            newReasoningPicker(catalog.optString("routedModel"),names,values);
        }
        JSONArray channels=catalog.optJSONArray("channels");
        if(channels!=null)for(int i=0;i<channels.length();i++){
            JSONObject channel=channels.getJSONObject(i);JSONArray models=channel.optJSONArray("models");if(models==null)continue;
            for(int j=0;j<models.length();j++){
                JSONObject model=models.getJSONObject(j);String channelId=channel.optString("id"),modelId=model.optString("id");
                content.addView(button("选择 Pi 模型 · "+channel.optString("name")+" / "+model.optString("name"),()->{
                    JSONObject values=json("channelId",channelId);try{values.put("modelId",modelId);}catch(Exception ignored){}
                    new AlertDialog.Builder(activity).setTitle("修改 Pi 直连模型？").setMessage("全局覆盖启用时，仍以全局路由为准。").setNegativeButton("取消",null).setPositiveButton("修改",(dialog,which)->scopedCall("session.pi-model",values)).show();
                }));
            }
        }
        JSONArray controls=catalog.getJSONArray("controls");content.addView(label("当前内核运行选项",18));
        LinkedHashMap<String,Object> widgets=new LinkedHashMap<>();LinkedHashMap<String,JSONObject> definitions=new LinkedHashMap<>();
        for(int i=0;i<controls.length();i++){
            JSONObject control=controls.getJSONObject(i);String id=control.optString("id"),type=control.optString("type");
            if(control.optBoolean("readOnly")||"unsupported".equals(type))continue;
            definitions.put(id,control);content.addView(label(control.optString("name",id),14));
            if("select".equals(type)){
                Spinner picker=new Spinner(activity);JSONArray options=control.optJSONArray("options");ArrayList<String> names=new ArrayList<>();ArrayList<Object> values=new ArrayList<>();
                if(options!=null)for(int j=0;j<options.length();j++){JSONObject option=options.getJSONObject(j);names.add(option.optString("name"));values.add(option.opt("value"));}
                picker.setAdapter(new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,names));picker.setTag(values);
                picker.setSelection(Math.max(0,values.indexOf(control.opt("currentValue"))));picker.setContentDescription(control.optString("name"));content.addView(picker);widgets.put(id,picker);
                if("model".equals(control.optString("category"))||"model".equals(id))content.addView(button("读取所选模型的运行选项",()->{try{int chosen=picker.getSelectedItemPosition();if(chosen<0||chosen>=values.size())return;JSONObject probe=json("kernelId",catalog.optString("kernelId"));probe.put("modelId",values.get(chosen));scopedCall("session.probe",probe);}catch(Exception invalid){fail();}}));
            }else if("boolean".equals(type)){
                CheckBox check=new CheckBox(activity);check.setMinHeight(dp(48));check.setText(control.optString("name"));check.setChecked(control.optBoolean("currentValue"));content.addView(check);widgets.put(id,check);
            }else{
                EditText edit=new EditText(activity);edit.setContentDescription(control.optString("name"));edit.setMinHeight(dp(48));edit.setText(control.optString("currentValue"));
                if("number".equals(type))edit.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
                content.addView(edit);widgets.put(id,edit);
            }
        }
        content.addView(button("保存内核运行选项",()->{
            try{
                JSONObject values=json("kernelId",catalog.optString("kernelId")),config=new JSONObject();
                for(Map.Entry<String,Object> entry:widgets.entrySet()){
                    JSONObject definition=definitions.get(entry.getKey());Object widget=entry.getValue(),value;
                    if(widget instanceof CheckBox)value=((CheckBox)widget).isChecked();
                    else if(widget instanceof Spinner){Spinner picker=(Spinner)widget;ArrayList<?> options=(ArrayList<?>)picker.getTag();value=options.get(Math.max(0,picker.getSelectedItemPosition()));}
                    else value=((EditText)widget).getText().toString();
                    String category=definition.optString("category");
                    if("model".equals(category)||"model".equals(entry.getKey()))values.put("modelId",value);
                    else if("mode".equals(category)||"mode".equals(entry.getKey()))values.put("modeId",value);
                    else config.put(entry.getKey(),"number".equals(definition.optString("type"))?Double.valueOf(String.valueOf(value)):value);
                }
                values.put("configValues",config);
                if(catalog.optBoolean("autoApprove")&&management)values.put("autoApprove",true);
                new AlertDialog.Builder(activity).setTitle("更新当前会话配置？").setNegativeButton("取消",null).setPositiveButton("保存",(dialog,which)->scopedCall("session.kernel",values)).show();
            }catch(Exception failure){fail();}
        }));
    }
    private void copy(String value) { ((ClipboardManager)activity.getSystemService(Activity.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Tervell",value));Toast.makeText(activity,"已复制",Toast.LENGTH_SHORT).show(); }
    private void newReasoningPicker(String model,ArrayList<String> names,ArrayList<String> values){
        content.addView(button("选择当前模型推理档位",()->new AlertDialog.Builder(activity).setTitle("推理档位").setItems(names.toArray(new String[0]),(dialog,at)->{
            JSONObject choice=json("model",model);try{if(!values.get(at).isEmpty())choice.put("effort",values.get(at));}catch(Exception ignored){}
            confirmScoped("保存推理档位","仅更改当前会话。","session.reasoning",choice);
        }).show()));
    }
    private void confirmScoped(String title,String note,String operation,JSONObject values){new AlertDialog.Builder(activity).setTitle(title).setMessage(note).setNegativeButton("取消",null).setPositiveButton("继续",(dialog,which)->scopedCall(operation,values)).show();}
    private void desktopPlugins(JSONArray plugins) throws Exception{
        for(int i=0;i<plugins.length();i++){
            JSONObject plugin=plugins.getJSONObject(i);String id=plugin.optString("id"),name=plugin.optString("name",id);boolean enabled=plugin.optBoolean("enabled");
            content.addView(label(name,18));JSONObject toggle=json("id",id);toggle.put("enabled",!enabled);
            content.addView(button(enabled?"停用插件":"启用插件",()->confirmScoped("改变插件状态",name,"plugins.toggle",toggle)));
            content.addView(button("移除插件",()->confirmScoped("移除插件",name,"plugins.remove",json("id",id))));
            JSONArray themes=plugin.optJSONArray("themes");if(enabled&&themes!=null)for(int j=0;j<themes.length();j++){JSONObject theme=themes.getJSONObject(j);content.addView(button("应用主题 · "+theme.optString("name"),()->confirmScoped("切换电脑主题",theme.optString("name"),"themes.select",json("id",theme.optString("id")))));}
        }
    }
    private void desktopMarketList(JSONArray entries) throws Exception{
        for(int i=0;i<Math.min(entries.length(),100);i++){
            JSONObject entry=entries.getJSONObject(i);String id=entry.optString("id"),name=entry.optString("name",id);
            content.addView(button("预览 · "+name,()->scopedCall("plugins.preview",json("id",id))));
        }
    }
    private void worktreeList(JSONArray entries) throws Exception{
        for(int i=0;i<entries.length();i++){
            JSONObject entry=entries.getJSONObject(i);if(entry.optBoolean("isMain"))continue;String path=entry.optString("path");
            content.addView(button("切换到 · "+entry.optString("branch",path),()->confirmScoped("切换 Worktree","后续操作将在此分支目录进行。","worktrees.select",json("path",path))));
        }
        content.addView(button("退出当前 Worktree",()->confirmScoped("退出 Worktree","返回当前会话原目录。","worktrees.select",json("path",""))));
    }
    private void pluginPages(JSONArray pages) throws Exception{
        for(int i=0;i<pages.length();i++){
            JSONObject page=pages.getJSONObject(i);String key=page.optString("key");content.addView(label(page.optString("title"),18));
            content.addView(button("查看插件配置",()->pageCall(key,"options.get",data())));
            content.addView(button("编辑插件配置",()->{
                JSONObject values=json("key",key);try{values.put("method","options.set").put("params",json("options",data()));}catch(Exception ignored){}
                prefilledAction("gateway.query.plugins.page-call",values);
            }));
            JSONArray reads=page.optJSONArray("reads");if(reads!=null)for(int j=0;j<reads.length();j++){String read=reads.optString(j);content.addView(button("读取 · "+read,()->pageCall(key,"read",json("name",read))));}
        }
    }
    private void pageCall(String key,String method,JSONObject params){try{JSONObject values=data().put("key",key).put("method",method).put("params",params);scopedCall("gateway.query.plugins.page-call",values);}catch(Exception invalid){fail();}}
    private void promptList(JSONArray prompts)throws Exception{
        for(int i=0;i<prompts.length();i++){
            JSONObject prompt=prompts.getJSONObject(i);String id=prompt.optString("id"),name=prompt.optString("name");
            content.addView(label(name,18));content.addView(button("设为默认提示词",()->confirmScoped("修改默认提示词",name,"prompts.default",json("id",id))));
            if(!prompt.optBoolean("isBuiltin")){JSONObject values=new JSONObject(prompt.toString());values.put("expectedUpdatedAt",prompt.optLong("updatedAt"));content.addView(button("编辑提示词",()->prefilledAction("prompts.update",values)));}
        }
    }
    private void planningList(JSONArray items,String operation,String kind)throws Exception{
        for(int i=0;i<items.length();i++){
            JSONObject item=items.getJSONObject(i);JSONObject values=new JSONObject(item.toString());if(item.has("updatedAt"))values.put("expectedUpdatedAt",item.optLong("updatedAt"));
            content.addView(button("编辑"+kind+" · "+item.optString("title",item.optString("name")),()->prefilledAction(operation,values)));
        }
    }
    private void modelList(JSONArray models) throws Exception {if(models==null||findAction("routing.save")==null)return;int count=Math.min(models.length(),100);for(int i=0;i<count;i++){JSONObject model=models.optJSONObject(i);if(model==null)continue;String id=model.optString("id");if(id.isEmpty())continue;content.addView(button("使用模型 · "+model.optString("name",id),()->{try{JSONObject v=data().put("enabled",true).put("defaultModel",id).put("rules",new JSONArray());new AlertDialog.Builder(activity).setTitle("设为全局模型？").setMessage("将开启全局覆盖；现有逐内核例外保留。").setNegativeButton("取消",null).setPositiveButton("设置",(d,w)->request.run("routing.state",null,null,data(),state->{JSONArray rules=state.getJSONObject("config").getJSONArray("rules");v.put("rules",rules);request.run("routing.save",null,null,v,r->showResult(activeAction,r));})).show();}catch(Exception e){fail();}}));}}
    private void kernelList(JSONArray kernels) throws Exception {for(int i=0;i<kernels.length();i++){JSONObject k=kernels.getJSONObject(i);String id=k.optString("id");if(!k.optBoolean("available")&&k.optBoolean("installable"))content.addView(button("安装 · "+k.optString("name"),()->confirmCall("安装 CLI","将在电脑下载并执行安装程序。","kernels.install",json("kernelId",id))));if(k.optBoolean("available")&&k.optBoolean("enabled")&&!"pty".equals(k.optString("transport"))&&selectedSession!=null)content.addView(button("配置并切换 · "+k.optString("name"),()->scopedCall("session.probe",json("kernelId",id))));}}
    private JSONObject json(String key,Object value) {JSONObject o=data();try{o.put(key,value);}catch(Exception ignored){}return o;}
    private void confirmCall(String title,String note,String operation,JSONObject values){new AlertDialog.Builder(activity).setTitle(title).setMessage(note).setNegativeButton("取消",null).setPositiveButton("继续",(d,w)->request.run(operation,null,null,values,r->showResult(activeAction,r))).show();}
    private void pluginList(JSONArray plugins) throws Exception {if(plugins==null)return;for(int i=0;i<Math.min(plugins.length(),150);i++){JSONObject p=plugins.getJSONObject(i);String spec=p.optString("spec");content.addView(button("安装 · "+p.optString("name",spec),()->confirmCall("安装模型插件",spec+"\n插件将在电脑运行。","gateway.plugin.add",json("spec",spec))));}}
    private void subscriptionList(JSONObject snapshot) throws Exception {JSONArray subscriptions=snapshot.getJSONArray("subscriptions");for(int i=0;i<subscriptions.length();i++){JSONObject sub=subscriptions.getJSONObject(i);content.addView(button("登录 · "+sub.optString("name"),()->chooseLogin(sub)));}}
    private void chooseLogin(JSONObject sub) {
        if(!sub.optString("installSpec").isEmpty()){confirmCall("安装账号登录插件",sub.optString("installSpec"),"gateway.plugin.add",json("spec",sub.optString("installSpec")));return;}
        Runnable proceed=()->{JSONArray methods=sub.optJSONArray("methods");if(!sub.optString("providerId").isEmpty()&&methods!=null){String[] names=new String[methods.length()];for(int i=0;i<names.length;i++)names[i]=methods.optJSONObject(i).optString("label");new AlertDialog.Builder(activity).setTitle("登录方式").setItems(names,(d,at)->startPlugin(sub,at,data(),null,null)).show();}else request.run("gateway.signin.start",null,null,json("agent",sub.optString("id")),r->showResult(activeAction,r));};
        if(!sub.optString("risk").isEmpty())new AlertDialog.Builder(activity).setTitle("订阅使用说明").setMessage(sub.optString("risk")).setNegativeButton("取消",null).setPositiveButton("了解并继续",(d,w)->proceed.run()).show();else proceed.run();
    }
    private void startPlugin(JSONObject sub,int method,JSONObject inputs,String key,String value) {
        try {JSONObject q=data().put("provider",sub.optString("providerId")).put("method",method).put("inputs",inputs);if(key!=null)q.put("key",key).put("value",value);
            request.run("gateway.auth-prompt",null,null,q,r->{if(!r.optString("error").isEmpty()){Toast.makeText(activity,r.optString("error"),Toast.LENGTH_LONG).show();startPlugin(sub,method,inputs,null,null);return;}JSONObject collected=r.optJSONObject("inputs");if(collected==null)collected=inputs;
                if(r.optJSONObject("prompt")!=null){final JSONObject answers=collected;JSONObject prompt=r.getJSONObject("prompt");askPrompt(prompt,answer->startPlugin(sub,method,answers,prompt.optString("key"),answer));}
                else {JSONObject chosen=sub.getJSONArray("methods").getJSONObject(method);final JSONObject answers=collected;
                    if("api".equals(chosen.optString("type"))&&!chosen.optBoolean("keyless")&&!chosen.optBoolean("keyAsked"))askSecret("供应商登录密钥",secret->loginPlugin(sub,method,answers,secret));else loginPlugin(sub,method,answers,"");}
            });
        }catch(Exception e){fail();}
    }
    interface Answer {void accept(String value);}
    private void askSecret(String title,Answer answer){EditText edit=new EditText(activity);edit.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);edit.setContentDescription(title);new AlertDialog.Builder(activity).setTitle(title).setView(edit).setNegativeButton("取消",null).setPositiveButton("继续",(d,w)->answer.accept(edit.getText().toString())).show();}
    private void askPrompt(JSONObject prompt,Answer answer){if("select".equals(prompt.optString("type"))){JSONArray opts=prompt.optJSONArray("options");if(opts==null)return;String[] names=new String[opts.length()];for(int i=0;i<names.length;i++)names[i]=opts.optJSONObject(i).optString("label");new AlertDialog.Builder(activity).setTitle(prompt.optString("message")).setItems(names,(d,at)->answer.accept(opts.optJSONObject(at).optString("value"))).show();}
        else {EditText edit=new EditText(activity);edit.setContentDescription(prompt.optString("message"));edit.setHint(prompt.optString("placeholder"));edit.setInputType(InputType.TYPE_CLASS_TEXT|("password".equals(prompt.optString("type"))?InputType.TYPE_TEXT_VARIATION_PASSWORD:0));new AlertDialog.Builder(activity).setTitle(prompt.optString("message")).setView(edit).setNegativeButton("取消",null).setPositiveButton("继续",(d,w)->answer.accept(edit.getText().toString())).show();}}
    private void loginPlugin(JSONObject sub,int method,JSONObject inputs,String key){try{request.run("gateway.signin.plugin",null,null,data().put("provider",sub.optString("providerId")).put("method",method).put("inputs",inputs).put("key",key),r->showResult(activeAction,r));}catch(Exception e){fail();}}
    private void promptResult(JSONObject result) throws Exception {content.addView(label(result.getJSONObject("prompt").optString("message"),16));}
    private void mcpAuthResult(JSONObject flow) {
        String id=flow.optString("id"),url=flow.optString("url");content.addView(label("MCP 授权 · "+flow.optString("state"),18));
        if(url.startsWith("https://"))content.addView(button("手机浏览器打开授权",()->activity.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)))));
        content.addView(button("刷新 MCP 授权进度",()->scopedCall("mcp.oauth-status",json("id",id))));
        if("waiting".equals(flow.optString("state"))){content.addView(button("粘贴 MCP 最终回调地址",()->askSecret("授权后浏览器最终回调地址",value->{JSONObject params=json("id",id);try{params.put("url",value);}catch(Exception ignored){}scopedCall("mcp.oauth-callback",params);})));content.addView(button("取消 MCP 授权",()->scopedCall("mcp.oauth-cancel",json("id",id))));}
    }
    private void authResult(JSONObject signIn) {
        content.addView(label("授权状态 · "+signIn.optString("state"),18));if(!signIn.optString("instructions").isEmpty())content.addView(label(signIn.optString("instructions"),16));String url=signIn.optString("url");
        if(url.startsWith("https://")||url.startsWith("http://"))content.addView(button("打开供应商授权页",()->{try{Uri parsed=Uri.parse(url);if(parsed.getUserInfo()!=null)return;activity.startActivity(new Intent(Intent.ACTION_VIEW,parsed));}catch(Exception e){Toast.makeText(activity,"无法打开授权页",Toast.LENGTH_SHORT).show();}}));
        if(!signIn.optString("code").isEmpty())content.addView(button("复制授权码 · "+signIn.optString("code"),()->copy(signIn.optString("code"))));String flow=signIn.optString("id");
        if(!flow.isEmpty()&&("waiting".equals(signIn.optString("state"))||"installing".equals(signIn.optString("state")))){
            if(signIn.optBoolean("pasteCallback")||signIn.optBoolean("pasteCode")||signIn.optBoolean("pasteKey"))content.addView(button("粘贴授权结果",()->askSecret(signIn.optBoolean("pasteCode")?"授权码":"浏览器最终回调地址 / 授权密钥",value->{try{request.run("gateway.signin.callback",null,null,data().put("id",flow).put("url",value),r->request.run("gateway.signin.poll",null,null,json("id",flow),next->showResult(activeAction,next)));}catch(Exception e){fail();}})));
            content.addView(button("刷新授权进度",()->request.run("gateway.signin.poll",null,null,json("id",flow),r->showResult(activeAction,r))));content.addView(button("取消授权",()->request.run("gateway.signin.cancel",null,null,json("id",flow),r->showResult(activeAction,r))));
        }
    }
}
