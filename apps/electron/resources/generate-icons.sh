#!/bin/bash
# Tervell 图标由已安装的 sharp 与 macOS iconutil 生成，无额外安装步骤。
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bun run "$SCRIPT_DIR/../scripts/generate-brand-assets.ts" "$@"
