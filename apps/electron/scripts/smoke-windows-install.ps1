$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw '需要原生 Windows PowerShell 7 Runner' }
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$out = Join-Path $repo 'apps/electron/out/windows-alpha'
$evidence = Join-Path $out 'native-smoke'
New-Item -ItemType Directory -Force $evidence | Out-Null

function Test-Application([string]$exe, [string]$label) {
  if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw "$label 验收目标不存在：$exe" }
  $profile = Join-Path $evidence "$label-配置 空格"
  New-Item -ItemType Directory -Force $profile | Out-Null
  $env:TERVELL_PROFILE_DIR = $profile
  $env:PROMA_RELEASE_CHANNEL = 'alpha'
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $process = Start-Process -FilePath $exe -ArgumentList '--tervell-runtime-smoke' -PassThru `
    -RedirectStandardOutput (Join-Path $evidence "$label-stdout.log") `
    -RedirectStandardError (Join-Path $evidence "$label-stderr.log")
  $peak = 0L
  try {
    $deadline = [DateTime]::UtcNow.AddMinutes(3)
    while (-not $process.HasExited) {
      $process.Refresh()
      $peak = [Math]::Max($peak, $process.WorkingSet64)
      if ([DateTime]::UtcNow -gt $deadline) { throw "$label 启动验收超时" }
      Start-Sleep -Milliseconds 250
    }
    $process.WaitForExit()
    $report = Join-Path $profile 'runtime-smoke.json'
    if (-not (Test-Path $report)) { throw "$label 未产出运行验收报告，退出码 $($process.ExitCode)" }
    $result = Get-Content -Raw $report | ConvertFrom-Json
    if ($process.ExitCode -ne 0 -or -not $result.ok) { throw "$label 原生运行失败：$($result.checks.error)" }
    @{ label=$label; mainProcessPeakBytes=$peak; exitCode=$process.ExitCode } | ConvertTo-Json | Set-Content (Join-Path $evidence "$label-process.json")
  } finally {
    if (-not $process.HasExited) { & taskkill.exe /PID $process.Id /T /F | Out-Null }
    Remove-Item Env:TERVELL_PROFILE_DIR -ErrorAction SilentlyContinue
  }
}

Test-Application (Join-Path $out 'win-unpacked/Tervell Alpha.exe') 'unpacked'
$installer = Get-ChildItem $out -Filter '*-setup.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) { throw '缺少 NSIS 安装包' }
$destination = Join-Path $env:RUNNER_TEMP 'Tervell 安装验收 空格'
$install = Start-Process -FilePath $installer.FullName -ArgumentList ('/S /currentuser /D="' + $destination + '"') -Wait -PassThru
if ($install.ExitCode -ne 0) { throw "NSIS 安装失败：$($install.ExitCode)" }
@{ requestedDestination=$destination; installerExitCode=$install.ExitCode; executableExists=(Test-Path -LiteralPath (Join-Path $destination 'Tervell Alpha.exe')); files=@(Get-ChildItem -LiteralPath $destination -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name) } | ConvertTo-Json | Set-Content (Join-Path $evidence 'installed-location.json')
Test-Application (Join-Path $destination 'Tervell Alpha.exe') 'installed'
Get-ChildItem $out -File -Filter '*.exe' | Get-FileHash -Algorithm SHA256 | ConvertTo-Json | Set-Content (Join-Path $evidence 'artifacts-sha256.json')
