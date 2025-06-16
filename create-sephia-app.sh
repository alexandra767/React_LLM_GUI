#!/bin/bash

echo "🧠⚡ Creating Sephia App Bundle..."
echo ""

# Create app structure
APP_NAME="Sephia"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
PROJECT_DIR="$(pwd)"

# Ask for permission
echo "This will create Sephia.app in your Applications folder."
echo "Do you want to continue? (y/n)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Remove old app if exists
if [ -d "$APP_DIR" ]; then
    echo "Removing old Sephia.app..."
    rm -rf "$APP_DIR"
fi

# Create directories
echo "Creating app structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create launcher script
echo "Creating launcher..."
cat > "$MACOS_DIR/Sephia" << 'EOF'
#!/bin/bash
# Sephia Launcher

# Get the app bundle path
APP_PATH="$(dirname "$(dirname "$(dirname "$0")")")"
PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Change to project directory
cd "$PROJECT_PATH"

# Start the app
osascript -e 'tell application "Terminal"
    activate
    do script "cd \"'$PROJECT_PATH'\" && ./start-sephia.command"
end tell'
EOF

chmod +x "$MACOS_DIR/Sephia"

# Copy icon
echo "Setting up icon..."
cp "$PROJECT_DIR/public/favicon.icns" "$RESOURCES_DIR/app.icns" 2>/dev/null || echo "Using default icon"

# Create Info.plist
echo "Creating app info..."
cat > "$CONTENTS_DIR/Info.plist" << EOF
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

echo ""
echo "✅ Sephia.app created successfully!"
echo ""
echo "📍 Location: /Applications/Sephia.app"
echo ""
echo "You can now:"
echo "  • Open Applications folder and double-click Sephia"
echo "  • Add Sephia to your Dock by dragging it from Applications"
echo "  • Launch from Spotlight by pressing Cmd+Space and typing 'Sephia'"
echo ""
echo "🧠⚡ Enjoy Sephia!"