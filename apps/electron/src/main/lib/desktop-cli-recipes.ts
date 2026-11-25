import { DESKTOP_REFERENCE_CATALOG } from '@proma/kernel-host'
import { join } from 'node:path'

export interface CliInstallRecipe { packages: string[]; source: string }
/** 已核查发布者的固定版本；不接受 renderer 提供包名、URL 或 shell 字符串。 */
export const CLI_INSTALL_RECIPES: Readonly<Record<string, CliInstallRecipe>> = {
  ...Object.fromEntries(DESKTOP_REFERENCE_CATALOG.filter(d=>d.packages?.length).map(d=>[d.id,{packages:d.packages!,source:d.sources.join(' / ')+' 核查目录'}])),
  claude: { packages: ['@anthropic-ai/claude-code@2.1.329', '@agentclientprotocol/claude-agent-acp@0.109.0'], source: 'Anthropic / Agent Client Protocol' },
  codex: { packages: ['@openai/codex@0.171.0', '@agentclientprotocol/codex-acp@2.8.0'], source: 'OpenAI / Agent Client Protocol' },
  gemini: { packages: ['@google/gemini-cli@0.70.0'], source: 'Google' },
  kimi: { packages: ['@moonshot-ai/kimi-code@2.7.0'], source: 'Moonshot AI' },
  qwen: { packages: ['@qwen-code/qwen-code@0.28.0'], source: 'Qwen' },
  opencode: { packages: ['opencode-ai@1.19.6'], source: 'OpenCode' },
  copilot: { packages: ['@github/copilot@1.0.114'], source: 'GitHub' },
  mcode: { packages: ['@minimax-ai/code@0.7.9'], source: 'MiniMax' },
  omp: { packages: ['@oh-my-pi/pi-coding-agent@19.0.1'], source: 'oh-my-pi' },
}
export function cliManagedDirectories(config: string): { root: string; bin: string; runtimeBin: string } {
  const root = join(config, 'cli-runtime')
  return { root, bin: join(root, 'bin'), runtimeBin: join(root, 'runtime/bin') }
}
export function quoteShell(value: string): string { return "'" + value.replace(/'/g, "'\\''") + "'" }
/** 私有运行时不修改系统 Node/Bun、不要求 sudo、不改用户 shell 配置。 */
export function buildCliInstallScript(id: string, config: string, arch: string, workDirectory?: string): string {
  const recipe = CLI_INSTALL_RECIPES[id]
  if (!recipe || !Object.hasOwn(CLI_INSTALL_RECIPES, id)) throw new Error('该内核暂未提供已核查的一键安装源')
  if (arch !== 'arm64' && arch !== 'x64') throw new Error('当前架构不支持此安装器')
  const { root, bin, runtimeBin } = cliManagedDirectories(config)
  const bunTarget = arch === 'arm64' ? 'aarch64' : 'x64-baseline'
  const bunSha = arch === 'arm64' ? 'c240d7f0ccb90c263a849fcdb09b7ee62630d921348ed6aafda86b9d577bc510' : 'd4a155adfbfd09155eb3ba05c9e3a544f39297d7a68616d3c7759f67ab5c47dc'
  const nodeSha = arch === 'arm64' ? 'e7131995759b61a0170b646010d2ad35a5d37b4cb0d471f3e8317eac6f742f3d' : 'c53383238206b9ae4db23c5d8a63645e2e753bec8ab51a49cc81939aa64e9422'
  return `#!/bin/bash
set -euo pipefail
umask 077
ROOT=${quoteShell(root)}
BIN=${quoteShell(bin)}
RUNTIME=${quoteShell(runtimeBin)}
mkdir -p "$ROOT" "$BIN" "$RUNTIME"
TMP=${workDirectory ? quoteShell(workDirectory) : '$(/usr/bin/mktemp -d "$ROOT/install.XXXXXX")'}
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT
export PATH="$RUNTIME:$BIN:$PATH"
export BUN_INSTALL_GLOBAL_DIR="$ROOT/packages"
export BUN_INSTALL_BIN="$BIN"
export BUN_INSTALL_CACHE_DIR="$ROOT/cache"
cd "$ROOT"
if [ "$("$RUNTIME/bun" --version 2>/dev/null || true)" != "1.4.4" ]; then
  printf '\\n准备安装运行时（Bun）…\\n'
  /usr/bin/curl --fail --location --retry 2 --connect-timeout 20 --max-time 300 'https://github.com/oven-sh/bun/releases/download/bun-v1.4.4/bun-darwin-${bunTarget}.zip' -o "$TMP/bun.zip"
  echo '${bunSha}  '"$TMP/bun.zip" | /usr/bin/shasum -a 256 -c -
  /usr/bin/unzip -oq "$TMP/bun.zip" -d "$TMP"
  /bin/chmod 700 "$TMP/bun-darwin-${bunTarget}/bun"
  /bin/mv -f "$TMP/bun-darwin-${bunTarget}/bun" "$RUNTIME/bun"
fi
if [ "$("$RUNTIME/node" --version 2>/dev/null || true)" != "v22.23.5" ]; then
  printf '\\n准备兼容运行时（Node）…\\n'
  /usr/bin/curl --fail --location --retry 2 --connect-timeout 20 --max-time 300 'https://nodejs.org/dist/v22.23.5/node-v22.23.5-darwin-${arch}.tar.gz' -o "$TMP/node.tar.gz"
  echo '${nodeSha}  '"$TMP/node.tar.gz" | /usr/bin/shasum -a 256 -c -
  /usr/bin/tar -xzf "$TMP/node.tar.gz" -C "$TMP" 'node-v22.23.5-darwin-${arch}/bin/node'
  /bin/chmod 700 "$TMP/node-v22.23.5-darwin-${arch}/bin/node"
  /bin/mv -f "$TMP/node-v22.23.5-darwin-${arch}/bin/node" "$RUNTIME/node"
fi
printf '\\n安装 ${id} 及所需适配器…\\n'
"$RUNTIME/bun" add --global --no-env-file --registry=https://registry.npmjs.org --trust ${recipe.packages.map(quoteShell).join(' ')}
printf '\\n下载与安装已完成，正在自动检查…\\n'
`
}
