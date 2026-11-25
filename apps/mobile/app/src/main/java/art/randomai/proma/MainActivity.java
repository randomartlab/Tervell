package art.randomai.proma;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognizerIntent;
import android.view.WindowManager;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.webkit.*;
import org.json.JSONObject;
import org.json.JSONArray;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

/** 离线打包的移动工作区。密钥、端到端加密与网络始终由 Android 原生层持有。 */
public final class MainActivity extends Activity {
    private static final String ORIGIN="https://appassets.androidplatform.net";
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private RemoteClient client;
    private WebView web;
    private FrameLayout frame;
    private int navigationInset;
    private boolean ready,uiReady;
    private String incoming="";
    private ValueCallback<Uri[]> fileCallback;
    private volatile boolean exportPreparing;
    private volatile String exportId;
    private String voiceId,scanId;
    private volatile java.io.File exportFile;
    private static final int PICK=71,EXPORT=72,VOICE=73,SCAN=74;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        boolean debug=(getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0;
        if(!debug)getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        WebView.setWebContentsDebuggingEnabled(debug);
        if(getIntent()!=null&&getIntent().getData()!=null)incoming=getIntent().getData().toString();
        try{client=new RemoteClient(new SecureStore(this));}
        catch(Exception error){new AlertDialog.Builder(this).setTitle("安全存储不可用").setMessage("无法读取本机配对。请检查系统安全存储后重启应用。").setPositiveButton("关闭",(d,w)->finish()).show();return;}
        frame=new FrameLayout(this){
            private final android.graphics.Paint navigationPaint=new android.graphics.Paint();
            @Override protected void dispatchDraw(android.graphics.Canvas canvas){super.dispatchDraw(canvas);navigationPaint.setColor(Color.parseColor("#141a1b"));canvas.drawRect(0,getHeight()-navigationInset,getWidth(),getHeight(),navigationPaint);}
        };
        web=new WebView(this);frame.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(frame);
        if(android.os.Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        frame.setOnApplyWindowInsetsListener((view,insets)->{
            if(android.os.Build.VERSION.SDK_INT>=30){navigationInset=insets.getInsets(WindowInsets.Type.navigationBars()).bottom;android.graphics.Insets edge=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());view.setPadding(edge.left,edge.top,edge.right,edge.bottom);view.invalidate();return WindowInsets.CONSUMED;}
            navigationInset=insets.getSystemWindowInsetBottom();view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());view.invalidate();return insets.consumeSystemWindowInsets();
        });
        frame.requestApplyInsets();
        applySystemTheme((getResources().getConfiguration().uiMode&android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES);
        int savedVersion=getPreferences(MODE_PRIVATE).getInt("offline-client-version",-1);
        try{int version=getPackageManager().getPackageInfo(getPackageName(),0).versionCode;if(savedVersion!=version){web.clearCache(true);getPreferences(MODE_PRIVATE).edit().putInt("offline-client-version",version).apply();}}catch(Exception ignored){}
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSupportMultipleWindows(false);settings.setMediaPlaybackRequiresUserGesture(true);
        if(android.os.Build.VERSION.SDK_INT>=26)settings.setSafeBrowsingEnabled(true);
        web.addJavascriptInterface(new NativeBridge(),"TervellNative");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if(!ORIGIN.equals(uri.getScheme()+"://"+uri.getAuthority()))return denied();
                String path=uri.getPath();
                if(path==null||!path.startsWith("/workbench/")||path.contains("..")||path.contains("\\"))return denied();
                try{String file=path.substring(1);String mime=file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":file.endsWith(".png")?"image/png":file.endsWith(".woff2")?"font/woff2":"text/html";return new WebResourceResponse(mime,"UTF-8",200,"OK",java.util.Collections.singletonMap("Cache-Control","no-store"),getAssets().open(file));}catch(Exception error){return denied();}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();return !ORIGIN.equals(uri.getScheme()+"://"+uri.getAuthority())||uri.getPath()==null||!uri.getPath().startsWith("/workbench/");}
            @Override public void onPageFinished(WebView view,String url){ready=true;}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);startActivityForResult(intent,PICK);return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request){request.deny();}
            @Override public boolean onJsPrompt(WebView view,String url,String message,String initial,JsPromptResult result){android.widget.EditText input=new android.widget.EditText(MainActivity.this);input.setText(initial);new AlertDialog.Builder(MainActivity.this).setMessage(message).setView(input).setNegativeButton("取消",(d,w)->result.cancel()).setPositiveButton("保存",(d,w)->result.confirm(input.getText().toString())).setOnCancelListener(d->result.cancel()).show();return true;}
            @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setNegativeButton("取消",(d,w)->result.cancel()).setPositiveButton("确认",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
        });
        web.setDownloadListener((url,userAgent,contentDisposition,mime,length)->{});
        web.loadUrl(ORIGIN+"/workbench/index.html");
    }
    private WebResourceResponse denied(){return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));}
    private void applySystemTheme(boolean dark){
        int background=Color.parseColor(dark?"#141a1b":"#f6f8fa");frame.setBackgroundColor(background);web.setBackgroundColor(background);
        getWindow().setStatusBarColor(Color.TRANSPARENT);getWindow().setNavigationBarColor(Color.parseColor("#141a1b"));
        if(android.os.Build.VERSION.SDK_INT>=29){getWindow().setStatusBarContrastEnforced(false);getWindow().setNavigationBarContrastEnforced(false);}
        if(android.os.Build.VERSION.SDK_INT>=30){WindowInsetsController controller=getWindow().getInsetsController();if(controller!=null)controller.setSystemBarsAppearance(dark?0:WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);}
        else {View decor=getWindow().getDecorView();int flags=decor.getSystemUiVisibility();flags=dark?flags&~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR:flags|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;flags&=~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;decor.setSystemUiVisibility(flags);}
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(intent.getData()==null)return;String link=intent.getData().toString();if(ready&&uiReady)web.evaluateJavascript("window.__tervellIncomingPairing?.("+JSONObject.quote(link)+")",null);else incoming=link;}
    @Override protected void onResume(){super.onResume();if(client!=null)client.setForeground(true);if(web!=null){web.onResume();web.resumeTimers();}}
    @Override protected void onPause(){if(client!=null)client.setForeground(false);if(web!=null)web.onPause();super.onPause();}
    @Override protected void onDestroy(){ready=false;io.shutdownNow();if(web!=null){web.removeJavascriptInterface("TervellNative");web.destroy();}super.onDestroy();}
    @Override public void onBackPressed(){if(web!=null)web.evaluateJavascript("window.__tervellBack?.()??false",value->{if(!"true".equals(value))new AlertDialog.Builder(this).setMessage("退出 Tervell？草稿会保留。").setNegativeButton("继续使用",null).setPositiveButton("退出",(d,w)->finish()).show();});else super.onBackPressed();}
    private void result(String id,Object data,String error){main.post(()->{if(isDestroyed()||web==null)return;try{JSONObject response=new JSONObject().put("id",id).put("ok",error==null);if(error!=null)response.put("error",error);else response.put("data",data==null?JSONObject.NULL:data);web.evaluateJavascript("window.__tervellResult?.("+response.toString()+")",null);}catch(Exception ignored){}});}
    private final class NativeBridge {
        @JavascriptInterface public void postMessage(String raw){
            if(raw==null||raw.length()>900000)return;
            try{JSONObject message=new JSONObject(raw);String id=message.getString("id"),op=message.getString("operation");JSONObject values=message.optJSONObject("values");if(values==null)values=new JSONObject();final JSONObject input=values;
                if(!id.matches("[a-zA-Z0-9_-]{1,80}"))return;
                if("ui.ready".equals(op)){main.post(()->{if(exportId==null){exportPreparing=false;if(exportFile!=null)exportFile.delete();exportFile=null;}uiReady=true;String value=incoming;incoming="";result(id,value,null);});return;}
                if("ui.theme".equals(op)){main.post(()->{applySystemTheme(input.optBoolean("dark"));result(id,new JSONObject(),null);});return;}
                if("clipboard".equals(op)){main.post(()->{ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);cb.setPrimaryClip(ClipData.newPlainText("Tervell",input.optString("text")));result(id,new JSONObject(),null);});return;}
                if("paste".equals(op)){main.post(()->{ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);String text=cb.hasPrimaryClip()?String.valueOf(cb.getPrimaryClip().getItemAt(0).coerceToText(MainActivity.this)):"";result(id,text,null);});return;}
                if("external".equals(op)){main.post(()->{try{Uri url=Uri.parse(input.getString("url"));if(!"https".equals(url.getScheme())&&!"http".equals(url.getScheme()))throw new IllegalArgumentException();startActivity(new Intent(Intent.ACTION_VIEW,url));result(id,new JSONObject(),null);}catch(Exception error){result(id,null,"无法打开这个网址");}});return;}
                if("scan".equals(op)){main.post(()->{if(scanId!=null){result(id,null,"请先完成当前扫码");return;}try{scanId=id;startActivityForResult(new Intent(MainActivity.this,PairingScannerActivity.class),SCAN);}catch(Exception error){scanId=null;result(id,null,"无法打开扫码页面，仍可粘贴配对链接");}});return;}
                if("voice".equals(op)){main.post(()->{if(voiceId!=null){result(id,null,"请先完成当前语音输入");return;}try{voiceId=id;Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_PROMPT,"说出你想交给 Agent 的任务");startActivityForResult(intent,VOICE);}catch(Exception error){voiceId=null;result(id,null,"此设备没有可用的系统语音输入服务");}});return;}
                if("export".equals(op)){main.post(()->{if(exportId!=null){result(id,null,"请先完成上次文件保存");return;}try{if(exportFile==null||!exportFile.isFile())throw new IllegalStateException();exportId=id;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(input.optString("mime","text/markdown")).putExtra(Intent.EXTRA_TITLE,input.optString("filename","Tervell conversation.md"));startActivityForResult(intent,EXPORT);}catch(Exception error){exportId=null;result(id,null,"无法打开系统文件保存器");}});return;}
                io.execute(()->{try{Object value;
                    switch(op){
                        case "export.prepare":if(exportId!=null||exportPreparing)throw new ConnectionFailure("请先完成当前文件保存");if(exportFile!=null)exportFile.delete();exportFile=java.io.File.createTempFile("conversation-export-",".txt",getCacheDir());exportPreparing=true;value=new JSONObject();break;
                        case "export.cancel":if(exportId==null){exportPreparing=false;if(exportFile!=null)exportFile.delete();exportFile=null;}value=new JSONObject();break;
                        case "export.bytes":if(exportFile==null||exportId!=null)throw new ConnectionFailure("导出尚未准备，请重新生成");String encoded=input.getString("data");if(encoded.length()>65536)throw new ConnectionFailure("附件分块过大");byte[] decoded=android.util.Base64.decode(encoded,android.util.Base64.DEFAULT);if(!android.util.Base64.encodeToString(decoded,android.util.Base64.NO_WRAP).equals(encoded))throw new ConnectionFailure("附件分块无效");try(java.io.FileOutputStream staged=new java.io.FileOutputStream(exportFile,true)){staged.write(decoded);}value=new JSONObject();break;
                        case "export.chunk":if(exportFile==null||exportId!=null)throw new ConnectionFailure("导出尚未准备，请重新生成");try(java.io.FileOutputStream staged=new java.io.FileOutputStream(exportFile,true)){staged.write(input.getString("text").getBytes(StandardCharsets.UTF_8));}value=new JSONObject();break;
                        case "state":value=new JSONObject().put("paired",client.paired()).put("confirmed",client.confirmed()).put("transport",client.connectionLabel()).put("hostId",client.hostIdentity());break;
                        case "pair.preview":value=PairingQrDecoder.preview(input.getString("link"),System.currentTimeMillis());break;
                        case "pair":client.importPairing(input.getString("link"));if(!client.confirmed())client.request("pair",new JSONObject());value=client.request("status",new JSONObject());break;
                        case "retry":value=client.request(client.confirmed()?"status":"pair",new JSONObject());break;
                        case "request":value=client.request(input.getString("method"),input.optJSONObject("params")==null?new JSONObject():input.getJSONObject("params"));break;
                        case "direct":value=client.directView();break;
                        case "pauseDirect":client.pauseDirect();value=client.directView();break;
                        case "direct.configure":client.configureDirectOptions(input.optBoolean("enabled",true),input.optBoolean("preferDirect",true),input.optString("selected"),input.optString("preferredOrigin"),input.optInt("intervalSeconds",20),input.optInt("timeoutSeconds",3),input.optString("language","system"));value=client.directView();break;
                        case "switchHost":client.switchHost(input.getString("id"));value=client.request("status",new JSONObject());break;
                        case "forget":client.forget();value=new JSONObject();break;
                        default:throw new IllegalArgumentException();
                    }result(id,value,null);
                }catch(Exception error){if((getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0){StringBuilder trace=new StringBuilder(op+" "+error.getClass().getName());for(StackTraceElement frame:error.getStackTrace()){if(trace.length()>1200)break;trace.append(" at ").append(frame.getClassName()).append('.').append(frame.getMethodName()).append(':').append(frame.getLineNumber());}android.util.Log.w("TervellBridge",trace.toString());}result(id,null,ConnectionFailure.describe(error));}});
            }catch(Exception ignored){}
        }
    }
    @Override protected void onActivityResult(int request,int code,Intent data){super.onActivityResult(request,code,data);
        if(request==SCAN&&scanId!=null){String id=scanId;scanId=null;result(id,code==RESULT_OK&&data!=null?data.getStringExtra("pairing"):"",null);}
        if(request==PICK&&fileCallback!=null){ValueCallback<Uri[]> callback=fileCallback;fileCallback=null;if(code!=RESULT_OK||data==null){callback.onReceiveValue(null);return;}java.util.ArrayList<Uri> uris=new java.util.ArrayList<>();if(data.getClipData()!=null){for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());}else if(data.getData()!=null)uris.add(data.getData());callback.onReceiveValue(uris.toArray(new Uri[0]));}
        if(request==VOICE&&voiceId!=null){String id=voiceId;voiceId=null;java.util.ArrayList<String> rows=data==null?null:data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);result(id,rows!=null&&!rows.isEmpty()?rows.get(0):"",null);}
        if(request==EXPORT&&exportId!=null){exportPreparing=false;String id=exportId;java.io.File file=exportFile;exportId=null;exportFile=null;if(code!=RESULT_OK||data==null||data.getData()==null){if(file!=null)file.delete();result(id,new JSONObject(),null);return;}Uri uri=data.getData();io.execute(()->{try(OutputStream output=getContentResolver().openOutputStream(uri,"wt")){if(output==null)throw new java.io.IOException();try(InputStream source=new java.io.FileInputStream(file)){byte[] buffer=new byte[32768];int count;while((count=source.read(buffer))!=-1)output.write(buffer,0,count);}result(id,new JSONObject().put("saved",true),null);}catch(Exception error){result(id,null,"无法保存文件，请重新选择位置");}finally{if(file!=null)file.delete();}});}
    }
}
