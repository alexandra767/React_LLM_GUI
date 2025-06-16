#!/bin/bash

echo "🧠⚡ Fixing Sephia launcher to prevent duplicate Electron instances..."
echo ""

# Kill any existing Electron instances
echo "Stopping any running Electron processes..."
pkill -f "electron.*electron-prod.js" 2>/dev/null
pkill -f "Electron" 2>/dev/null
sleep 1

# Create a better launcher that doesn't spawn duplicates
cat > /tmp/sephia-launcher.sh << 'EOF'
#!/bin/bash
# Sephia Launcher - Prevents duplicate instances

PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"
cd "$PROJECT_PATH"

# Check if already running
if pgrep -f "electron.*electron-prod.js" > /dev/null; then
    echo "Sephia is already running"
    # Bring to front using AppleScript
    osascript -e 'tell application "System Events" to set frontmost of (first process whose name contains "Electron") to true' 2>/dev/null
    exit 0
fi

# Kill any stray Electron processes first
pkill -f "Electron" 2>/dev/null
sleep 0.5

# Start fresh instance
exec /Users/alexandratitus767/.nvm/versions/node/v22.16.0/bin/node ./node_modules/.bin/electron electron-prod.js
EOF

chmod +x /tmp/sephia-launcher.sh

# Update the Sephia.app to use the new launcher
echo "Updating Sephia.app launcher..."
cp /tmp/sephia-launcher.sh /Applications/Sephia.app/Contents/MacOS/Sephia

echo ""
echo "✅ Fixed! Sephia should now:"
echo "  • Only run one instance at a time"
echo "  • Bring existing window to front if already running"
echo "  • Not create duplicate Electron processes"
echo ""
echo "Try launching Sephia now!"