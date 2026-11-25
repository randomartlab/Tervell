package art.randomai.proma;

/** 只展示固定错误文案，网络异常、地址、凭据和请求内容不进入界面。 */
final class ConnectionFailure extends Exception {
    private final String publicText;
    ConnectionFailure(String publicText) { super(publicText); this.publicText = publicText; }
    static ConnectionFailure hosted(int status) {
        switch (status) {
            case 403: return new ConnectionFailure("手机配对码已失效或授权已撤销。请在电脑生成新配对码后重新连接。");
            case 429: return new ConnectionFailure("电脑正在处理其他请求，请稍等片刻后重试。");
            case 503: return new ConnectionFailure("已到达连接服务，但电脑未在线。请在电脑点击“重新连接”，等待显示公网就绪。");
            case 504: return new ConnectionFailure("电脑未及时回应。请保持电脑在线并重试；原配对请求已保留，不会重复执行。");
            default: return new ConnectionFailure("连接服务暂时不可用，请稍后重试；原配对和消息已保留。");
        }
    }
    static String describe(Exception error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof ConnectionFailure) return ((ConnectionFailure) current).publicText;
            if (current instanceof java.net.SocketTimeoutException) return "连接超时，请检查手机网络和电脑在线状态，然后重试；原请求已保留。";
            if (current instanceof java.net.UnknownHostException) return "手机暂时无法访问连接服务，请检查网络后重试。";
            if (current instanceof javax.net.ssl.SSLException) return "安全连接校验未通过，请检查两端日期时间和网络；不会跳过证书验证。";
        }
        if (error instanceof IllegalArgumentException) return "配对码无效或已过期。请复制电脑刚刚生成的完整手机配对码；网页的电脑确认码不能用于手机配对。";
        return "连接未完成，请检查电脑在线状态和项目授权后重试；原消息和配对已保留。";
    }
}
