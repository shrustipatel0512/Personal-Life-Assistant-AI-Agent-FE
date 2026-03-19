$outLog = Join-Path $PSScriptRoot "frontend-dev.out.log"
$errLog = Join-Path $PSScriptRoot "frontend-dev.err.log"

Start-Process -FilePath "C:\Windows\System32\cmd.exe" `
  -ArgumentList "/c npm.cmd start -- --host 0.0.0.0 --port 4200" `
  -WorkingDirectory $PSScriptRoot `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog
