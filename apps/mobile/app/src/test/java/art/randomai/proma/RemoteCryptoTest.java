package art.randomai.proma;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

/** 编译环境就绪后运行，固定向量与桌面 remote.test.ts 相同。 */
public final class RemoteCryptoTest {
    @Test public void givenSharedVector_whenEncrypt_thenMatchesDesktop() throws Exception {
        JSONObject pairing = new JSONObject().put("key", repeat("11", 32)).put("room", repeat("22", 32)).put("hostId", "host").put("deviceId", "device");
        JSONObject packet = RemoteCrypto.sealWithNonce(pairing, 1, new JSONObject().put("hello", "你好"), RemoteCrypto.unhex(repeat("33", 12)));
        assertEquals("cb8413002954fb8dfeafbd8b31416537988b6f5dadd69837e6c08f65c9d8fedcb529", packet.getString("ciphertext"));
        assertEquals("to-host", packet.getString("direction"));
    }
    @Test public void givenDesktopResponse_whenDecrypt_thenReadsDataAndRejectsReplay() throws Exception {
        JSONObject pairing = new JSONObject().put("key", repeat("11", 32)).put("room", repeat("22", 32)).put("hostId", "host").put("deviceId", "device");
        JSONObject packet = new JSONObject().put("v", 1).put("hostId", "host").put("deviceId", "device").put("direction", "to-device").put("seq", 2).put("nonce", repeat("55", 12)).put("ciphertext", "8617f9e88657675ec37e44a0dc00b4ac56ff7552e4650705c35934");
        assertTrue(RemoteCrypto.open(pairing, 0, packet).getBoolean("ok"));
        try { RemoteCrypto.open(pairing, 2, packet); fail("重放必须被拒绝"); } catch (SecurityException expected) { assertNotNull(expected); }
        pairing.put("key", repeat("44", 32));
        try { RemoteCrypto.open(pairing, 0, packet); fail("错误密钥必须被拒绝"); } catch (javax.crypto.AEADBadTagException expected) { assertNotNull(expected); }
    }
    @Test public void givenInvalidHex_whenDecode_thenRejects() {
        try { RemoteCrypto.unhex("zz"); fail("应拒绝非法输入"); } catch (IllegalArgumentException expected) { assertNotNull(expected); }
    }
    private static String repeat(String value, int count) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < count; i++) out.append(value);
        return out.toString();
    }
}
