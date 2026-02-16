# Compare two diagnostic captures to find what changed
param(
    [Parameter(Mandatory=$true)]
    [string]$BeforeDir,
    
    [Parameter(Mandatory=$true)]
    [string]$AfterDir
)

Write-Host "`n=== Comparing Diagnostic Captures ===" -ForegroundColor Cyan
Write-Host "Before: $BeforeDir"
Write-Host "After: $AfterDir"
Write-Host ""

# Compare boot events
Write-Host "--- Boot Event Changes ---" -ForegroundColor Yellow
$beforeBoot = Import-Clixml "$BeforeDir\system_events.xml" | Where-Object { $_.Id -in @(6005,6006,6008,6009,41) }
$afterBoot = Import-Clixml "$AfterDir\system_events.xml" | Where-Object { $_.Id -in @(6005,6006,6008,6009,41) }
$afterBoot | Where-Object { $_.TimeCreated -gt ($beforeBoot | Select-Object -Last 1).TimeCreated } | Select-Object TimeCreated, Id, Message | Format-Table -Wrap

# Compare memory
Write-Host "`n--- Memory Changes ---" -ForegroundColor Yellow
$beforeLog = Get-Content "$BeforeDir\diagnostic.log" -Raw
$afterLog = Get-Content "$AfterDir\diagnostic.log" -Raw

# Extract memory section
if ($beforeLog -match '(?s)--- Memory Status ---(.+?)--- Disk Status ---') {
    Write-Host "Before Memory:" -ForegroundColor Gray
    Write-Host $matches[1].Trim() -ForegroundColor Gray
}
if ($afterLog -match '(?s)--- Memory Status ---(.+?)--- Disk Status ---') {
    Write-Host "`nAfter Memory:" -ForegroundColor White
    Write-Host $matches[1].Trim() -ForegroundColor White
}

Write-Host "`n=== Analysis Complete ===" -ForegroundColor Cyan
Write-Host "Check full logs at: $AfterDir\diagnostic.log"
