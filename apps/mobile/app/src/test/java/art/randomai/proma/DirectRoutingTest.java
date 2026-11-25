package art.randomai.proma;
import org.json.JSONObject;
import org.json.JSONArray;
import org.junit.Test;
import static org.junit.Assert.*;
public class DirectRoutingTest {
    @Test public void verifiedAndOriginalAddressPrecedeUnreachableDiscoveredInterfaces() throws Exception {
        JSONObject state=new JSONObject().put("pairing",new JSONObject().put("direct",new JSONObject().put("url","https://original.invalid"))).put("direct",new JSONObject().put("candidates",new JSONArray().put(new JSONObject().put("url","https://unreachable.invalid")).put(new JSONObject().put("url","https://original.invalid")).put(new JSONObject().put("url","https://verified.invalid"))));
        DirectRouting routing=new DirectRouting(state);
        assertEquals("https://original.invalid",routing.candidates().get(0).getString("url"));
        routing.success("https://verified.invalid",4);
        assertEquals("https://verified.invalid",new DirectRouting(new JSONObject(state.toString())).candidates().get(0).getString("url"));
        routing.configure(true,true,"https://original.invalid","");assertEquals("https://original.invalid",routing.candidates().get(0).getString("url"));
    }
    @Test public void automaticProbeBudgetKeepsPublicFallbackReachable() {
        DirectRouting routing=new DirectRouting(new JSONObject());
        long now=System.nanoTime();
        assertTrue(routing.mayProbe(now,0));
        assertTrue(routing.mayProbe(now,1));
        assertFalse(routing.mayProbe(now,2));
        assertFalse(routing.mayProbe(now-5000000000L,0));
    }
    @Test public void optionsValidationAndResetPreservePairing() throws Exception {
        JSONObject state=new JSONObject().put("pairing",new JSONObject().put("hostId","retained"));DirectRouting routing=new DirectRouting(state);
        routing.configureOptions(true,false,"","",45,8,"en");
        assertEquals(45,new DirectRouting(new JSONObject(state.toString())).preferences().getInt("intervalSeconds"));
        assertEquals(8,routing.preferences().getInt("timeoutSeconds"));
        boolean invalid=false;try{routing.configureOptions(false,false,"","",0,11,"en");}catch(IllegalArgumentException expected){invalid=true;}
        assertTrue(invalid);assertTrue(routing.preferences().getBoolean("enabled"));
        routing.pause();routing.resume();assertTrue(routing.eligible(true));
        routing.exclude("https://example.invalid");routing.restoreExcluded();assertEquals(0,routing.preferences().getJSONArray("excluded").length());
        routing.clearEvents();assertEquals(0,routing.diagnostics("relay").getJSONArray("events").length());
        routing.reset();assertEquals(20,routing.preferences().getInt("intervalSeconds"));assertEquals("retained",state.getJSONObject("pairing").getString("hostId"));
    }
    @Test public void defaultsAndPersistentBackoff() throws Exception {
        JSONObject state=new JSONObject();DirectRouting routing=new DirectRouting(state);
        assertTrue(routing.preferences().getBoolean("enabled"));assertTrue(routing.eligible(true));assertFalse(routing.eligible(false));
        routing.failure();assertFalse(new DirectRouting(new JSONObject(state.toString())).eligible(true));
        assertTrue(state.getLong("directRetryAt")>System.currentTimeMillis()+29000);
        routing.success("https://example.invalid:443",2);assertTrue(routing.eligible(true));routing.pause();assertFalse(routing.eligible(true));
        routing.forwardFailure();assertFalse(new DirectRouting(new JSONObject(state.toString())).forwardEligible());routing.forwardSuccess();assertTrue(routing.forwardEligible());
    }
    @Test public void selectionAndRemovalOnlyAffectManagedInactiveAddresses() throws Exception {
        JSONObject state=new JSONObject().put("direct",new JSONObject().put("candidates",new JSONArray().put(new JSONObject().put("url","https://one.invalid:443")).put(new JSONObject().put("url","https://two.invalid:443"))));
        DirectRouting routing=new DirectRouting(state);routing.configure(true,false,"https://two.invalid:443","");assertEquals("https://two.invalid:443",routing.candidates().get(0).getString("url"));
        routing.success("https://two.invalid:443",10);boolean rejected=false;try{routing.exclude("https://two.invalid:443");}catch(Exception expected){rejected=true;}assertTrue(rejected);
        routing.exclude("https://one.invalid:443");assertEquals(1,routing.candidates().size());
        routing.tunnel(1);assertTrue(routing.preferTunnelByLatency());
        for(int i=0;i<100;i++)routing.event("network",i);assertEquals(80,routing.diagnostics("relay").getJSONArray("events").length());
        assertFalse(routing.diagnostics("relay").toString().contains("https://"));
    }
}
