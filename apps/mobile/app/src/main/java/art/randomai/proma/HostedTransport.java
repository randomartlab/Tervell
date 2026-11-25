package art.randomai.proma;

import org.json.JSONObject;
import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** 公开固定入口；只转发端到端密文，不携带服务器登记或管理凭据。 */
final class HostedTransport {
    static JSONObject exchange(JSONObject pairing, JSONObject packet) throws Exception {
        if (pairing.getInt("v") != 4 || !"random-market".equals(pairing.getString("service"))) throw new IllegalArgumentException("连接服务无效");
        HttpsURLConnection connection = (HttpsURLConnection) new URL("https://randomai.art/connect/exchange").openConnection();
        try {
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + pairing.getString("token"));
            byte[] bytes = new JSONObject().put("hostId", pairing.getString("hostId")).put("deviceId", pairing.getString("deviceId")).put("packet", packet).toString().getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(bytes.length);
            try (java.io.OutputStream output = connection.getOutputStream()) { output.write(bytes); }
            int code = connection.getResponseCode();
            if (code != 200) throw ConnectionFailure.hosted(code);
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 1000000) throw new SecurityException("响应超出限制");
                    output.write(buffer, 0, count);
                }
                return new JSONObject(output.toString("UTF-8"));
            }
        } finally { connection.disconnect(); }
    }
}
