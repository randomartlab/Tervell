package art.randomai.proma;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Iterator;

/** JSON 内容相等，不依赖 JSONObject 实例身份或属性写入顺序。 */
final class RemoteJson {
    static boolean equal(Object left,Object right) throws Exception {
        if(left==right)return true;
        if(left==null||right==null||left==JSONObject.NULL||right==JSONObject.NULL)return false;
        if(left instanceof JSONObject&&right instanceof JSONObject){
            JSONObject a=(JSONObject)left,b=(JSONObject)right;if(a.length()!=b.length())return false;
            Iterator<String> keys=a.keys();while(keys.hasNext()){String key=keys.next();if(!b.has(key)||!equal(a.get(key),b.get(key)))return false;}return true;
        }
        if(left instanceof JSONArray&&right instanceof JSONArray){
            JSONArray a=(JSONArray)left,b=(JSONArray)right;if(a.length()!=b.length())return false;
            for(int i=0;i<a.length();i++)if(!equal(a.get(i),b.get(i)))return false;return true;
        }
        if(left instanceof Number&&right instanceof Number)return new java.math.BigDecimal(left.toString()).compareTo(new java.math.BigDecimal(right.toString()))==0;
        return left.equals(right);
    }
    private RemoteJson(){}
}
