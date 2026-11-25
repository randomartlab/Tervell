package art.randomai.proma;

import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import javax.net.ssl.SNIHostName;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

final class TunnelTransport {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_BYTES = 1100000;
    static JSONObject exchange(JSONObject pairing, JSONObject packet) throws Exception {
        JSONObject tunnel = pairing.getJSONObject("tunnel");
        try (SSLSocket socket = (SSLSocket) SSLSocketFactory.getDefault().createSocket()) {
            String server = tunnel.getString("server");
            socket.connect(new InetSocketAddress(server, 443), 10000); socket.setSoTimeout(25000);
            SSLParameters parameters = socket.getSSLParameters(); parameters.setEndpointIdentificationAlgorithm("HTTPS");
            parameters.setServerNames(java.util.Collections.singletonList(new SNIHostName(server))); socket.setSSLParameters(parameters); socket.startHandshake();
            InputStream input = socket.getInputStream(); OutputStream output = socket.getOutputStream();
            byte[] randomKey = new byte[16]; RANDOM.nextBytes(randomKey);
            String key = Base64.getEncoder().encodeToString(randomKey);
            output.write(("GET " + tunnel.getString("path") + " HTTP/1.1\r\nHost: " + server + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: " + key + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII)); output.flush();
            String handshake = readHeaders(input);
            String accept = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1").digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.US_ASCII)));
            if (!handshake.startsWith("HTTP/1.1 101 ") || !header(handshake, "sec-websocket-accept").equals(accept) || !header(handshake, "upgrade").equalsIgnoreCase("websocket")) throw new SecurityException("连接校验失败");
            ByteArrayOutputStream command = new ByteArrayOutputStream(); UUID clientId = UUID.fromString(tunnel.getString("clientId"));
            command.write(0); command.write(ByteBuffer.allocate(16).putLong(clientId.getMostSignificantBits()).putLong(clientId.getLeastSignificantBits()).array());
            command.write(0); command.write(1); int port = tunnel.getInt("targetPort"); command.write(port >> 8); command.write(port & 255);
            command.write(1); command.write(new byte[]{127, 0, 0, 1});
            byte[] body = new JSONObject().put("room", pairing.getString("room")).put("packet", packet).toString().getBytes(StandardCharsets.UTF_8);
            command.write(("POST /v2/connect HTTP/1.1\r\nHost: 127.0.0.1:" + port + "\r\nAuthorization: Bearer " + pairing.getString("token") + "\r\nContent-Type: application/json\r\nContent-Length: " + body.length + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII)); command.write(body);
            frame(output, 2, command.toByteArray());
            ByteArrayOutputStream received = new ByteArrayOutputStream();
            long deadline = System.nanoTime() + 30000000000L;
            for (;;) {
                if (System.nanoTime() > deadline) throw new IllegalStateException("连接超时");
                byte[] data = readFrame(input, output);
                if (data == null) break;
                if (received.size() + data.length > MAX_BYTES) throw new SecurityException("响应过长");
                received.write(data);
                JSONObject response = parse(received.toByteArray());
                if (response != null) return response;
            }
            throw new EOFException("连接已中断");
        } catch (Exception failure) { throw new IllegalStateException("暂时无法连接电脑，请确认电脑在线后重试", failure); }
    }
    private static String header(String headers, String name) {
        for (String line : headers.split("\r\n")) { int colon = line.indexOf(':'); if (colon > 0 && line.substring(0, colon).equalsIgnoreCase(name)) return line.substring(colon + 1).trim(); }
        return "";
    }
    private static String readHeaders(InputStream input) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        while (bytes.size() < 16384) { int next = input.read(); if (next < 0) throw new EOFException(); bytes.write(next); byte[] value = bytes.toByteArray(); int size = value.length; if (size >= 4 && value[size - 4] == 13 && value[size - 3] == 10 && value[size - 2] == 13 && value[size - 1] == 10) return new String(value, StandardCharsets.US_ASCII); }
        throw new SecurityException("响应过长");
    }
    static void frame(OutputStream output, int opcode, byte[] payload) throws Exception {
        output.write(0x80 | opcode); int length = payload.length;
        if (length < 126) output.write(0x80 | length);
        else if (length <= 65535) { output.write(0x80 | 126); output.write(length >> 8); output.write(length & 255); }
        else { output.write(0x80 | 127); output.write(ByteBuffer.allocate(8).putLong(length).array()); }
        byte[] mask = new byte[4]; RANDOM.nextBytes(mask); output.write(mask);
        byte[] encoded = payload.clone(); for (int index = 0; index < encoded.length; index++) encoded[index] ^= mask[index % 4];
        output.write(encoded); output.flush();
    }
    static byte[] readFrame(InputStream input, OutputStream output) throws Exception {
        for (int controlCount = 0; controlCount < 32; controlCount++) {
            int first = input.read(), second = input.read(); if (first < 0 || second < 0) return null;
            if ((first & 0x70) != 0 || (second & 0x80) != 0) throw new SecurityException("连接帧无效");
            int opcode = first & 15; long length = second & 127;
            if (length == 126) length = ByteBuffer.wrap(read(input, 2)).getShort() & 65535;
            else if (length == 127) length = ByteBuffer.wrap(read(input, 8)).getLong();
            if (length < 0 || length > MAX_BYTES || (opcode >= 8 && (length > 125 || (first & 128) == 0))) throw new SecurityException("连接帧过长");
            byte[] bytes = read(input, (int) length);
            if (opcode == 8) return null;
            if (opcode == 9) { frame(output, 10, bytes); continue; }
            if (opcode == 10) continue;
            if (opcode != 0 && opcode != 2) throw new SecurityException("连接帧无效");
            return bytes;
        }
        throw new SecurityException("连接帧无效");
    }
    private static byte[] read(InputStream input, int size) throws Exception {
        byte[] result = new byte[size]; int offset = 0;
        while (offset < size) { int count = input.read(result, offset, size - offset); if (count < 0) throw new EOFException(); offset += count; }
        return result;
    }
    static JSONObject parse(byte[] payload) throws Exception {
        if (payload.length < 2) return null;
        if (payload[0] != 0) throw new SecurityException("连接版本无效");
        int offset = 2 + (payload[1] & 255); if (payload.length < offset) return null;
        String content = new String(payload, offset, payload.length - offset, StandardCharsets.UTF_8);
        int split = content.indexOf("\r\n\r\n"); if (split < 0) return null;
        String headers = content.substring(0, split + 4);
        if (!headers.startsWith("HTTP/1.1 200 ")) throw new IllegalStateException("电脑暂时无法处理请求");
        int length = Integer.parseInt(header(headers, "content-length"));
        if (length < 0 || length > MAX_BYTES) throw new SecurityException("响应过长");
        int headerBytes = headers.getBytes(StandardCharsets.US_ASCII).length;
        if (payload.length - offset - headerBytes < length) return null;
        return new JSONObject(new String(payload, offset + headerBytes, length, StandardCharsets.UTF_8));
    }
    private TunnelTransport() {}
}
