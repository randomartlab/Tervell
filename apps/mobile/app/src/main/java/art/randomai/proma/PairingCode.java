package art.randomai.proma;

import org.json.JSONObject;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

final class PairingCode {
    static JSONObject decode(String link) throws Exception {
        if (link.length() > 8192) throw new IllegalArgumentException("配对码无效，请重新复制");
        URI uri = URI.create(link.trim());
        boolean legacy = "proma".equals(uri.getScheme());
        if ((!legacy && !"tervell".equals(uri.getScheme())) || !"pair".equals(uri.getHost()) || uri.getRawQuery() == null || uri.getUserInfo() != null || uri.getPort() != -1 || uri.getRawFragment() != null || (uri.getPath() != null && !uri.getPath().isEmpty())) throw new IllegalArgumentException("配对码无效，请重新扫描或复制");
        String query = uri.getRawQuery();
        if (legacy && query.startsWith("data=") && !query.contains("&")) return new JSONObject(URLDecoder.decode(query.substring(5), "UTF-8"));
        if (!query.startsWith("code=") || query.contains("&")) throw new IllegalArgumentException("配对码无效，请重新复制");
        String[] parts = query.substring(5).split("\\.", -1);
        if (parts.length != 2) throw new IllegalArgumentException("配对码无效，请重新复制");
        byte[] key = Base64.getUrlDecoder().decode(parts[0]), payload = Base64.getUrlDecoder().decode(parts[1]);
        if (key.length != 32 || payload.length < 29) throw new IllegalArgumentException("配对码无效，请重新复制");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, payload, 0, 12));
        cipher.updateAAD((legacy ? "proma-pair-v2" : "tervell-pair-v3").getBytes(StandardCharsets.UTF_8));
        return new JSONObject(new String(cipher.doFinal(payload, 12, payload.length - 12), StandardCharsets.UTF_8));
    }
    private PairingCode() {}
}
