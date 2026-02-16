#!/bin/bash
# Setup OpenClaw Gateway Auto-Start in WSL

set -e

echo "=== OpenClaw Auto-Start Setup ==="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in WSL
if [[ ! -f /proc/version ]] || ! grep -q "microsoft" /proc/version && ! grep -q "WSL" /proc/version; then
    echo -e "${YELLOW}Warning: This doesn't appear to be WSL. Continuing anyway...${NC}"
fi

# Create directory for autostart files
mkdir -p ~/.config/openclaw

# Create the startup script
cat > ~/.config/openclaw/start-gateway.sh << 'EOF'
#!/bin/bash
# OpenClaw Gateway Startup Script

export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"
export NODE_PATH="$HOME/.npm-global/lib/node_modules"

LOG_FILE="$HOME/.config/openclaw/gateway.log"
PID_FILE="$HOME/.config/openclaw/gateway.pid"

echo "$(date): Starting OpenClaw Gateway..." >> "$LOG_FILE"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "$(date): Gateway already running (PID: $PID)" >> "$LOG_FILE"
        exit 0
    fi
fi

# Start the gateway
openclaw gateway start >> "$LOG_FILE" 2>&1 &
PID=$!
echo $PID > "$PID_FILE"
echo "$(date): Gateway started with PID: $PID" >> "$LOG_FILE"
EOF

chmod +x ~/.config/openclaw/start-gateway.sh

echo -e "${GREEN}✓${NC} Created startup script"

# Check if systemd is available
if command -v systemctl &> /dev/null && systemctl --version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Systemd detected - installing service"
    
    # Create systemd user service
    mkdir -p ~/.config/systemd/user
    
    cat > ~/.config/systemd/user/openclaw-gateway.service << EOF
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=forking
ExecStart=$HOME/.config/openclaw/start-gateway.sh
ExecStop=/bin/bash -c 'openclaw gateway stop'
Restart=on-failure
RestartSec=10
Environment="PATH=$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
Environment="HOME=$HOME"

[Install]
WantedBy=default.target
EOF

    # Reload systemd
    systemctl --user daemon-reload
    
    # Enable service
    systemctl --user enable openclaw-gateway.service
    
    echo -e "${GREEN}✓${NC} Systemd service installed and enabled"
    echo ""
    echo "To start now: systemctl --user start openclaw-gateway"
    echo "To check status: systemctl --user status openclaw-gateway"
    echo "To view logs: journalctl --user -u openclaw-gateway -f"
    
else
    echo -e "${YELLOW}!${NC} Systemd not available - using cron @reboot instead"
    
    # Add cron job
    CRON_JOB="@reboot /bin/bash $HOME/.config/openclaw/start-gateway.sh"
    
    # Check if already exists
    if ! crontab -l 2>/dev/null | grep -q "openclaw"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        echo -e "${GREEN}✓${NC} Cron job added"
    else
        echo -e "${YELLOW}!${NC} Cron job already exists"
    fi
    
    echo ""
    echo "Cron job set up. OpenClaw will start on next reboot."
fi

# Also add to .bashrc as a fallback (won't start on boot, but when you open WSL)
if ! grep -q "openclaw gateway status" ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'EOF'

# Auto-start OpenClaw gateway if not running (WSL interactive sessions)
if command -v openclaw &> /dev/null; then
    if ! openclaw gateway status &> /dev/null; then
        openclaw gateway start &> /dev/null &
    fi
fi
EOF
    echo -e "${GREEN}✓${NC} Added fallback to .bashrc"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "OpenClaw gateway will now start automatically when:"
echo "1. Windows starts and you log in (via WSL auto-start)"
echo "2. WSL starts (via systemd or cron)"
echo ""
echo "Test it by restarting your computer!"
