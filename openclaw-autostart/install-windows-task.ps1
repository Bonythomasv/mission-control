#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Install Windows Task Scheduler jobs for WSL and OpenClaw auto-start
.DESCRIPTION
    Creates scheduled tasks to start WSL and OpenClaw gateway on Windows login
#>

Write-Host "=== Installing Windows Auto-Start Tasks ===" -ForegroundColor Cyan

# Check if running as admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator!"
    exit 1
}

# Function to create task
task Function Create-AutoStartTask {
    param(
        [string]$TaskName,
        [string]$Description,
        [string]$Execute,
        [string]$Argument = ""
    )
    
    # Remove existing task if present
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Removed existing task: $TaskName" -ForegroundColor Yellow
    }
    
    # Create action
    $action = New-ScheduledTaskAction -Execute $Execute -Argument $Argument
    
    # Create trigger (at logon)
    $trigger = New-ScheduledTaskTrigger -AtLogon
    
    # Create settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew
    
    # Create principal (run as current user)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    
    # Register task
    Register-ScheduledTask -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description $Description `
        -Force | Out-Null
    
    Write-Host "✓ Created task: $TaskName" -ForegroundColor Green
}

Write-Host ""
Write-Host "Creating WSL Auto-Start Task..." -ForegroundColor Yellow
Create-AutoStartTask `
    -TaskName "WSL-Ubuntu-AutoStart" `
    -Description "Start WSL Ubuntu distribution on user login" `
    -Execute "wsl.exe" `
    -Argument "-d Ubuntu --exec sleep 30"

Write-Host ""
Write-Host "Creating OpenClaw Gateway Auto-Start Task..." -ForegroundColor Yellow

# Create a batch file to start OpenClaw
$batchContent = @"
@echo off
echo Starting OpenClaw Gateway in WSL...
timeout /t 5 /nobreak >nul
wsl -d Ubuntu -e bash -c "export PATH=\"\$HOME/.npm-global/bin:\$PATH\"; openclaw gateway start" >nul 2>&1
echo OpenClaw Gateway started.
"@

$batchPath = "$env:USERPROFILE\start-openclaw.bat"
$batchContent | Out-File -FilePath $batchPath -Encoding ASCII

Create-AutoStartTask `
    -TaskName "OpenClaw-Gateway-AutoStart" `
    -Description "Start OpenClaw gateway in WSL on user login" `
    -Execute $batchPath

Write-Host ""
Write-Host "Creating Mission Control Auto-Start Task..." -ForegroundColor Yellow

# Batch file for Mission Control
$mcBatchContent = @"
@echo off
echo Starting Mission Control Dashboard...
timeout /t 10 /nobreak >nul
start "" http://localhost:3000
"@

$mcBatchPath = "$env:USERPROFILE\start-mission-control.bat"
$mcBatchContent | Out-File -FilePath $mcBatchPath -Encoding ASCII

Create-AutoStartTask `
    -TaskName "Mission-Control-AutoStart" `
    -Description "Open Mission Control dashboard in browser on login" `
    -Execute $mcBatchPath

Write-Host ""
Write-Host "Creating OpenClaw WebChat Auto-Start Task..." -ForegroundColor Yellow

# Batch file for OpenClaw WebChat
$webchatBatchContent = @"
@echo off
echo Opening OpenClaw WebChat...
timeout /t 15 /nobreak >nul
start "" http://localhost:18789/chat
"@

$webchatBatchPath = "$env:USERPROFILE\start-openclaw-webchat.bat"
$webchatBatchContent | Out-File -FilePath $webchatBatchPath -Encoding ASCII

Create-AutoStartTask `
    -TaskName "OpenClaw-WebChat-AutoStart" `
    -Description "Open OpenClaw WebChat interface in browser on login" `
    -Execute $webchatBatchPath

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "The following tasks will run on your next login:" -ForegroundColor Cyan
Write-Host "  1. WSL Ubuntu starts" -ForegroundColor White
Write-Host "  2. OpenClaw gateway starts inside WSL" -ForegroundColor White
Write-Host "  3. Mission Control dashboard opens (http://localhost:3000)" -ForegroundColor White
Write-Host "  4. OpenClaw WebChat opens (http://localhost:18789/chat)" -ForegroundColor White
Write-Host ""
Write-Host "To verify, restart your computer and check:" -ForegroundColor Yellow
Write-Host "  - Task Manager > Services for WSL" -ForegroundColor Gray
Write-Host "  - Browser tabs will open automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "To view scheduled tasks, run: Get-ScheduledTask | Where-Object {`$_.TaskName -like '*AutoStart*' }" -ForegroundColor Gray
