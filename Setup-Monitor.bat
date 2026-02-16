@echo off
echo === Creating CrashDiagnostics Scheduled Task ===
powershell -Command "Unregister-ScheduledTask -TaskName 'CrashDiagnostics' -Confirm:$false" 2>nul
powershell -Command "Register-ScheduledTask -TaskName 'CrashDiagnostics' -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"C:\Users\User\Documents\Capture-Diagnostics.ps1\"') -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable) -Description 'Captures system diagnostics after unexpected restart' -Force"
echo.
echo === Task Created ===
powershell -Command "Get-ScheduledTask -TaskName 'CrashDiagnostics' | Select-Object TaskName, State, NextRunTime | Format-Table"
echo.
echo === Running initial capture ===
powershell -ExecutionPolicy Bypass -File "C:\Users\User\Documents\Capture-Diagnostics.ps1"
echo.
pause
