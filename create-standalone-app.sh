#!/bin/bash

# Create a standalone Sephia app that launches without Terminal

echo "🧠⚡ Creating standalone Sephia app..."

# First, let's build the React app
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI
echo "Building React app..."
npm run build

# Now create the app bundle
APP_NAME="Sephia"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# Remove existing app
rm -rf "$APP_DIR"

# Create structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy icon
cp public/favicon.icns "$RESOURCES_DIR/app.icns"

# Create Info.plist with proper settings
cat > "${CONTENTS_DIR}/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Sephia</string>
    <key>CFBundleIdentifier</key>
    <string>com.sephia.app</string>
    <key>CFBundleName</key>
    <string>Sephia</string>
    <key>CFBundleDisplayName</key>
    <string>Sephia</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleIconFile</key>
    <string>app</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create the launcher script
cat > "${MACOS_DIR}/Sephia" << 'EOF'
#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$DIR/../.." && pwd )"

# Set working directory
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start Electron in background
nohup npm run electron:dev > /tmp/sephia.log 2>&1 &

# Give it a moment to start
sleep 2

# Exit the launcher
exit 0
EOF

# Make executable
chmod +x "${MACOS_DIR}/Sephia"

echo "✅ Standalone Sephia app created!"
echo "📍 Location: $APP_DIR"
echo ""
echo "The app will now launch without opening Terminal."