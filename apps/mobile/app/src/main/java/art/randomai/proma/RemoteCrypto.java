package art.randomai.proma;

import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/** RFC 5869 HKDF-SHA256 + AES-256-GCM，与桌面 crypto.ts 共享固定测试向量。 */
public final class RemoteCrypto {
    private static final SecureRandom RANDOM = new SecureRandom();
    public static byte[] unhex(String value) {
        if (!value.matches("(?:[a-f0-9]{2})+")) throw new IllegalArgumentException("无效十六进制");
        byte[] result = new byte[value.length() / 2];
        for (int i = 0; i < result.length; i++) result[i] = (byte) Integer.parseInt(value.substring(i * 2, i * 2 + 2), 16);
        return result;
    }
    public static String hex(byte[] value) {
        StringBuilder out = new StringBuilder();
        for (byte item : value) out.append(String.format(java.util.Locale.ROOT, "%02x", item & 255));
        return out.toString();
    }
    private static byte[] key(JSONObject pairing, String direction) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(unhex(pairing.getString("room")), "HmacSHA256"));
        byte[] prk = mac.doFinal(unhex(pairing.getString("key")));
        mac.init(new SecretKeySpec(prk, "HmacSHA256"));
        mac.update(("proma-remote-v1:" + direction).getBytes(StandardCharsets.UTF_8));
        return mac.doFinal(new byte[] { 1 });
    }
    private static byte[] aad(JSONObject packet) throws Exception {
        return ("proma-remote-v1|" + packet.getString("hostId") + "|" + packet.getString("deviceId") + "|" + packet.getString("direction") + "|" + packet.getLong("seq")).getBytes(StandardCharsets.UTF_8);
    }
    public static JSONObject seal(JSONObject pairing, long seq, JSONObject request) throws Exception {
        byte[] nonce = new byte[12]; RANDOM.nextBytes(nonce);
        return sealWithNonce(pairing, seq, request, nonce);
    }
    static JSONObject sealWithNonce(JSONObject pairing, long seq, JSONObject request, byte[] nonce) throws Exception {
        JSONObject packet = new JSONObject().put("v", 1).put("hostId", pairing.getString("hostId")).put("deviceId", pairing.getString("deviceId")).put("direction", "to-host").put("seq", seq);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key(pairing, "to-host"), "AES"), new GCMParameterSpec(128, nonce));
        cipher.updateAAD(aad(packet));
        return packet.put("nonce", hex(nonce)).put("ciphertext", hex(cipher.doFinal(request.toString().getBytes(StandardCharsets.UTF_8))));
    }
    public static JSONObject open(JSONObject pairing, long lastSeq, JSONObject packet) throws Exception {
        if (packet.getInt("v") != 1 || !packet.getString("hostId").equals(pairing.getString("hostId")) || !packet.getString("deviceId").equals(pairing.getString("deviceId")) || !packet.getString("direction").equals("to-device") || packet.getLong("seq") <= lastSeq) throw new SecurityException("身份或序号无效");
        byte[] nonce = unhex(packet.getString("nonce"));
        if (nonce.length != 12 || packet.getString("ciphertext").length() > 900000) throw new SecurityException("数据包无效");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key(pairing, "to-device"), "AES"), new GCMParameterSpec(128, nonce));
        cipher.updateAAD(aad(packet));
        return new JSONObject(new String(cipher.doFinal(unhex(packet.getString("ciphertext"))), StandardCharsets.UTF_8));
    }
    private RemoteCrypto() {}
}
