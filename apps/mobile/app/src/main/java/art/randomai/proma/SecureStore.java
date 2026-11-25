package art.randomai.proma;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.JSONObject;
import java.security.KeyStore;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** 设备凭据由 Android Keystore 密钥加密；禁止系统备份转移。 */
final class SecureStore implements RemoteStateStore {
    private final SharedPreferences prefs;
    private final SecretKey key;
    SecureStore(Context context) throws Exception {
        prefs = context.getSharedPreferences("remote-private", Context.MODE_PRIVATE);
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        String alias = "proma-remote-v1";
        if (!store.containsAlias(alias)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        key = (SecretKey) store.getKey(alias, null);
    }
    public synchronized JSONObject load() throws Exception {
        String raw = prefs.getString("encrypted", null);
        if (raw == null) return new JSONObject();
        JSONObject record = new JSONObject(raw);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, Base64.decode(record.getString("iv"), Base64.NO_WRAP)));
        return new JSONObject(new String(cipher.doFinal(Base64.decode(record.getString("data"), Base64.NO_WRAP)), StandardCharsets.UTF_8));
    }
    public synchronized void save(JSONObject value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key);
        JSONObject record = new JSONObject().put("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)).put("data", Base64.encodeToString(cipher.doFinal(value.toString().getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP));
        if (!prefs.edit().putString("encrypted", record.toString()).commit()) throw new IllegalStateException("凭据保存失败");
    }
    public synchronized void clear() { prefs.edit().clear().commit(); }
}
