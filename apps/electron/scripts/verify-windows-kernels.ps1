$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw '需要原生Windows Runner' }
$repo=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
Set-Location $repo
$out=Join-Path $repo 'apps/electron/out/windows-alpha/native-smoke/kernels'
New-Item -ItemType Directory -Force $out | Out-Null
$electron=Join-Path $repo 'node_modules/electron/dist/electron.exe'
if (-not (Test-Path -LiteralPath $electron)) {
  # Bun 的锁文件安装不执行 Electron postinstall；打包阶段已校验并解压同版本官方发行物。
  $electron=Join-Path $env:USERPROFILE '.cache/tervell/windows-build/electron-win32-x64/electron.exe'
}
if (-not (Test-Path -LiteralPath $electron)) { throw '缺少已校验的原生 Electron 测试运行时' }
$esbuild=Join-Path $repo 'node_modules/esbuild/bin/esbuild'
$node=(Get-Command node.exe).Source
function Build-Harness([string]$source,[string]$output) {
  & $node $esbuild $source --bundle --platform=node --format=cjs --external:electron --external:sharp --external:esbuild --external:@earendil-works/pi-coding-agent --external:@earendil-works/pi-agent-core --external:@earendil-works/pi-ai "--outfile=$output"
  if ($LASTEXITCODE) { throw "构建内核回归脚本失败：$source" }
}
function Invoke-Harness([string]$entry,[string]$label) {
  & $electron $entry 2>&1 | Tee-Object -FilePath (Join-Path $out "$label.log")
  if ($LASTEXITCODE) { throw "原生Windows内核回归失败：$label" }
}
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$env:TERVELL_QA_NODE_BIN=$node
$env:TERVELL_QA_EVIDENCE_DIR=Join-Path $out 'dialogue-evidence'
$env:TERVELL_QA_TRACE='1'
Build-Harness 'scripts/verify-acp-host-runtime.ts' 'apps/electron/dist/acp-host-runtime-verify.cjs'
Invoke-Harness 'apps/electron/dist/acp-host-runtime-verify.cjs' 'host-runtime'
# 每个CLI在独立profile里真实安装；真实网关只连接回环模型，不使用厂商账号或付费请求。
$env:TERVELL_QA_KERNELS='codex,gemini,qwen,kimi,copilot,mcode,dsh,omp,opencode,glm-acp-agent,claude,goose,cline,codebuddy,grok,antigravity,pi-acp,hermes,mistral-vibe,deepagents,crow-cli'
Build-Harness 'scripts/verify-managed-kernel-dialogue.ts' 'apps/electron/dist/managed-kernel-dialogue-verify.cjs'
Invoke-Harness 'apps/electron/dist/managed-kernel-dialogue-verify.cjs' 'actual-cli-dialogue'
Remove-Item Env:TERVELL_QA_KERNELS -ErrorAction SilentlyContinue
Remove-Item Env:TERVELL_QA_NODE_BIN -ErrorAction SilentlyContinue
Remove-Item Env:TERVELL_QA_EVIDENCE_DIR -ErrorAction SilentlyContinue
Remove-Item Env:TERVELL_QA_TRACE -ErrorAction SilentlyContinue
Write-Output 'Windows实际CLI工具、续聊、取消和宿主资源回归通过'
