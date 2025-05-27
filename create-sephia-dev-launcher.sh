#!/bin/bash

echo "🧠⚡ Creating Sephia Development Launcher..."
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

# Create launcher that starts both React and Electron
cat > "$MACOS_DIR/Sephia" << 'EOF'
#!/bin/bash
# Sephia Development Launcher

PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"
cd "$PROJECT_PATH"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    osascript -e 'display dialog "npm not found. Please install Node.js first." buttons {"OK"} default button 1 with icon stop'
    exit 1
fi

# Start the React development server in the background
echo "Starting React development server..."
npm start > /tmp/sephia-react.log 2>&1 &
REACT_PID=$!

# Wait for the server to be ready
echo "Waiting for React server..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        break
    fi
    sleep 1
done

# Start Electron
echo "Starting Electron..."
./node_modules/.bin/electron .

# Clean up - kill React server when Electron closes
kill $REACT_PID 2>/dev/null
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
</dict>
</plist>
EOF

echo -n "APPL????" > "$CONTENTS_DIR/PkgInfo"

echo ""
echo "✅ Sephia development launcher created!"
echo ""
echo "This launcher will:"
echo "  • Start the React development server"
echo "  • Wait for it to be ready"
echo "  • Launch Electron"
echo "  • Clean up when you close the app"
echo ""
echo "Try launching Sephia now from /Applications!"