package art.randomai.proma;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Size;
import android.view.Gravity;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** 原生离线扫码页面，不依赖 Google Play、外部扫码 App 或网络下载模型。 */
public final class PairingScannerActivity extends Activity {
    private static final int CAMERA_PERMISSION = 81, PICK_QR = 82;
    private TextureView preview;
    private TextView status;
    private Button permissionButton, torchButton;
    private HandlerThread thread;
    private Handler worker;
    private CameraDevice camera;
    private CameraCaptureSession session;
    private ImageReader reader;
    private Surface previewSurface;
    private CaptureRequest.Builder request;
    private Size previewSize;
    private int sensorOrientation = 90;
    private volatile boolean resumed, completed;
    private boolean opening, torch, hasFlash;
    private int cameraGeneration;
    private long lastFrame;
    private final AtomicBoolean decoding = new AtomicBoolean();

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        thread = new HandlerThread("tervell-pairing-camera"); thread.start(); worker = new Handler(thread.getLooper());
        boolean debug = (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (!debug) getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        boolean dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int background = Color.parseColor(dark ? "#141A1B" : "#F6F8FA"), foreground = Color.parseColor(dark ? "#E5EEEB" : "#1C292E");
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(20), dp(12), dp(20), dp(20)); root.setBackgroundColor(background); setContentView(root);
        getWindow().setStatusBarColor(background); getWindow().setNavigationBarColor(background);
        getWindow().getDecorView().setSystemUiVisibility(dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        root.setOnApplyWindowInsetsListener((view, insets) -> { view.setPadding(dp(20), dp(12) + insets.getSystemWindowInsetTop(), dp(20), dp(20) + insets.getSystemWindowInsetBottom()); return insets; });
        root.requestApplyInsets();
        LinearLayout header = new LinearLayout(this); header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = new TextView(this); title.setText("扫描电脑配对二维码"); title.setTextSize(21); title.setTextColor(foreground); title.setTypeface(null, android.graphics.Typeface.BOLD);
        header.addView(title, new LinearLayout.LayoutParams(0, dp(64), 1));
        Button close = new Button(this); close.setText("取消"); close.setContentDescription("取消扫码"); close.setOnClickListener(v -> finish()); header.addView(close); root.addView(header);
        TextView help = new TextView(this); help.setText("在电脑的“设置 → 远程连接”生成二维码，对准后自动识别，确认电脑后立即连接。"); help.setTextColor(foreground); help.setTextSize(14); help.setPadding(0, 0, 0, dp(16)); root.addView(help);
        FrameLayout cameraFrame = new FrameLayout(this); cameraFrame.setBackgroundColor(Color.BLACK);
        preview = new TextureView(this); cameraFrame.addView(preview, new FrameLayout.LayoutParams(-1, -1)); cameraFrame.addView(new Viewfinder(this), new FrameLayout.LayoutParams(-1, -1));
        root.addView(cameraFrame, new LinearLayout.LayoutParams(-1, 0, 1));
        status = new TextView(this); status.setText("正在准备相机…"); status.setTextColor(foreground); status.setTextSize(14); status.setPadding(0, dp(16), 0, dp(12)); root.addView(status);
        permissionButton = new Button(this); permissionButton.setText("允许使用相机"); permissionButton.setVisibility(View.GONE); permissionButton.setOnClickListener(v -> {
            if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) openCamera();
            else if (shouldShowRequestPermissionRationale(Manifest.permission.CAMERA)) requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
            else startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
        }); root.addView(permissionButton, new LinearLayout.LayoutParams(-1, -2));
        LinearLayout actions = new LinearLayout(this); actions.setGravity(Gravity.CENTER);
        torchButton = new Button(this); torchButton.setText("打开补光灯"); torchButton.setEnabled(false); torchButton.setOnClickListener(v -> toggleTorch()); actions.addView(torchButton, new LinearLayout.LayoutParams(0, -2, 1));
        Button gallery = new Button(this); gallery.setText("从图片识别"); gallery.setOnClickListener(v -> {
            try { startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE), PICK_QR); }
            catch (Exception unavailable) { showStatus("无法打开图片选择器，仍可返回粘贴配对链接"); }
        }); actions.addView(gallery, new LinearLayout.LayoutParams(0, -2, 1)); root.addView(actions);
        for (Button action : new Button[]{close, permissionButton, torchButton, gallery}) {
            action.setAllCaps(false); action.setTextSize(14); action.setTextColor(foreground);
            action.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.parseColor(dark ? "#223B37" : "#E5EEEB")));
        }
        TextView privacy = new TextView(this); privacy.setText("相机画面只在手机本地识别，不保存、不上传。"); privacy.setTextColor(foreground); privacy.setTextSize(12); privacy.setPadding(0, dp(10), 0, 0); root.addView(privacy);
        preview.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) { openCamera(); }
            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) { transformPreview(); }
            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) { closeCamera(); return true; }
            @Override public void onSurfaceTextureUpdated(SurfaceTexture surface) {}
        });
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION);
    }

    @Override protected void onResume() {
        super.onResume(); resumed = true;
        if (preview.isAvailable()) openCamera();
    }

    @Override protected void onPause() {
        resumed = false; closeCamera();
        super.onPause();
    }

    @Override protected void onDestroy() { closeCamera(); HandlerThread old = thread; thread = null; worker = null; if (old != null) old.quitSafely(); super.onDestroy(); }

    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == CAMERA_PERMISSION) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) { permissionButton.setVisibility(View.GONE); openCamera(); }
            else { status.setText("未获得相机权限。可以允许相机、从图片识别，或返回粘贴链接。"); permissionButton.setVisibility(View.VISIBLE); }
        }
    }

    private void openCamera() {
        if (!resumed || completed || opening || camera != null || worker == null || !preview.isAvailable()) return;
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) { permissionButton.setVisibility(View.VISIBLE); return; }
        permissionButton.setVisibility(View.GONE);
        try {
            CameraManager manager = (CameraManager) getSystemService(CAMERA_SERVICE); String chosen = null;
            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics info = manager.getCameraCharacteristics(id);
                if (chosen == null) chosen = id;
                if (Integer.valueOf(CameraCharacteristics.LENS_FACING_BACK).equals(info.get(CameraCharacteristics.LENS_FACING))) { chosen = id; break; }
            }
            if (chosen == null) throw new IllegalStateException();
            CameraCharacteristics info = manager.getCameraCharacteristics(chosen);
            Integer rotation = info.get(CameraCharacteristics.SENSOR_ORIENTATION); sensorOrientation = rotation == null ? 90 : rotation;
            hasFlash = Boolean.TRUE.equals(info.get(CameraCharacteristics.FLASH_INFO_AVAILABLE));
            StreamConfigurationMap map = info.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
            if (map == null) throw new IllegalStateException();
            Size[] sizes = map.getOutputSizes(ImageFormat.YUV_420_888); Size size = chooseSize(sizes);
            previewSize = chooseMatchingPreview(map.getOutputSizes(SurfaceTexture.class), size);
            reader = ImageReader.newInstance(size.getWidth(), size.getHeight(), ImageFormat.YUV_420_888, 2);
            reader.setOnImageAvailableListener(this::readImage, worker); opening = true; final int generation = ++cameraGeneration;
            manager.openCamera(chosen, new CameraDevice.StateCallback() {
                @Override public void onOpened(CameraDevice device) { opening = false; if (!resumed || completed || worker == null || generation != cameraGeneration) { device.close(); return; } camera = device; startPreview(); }
                @Override public void onDisconnected(CameraDevice device) { device.close(); camera = null; opening = false; showStatus("相机已断开，请返回后重新扫码，或从图片识别"); }
                @Override public void onError(CameraDevice device, int error) { device.close(); camera = null; opening = false; showStatus("相机暂不可用，请关闭其他相机应用后重试，或从图片识别"); }
            }, new Handler(getMainLooper()));
            transformPreview();
        } catch (Exception unavailable) { opening = false; closeCamera(); showStatus("相机暂不可用。可从图片识别，或返回粘贴配对链接。"); }
    }

    private static Size chooseSize(Size[] choices) {
        if (choices == null || choices.length == 0) throw new IllegalArgumentException();
        return Arrays.stream(choices).filter(s -> (long) s.getWidth() * s.getHeight() <= 2_100_000)
            .min(Comparator.comparingLong(s -> Math.abs((long) s.getWidth() * s.getHeight() - 1280L * 720))).orElse(choices[0]);
    }
    private static Size chooseMatchingPreview(Size[] choices, Size analysis) {
        if (choices == null || choices.length == 0) return analysis;
        return Arrays.stream(choices).min(Comparator.comparingDouble(s -> Math.abs((double) s.getWidth() / s.getHeight() - (double) analysis.getWidth() / analysis.getHeight()) * 1_000_000 + Math.abs((long) s.getWidth() * s.getHeight() - 1280L * 720))).orElse(analysis);
    }

    private void startPreview() {
        try {
            CameraDevice device = camera; ImageReader images = reader; Handler handler = worker; SurfaceTexture texture = preview.getSurfaceTexture();
            if (device == null || images == null || handler == null || texture == null) return;
            texture.setDefaultBufferSize(previewSize.getWidth(), previewSize.getHeight()); previewSurface = new Surface(texture);
            request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW); request.addTarget(previewSurface); request.addTarget(images.getSurface());
            request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            device.createCaptureSession(Arrays.asList(previewSurface, images.getSurface()), new CameraCaptureSession.StateCallback() {
                @Override public void onConfigured(CameraCaptureSession configured) {
                    if (!resumed || camera != device || completed) { configured.close(); return; }
                    session = configured;
                    try { configured.setRepeatingRequest(request.build(), null, handler); runOnUiThread(() -> { torchButton.setEnabled(hasFlash); status.setText("将整个二维码放入画面，保持手机稳定"); }); }
                    catch (Exception error) { showStatus("相机预览无法启动，请从图片识别或重试"); }
                }
                @Override public void onConfigureFailed(CameraCaptureSession failed) { showStatus("相机预览无法启动，请从图片识别"); }
            }, new Handler(getMainLooper()));
        } catch (Exception error) { showStatus("相机预览无法启动，请从图片识别"); }
    }

    private void readImage(ImageReader images) {
        try (Image image = images.acquireLatestImage()) {
            if (image == null || completed || !resumed || SystemClock.elapsedRealtime() - lastFrame < 350 || !decoding.compareAndSet(false, true)) return;
            lastFrame = SystemClock.elapsedRealtime();
            try {
                Image.Plane y = image.getPlanes()[0];
                byte[] pixels = PairingQrDecoder.copyLuminance(y.getBuffer(), y.getRowStride(), y.getPixelStride(), image.getWidth(), image.getHeight());
                accept(PairingQrDecoder.luminance(pixels, image.getWidth(), image.getHeight()));
            } catch (com.google.zxing.ReaderException noCode) { /* 等待下一帧，不回传或记录图像。 */ }
            catch (Exception invalid) { showStatus("识别到的不是有效 Tervell 配对码，或二维码已过期，请在电脑重新生成"); }
            finally { decoding.set(false); }
        } catch (IllegalStateException closed) { /* 离开扫码页时相机已释放。 */ }
    }

    private void accept(String value) throws Exception {
        PairingQrDecoder.preview(value, System.currentTimeMillis());
        runOnUiThread(() -> { if (!completed && !isFinishing()) { completed = true; closeCamera(); setResult(RESULT_OK, new Intent().putExtra("pairing", value)); finish(); } });
    }

    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code != PICK_QR || result != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData(); Handler handler = worker;
        if (handler == null) { showStatus("扫码页面正在恢复，请再次选择图片"); return; }
        status.setText("正在本机识别图片…");
        handler.post(() -> {
            Bitmap bitmap = null;
            try {
                BitmapFactory.Options options = new BitmapFactory.Options(); options.inJustDecodeBounds = true;
                try (InputStream input = getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(input, null, options); }
                if (options.outWidth < 1 || options.outHeight < 1 || options.outWidth > 50000 || options.outHeight > 50000) throw new IllegalArgumentException();
                options.inJustDecodeBounds = false; options.inSampleSize = 1;
                while ((long) (options.outWidth / options.inSampleSize) * (options.outHeight / options.inSampleSize) > 4_000_000) options.inSampleSize *= 2;
                options.inPreferredConfig = Bitmap.Config.ARGB_8888;
                try (InputStream input = getContentResolver().openInputStream(uri)) { bitmap = BitmapFactory.decodeStream(input, null, options); }
                if (bitmap == null) throw new IllegalArgumentException();
                int[] pixels = new int[bitmap.getWidth() * bitmap.getHeight()]; bitmap.getPixels(pixels, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
                accept(PairingQrDecoder.rgb(pixels, bitmap.getWidth(), bitmap.getHeight()));
            } catch (Exception invalid) { showStatus("图片中没有有效的 Tervell 配对二维码，请选择电脑生成的完整二维码"); }
            finally { if (bitmap != null) bitmap.recycle(); }
        });
    }

    private void toggleTorch() {
        if (!hasFlash || session == null || request == null || worker == null) return;
        try { torch = !torch; request.set(CaptureRequest.FLASH_MODE, torch ? CaptureRequest.FLASH_MODE_TORCH : CaptureRequest.FLASH_MODE_OFF); session.setRepeatingRequest(request.build(), null, worker); torchButton.setText(torch ? "关闭补光灯" : "打开补光灯"); }
        catch (Exception error) { torch = false; showStatus("补光灯暂不可用"); }
    }

    private void transformPreview() {
        if (previewSize == null || preview.getWidth() == 0) return;
        int rotation = getWindowManager().getDefaultDisplay().getRotation(), degrees = rotation * 90, relative = (sensorOrientation - degrees + 360) % 360;
        float width = preview.getWidth(), height = preview.getHeight();
        boolean swapped = relative == 90 || relative == 270;
        RectF view = new RectF(0, 0, width, height), buffer = new RectF(0, 0, swapped ? previewSize.getHeight() : previewSize.getWidth(), swapped ? previewSize.getWidth() : previewSize.getHeight());
        buffer.offset(view.centerX() - buffer.centerX(), view.centerY() - buffer.centerY()); Matrix matrix = new Matrix();
        matrix.setRectToRect(view, buffer, Matrix.ScaleToFit.FILL); float scale = Math.max(width / buffer.width(), height / buffer.height()); matrix.postScale(scale, scale, view.centerX(), view.centerY());
        if (rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270) matrix.postRotate(90 * (rotation - 2), view.centerX(), view.centerY()); else if (rotation == Surface.ROTATION_180) matrix.postRotate(180, view.centerX(), view.centerY());
        preview.setTransform(matrix);
    }

    private void closeCamera() {
        cameraGeneration++;
        if (session != null) { session.close(); session = null; }
        if (camera != null) { camera.close(); camera = null; }
        if (reader != null) { reader.close(); reader = null; }
        if (previewSurface != null) { previewSurface.release(); previewSurface = null; }
        request = null; torch = false; opening = false;
    }
    private void showStatus(String text) { runOnUiThread(() -> { if (!isFinishing()) status.setText(text); }); }
    private int dp(int value) { return Math.round(getResources().getDisplayMetrics().density * value); }
    private static final class Viewfinder extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Viewfinder(Activity activity) { super(activity); setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO); }
        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas); float side = Math.min(getWidth() * .84f, getHeight() * .78f), x = (getWidth() - side) / 2, y = (getHeight() - side) / 2;
            paint.setColor(Color.parseColor("#A5CEC4")); paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(3 * getResources().getDisplayMetrics().density); canvas.drawRoundRect(x, y, x + side, y + side, 16, 16, paint);
        }
    }
}
