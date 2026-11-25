package art.randomai.proma;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public final class RemoteJsonTest {
    @Test public void givenRetriedControl_whenKeysReordered_thenSameNestedPayload() throws Exception {
        JSONObject first=new JSONObject("{\"call\":{\"values\":{\"rules\":[1,2],\"flag\":true},\"operation\":\"routing.save\"}}");
        JSONObject retry=new JSONObject("{\"call\":{\"operation\":\"routing.save\",\"values\":{\"flag\":true,\"rules\":[1.0,2.0]}}}");
        assertTrue(RemoteJson.equal(first,retry));
        retry.getJSONObject("call").getJSONObject("values").put("flag",false);
        assertFalse(RemoteJson.equal(first,retry));
    }
    @Test public void givenChangedArrayOrExtraField_whenCompare_thenDifferent() throws Exception {
        assertFalse(RemoteJson.equal(new JSONObject("{\"ids\":[1,2]}"),new JSONObject("{\"ids\":[2,1]}")));
        assertFalse(RemoteJson.equal(new JSONObject("{\"id\":\"a\"}"),new JSONObject("{\"id\":\"a\",\"scope\":\"admin\"}")));
        assertTrue(RemoteJson.equal(JSONObject.NULL,JSONObject.NULL));
    }
}
