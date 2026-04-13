param(
  [int]$Port = 3000,
  [string]$HostName = '0.0.0.0'
)

$ErrorActionPreference = 'Continue'

$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root '.codex-runtime'
$stdoutLog = Join-Path $logDir 'dev-watchdog.log'
$stderrLog = Join-Path $logDir 'dev-watchdog.err.log'

if (!(Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Write-WatchdogLog([string]$message) {
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -Path $stdoutLog -Value "[$timestamp] $message"
}

Write-WatchdogLog "Starting dev watchdog on port $Port"

while ($true) {
  Write-WatchdogLog 'Launching Vite dev server...'
  try {
    $command = "npm run dev -- --host $HostName --port $Port 1>> `"$stdoutLog`" 2>> `"$stderrLog`""
    $process = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/c', $command `
      -WorkingDirectory $root `
      -PassThru

    Wait-Process -Id $process.Id
    Write-WatchdogLog "Dev server exited with code $($process.ExitCode). Restarting in 2 seconds..."
  } catch {
    Write-WatchdogLog "Watchdog caught an error: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 2
}
