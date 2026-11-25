#!/bin/sh
# 仅使用已存在的 JDK/SDK/Gradle；不下载或安装工具链。
set -eu
cd "$(dirname "$0")"
command -v gradle >/dev/null 2>&1 || { printf '%s\n' '需要本机已有 Gradle 8.9；本脚本不会安装。'; exit 1; }
java -version >/dev/null 2>&1 || { printf '%s\n' '需要本机已有 JDK 17；本脚本不会安装。'; exit 1; }
test -n "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" || { printf '%s\n' '需要本机已有 Android SDK 35 并设置 ANDROID_HOME。'; exit 1; }
exec gradle --offline --no-daemon :app:testDebugUnitTest :app:assembleDebug
