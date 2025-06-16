#!/bin/bash

echo "🧠⚡ Creating Sephia Launcher App..."
echo ""

# Remove the broken Electron copy
echo "Removing broken app..."
rm -rf /Applications/Sephia.app

# Create a simple launcher app
APP_NAME="Sephia"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
PROJECT_DIR="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Create directories
echo "Creating app structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create launcher script that runs Electron from the project directory
echo "Creating launcher..."
cat > "$MACOS_DIR/Sephia" << 'EOF'
#!/bin/bash
# Sephia Launcher

PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Change to project directory and run Electron
cd "$PROJECT_PATH"

# Check if Electron exists
if [ -f "node_modules/.bin/electron" ]; then
    # Run Electron with the current directory
    exec ./node_modules/.bin/electron .
else
    # Show error dialog
    osascript -e 'display dialog "Electron not found. Please run npm install in the project directory." buttons {"OK"} default button 1 with icon stop'
fi
EOF

chmod +x "$MACOS_DIR/Sephia"

# Copy icon
echo "Setting up icon..."
cp "$PROJECT_DIR/public/favicon.icns" "$RESOURCES_DIR/app.icns" 2>/dev/null

# Create Info.plist
echo "Creating app info..."
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
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create PkgInfo
echo -n "APPL????" > "$CONTENTS_DIR/PkgInfo"

echo ""
echo "✅ Sephia launcher created successfully!"
echo ""
echo "📍 Location: /Applications/Sephia.app"
echo ""
echo "The app will run Electron from your development directory."
echo "This ensures all resources are found correctly."
echo ""
echo "Try launching Sephia now!"