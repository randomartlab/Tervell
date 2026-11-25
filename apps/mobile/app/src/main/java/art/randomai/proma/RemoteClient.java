package art.randomai.proma;

import org.json.JSONObject;
import java.net.URI;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** 前台按需请求；HTTP 失败保留请求 ID 和发送包以便安全重试。 */
final class RemoteClient {
    interface HostedExchange { JSONObject exchange(JSONObject identity, JSONObject packet) throws Exception; }
    private final RemoteStateStore store;
    private final HostedExchange hostedExchange;
    private JSONObject state;
    private volatile boolean isConfirmed;
    private volatile String recoveredSendText;
    private volatile String recoveredSendSession;
    private volatile boolean foreground=true;
    private volatile String activeTransport="加密隧道";
    void setForeground(boolean value){foreground=value;}
    String connectionLabel(){return activeTransport;}
    synchronized String hostIdentity(){JSONObject pairing=state.optJSONObject("pairing");return pairing==null?"":pairing.optString("hostId");}
    synchronized void pauseDirect() throws Exception {new DirectRouting(state).pause();activeTransport="加密隧道";store.save(state);}
    RemoteClient(RemoteStateStore store) throws Exception { this(store, HostedTransport::exchange); }
    RemoteClient(RemoteStateStore store, HostedExchange hostedExchange) throws Exception { this.store = store; this.hostedExchange=hostedExchange; state = store.load(); isConfirmed = state.optBoolean("confirmed"); }
    synchronized boolean paired() { return state.has("pairing"); }
    boolean confirmed() { return isConfirmed; }
    synchronized boolean supportsCreate() { return !state.optBoolean("coreProtocol"); }
    synchronized void forget() { store.clear(); state = new JSONObject(); isConfirmed = false; }
    synchronized JSONObject directView() throws Exception {return new JSONObject().put("preferences",new DirectRouting(state).preferences()).put("direct",state.optJSONObject("direct")).put("retryAt",state.optLong("directRetryAt")).put("forwardRetryAt",state.optLong("forwardRetryAt")).put("pauseUntil",state.optLong("directPauseUntil")).put("activeDirect",state.optString("activeDirect")).put("management",state.optBoolean("management")).put("metrics",state.optJSONObject("directMetrics")).put("transport",activeTransport).put("diagnostics",new DirectRouting(state).diagnostics(activeTransport)).put("hosts",savedHostSummaries());}
    synchronized void configureDirect(boolean enabled,boolean preferDirect,String selected,String origin) throws Exception {new DirectRouting(state).configure(enabled,preferDirect,selected,origin);store.save(state);}
    synchronized void configureDirectOptions(boolean enabled,boolean preferDirect,String selected,String origin,int interval,int timeout,String language) throws Exception {new DirectRouting(state).configureOptions(enabled,preferDirect,selected,origin,interval,timeout,language);store.save(state);}
    synchronized void directAction(String action) throws Exception {
        DirectRouting routing=new DirectRouting(state);
        if("resume".equals(action))routing.resume();else if("restoreExcluded".equals(action))routing.restoreExcluded();else if("clearEvents".equals(action))routing.clearEvents();else if("reset".equals(action))routing.reset();else throw new IllegalArgumentException("未知连接操作");store.save(state);
    }
    synchronized JSONObject directHostSettings(JSONObject preferences) throws Exception {return request("control",new JSONObject().put("call",new JSONObject().put("operation",preferences==null?"connection.preferences":"connection.configure").put("values",preferences==null?new JSONObject():preferences)));}
    synchronized void excludeDirect(String url) throws Exception {new DirectRouting(state).exclude(url);store.save(state);}
    synchronized JSONObject reportDirect() throws Exception {return request("control",new JSONObject().put("call",new JSONObject().put("operation","connection.report").put("values",new DirectRouting(state).diagnostics(activeTransport))));}
    private JSONObject savedHosts() throws Exception {JSONObject hosts=state.optJSONObject("savedHosts");if(hosts==null){hosts=new JSONObject();state.put("savedHosts",hosts);}return hosts;}
    private void rememberCurrent() throws Exception {if(!isConfirmed||!state.has("pairing"))return;JSONObject snapshot=new JSONObject(state.toString());snapshot.remove("savedHosts");savedHosts().put(state.getJSONObject("pairing").getString("hostId"),snapshot);}
    private org.json.JSONArray savedHostSummaries() throws Exception {org.json.JSONArray result=new org.json.JSONArray();java.util.Iterator<String> ids=savedHosts().keys();while(ids.hasNext()){String id=ids.next();if(!id.equals(state.getJSONObject("pairing").getString("hostId")))result.put(new JSONObject().put("id",id));}return result;}
    synchronized void switchHost(String id) throws Exception {if(state.has("pendingRequest"))throw new IllegalStateException("先完成上次请求再切换电脑");rememberCurrent();JSONObject hosts=savedHosts(),target=hosts.getJSONObject(id);state=new JSONObject(target.toString()).put("savedHosts",hosts);isConfirmed=state.optBoolean("confirmed");activeTransport="加密隧道";store.save(state);}
    private JSONObject forwardPacket(String origin,JSONObject packet) throws Exception {
        JSONObject other=savedHosts().optJSONObject(origin),targetPairing=state.getJSONObject("pairing");
        if(other==null||!other.optBoolean("confirmed"))throw new SecurityException("中继电脑未配对");
        JSONObject path=other.optJSONObject("direct");if(path==null)throw new IllegalStateException("中继电脑没有已验证候选");
        JSONObject target=null;org.json.JSONArray targets=path.optJSONArray("targets");for(int i=0;targets!=null&&i<targets.length();i++)if(targetPairing.getString("hostId").equals(targets.getJSONObject(i).optString("hostId")))target=targets.getJSONObject(i);
        if(target==null)throw new SecurityException("中继电脑未登记当前目标");
        JSONObject identity=other.getJSONObject("pairing");if(packet.toString().length()>120000)throw new IllegalStateException("较大内容使用目标原有连接");long seq=other.optLong("tx")+1;String id=UUID.randomUUID().toString();
        JSONObject call=new JSONObject().put("operation","connection.forward").put("values",new JSONObject().put("targetId",target.getString("id")).put("room",targetPairing.getString("room")).put("token",targetPairing.getString("token")).put("packet",packet));
        JSONObject forwarded=RemoteCrypto.seal(identity,seq,new JSONObject().put("id",id).put("sentAt",System.currentTimeMillis()).put("method","control").put("call",call));
        other.put("tx",seq);store.save(state);
        for(JSONObject candidate:new DirectRouting(other).candidates())try{
            JSONObject response=DirectTransport.exchange(candidate.getString("url"),path.getString("certificateSha256"),identity,forwarded).getJSONObject("packet"),reply=RemoteCrypto.open(identity,other.optLong("rx"),response);
            if(!id.equals(reply.getString("id"))||!reply.optBoolean("ok"))throw new SecurityException("中继未确认");other.put("rx",response.getLong("seq"));store.save(state);
            JSONObject received=reply.getJSONObject("data").getJSONObject("packet"),targetResponse=RemoteCrypto.open(targetPairing,state.getLong("rx"),received);if(!targetResponse.getString("id").equals(requestId(packet)))throw new SecurityException("目标响应身份不匹配");return received;
        }catch(Exception unavailable){/* 同一中继请求可重试；目标请求在两种通路共用去重记录。 */}
        throw new IllegalStateException("中继路径暂不可用");
    }
    synchronized void importPairing(String link) throws Exception {
        if (link.length() > 8192) throw new IllegalArgumentException("配对链接过长");
        JSONObject pairing;
        try { pairing = PairingCode.decode(link); } catch (Exception invalid) { throw new IllegalArgumentException("配对码无效，请重新复制"); }
        int version = pairing.getInt("v");
        if (version == 1) {
            URI relay = URI.create(pairing.getString("relay"));
            if (!"https".equals(relay.getScheme()) || relay.getHost() == null || relay.getUserInfo() != null || relay.getQuery() != null || relay.getFragment() != null || !pairing.getString("relay").endsWith("/")) throw new IllegalArgumentException("配对码无效，请重新复制");
        } else if (version == 2) {
            JSONObject tunnel = pairing.getJSONObject("tunnel");
            if (!tunnel.getString("server").matches("[a-z0-9][a-z0-9.-]{0,252}") || tunnel.getInt("port") != 443 || !tunnel.getString("path").matches("/[a-zA-Z0-9_-]{16,128}") || !"127.0.0.1".equals(tunnel.getString("targetHost")) || tunnel.getInt("targetPort") < 1024 || tunnel.getInt("targetPort") > 65535) throw new IllegalArgumentException("配对码无效，请重新复制");
            UUID.fromString(tunnel.getString("clientId"));
        } else if(version==3){
            JSONObject direct=pairing.getJSONObject("direct");URI endpoint=URI.create(direct.getString("url"));
            if(!"https".equals(endpoint.getScheme())||endpoint.getHost()==null||endpoint.getUserInfo()!=null||endpoint.getQuery()!=null||endpoint.getFragment()!=null||!("".equals(endpoint.getPath())||"/".equals(endpoint.getPath()))||!direct.getString("certificateSha256").matches("[a-f0-9]{64}"))throw new IllegalArgumentException("配对码无效，请重新复制");
        } else if(version==4){
            if(!"random-market".equals(pairing.getString("service")))throw new IllegalArgumentException("连接服务无效");
        } else throw new IllegalArgumentException("请更新手机端后重试");
        for (String field : new String[]{"room", "token", "key"}) if (!pairing.getString(field).matches("[a-f0-9]{64}")) throw new IllegalArgumentException("配对凭据格式无效");
        for (String field : new String[]{"hostId", "deviceId"}) if (!pairing.getString(field).matches("[a-zA-Z0-9_-]{1,128}")) throw new IllegalArgumentException("配对身份无效");
        if (pairing.getLong("expiresAt") < System.currentTimeMillis()) throw new IllegalArgumentException("配对链接已过期");
        String digest=RemoteCrypto.hex(java.security.MessageDigest.getInstance("SHA-256").digest(link.trim().getBytes(StandardCharsets.UTF_8)));
        JSONObject current=state.optJSONObject("pairing");
        // 扫描已由本机成功使用的二维码时恢复现有连接，不能丢弃轮换后的长期密钥。
        if(isConfirmed&&current!=null&&current.optString("hostId").equals(pairing.getString("hostId"))&&current.optString("deviceId").equals(pairing.getString("deviceId"))){
            if(digest.equals(state.optString("pairingLinkDigest")))return;
            throw new ConnectionFailure("这台电脑已在本机配对，请返回现有连接；添加新手机需要电脑重新生成二维码");
        }
        // 首次回包可能在切换浏览器或断网时丢失；同一码重试必须保留原请求及轮换密钥。
        if (!isConfirmed && state.has("pendingRequest") && "pair".equals(state.getJSONObject("pendingRequest").optString("method")) && state.has("nextPairing") && RemoteJson.equal(state.optJSONObject("pairing"), pairing)) return;
        rememberCurrent();JSONObject previousHosts=savedHosts();
        isConfirmed = false;
        state = new JSONObject().put("savedHosts",previousHosts).put("pairing", pairing).put("pairingLinkDigest",digest).put("tx", 0).put("rx", 0);
        store.save(state);
    }
    private JSONObject call(String action, JSONObject body) throws Exception {
        return callAs(action, body, state.getJSONObject("pairing"));
    }
    private JSONObject callAs(String action, JSONObject body, JSONObject pairing) throws Exception {
        URL url = new URL(pairing.getString("relay") + "v1/rooms/" + pairing.getString("room") + "/device/" + action);
        HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
        try {
            conn.setInstanceFollowRedirects(false); conn.setConnectTimeout(10000); conn.setReadTimeout(23000);
            conn.setRequestMethod("POST"); conn.setDoOutput(true);
            conn.setRequestProperty("Authorization", "Bearer " + pairing.getString("token"));
            conn.setRequestProperty("Content-Type", "application/json");
            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            conn.setFixedLengthStreamingMode(bytes.length);
            try (java.io.OutputStream output = conn.getOutputStream()) { output.write(bytes); }
            int code = conn.getResponseCode();
            if (code != 200) throw new IllegalStateException(code == 403 ? "设备离线、已撤销或中转重启，等待电脑重新登记" : "中转响应 " + code);
            try (InputStream input = conn.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 1000000) throw new SecurityException("响应超出限制");
                    output.write(buffer, 0, count);
                }
                return new JSONObject(output.toString("UTF-8"));
            }
        } finally { conn.disconnect(); }
    }
    synchronized JSONObject request(String method, JSONObject params) throws Exception {
        if (state.optBoolean("coreProtocol") && !"pair".equals(method) && !"rpc".equals(method) && !"control".equals(method)) return coreRequest(method, params);
        if (!paired()) throw new IllegalStateException("请先配对");
        // 重连时保持原 ID，更新时钟与序号，主机使用持久化结果去重。
        if (state.has("pendingRequest")) {
            JSONObject prior = state.getJSONObject("pendingRequest");
            JSONObject result = sendRequest(prior);
            if (sameParams(prior, method, params)) return result;
            if (!isSafeRead(method, params)) throw new ConnectionFailure("已恢复上次操作，请先刷新会话核对结果，再继续操作");
        }
        JSONObject request = new JSONObject(params.toString()).put("id", UUID.randomUUID().toString()).put("sentAt", System.currentTimeMillis()).put("method", method);
        if (method.equals("pair")) {
            java.security.SecureRandom random = new java.security.SecureRandom();
            byte[] key = new byte[32], token = new byte[32]; random.nextBytes(key); random.nextBytes(token);
            JSONObject next = new JSONObject(state.getJSONObject("pairing").toString()).put("key", RemoteCrypto.hex(key)).put("token", RemoteCrypto.hex(token));
            state.put("nextPairing", next);
            request.put("deviceKey", next.getString("key")).put("deviceToken", next.getString("token"));
        }
        if (request.toString().getBytes(StandardCharsets.UTF_8).length > 420000) throw new IllegalArgumentException("操作内容过大，请分批提交");
        state.put("pendingRequest", request); store.save(state);
        return sendRequest(request);
    }
    private static boolean isSafeRead(String method, JSONObject params) {
        if ("status".equals(method) || "sessions".equals(method) || "messages".equals(method) || "approvals".equals(method) || "interactions".equals(method)) return true;
        JSONObject call = params.optJSONObject("call");
        if (!"control".equals(method) || call == null) return false;
        String operation = call.optString("operation");
        return "catalog".equals(operation) || "workspace.mobile".equals(operation) || "session.timeline".equals(operation) || "session.entry".equals(operation) || "session.detail".equals(operation) || "plugins.mobile-bundle".equals(operation) || "plugins.mobile-result".equals(operation);
    }
    private boolean sameParams(JSONObject prior, String method, JSONObject params) throws Exception {
        if (!prior.getString("method").equals(method)) return false;
        java.util.Iterator<String> keys = params.keys();
        while (keys.hasNext()) { String key = keys.next();  if (!RemoteJson.equal(params.get(key),prior.opt(key))) return false; }
        int expected = params.length() + 3 + ("pair".equals(method) ? 2 : 0);
        return prior.length() == expected;
    }
    private JSONObject sendRequest(JSONObject request) throws Exception {
        JSONObject cached = state.optJSONObject("lastResponse");
        if (cached != null && cached.getString("id").equals(request.getString("id"))) return complete(cached);
        request.put("sentAt", System.currentTimeMillis());
        long seq = state.getLong("tx") + 1;
        state.put("pendingId", request.getString("id"));
        state.put("tx", seq).put("pending", RemoteCrypto.seal(state.getJSONObject("pairing"), seq, request));
        store.save(state);
        return perform(state.getJSONObject("pending"));
    }
    private JSONObject perform(JSONObject packet) throws Exception {
        JSONObject next = state.optJSONObject("nextPairing");
        if (state.getJSONObject("pairing").getInt("v") >= 2) {
            JSONObject responsePacket=null;
            DirectRouting routing=new DirectRouting(state);
            JSONObject direct=state.optJSONObject("direct");
            if(isConfirmed&&routing.eligible(foreground)){
                String origin=routing.preferences().optString("preferredOrigin");
                if(!origin.isEmpty()&&routing.forwardEligible())try{responsePacket=forwardPacket(origin,packet);routing.forwardSuccess();activeTransport="已验证 PC 中继";}catch(Exception unavailable){routing.forwardFailure();}
                boolean latencyTunnel=routing.preferTunnelByLatency();
                if(responsePacket==null&&!latencyTunnel&&direct!=null){
                    long probeStarted=System.nanoTime();int attempted=0;
                    for(JSONObject candidate:routing.candidates())try{
                        if(!routing.mayProbe(probeStarted,attempted++))break;
                        long started=System.nanoTime();String url=candidate.getString("url");
                        JSONObject received=DirectTransport.exchange(url,direct.getString("certificateSha256"),state.getJSONObject("pairing"),packet,Math.min(2,routing.preferences().optInt("timeoutSeconds",3)),2).getJSONObject("packet");
                        JSONObject verified=RemoteCrypto.open(state.getJSONObject("pairing"),state.getLong("rx"),received);
                        if(!verified.getString("id").equals(requestId(packet)))throw new SecurityException("响应身份无效");
                        routing.success(url,(System.nanoTime()-started)/1000000);responsePacket=received;activeTransport="已验证直连";break;
                    }catch(Exception unavailable){/* 候选失败不会改变目标配对或请求身份。 */}
                    if(responsePacket==null)routing.failure();
                }
            }
            if(responsePacket==null){
                long started=System.nanoTime();JSONObject identity=state.getJSONObject("pairing");
                if(identity.getInt("v")==3){JSONObject primary=identity.getJSONObject("direct");responsePacket=DirectTransport.exchange(primary.getString("url"),primary.getString("certificateSha256"),identity,packet,routing.preferences().optInt("timeoutSeconds",3)).getJSONObject("packet");activeTransport="同一网络已连接";}
                else if(identity.getInt("v")==4){activeTransport="Random创造集市";responsePacket=hostedExchange.exchange(identity,packet).getJSONObject("packet");routing.tunnel((System.nanoTime()-started)/1000000);}
                else {activeTransport="加密隧道";responsePacket=TunnelTransport.exchange(identity,packet).getJSONObject("packet");routing.tunnel((System.nanoTime()-started)/1000000);}
            }
            JSONObject response = RemoteCrypto.open(next == null ? state.getJSONObject("pairing") : next, state.getLong("rx"), responsePacket);
            if (!response.getString("id").equals(requestId(packet))) throw new SecurityException("响应身份无效");
            state.put("rx", responsePacket.getLong("seq")).put("lastResponse", response); store.save(state);
            return complete(response);
        }
        try { call("push", packet); } catch (IllegalStateException e) {
            if (next == null) throw e;
            callAs("push", packet, next);
        }
        long deadline = System.currentTimeMillis() + 45000;
        while (System.currentTimeMillis() < deadline) {
            JSONObject polled;
            try { polled = next == null ? call("poll", new JSONObject()) : callAs("poll", new JSONObject(), next); }
            catch (IllegalStateException e) { if (next == null) throw e; Thread.sleep(500); continue; }
            if (polled.isNull("packet")) continue;
            JSONObject responsePacket = polled.getJSONObject("packet");
            if (responsePacket.getLong("seq") <= state.getLong("rx")) {
                callAs("ack", new JSONObject().put("seq", responsePacket.getLong("seq")), next == null ? state.getJSONObject("pairing") : next); continue;
            }
            JSONObject response = RemoteCrypto.open(next == null ? state.getJSONObject("pairing") : next, state.getLong("rx"), responsePacket);
            state.put("rx", responsePacket.getLong("seq"));
            if (response.getString("id").equals(requestId(packet))) state.put("lastResponse", response); // 落盘后再确认，进程中断仍可恢复配对结果。
            store.save(state);
            callAs("ack", new JSONObject().put("seq", responsePacket.getLong("seq")), next == null ? state.getJSONObject("pairing") : next);
            if (!response.getString("id").equals(requestId(packet))) continue;
            return complete(response);
        }
        throw new IllegalStateException("电脑未响应；保持电脑在线后重试，消息不会重复执行");
    }
    private JSONObject complete(JSONObject response) throws Exception {
        JSONObject pending = state.getJSONObject("pendingRequest");
        String method = pending.getString("method");
        boolean discovery="status".equals(method)||"control".equals(method)&&"connection.discovery".equals(pending.getJSONObject("call").optString("operation"));
        if(response.optBoolean("ok")&&discovery&&response.optJSONObject("data")!=null){state.put("management",response.getJSONObject("data").optBoolean("management"));JSONObject direct=response.getJSONObject("data").optJSONObject("direct");if(direct!=null){if(direct.optBoolean("enabled")&&direct.optBoolean("ready"))state.put("direct",direct);else state.remove("direct");}}
        if (response.getBoolean("ok") && method.equals("send")) {
            recoveredSendText = pending.getString("text"); recoveredSendSession = pending.getString("sessionId");
        }
        if (response.getBoolean("ok") && method.equals("rpc")) {
            JSONObject operation = pending.getJSONObject("request");
            if ("session.send".equals(operation.getString("method"))) {
                recoveredSendText = operation.getJSONObject("params").getString("text"); recoveredSendSession = operation.getJSONObject("params").getString("id");
            }
        }
        if(response.getBoolean("ok")&&"control".equals(method)&&"session.queue".equals(pending.getJSONObject("call").optString("operation"))){JSONObject call=pending.getJSONObject("call");recoveredSendText=call.getJSONObject("values").getString("text");recoveredSendSession=call.getString("sessionId");}
        state.remove("pending"); state.remove("pendingRequest");
        if (response.getBoolean("ok") && method.equals("pair")) {
            JSONObject next = state.getJSONObject("nextPairing");
            next.put("expiresAt", response.getJSONObject("data").getLong("expiresAt"));
            isConfirmed = true;
            state.put("pairing", next).put("confirmed", true).put("coreProtocol", "core".equals(response.getJSONObject("data").optString("protocol"))); state.remove("nextPairing");
        }
        store.save(state);
        if (!response.getBoolean("ok")) throw new ConnectionFailure(response.optString("error", "电脑拒绝了这次请求，请检查会话状态与项目授权"));
        return response.optJSONObject("data") == null ? new JSONObject() : response.getJSONObject("data");
    }
    boolean consumeSentDraft(String session, String text) {
        if (session != null && session.equals(recoveredSendSession) && text.equals(recoveredSendText)) {
            recoveredSendText = null; recoveredSendSession = null; return true;
        }
        return false;
    }
    private String requestId(JSONObject packet) throws Exception { return state.getString("pendingId"); }
    private JSONObject coreRpc(String method, JSONObject params) throws Exception {
        return request("rpc", new JSONObject().put("request", new JSONObject().put("clientKind", "mobile").put("requestId", UUID.randomUUID().toString()).put("method", method).put("params", params)));
    }
    private JSONObject coreRequest(String method, JSONObject params) throws Exception {
        String selected = params.optString("sessionId");
        JSONObject session = new JSONObject().put("id", selected);
        switch (method) {
            case "sessions": {
                JSONObject result = coreRpc("session.list", new JSONObject().put("limit", 100));
                org.json.JSONArray entries = result.getJSONArray("entries"), sessions = new org.json.JSONArray();
                for (int index = 0; index < entries.length(); index++) {
                    JSONObject item = entries.getJSONObject(index);
                    sessions.put(new JSONObject().put("id", item.getString("id")).put("title", item.optString("title")).put("workspaceId", item.optString("workspaceId")).put("updatedAt", item.getLong("updatedAt")));
                }
                return new JSONObject().put("sessions", sessions).put("hasMore", result.getJSONObject("pageInfo").getBoolean("hasMore"));
            }
            case "messages": {
                JSONObject response = coreRpc("session.timeline", session.put("direction", "tail").put("wholeTurns", true).put("limit", 80));
                org.json.JSONArray rows = response.getJSONArray("rows"), messages = new org.json.JSONArray();
                for (int index = 0; index < rows.length(); index++) {
                    JSONObject row = rows.getJSONObject(index);
                    messages.put(new JSONObject().put("id", row.getString("id")).put("role", row.optString("role", "assistant")).put("content", row.getString("summary")).put("createdAt", 0));
                }
                JSONObject current = coreRpc("session.events", new JSONObject().put("id", selected).put("afterSeq", 0).put("limit", 1));
                String status = current.optString("executionStatus");
                return new JSONObject().put("messages", messages).put("before", 0).put("hasOlder", false).put("olderOnHost", response.getBoolean("hasOlder")).put("running", "running".equals(status) || "queued".equals(status)).put("liveText", "").put("revision", response.optString("epoch") + ":" + messages.toString().hashCode());
            }
            case "send": return coreRpc("session.send", session.put("text", params.getString("text")).put("clientMessageId", params.getString("clientMessageId")));
            case "stop": return coreRpc("session.interrupt", session);
            case "approvals": {
                JSONObject result = coreRpc("approval.list", new JSONObject()); org.json.JSONArray rows = result.getJSONArray("approvals"), approvals = new org.json.JSONArray();
                for (int index = 0; index < rows.length(); index++) {
                    JSONObject row = rows.getJSONObject(index); org.json.JSONArray decisions = row.optJSONArray("allowedDecisions");
                    approvals.put(new JSONObject().put("requestId", row.getString("id")).put("sessionId", row.getString("sessionId")).put("toolName", row.getString("kind")).put("description", row.getString("request")).put("canApprove", decisions == null || decisions.toString().contains("\"allow\"")));
                }
                return new JSONObject().put("approvals", approvals);
            }
            case "approve": return coreRpc("approval.respond", new JSONObject().put("requestId", params.getString("requestId")).put("decision", params.getString("decision")));
            case "interactions": return new JSONObject().put("interactions", new org.json.JSONArray());
            case "status": return request("control",new JSONObject().put("call",new JSONObject().put("operation","connection.discovery").put("values",new JSONObject())));
            case "create": throw new IllegalStateException("请在电脑创建会话");
            default: throw new IllegalArgumentException("请更新手机端后重试");
        }
    }
}
