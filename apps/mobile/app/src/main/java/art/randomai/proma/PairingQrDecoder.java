package art.randomai.proma;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.LuminanceSource;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.util.EnumMap;
import java.util.Map;

/** 仅在本机解码二维码；不持久化、不上传摄像头图像或配对凭据。 */
final class PairingQrDecoder {
    static String luminance(byte[] pixels, int width, int height) throws Exception {
        return decode(new PlanarYUVLuminanceSource(pixels, width, height, 0, 0, width, height, false));
    }

    static String rgb(int[] pixels, int width, int height) throws Exception {
        return decode(new RGBLuminanceSource(width, height, pixels));
    }

    static byte[] copyLuminance(ByteBuffer source, int rowStride, int pixelStride, int width, int height) {
        if (width <= 0 || height <= 0 || rowStride < width || pixelStride <= 0 || (long) width * height > 8_000_000) throw new IllegalArgumentException("相机图像格式无效");
        byte[] result = new byte[width * height];
        ByteBuffer bytes = source.duplicate();
        int start = bytes.position();
        if ((long) start + (long) (height - 1) * rowStride + (long) (width - 1) * pixelStride >= bytes.limit()) throw new IllegalArgumentException("相机图像不完整");
        for (int y = 0; y < height; y++) {
            int row = start + y * rowStride;
            for (int x = 0; x < width; x++) result[y * width + x] = bytes.get(row + x * pixelStride);
        }
        return result;
    }

    private static String decode(LuminanceSource source) throws Exception {
        Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
        hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
        QRCodeReader reader = new QRCodeReader();
        try {
            return reader.decode(new BinaryBitmap(new HybridBinarizer(source)), hints).getText();
        } catch (com.google.zxing.NotFoundException notFound) {
            reader.reset();
            return reader.decode(new BinaryBitmap(new HybridBinarizer(source.invert())), hints).getText();
        } finally {
            reader.reset();
        }
    }

    static JSONObject preview(String value, long now) throws Exception {
        JSONObject pairing = PairingCode.decode(value);
        int version = pairing.getInt("v");
        if (version < 1 || version > 4) throw new IllegalArgumentException("此配对码版本不受支持，请更新应用");
        for (String field : new String[]{"room", "token", "key"}) if (!pairing.getString(field).matches("[a-f0-9]{64}")) throw new IllegalArgumentException("这不是有效的手机配对码");
        for (String field : new String[]{"hostId", "deviceId"}) if (!pairing.getString(field).matches("[a-zA-Z0-9_-]{1,128}")) throw new IllegalArgumentException("配对电脑身份无效");
        if (pairing.getLong("expiresAt") <= now) throw new IllegalArgumentException("配对二维码已过期，请在电脑重新生成");
        if (version == 4 && !"random-market".equals(pairing.optString("service"))) throw new IllegalArgumentException("连接服务无效");
        String host = pairing.getString("hostId");
        return new JSONObject().put("service", version == 4 ? "Random创造集市 · 公网连接" : version == 3 ? "电脑直连 · 已固定证书" : "电脑加密连接")
            .put("hostHint", host.substring(0, Math.min(host.length(), 16))).put("expiresAt", pairing.getLong("expiresAt"));
    }

    private PairingQrDecoder() {}
}
