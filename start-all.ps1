# Start both backend and frontend in separate PowerShell windows and run the smoke test
param(
  [int]$DelaySeconds = 6
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $root 'server'

Write-Host "Starting backend in new window..."
Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoExit","-Command","cd `"$serverDir`"; npm run dev"

Start-Sleep -Seconds 1

Write-Host "Starting frontend in new window..."
Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoExit","-Command","cd `"$root`"; npm run dev"

Write-Host "Waiting $DelaySeconds seconds for servers to start..."
Start-Sleep -Seconds $DelaySeconds

Write-Host "Running smoke test (server must be running at http://127.0.0.1:4000)..."
Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoExit","-Command","cd `"$serverDir`"; npm run smoke"

Write-Host "Done. Check the opened terminals for logs and the smoke test output."
