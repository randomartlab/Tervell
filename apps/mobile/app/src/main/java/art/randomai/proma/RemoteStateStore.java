package art.randomai.proma;

import org.json.JSONObject;

/** 配对状态持久层；正式应用由 Android Keystore 加密实现。 */
interface RemoteStateStore {
    JSONObject load() throws Exception;
    void save(JSONObject value) throws Exception;
    void clear();
}
