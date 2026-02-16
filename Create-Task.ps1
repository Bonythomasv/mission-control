# Create scheduled task for crash diagnostics
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -File "C:\Users\User\Documents\Capture-Diagnostics.ps1"'
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'CrashDiagnostics' -Action $action -Trigger $trigger -Settings $settings -Description 'Captures system diagnostics after unexpected restart' -Force
Write-Host "Scheduled task 'CrashDiagnostics' created successfully!"
