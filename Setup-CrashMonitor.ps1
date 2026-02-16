# Windows Crash Monitoring Setup
# Run this as Administrator to set up automatic diagnostic capture

Write-Host "=== Windows Crash Monitor Setup ===" -ForegroundColor Cyan

# 1. Create scheduled task to run diagnostics at startup
Write-Host "`n[1/3] Creating startup diagnostic task..." -ForegroundColor Yellow
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\User\Documents\Capture-Diagnostics.ps1"'
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Check if task exists and remove it
if (Get-ScheduledTask -TaskName 'CrashDiagnostics' -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName 'CrashDiagnostics' -Confirm:$false
}

Register-ScheduledTask -TaskName 'CrashDiagnostics' -Action $action -Trigger $trigger -Settings $settings -Description 'Captures system diagnostics after unexpected restart' -Force | Out-Null
Write-Host "✓ Task created: CrashDiagnostics (runs at startup)" -ForegroundColor Green

# 2. Create periodic health check (every hour)
Write-Host "`n[2/3] Creating periodic health check task..." -ForegroundColor Yellow
$action2 = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\User\Documents\Capture-Diagnostics.ps1"'
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)

if (Get-ScheduledTask -TaskName 'HealthCheck' -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName 'HealthCheck' -Confirm:$false
}

Register-ScheduledTask -TaskName 'HealthCheck' -Action $action2 -Trigger $trigger2 -Settings $settings -Description 'Periodic system health capture' -Force | Out-Null
Write-Host "✓ Task created: HealthCheck (runs every hour)" -ForegroundColor Green

# 3. Run initial capture
Write-Host "`n[3/3] Running initial diagnostic capture..." -ForegroundColor Yellow
& "C:\Users\User\Documents\Capture-Diagnostics.ps1"

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Diagnostic captures saved to: $env:USERPROFILE\CrashLogs" -ForegroundColor Green
Write-Host "`nNext time a restart happens:"
Write-Host "  1. Open PowerShell as admin"
Write-Host "  2. Run: cd ~\CrashLogs"
Write-Host "  3. Compare captures: .\Compare-Diagnostics.ps1 -BeforeDir '<old>' -AfterDir '<new>'"
Write-Host "`nTo view latest capture: Get-Content ~\CrashLogs\<timestamp>\diagnostic.log"
