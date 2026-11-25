# Android系统按Manifest/组件规则保留入口；保留JSON反射所需注解，业务类允许R8缩减与改名。
-keepattributes Signature,*Annotation*,InnerClasses,EnclosingMethod

# WebView JS bridge只暴露明确标注的方法；保留方法名。
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
