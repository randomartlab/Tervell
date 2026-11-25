package art.randomai.proma;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** 每台已配对电脑独立的选路、退避和有界元数据；不保存正文或配对凭据到诊断。 */
final class DirectRouting {
    private final JSONObject state;
    DirectRouting(JSONObject state) { this.state=state; }
    JSONObject preferences() throws Exception {
        JSONObject prefs=state.optJSONObject("directPreferences");
        if(prefs==null){prefs=new JSONObject().put("enabled",true).put("preferDirect",true).put("intervalSeconds",20).put("timeoutSeconds",3).put("language","system").put("excluded",new JSONArray()).put("selected","").put("preferredOrigin","");state.put("directPreferences",prefs);}
        return prefs;
    }
    void configure(boolean enabled,boolean preferDirect,String selected,String preferredOrigin) throws Exception {
        preferences().put("enabled",enabled).put("preferDirect",preferDirect).put("selected",selected).put("preferredOrigin",preferredOrigin);
        state.put("directRetryAt",0).put("directFailures",0);if(!selected.isEmpty())state.put("originPauseUntil",System.currentTimeMillis()+60000);
    }
    boolean eligible(boolean foreground) throws Exception {
        return foreground&&preferences().optBoolean("enabled",true)&&System.currentTimeMillis()>=state.optLong("directPauseUntil")&&System.currentTimeMillis()>=state.optLong("directRetryAt");
    }
    boolean mayProbe(long startedNanos,int attempted) {
        return attempted<2 && System.nanoTime()-startedNanos<4000000000L;
    }
    void configureOptions(boolean enabled,boolean preferDirect,String selected,String origin,int interval,int timeout,String language) throws Exception {
        if(interval<10||interval>300||timeout<1||timeout>10||!("system".equals(language)||"zh-CN".equals(language)||"en".equals(language)))throw new IllegalArgumentException("检查间隔为10–300秒，连接超时为1–10秒");
        configure(enabled,preferDirect,selected,origin);
        preferences().put("intervalSeconds",interval).put("timeoutSeconds",timeout).put("language",language);
    }
    void resume() throws Exception {state.put("directPauseUntil",0).put("directRetryAt",0).put("originPauseUntil",0).put("forwardRetryAt",0);event("manual_resume",0);}
    void restoreExcluded() throws Exception {preferences().put("excluded",new JSONArray());}
    void clearEvents() throws Exception {state.put("directEvents",new JSONArray());}
    void reset() throws Exception {state.remove("directPreferences");preferences();resume();}
    List<JSONObject> candidates() throws Exception {
        List<JSONObject> result=new ArrayList<>();JSONObject direct=state.optJSONObject("direct");JSONArray entries=direct==null?null:direct.optJSONArray("candidates"),excluded=preferences().optJSONArray("excluded");String selected=preferences().optString("selected");
        for(int i=0;entries!=null&&i<entries.length()&&i<16;i++){
            JSONObject candidate=entries.getJSONObject(i);String url=candidate.getString("url");boolean skip=false;
            for(int e=0;excluded!=null&&e<excluded.length();e++)if(url.equals(excluded.optString(e)))skip=true;
            if(!skip)result.add(candidate);
        }
        String active=state.optString("activeDirect");JSONObject pairing=state.optJSONObject("pairing"),primary=pairing==null?null:pairing.optJSONObject("direct");String original=primary==null?"":primary.optString("url");
        result.sort((a,b)->{String first=a.optString("url"),second=b.optString("url");if(first.equals(selected))return -1;if(second.equals(selected))return 1;if(first.equals(active))return -1;if(second.equals(active))return 1;if(first.equals(original))return -1;if(second.equals(original))return 1;JSONObject metrics=state.optJSONObject("directMetrics");long x=metrics==null?Long.MAX_VALUE:metrics.optLong(first,Long.MAX_VALUE),y=metrics==null?Long.MAX_VALUE:metrics.optLong(second,Long.MAX_VALUE);return Long.compare(x,y);});
        return result;
    }
    boolean forwardEligible() {return System.currentTimeMillis()>=state.optLong("forwardRetryAt")&&System.currentTimeMillis()>=state.optLong("originPauseUntil");}
    void forwardFailure() throws Exception {int attempts=Math.min(5,state.optInt("forwardFailures")+1);state.put("forwardFailures",attempts).put("forwardRetryAt",System.currentTimeMillis()+Math.min(300000,30000L<<(attempts-1)));event("forward_failed",0);}
    void forwardSuccess() throws Exception {state.put("forwardFailures",0).put("forwardRetryAt",0);event("forward_verified",0);}
    boolean preferTunnelByLatency() throws Exception {
        return System.currentTimeMillis()-state.optLong("directProbeAt")<preferences().optInt("intervalSeconds",20)*1000L&&!preferences().optBoolean("preferDirect",true)&&state.optLong("tunnelLatency",Long.MAX_VALUE)<state.optLong("directLatency",Long.MAX_VALUE);
    }
    void success(String url,long elapsed) throws Exception {
        state.put("directProbeAt",System.currentTimeMillis());JSONObject metrics=state.optJSONObject("directMetrics");if(metrics==null)metrics=new JSONObject();metrics.put(url,elapsed);state.put("directMetrics",metrics).put("directLatency",elapsed).put("directRetryAt",0).put("directFailures",0).put("activeDirect",url);
        event("direct_verified",elapsed);
    }
    void failure() throws Exception {
        state.put("directProbeAt",System.currentTimeMillis());int attempts=Math.min(5,state.optInt("directFailures")+1);state.put("directFailures",attempts).put("directRetryAt",System.currentTimeMillis()+Math.min(300000,30000L<<(attempts-1))).remove("activeDirect");event("direct_failed",0);
    }
    void tunnel(long elapsed) throws Exception {state.remove("activeDirect");state.put("tunnelLatency",elapsed);event("tunnel_verified",elapsed);}
    void pause() throws Exception {state.remove("activeDirect");state.put("directPauseUntil",System.currentTimeMillis()+60000);event("manual_tunnel",0);}
    void exclude(String url) throws Exception {
        if(url.equals(state.optString("activeDirect")))throw new IllegalStateException("当前正在使用此地址，请先切换连接");
        JSONArray old=preferences().optJSONArray("excluded"),next=new JSONArray();for(int i=0;old!=null&&i<old.length();i++)if(!url.equals(old.optString(i)))next.put(old.getString(i));if(next.length()>=64)throw new IllegalStateException("忽略地址数量已满");next.put(url);preferences().put("excluded",next);
    }
    void event(String code,long elapsed) throws Exception {
        JSONArray old=state.optJSONArray("directEvents"),next=new JSONArray();for(int i=Math.max(0,old==null?0:old.length()-79);old!=null&&i<old.length();i++)next.put(old.get(i));next.put(new JSONObject().put("at",System.currentTimeMillis()).put("code",code).put("durationMs",elapsed));state.put("directEvents",next);
    }
    JSONObject diagnostics(String transport) throws Exception {return new JSONObject().put("transport",transport).put("events",state.optJSONArray("directEvents")==null?new JSONArray():state.getJSONArray("directEvents"));}
}
