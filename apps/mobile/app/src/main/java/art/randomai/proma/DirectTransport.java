package art.randomai.proma;

import org.json.JSONObject;
import java.net.URL;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import javax.net.ssl.*;

/** 证书指纹只接受原有加密隧道下发值，不接受直连响应自报身份。 */
final class DirectTransport {
    static JSONObject exchange(String endpoint,String fingerprint,JSONObject pairing,JSONObject packet) throws Exception {return exchange(endpoint,fingerprint,pairing,packet,3);}
    static JSONObject exchange(String endpoint,String fingerprint,JSONObject pairing,JSONObject packet,int timeoutSeconds) throws Exception {
        return exchange(endpoint,fingerprint,pairing,packet,timeoutSeconds,25);
    }
    static JSONObject exchange(String endpoint,String fingerprint,JSONObject pairing,JSONObject packet,int timeoutSeconds,int readTimeoutSeconds) throws Exception {
        URL url=new URL(endpoint+"/v2/connect");
        if(!"https".equals(url.getProtocol())||url.getUserInfo()!=null||url.getPort()==0||!fingerprint.matches("[a-f0-9]{64}"))throw new SecurityException("直连地址无效");
        SSLContext context=SSLContext.getInstance("TLS");
        context.init(null,new TrustManager[]{new X509TrustManager(){
            public X509Certificate[] getAcceptedIssuers(){return new X509Certificate[0];}
            public void checkClientTrusted(X509Certificate[] chain,String authType) throws java.security.cert.CertificateException{throw new java.security.cert.CertificateException("仅供客户端使用");}
            public void checkServerTrusted(X509Certificate[] chain,String authType) throws java.security.cert.CertificateException{
                try{if(chain==null||chain.length==0)throw new SecurityException();chain[0].checkValidity();String actual=RemoteCrypto.hex(MessageDigest.getInstance("SHA-256").digest(chain[0].getEncoded()));if(!MessageDigest.isEqual(actual.getBytes(StandardCharsets.US_ASCII),fingerprint.getBytes(StandardCharsets.US_ASCII)))throw new SecurityException();}
                catch(Exception e){throw new java.security.cert.CertificateException("电脑证书身份不匹配",e);}
            }
        }},new SecureRandom());
        HttpsURLConnection connection=(HttpsURLConnection)url.openConnection();
        connection.setSSLSocketFactory(context.getSocketFactory());
        // 精确证书 pin 是身份依据；候选 IP 不在自签证书 SAN 中。
        connection.setHostnameVerifier((hostname,session)->{try{return fingerprint.equals(RemoteCrypto.hex(MessageDigest.getInstance("SHA-256").digest(session.getPeerCertificates()[0].getEncoded())));}catch(Exception e){return false;}});
        try{
            connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(Math.max(1000,Math.min(10000,timeoutSeconds*1000)));connection.setReadTimeout(Math.max(1000,Math.min(25000,readTimeoutSeconds*1000)));connection.setRequestMethod("POST");connection.setDoOutput(true);
            connection.setRequestProperty("Authorization","Bearer "+pairing.getString("token"));connection.setRequestProperty("Content-Type","application/json");
            byte[] bytes=new JSONObject().put("room",pairing.getString("room")).put("packet",packet).toString().getBytes(StandardCharsets.UTF_8);connection.setFixedLengthStreamingMode(bytes.length);
            try(java.io.OutputStream output=connection.getOutputStream()){output.write(bytes);}
            if(connection.getResponseCode()!=200)throw new IllegalStateException("直连暂不可用");
            try(InputStream input=connection.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int count;while((count=input.read(buffer))!=-1){if(output.size()+count>1100000)throw new SecurityException("响应过大");output.write(buffer,0,count);}return new JSONObject(output.toString("UTF-8"));}
        }finally{connection.disconnect();}
    }
}
