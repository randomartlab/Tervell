package art.randomai.proma;

import org.json.JSONObject;
import org.junit.Test;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import static org.junit.Assert.*;

public final class TunnelTransportTest {
    @Test public void givenHiddenPairing_whenDecode_thenRestoresAuthenticatedPayload() throws Exception {
        byte[] key = new byte[32], nonce = new byte[12]; key[0] = 1; nonce[0] = 2;
        JSONObject expected = new JSONObject().put("v", 2).put("hostId", "host");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, nonce)); cipher.updateAAD("proma-pair-v2".getBytes(StandardCharsets.UTF_8));
        ByteArrayOutputStream payload = new ByteArrayOutputStream(); payload.write(nonce); payload.write(cipher.doFinal(expected.toString().getBytes(StandardCharsets.UTF_8)));
        String code = "proma://pair?code=" + Base64.getUrlEncoder().withoutPadding().encodeToString(key) + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(payload.toByteArray());
        assertEquals("host", PairingCode.decode(code).getString("hostId"));
        byte[] corrupted = payload.toByteArray(); corrupted[15] ^= 1;
        String bad = "proma://pair?code=" + Base64.getUrlEncoder().withoutPadding().encodeToString(key) + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(corrupted);
        try { PairingCode.decode(bad); fail("应拒绝篡改"); } catch (javax.crypto.AEADBadTagException expectedFailure) { assertNotNull(expectedFailure); }
    }
    @Test public void givenServerFrame_whenRead_thenReturnsBinaryPayloadAndMasksClientFrames() throws Exception {
        byte[] payload = new byte[]{1, 2, 3}; ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertArrayEquals(payload, TunnelTransport.readFrame(new ByteArrayInputStream(new byte[]{(byte) 0x82, 3, 1, 2, 3}), output));
        TunnelTransport.frame(output, 2, payload); byte[] client = output.toByteArray();
        assertEquals(0x82, client[0] & 255); assertEquals(0x83, client[1] & 255);
        for (int index = 0; index < payload.length; index++) assertEquals(payload[index], (byte) (client[6 + index] ^ client[2 + index % 4]));
    }
    @Test public void givenSplitTunnelResponse_whenParse_thenWaitsForCompleteLength() throws Exception {
        byte[] body = new JSONObject().put("packet", new JSONObject().put("v", 1)).toString().getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream response = new ByteArrayOutputStream(); response.write(new byte[]{0, 0});
        response.write(("HTTP/1.1 200 OK\r\nContent-Length: " + body.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
        assertNull(TunnelTransport.parse(response.toByteArray())); response.write(body);
        assertEquals(1, TunnelTransport.parse(response.toByteArray()).getJSONObject("packet").getInt("v"));
    }
    @Test public void givenMaskedServerFrame_whenRead_thenRejectsInvalidWireFormat() throws Exception {
        try { TunnelTransport.readFrame(new ByteArrayInputStream(new byte[]{(byte) 0x82, (byte) 0x83}), new ByteArrayOutputStream()); fail("应拒绝非法帧"); } catch (SecurityException expected) { assertNotNull(expected); }
    }
}
