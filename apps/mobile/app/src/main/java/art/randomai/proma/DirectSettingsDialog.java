package art.randomai.proma;

import android.app.Activity;
import android.app.AlertDialog;
import android.text.InputType;
import android.view.View;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** 已配对电脑的原生连接管理。分页只切换可见性，保留未保存的名称和地址输入。 */
final class DirectSettingsDialog {
    interface Job { JSONObject run() throws Exception; }
    interface Result { void accept(JSONObject value) throws Exception; }
    interface Runner { void run(Job work, Result done); }
    private final Activity activity;
    private final RemoteClient client;
    private final Runner runner;
    private final JSONObject snapshot;
    private final boolean english;
    private final List<String> addresses = new ArrayList<>();
    private final List<String> origins = new ArrayList<>();
    private final List<LinearLayout> pages = new ArrayList<>();
    private final List<Button> tabs = new ArrayList<>();
    private final LinearLayout root;
    private CheckBox enabled, prefer;
    private Spinner address, origin, language;
    private EditText interval, timeout;
    private TextView status, error;
    private AlertDialog dialog;
    private int tab;

    DirectSettingsDialog(Activity activity, RemoteClient client, JSONObject snapshot, Runner runner) throws Exception {
        this.activity = activity; this.client = client; this.snapshot = snapshot; this.runner = runner;
        JSONObject prefs = snapshot.getJSONObject("preferences");
        String locale = prefs.optString("language", "system");
        english = "en".equals(locale) || "system".equals(locale) && !Locale.getDefault().getLanguage().equals("zh");
        root = column(); root.setPadding(dp(16), dp(8), dp(16), dp(16));
        LinearLayout bar = new LinearLayout(activity); bar.setOrientation(LinearLayout.HORIZONTAL);
        String[] titles = { t("连接", "Connection"), t("中继", "Relay"), t("设置", "Settings") };
        for (int i = 0; i < titles.length; i++) {
            final int index = i; Button button = button(titles[i], () -> selectTab(index));
            bar.addView(button, new LinearLayout.LayoutParams(0, dp(48), 1)); tabs.add(button);
        }
        root.addView(bar);
        for (int i = 0; i < 3; i++) { LinearLayout page = column(); pages.add(page); root.addView(page); }
        buildConnection(pages.get(0), prefs);
        buildRelay(pages.get(1), prefs);
        buildSettings(pages.get(2), prefs);
        error = label(""); error.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); root.addView(error);
    }
    private int dp(int value) { return Math.round(value * activity.getResources().getDisplayMetrics().density); }
    private String t(String zh, String en) { return english ? en : zh; }
    private LinearLayout column() { LinearLayout view = new LinearLayout(activity); view.setOrientation(LinearLayout.VERTICAL); return view; }
    private TextView label(String text) { TextView view = new TextView(activity); view.setText(text); view.setTextSize(14); view.setPadding(0, dp(8), 0, dp(8)); return view; }
    private Button button(String text, Runnable action) { Button view = new Button(activity); view.setText(text); view.setMinHeight(dp(48)); view.setOnClickListener(v -> action.run()); return view; }
    private CheckBox check(LinearLayout page, String title, boolean value) { CheckBox view = new CheckBox(activity); view.setText(title); view.setMinHeight(dp(48)); view.setChecked(value); page.addView(view); return view; }
    private EditText field(LinearLayout page, String title, String value, boolean numeric) {
        page.addView(label(title)); EditText input = new EditText(activity); input.setContentDescription(title); input.setText(value); input.setMinHeight(dp(48));
        input.setInputType(numeric ? InputType.TYPE_CLASS_NUMBER : InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE); page.addView(input); return input;
    }
    private Spinner spinner(LinearLayout page, String title, String[] labels, int selected) {
        page.addView(label(title)); Spinner view = new Spinner(activity); view.setContentDescription(title); view.setMinimumHeight(dp(48));
        view.setAdapter(new ArrayAdapter<>(activity, android.R.layout.simple_spinner_dropdown_item, labels)); view.setSelection(Math.max(0, selected)); page.addView(view); return view;
    }
    private void run(Job job, Result result) {
        error.setText("");
        runner.run(() -> { try { return new JSONObject().put("value", job.run()); } catch (Exception e) { return new JSONObject().put("error", e.getMessage() == null ? t("未完成，请重试", "Could not complete; retry") : e.getMessage()); } }, value -> {
            if (value.has("error")) { error.setText(value.getString("error")); return; }
            try { result.accept(value.getJSONObject("value")); } catch (Exception e) { error.setText(e.getMessage()); }
        });
    }
    void show() {
        ScrollView scroll = new ScrollView(activity); scroll.setFillViewport(true); scroll.addView(root);
        dialog = new AlertDialog.Builder(activity).setTitle("Tervell Direct").setView(scroll).setNegativeButton(t("关闭", "Close"), null).create();
        selectTab(0); dialog.show();
    }
    private void selectTab(int selected) {
        tab = selected;
        for (int i = 0; i < pages.size(); i++) { pages.get(i).setVisibility(i == selected ? View.VISIBLE : View.GONE); tabs.get(i).setSelected(i == selected); tabs.get(i).setTypeface(null, i == selected ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL); }
    }
    private void refresh() {
        run(() -> { client.request("status", new JSONObject()); return client.directView(); }, value -> {
            status.setText(value.getString("transport") + "\n" + t("前台核验电脑身份，失败恢复原有加密隧道。", "Verifies the paired PC in the foreground; falls back to the encrypted tunnel."));
        });
    }
    private void buildConnection(LinearLayout page, JSONObject prefs) throws Exception {
        status = label(snapshot.getString("transport") + "\n" + t("前台核验电脑身份，失败恢复原有加密隧道。", "Verifies the paired PC in the foreground; falls back to the encrypted tunnel.")); page.addView(status);
        long retry = Math.max(snapshot.optLong("retryAt"), snapshot.optLong("forwardRetryAt"));
        if (retry > System.currentTimeMillis()) page.addView(label(t("失败退避至：", "Retry after: ") + java.text.DateFormat.getTimeInstance().format(new java.util.Date(retry))));
        JSONObject direct = snapshot.optJSONObject("direct"), metrics = snapshot.optJSONObject("metrics");
        JSONArray candidates = direct == null ? null : direct.optJSONArray("candidates"); addresses.add("");
        List<String> labels = new ArrayList<>(); labels.add(t("自动选择地址", "Choose automatically"));
        for (int i = 0; candidates != null && i < candidates.length(); i++) {
            String url = candidates.getJSONObject(i).getString("url"); addresses.add(url);
            labels.add(url + (url.equals(snapshot.optString("activeDirect")) ? t(" · 当前", " · Current") : "") + (metrics != null && metrics.has(url) ? " · " + metrics.optLong(url) + " ms" : ""));
        }
        address = spinner(page, t("电脑地址", "PC address"), labels.toArray(new String[0]), addresses.indexOf(prefs.optString("selected")));
        page.addView(button(t("检查并连接所选地址", "Check and connect"), () -> run(() -> {
            client.configureDirectOptions(enabled.isChecked(), prefer.isChecked(), addresses.get(address.getSelectedItemPosition()), origins.get(origin.getSelectedItemPosition()), Integer.parseInt(interval.getText().toString()), Integer.parseInt(timeout.getText().toString()), languageCode());
            client.directAction("resume"); client.request("status", new JSONObject()); return client.directView();
        }, value -> status.setText(value.getString("transport")))));
        page.addView(button(t("使用隧道 60 秒", "Use tunnel for 60 seconds"), () -> run(() -> { client.pauseDirect(); return client.directView(); }, value -> status.setText(value.getString("transport")))));
        page.addView(button(t("恢复自动直连", "Resume direct"), () -> run(() -> { client.directAction("resume"); return client.directView(); }, value -> refresh())));
        page.addView(button(t("移除所选非活动地址", "Remove selected inactive address"), () -> {
            String selected = addresses.get(address.getSelectedItemPosition());
            if (selected.isEmpty()) { error.setText(t("先选择一个地址", "Choose an address first")); return; }
            run(() -> { client.excludeDirect(selected); return new JSONObject(); }, value -> status.setText(t("地址已忽略，可在设置恢复", "Address excluded; restore it in Settings")));
        }));
    }
    private void buildRelay(LinearLayout page, JSONObject prefs) throws Exception {
        page.addView(label(t("手机须分别配对中继和目标电脑。中继须已登记目标的身份及可访问地址，两段核验成功后才会使用。", "Pair this phone with both PCs. Register the target identity and reachable address on the relay; both hops must verify.")));
        JSONArray hosts = snapshot.getJSONArray("hosts"); origins.add(""); String[] labels = new String[hosts.length() + 1]; labels[0] = t("不优先 PC 中继", "Use original connections");
        for (int i = 0; i < hosts.length(); i++) { origins.add(hosts.getJSONObject(i).getString("id")); labels[i + 1] = origins.get(i + 1); }
        origin = spinner(page, t("优先使用的中继电脑", "Preferred relay PC"), labels, origins.indexOf(prefs.optString("preferredOrigin")));
        page.addView(button(t("保存中继偏好", "Save relay preference"), this::save));
        page.addView(label(t("中继或目标不可用时恢复目标原有连接，30–300 秒退避重试。手动选择地址暂停自动中继 60 秒。", "Falls back to the target's original connection. Failed routes retry after 30–300 seconds; manual selection pauses automatic forwarding for 60 seconds.")));
    }
    private void buildSettings(LinearLayout page, JSONObject prefs) throws Exception {
        page.addView(label(t("当前设备（按电脑分别保存）", "This device · saved per PC")));
        enabled = check(page, t("前台自动探测", "Check while in foreground"), prefs.optBoolean("enabled", true));
        prefer = check(page, t("优先直连（取消则按已测延迟选择）", "Prefer direct · otherwise use measured latency"), prefs.optBoolean("preferDirect", true));
        interval = field(page, t("检查间隔（10–300 秒）", "Check interval (10–300 seconds)"), String.valueOf(prefs.optInt("intervalSeconds", 20)), true);
        timeout = field(page, t("连接超时（1–10 秒）", "Connection timeout (1–10 seconds)"), String.valueOf(prefs.optInt("timeoutSeconds", 3)), true);
        String[] languages = { "system", "zh-CN", "en" };
        language = spinner(page, t("语言（保存后重开本页）", "Language · reopen after saving"), new String[] { t("跟随系统", "Follow system"), "简体中文", "English" }, java.util.Arrays.asList(languages).indexOf(prefs.optString("language", "system")));
        page.addView(button(t("保存设备偏好", "Save device preferences"), this::save));
        page.addView(button(t("恢复已忽略地址", "Restore excluded addresses"), () -> run(() -> { client.directAction("restoreExcluded"); return new JSONObject(); }, value -> error.setText(t("已恢复", "Restored")))));
        page.addView(button(t("恢复设备默认值", "Restore device defaults"), () -> run(() -> { client.directAction("reset"); return client.directView(); }, value -> { dialog.dismiss(); new DirectSettingsDialog(activity, client, value, runner).show(); })));
        page.addView(button(t("电脑共享地址设置", "PC address settings"), () -> run(() -> client.directHostSettings(null), this::showHostSettings)));
        page.addView(label(t("修改电脑共享地址需要整机管理授权。设备偏好不改变电脑上的项目授权。", "Changing shared PC addresses requires management permission. Device preferences do not change project access.")));
        page.addView(button(t("诊断与连接事件", "Diagnostics and events"), () -> run(client::directView, this::showDiagnostics)));
    }
    private String languageCode() { return new String[] { "system", "zh-CN", "en" }[language.getSelectedItemPosition()]; }
    private void save() {
        run(() -> { client.configureDirectOptions(enabled.isChecked(), prefer.isChecked(), addresses.get(address.getSelectedItemPosition()), origins.get(origin.getSelectedItemPosition()), Integer.parseInt(interval.getText().toString()), Integer.parseInt(timeout.getText().toString()), languageCode()); return new JSONObject(); }, value -> error.setText(t("已保存", "Saved")));
    }
    private void showHostSettings(JSONObject value) throws Exception {
        JSONObject prefs = value.getJSONObject("preferences"); LinearLayout form = column(); form.setPadding(dp(16), 0, dp(16), dp(16));
        CheckBox hostEnabled = check(form, t("提供直连", "Offer direct connections"), prefs.getBoolean("enabled"));
        CheckBox auto = check(form, t("自动发现 IPv4 网卡", "Discover IPv4 interfaces"), prefs.getBoolean("autoDiscover"));
        EditText ignored = field(form, t("忽略接口（每行一条）", "Ignored interfaces · one per line"), join(prefs.getJSONArray("ignoredInterfaces")), false);
        EditText custom = field(form, t("额外 HTTPS 地址（每行一条）", "Additional HTTPS addresses · one per line"), join(prefs.getJSONArray("customAddresses")), false);
        TextView notice = label(""); form.addView(notice); ScrollView scroll = new ScrollView(activity); scroll.addView(form);
        AlertDialog hostDialog = new AlertDialog.Builder(activity).setTitle(t("电脑共享设置", "Shared PC settings")).setView(scroll).setNegativeButton(t("取消", "Cancel"), null).setPositiveButton(t("保存", "Save"), null).create(); hostDialog.show();
        hostDialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> runner.run(() -> {
            try { return client.directHostSettings(new JSONObject().put("enabled", hostEnabled.isChecked()).put("autoDiscover", auto.isChecked()).put("ignoredInterfaces", lines(ignored)).put("customAddresses", lines(custom))); }
            catch (Exception e) { return new JSONObject().put("error", e.getMessage()); }
        }, result -> { if (result.has("error")) notice.setText(result.optString("error")); else hostDialog.dismiss(); }));
    }
    private static String join(JSONArray items) { List<String> result = new ArrayList<>(); for (int i = 0; i < items.length(); i++) result.add(items.optString(i)); return String.join("\n", result); }
    private static JSONArray lines(EditText input) { JSONArray result = new JSONArray(); for (String line : input.getText().toString().split("\\n")) if (!line.trim().isEmpty()) result.put(line.trim()); return result; }
    private void showDiagnostics(JSONObject value) throws Exception {
        new AlertDialog.Builder(activity).setTitle(t("连接元数据（不含消息正文）", "Connection metadata · no message content")).setMessage(value.getJSONObject("diagnostics").toString(2)).setNegativeButton(t("关闭", "Close"), null)
            .setNeutralButton(t("清空事件", "Clear events"), (d, w) -> run(() -> { client.directAction("clearEvents"); return new JSONObject(); }, result -> {}))
            .setPositiveButton(t("发送诊断到电脑", "Send diagnostics to PC"), (d, w) -> run(client::reportDirect, result -> error.setText(t("诊断已发送到当前电脑", "Diagnostics sent to this PC")))).show();
    }
}
