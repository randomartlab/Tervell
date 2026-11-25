package art.randomai.proma;

import org.json.JSONObject;
import org.junit.Test;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.FutureTask;
import static org.junit.Assert.*;

public final class PairingRecoveryTest {
    private static final class MemoryStore implements RemoteStateStore {
        private JSONObject state=new JSONObject();
        public synchronized JSONObject load() throws Exception { return new JSONObject(state.toString()); }
        public synchronized void save(JSONObject value) throws Exception { state=new JSONObject(value.toString()); }
        public synchronized void clear() { state=new JSONObject(); }
    }
    private static String repeat(String value,int count){StringBuilder b=new StringBuilder();for(int i=0;i<count;i++)b.append(value);return b.toString();}
    private static String link() throws Exception {
        JSONObject p=new JSONObject().put("v",4).put("service","random-market").put("hostId","test-host").put("deviceId","test-phone").put("key",repeat("11",32)).put("token",repeat("22",32)).put("room",repeat("33",32)).put("expiresAt",System.currentTimeMillis()+300000);
        return "proma://pair?data="+java.net.URLEncoder.encode(p.toString(),"UTF-8");
    }
    @Test public void givenLostPairReply_whenSameCodeIsPastedAgain_thenRequestAndRotatedKeysSurvive() throws Exception {
        MemoryStore store=new MemoryStore();RemoteClient client=new RemoteClient(store,(identity,packet)->{throw new java.net.SocketTimeoutException();});String code=link();client.importPairing(code);
        try{client.request("pair",new JSONObject());fail("Expected lost response");}catch(java.net.SocketTimeoutException expected){}
        JSONObject before=store.load();String id=before.getJSONObject("pendingRequest").getString("id"),key=before.getJSONObject("nextPairing").getString("key");
        client.importPairing(code);JSONObject after=store.load();assertEquals(id,after.getJSONObject("pendingRequest").getString("id"));assertEquals(key,after.getJSONObject("nextPairing").getString("key"));
        RemoteClient restarted=new RemoteClient(store,(identity,packet)->{throw new java.net.SocketTimeoutException();});
        try{restarted.request("pair",new JSONObject());fail("Expected retry");}catch(java.net.SocketTimeoutException expected){}
        assertEquals(id,store.load().getJSONObject("pendingRequest").getString("id"));assertEquals(key,store.load().getJSONObject("nextPairing").getString("key"));
    }
    @Test public void givenNetworkRequestHoldsClient_whenActivityPauses_thenForegroundUpdateNeverWaitsForNetwork() throws Exception {
        MemoryStore store=new MemoryStore();CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);RemoteClient client=new RemoteClient(store,(identity,packet)->{entered.countDown();release.await(3,TimeUnit.SECONDS);throw new java.net.SocketTimeoutException();});client.importPairing(link());
        Thread worker=new Thread(()->{try{client.request("pair",new JSONObject());}catch(Exception expected){}});worker.start();assertTrue(entered.await(1,TimeUnit.SECONDS));
        FutureTask<Boolean> lifecycle=new FutureTask<>(()->{client.setForeground(false);return true;});Thread ui=new Thread(lifecycle);ui.start();
        try{assertTrue(lifecycle.get(300,TimeUnit.MILLISECONDS));}finally{release.countDown();worker.join(2000);ui.join(1000);}
    }
    @Test public void givenNetworkErrorWithPrivateDetails_whenShown_thenFixedMessageExplainsFailedStageWithoutLeaking() {
        assertTrue(ConnectionFailure.describe(ConnectionFailure.hosted(503)).contains("电脑未在线"));
        assertTrue(ConnectionFailure.describe(ConnectionFailure.hosted(403)).contains("重新连接"));
        assertFalse(ConnectionFailure.describe(new IllegalStateException("Bearer private-token https://private.example")).contains("private"));
        assertTrue(ConnectionFailure.describe(new java.net.SocketTimeoutException()).contains("原请求已保留"));
    }
    private static MemoryStore recoveredSendStore() throws Exception {
        MemoryStore store=new MemoryStore();RemoteClient initial=new RemoteClient(store);initial.importPairing(link());
        JSONObject state=store.load();state.put("pendingRequest",new JSONObject().put("id","prior-send").put("method","send").put("sessionId","qa-session").put("text","first message").put("sentAt",1));
        state.put("lastResponse",new JSONObject().put("id","prior-send").put("ok",true).put("data",new JSONObject()));store.save(state);return store;
    }
    @Test public void givenRecoveredPreviousSend_whenRefreshingStatus_thenSafeReadContinuesWithNewIdentity() throws Exception {
        MemoryStore store=recoveredSendStore();int[] exchanges={0};RemoteClient client=new RemoteClient(store,(identity,packet)->{exchanges[0]++;throw new java.net.SocketTimeoutException();});
        try{client.request("status",new JSONObject());fail("Fixture network should stop next read");}catch(java.net.SocketTimeoutException expected){}
        assertEquals(1,exchanges[0]);assertEquals("status",store.load().getJSONObject("pendingRequest").getString("method"));assertTrue(client.consumeSentDraft("qa-session","first message"));
    }
    @Test public void givenRecoveredPreviousSend_whenAnotherMutationStarts_thenRequireRefreshWithoutSendingAgain() throws Exception {
        MemoryStore store=recoveredSendStore();int[] exchanges={0};RemoteClient client=new RemoteClient(store,(identity,packet)->{exchanges[0]++;throw new java.net.SocketTimeoutException();});
        try{client.request("send",new JSONObject().put("sessionId","qa-session").put("text","second message"));fail("Must reconcile the recovered send first");}catch(ConnectionFailure expected){assertTrue(expected.getMessage().contains("刷新会话"));}
        assertEquals(0,exchanges[0]);assertFalse(store.load().has("pendingRequest"));
    }
    @Test public void givenAlreadyPairedPhone_whenSameQrScanned_thenRotatedKeysAndConfirmationSurvive() throws Exception {
        MemoryStore store=new MemoryStore();RemoteClient client=new RemoteClient(store);String code=link();client.importPairing(code);
        JSONObject state=store.load();state.put("confirmed",true);state.getJSONObject("pairing").put("key",repeat("44",32));store.save(state);
        RemoteClient restored=new RemoteClient(store);restored.importPairing(code);
        assertTrue(restored.confirmed());assertEquals(repeat("44",32),store.load().getJSONObject("pairing").getString("key"));
        JSONObject changed=PairingCode.decode(code);changed.put("token",repeat("66",32));String tampered="proma://pair?data="+java.net.URLEncoder.encode(changed.toString(),"UTF-8");
        try{restored.importPairing(tampered);fail("Changed bootstrap must not replace working credentials");}catch(ConnectionFailure expected){assertTrue(expected.getMessage().contains("已在本机配对"));}
        assertTrue(restored.confirmed());assertEquals(repeat("44",32),store.load().getJSONObject("pairing").getString("key"));
    }
}
