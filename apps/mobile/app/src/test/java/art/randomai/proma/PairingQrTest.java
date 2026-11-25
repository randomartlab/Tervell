package art.randomai.proma;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.json.JSONObject;
import org.junit.Test;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import static org.junit.Assert.*;

public final class PairingQrTest {
    private String link(boolean legacy, long expires) throws Exception {
        JSONObject expected = new JSONObject().put("v",4).put("service","random-market").put("hostId","qa-host").put("deviceId","qa-phone").put("room","a".repeat(64)).put("token","b".repeat(64)).put("key","c".repeat(64)).put("expiresAt",expires);
        byte[] key = new byte[32], nonce = new byte[12]; key[0] = 27; nonce[0] = 41;
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,nonce));cipher.updateAAD((legacy?"proma-pair-v2":"tervell-pair-v3").getBytes(StandardCharsets.UTF_8));
        byte[] encrypted=cipher.doFinal(expected.toString().getBytes(StandardCharsets.UTF_8)),payload=new byte[nonce.length+encrypted.length];System.arraycopy(nonce,0,payload,0,12);System.arraycopy(encrypted,0,payload,12,encrypted.length);
        return (legacy?"proma":"tervell")+"://pair?code="+Base64.getUrlEncoder().withoutPadding().encodeToString(key)+"."+Base64.getUrlEncoder().withoutPadding().encodeToString(payload);
    }
    @Test public void givenPublicPairingQr_whenCameraAndImageDecode_thenNewIdentityAndTrustPreviewMatch() throws Exception {
        String value=link(false,2000);Map<EncodeHintType,Object> hints=new EnumMap<>(EncodeHintType.class);hints.put(EncodeHintType.ERROR_CORRECTION,ErrorCorrectionLevel.L);hints.put(EncodeHintType.MARGIN,3);
        BitMatrix qr=new QRCodeWriter().encode(value,BarcodeFormat.QR_CODE,900,900,hints);int width=qr.getWidth(),height=qr.getHeight();byte[] y=new byte[width*height];int[] rgb=new int[y.length];
        for(int row=0;row<height;row++)for(int x=0;x<width;x++){int at=row*width+x;boolean black=qr.get(x,row);y[at]=(byte)(black?0:255);rgb[at]=black?0xff000000:0xffffffff;}
        assertEquals(value,PairingQrDecoder.luminance(y,width,height));assertEquals(value,PairingQrDecoder.rgb(rgb,width,height));
        // Camera planes often pad each row and expose a non-zero ByteBuffer position.
        int stride=width+13;ByteBuffer padded=ByteBuffer.allocate(7+stride*height);padded.position(7);for(int row=0;row<height;row++)for(int x=0;x<width;x++)padded.put(7+row*stride+x,y[row*width+x]);
        assertEquals(value,PairingQrDecoder.luminance(PairingQrDecoder.copyLuminance(padded,stride,1,width,height),width,height));
        JSONObject preview=PairingQrDecoder.preview(value,1000);assertEquals("qa-host",preview.getString("hostHint"));assertTrue(preview.getString("service").contains("Random创造集市"));assertFalse(preview.has("key"));assertFalse(preview.has("token"));
    }
    @Test public void givenLegacyLink_whenDecode_thenCompatibilityRemainsButPrefixCannotBeRelabelled() throws Exception {
        assertEquals(4,PairingCode.decode(link(true,2000)).getInt("v"));
        try{PairingCode.decode(link(false,2000).replace("tervell://","proma://"));fail("不能只改前缀绕过认证");}catch(javax.crypto.AEADBadTagException expected){assertNotNull(expected);}
    }
    @Test public void givenExpiredOrForeignQr_whenPreview_thenNeverConnectOrOpenWebsite() throws Exception {
        for(String value:new String[]{link(false,999),"https://example.invalid/","tervell://pair?code=bad","tervell://pair?data=%7B%7D",link(false,2000)+"&other=1",link(false,2000)+"#fragment"}){
            try{PairingQrDecoder.preview(value,1000);fail("必须拒绝无效、过期或非配对码");}catch(Exception expected){assertNotNull(expected);}
        }
    }
}
