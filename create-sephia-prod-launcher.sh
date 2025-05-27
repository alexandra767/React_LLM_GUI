#!/bin/bash

echo "🧠⚡ Creating Sephia Production Launcher..."
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

# Create launcher that runs Electron in production mode
cat > "$MACOS_DIR/Sephia" << 'EOF'
#!/bin/bash
# Sephia Production Launcher

PROJECT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"
cd "$PROJECT_PATH"

# Set production environment
export NODE_ENV=production

# Start Electron with the built app
exec ./node_modules/.bin/electron .
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
echo "✅ Sephia production launcher created!"
echo ""
echo "This launcher will run Sephia using the built React files."
echo "No development server needed!"
echo ""
echo "Try launching Sephia now from /Applications!"