#!/bin/bash

echo "🧠⚡ Creating Finder-compatible Sephia Launcher..."
echo ""

# Remove old launcher
rm -rf /Applications/Sephia.app

# Create app structure
APP_NAME="Sephia"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
PROJECT_DIR="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Create directories
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create launcher that works from Finder
cat > "$MACOS_DIR/Sephia" << 'EOF'
#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Setup environment for Finder launch
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="${HOME:-/Users/alexandratitus767}"

# Log for debugging
LOG_FILE="/tmp/sephia-launch.log"
echo "Launching Sephia at $(date)" > "$LOG_FILE"
echo "PATH: $PATH" >> "$LOG_FILE"
echo "HOME: $HOME" >> "$LOG_FILE"

# Change to project directory
cd "$PROJECT_PATH" 2>> "$LOG_FILE"

# Find node and electron
NODE_BIN="$(which node || echo '/usr/local/bin/node')"
if [ ! -f "$NODE_BIN" ]; then
    # Check common Node.js installation paths
    for node_path in "/opt/homebrew/bin/node" "/usr/local/bin/node" "$HOME/.nvm/versions/node/*/bin/node"; do
        if [ -f "$node_path" ]; then
            NODE_BIN="$node_path"
            break
        fi
    done
fi

echo "Node binary: $NODE_BIN" >> "$LOG_FILE"

# Check if we have electron
ELECTRON_BIN="./node_modules/.bin/electron"
if [ ! -f "$ELECTRON_BIN" ]; then
    echo "Electron not found at $ELECTRON_BIN" >> "$LOG_FILE"
    osascript -e 'display dialog "Electron not found. Please run npm install in the project directory." buttons {"OK"} default button 1 with icon stop'
    exit 1
fi

# Launch Electron
echo "Launching Electron..." >> "$LOG_FILE"
"$ELECTRON_BIN" electron-prod.js >> "$LOG_FILE" 2>&1
EOF

chmod +x "$MACOS_DIR/Sephia"

# Copy icon
cp "$PROJECT_DIR/public/favicon.icns" "$RESOURCES_DIR/app.icns" 2>/dev/null

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Sephia</string>
    <key>CFBundleIconFile</key>
    <string>app.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.sephia.app</string>
    <key>CFBundleName</key>
    <string>Sephia</string>
    <key>CFBundleDisplayName</key>
    <string>Sephia</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.10</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSEnvironment</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

echo -n "APPL????" > "$CONTENTS_DIR/PkgInfo"

echo ""
echo "✅ Finder-compatible Sephia launcher created!"
echo ""
echo "Try double-clicking Sephia in /Applications now."
echo ""
echo "If it doesn't work, check /tmp/sephia-launch.log for debugging info."