# System Crash Monitor
# Captures diagnostic data for troubleshooting unexpected restarts

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logDir = "$env:USERPROFILE\CrashLogs"
$sessionDir = "$logDir\$timestamp"
New-Item -ItemType Directory -Path $sessionDir -Force | Out-Null

function Write-Log($msg) {
    $msg | Tee-Object -FilePath "$sessionDir\diagnostic.log" -Append
}

Write-Log "=== System Diagnostic Capture: $timestamp ==="
Write-Log ""

# 1. System uptime and boot history
Write-Log "--- Boot History (last 10) ---"
Get-WinEvent -FilterHashtable @{LogName='System'; ID=6005,6006,6008,6009,1074,1076,41} -MaxEvents 10 | 
    Select-Object TimeCreated, Id, LevelDisplayName, Message | 
    Format-Table -Wrap | Out-String | Write-Log

# 2. Critical/Error events in last 24 hours
Write-Log ""
Write-Log "--- Critical/Error Events (last 24h) ---"
$startTime = (Get-Date).AddHours(-24)
Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2; StartTime=$startTime} -ErrorAction SilentlyContinue | 
    Select-Object TimeCreated, Id, Message | 
    Format-Table -Wrap | Out-String | Write-Log

# 3. Application crashes
Write-Log ""
Write-Log "--- Application Errors (last 24h) ---"
Get-WinEvent -FilterHashtable @{LogName='Application'; Level=1,2; StartTime=$startTime} -ErrorAction SilentlyContinue | 
    Where-Object { $_.Message -match 'crash|fault|exception|stopped' } |
    Select-Object TimeCreated, Id, Message | 
    Format-Table -Wrap | Out-String | Write-Log

# 4. System info
Write-Log ""
Write-Log "--- System Info ---"
Write-Log "Computer: $env:COMPUTERNAME"
Write-Log "User: $env:USERNAME"
Get-WmiObject Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture | Format-List | Out-String | Write-Log

# 5. CPU and thermal info
Write-Log ""
Write-Log "--- CPU Info ---"
Get-WmiObject Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed, LoadPercentage | Format-List | Out-String | Write-Log

# 6. Memory status
Write-Log ""
Write-Log "--- Memory Status ---"
Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory, TotalVirtualMemorySize, FreeVirtualMemory | Format-List | Out-String | Write-Log
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, Id, WorkingSet, PagedMemorySize | Format-Table | Out-String | Write-Log

# 7. Disk status
Write-Log ""
Write-Log "--- Disk Status ---"
Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace, @{Name='PercentFree';Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}} | Format-Table | Out-String | Write-Log
Get-PhysicalDisk | Select-Object DeviceId, MediaType, HealthStatus, OperationalStatus, Size | Format-Table | Out-String | Write-Log

# 8. GPU info
Write-Log ""
Write-Log "--- GPU Info ---"
Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, Status, @{Name='Temperature';Expression={'N/A'}} | Format-List | Out-String | Write-Log

# 9. Power settings
Write-Log ""
Write-Log "--- Power Settings ---"
powercfg /query SCHEME_CURRENT SUB_SLEEP | Out-String | Write-Log
powercfg /a | Out-String | Write-Log

# 10. Running processes (top resource users)
Write-Log ""
Write-Log "--- Top Processes by CPU ---"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 15 Name, Id, CPU, WorkingSet, PagedMemorySize | Format-Table | Out-String | Write-Log

# 11. Event log export (last 100 system events)
Write-Log ""
Write-Log "--- Exporting recent event logs ---"
Get-WinEvent -FilterHashtable @{LogName='System'} -MaxEvents 100 | Export-Clixml "$sessionDir\system_events.xml"
Get-WinEvent -FilterHashtable @{LogName='Application'} -MaxEvents 50 | Export-Clixml "$sessionDir\application_events.xml"

# 12. Minidump check
Write-Log ""
Write-Log "--- Minidump Files ---"
if (Test-Path C:\Windows\Minidump) {
    Get-ChildItem C:\Windows\Minidump | Select-Object Name, LastWriteTime, Length | Format-Table | Out-String | Write-Log
} else {
    Write-Log "No minidump directory found"
}

# 13. Reliability history
Write-Log ""
Write-Log "--- Reliability Records (last 20) ---"
Get-WmiObject Win32_ReliabilityRecords | Select-Object -First 20 TimeGenerated, EventIdentifier, Message | Format-Table -Wrap | Out-String | Write-Log

# 14. Driver issues
Write-Log ""
Write-Log "--- Problematic Drivers ---"
Get-WmiObject Win32_PnPSignedDriver | Where-Object { $_.Status -ne 'OK' } | Select-Object DeviceName, DriverVersion, Status | Format-Table | Out-String | Write-Log

# 15. Windows Update status
Write-Log ""
Write-Log "--- Pending Updates ---"
try {
    $updateSession = New-Object -ComObject Microsoft.Update.Session
    $updateSearcher = $updateSession.CreateUpdateSearcher()
    $searchResult = $updateSearcher.Search("IsInstalled=0")
    $searchResult.Updates | Select-Object Title, IsDownloaded | Format-Table -Wrap | Out-String | Write-Log
} catch {
    Write-Log "Could not check for updates"
}

Write-Log ""
Write-Log "=== Diagnostic capture complete: $sessionDir ==="

# Keep only last 10 captures to save space
Get-ChildItem $logDir -Directory | Sort-Object CreationTime -Descending | Select-Object -Skip 10 | Remove-Item -Recurse -Force

# Output summary
Write-Host "`nDiagnostic data saved to: $sessionDir" -ForegroundColor Green
Write-Host "Run 'Get-Content $sessionDir\diagnostic.log' to view results" -ForegroundColor Green
