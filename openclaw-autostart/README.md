# OpenClaw Auto-Start Configuration

## Overview
This configures Windows to automatically start WSL (Ubuntu) and OpenClaw gateway on system restart.

## Components

### 1. WSL Auto-Start
WSL will be configured to start automatically via Windows Task Scheduler.

### 2. OpenClaw Gateway Auto-Start
OpenClaw gateway will start automatically inside WSL using systemd or a startup script.

## Setup Instructions

### Step 1: Create Windows Startup Task for WSL

Open PowerShell as Administrator and run:

```powershell
# Create a scheduled task to start WSL on login
$action = New-ScheduledTaskAction -Execute "wsl.exe" -Argument "-d Ubuntu"
$trigger = New-ScheduledTaskTrigger -AtLogon
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive

Register-ScheduledTask -TaskName "WSL-AutoStart" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Start WSL Ubuntu on login"
```

### Step 2: Setup OpenClaw Gateway Auto-Start in WSL

The `setup-openclaw-autostart.sh` script will:
1. Create a systemd service for OpenClaw gateway (if systemd is available)
2. OR create a cron @reboot entry
3. Configure the gateway to start automatically

### Step 3: Enable WSL Systemd (if not already enabled)

In WSL, create/edit `/etc/wsl.conf`:

```ini
[boot]
systemd=true
```

Then restart WSL:
```bash
wsl --shutdown
```

### Step 4: Install OpenClaw Systemd Service

Run the setup script (as your user, not root):
```bash
cd ~/openclaw-autostart
./setup-openclaw-autostart.sh
```

## Files

- `setup-openclaw-autostart.sh` - Configures OpenClaw auto-start in WSL
- `openclaw-gateway.service` - Systemd service file
- `start-openclaw.sh` - Wrapper script to start OpenClaw
- `install-windows-task.ps1` - Windows Task Scheduler setup

## Verification

After setup:
1. Restart your computer
2. WSL should start automatically
3. Open `http://localhost:3000` to verify Mission Control is running
4. Or check OpenClaw status: `openclaw gateway status`

## Troubleshooting

If OpenClaw doesn't start:
1. Check WSL is running: `wsl -l -v` in PowerShell
2. Check OpenClaw service status in WSL: `systemctl status openclaw-gateway` (if using systemd)
3. Check logs: `journalctl -u openclaw-gateway -f` (if using systemd)
4. Or check cron logs if using cron method

## Manual Start

If auto-start fails, manually start with:
```powershell
wsl -d Ubuntu -e bash -c "openclaw gateway start"
```
