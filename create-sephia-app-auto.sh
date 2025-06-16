#!/bin/bash

# Sephia App Bundle Creator - Auto Version
# This script creates a macOS app bundle for Sephia without prompts

APP_NAME="Sephia"
PROJECT_DIR="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"
APP_DIR="/Applications/${APP_NAME}.app"

echo "🧠⚡ Creating Sephia App Bundle..."

# Remove existing app if present
if [ -d "$APP_DIR" ]; then
    echo "Removing existing app..."
    rm -rf "$APP_DIR"
fi

# Create app bundle structure
echo "Creating app structure..."
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Info.plist
echo "Creating Info.plist..."
cat > "${CONTENTS_DIR}/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.sephia.app</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>© 2024 Sephia. Brain-Lightning Powered LLM GUI.</string>
</dict>
</plist>
EOF

# Copy icon if available
if [ -f "${PROJECT_DIR}/public/favicon.icns" ]; then
    echo "Copying app icon..."
    cp "${PROJECT_DIR}/public/favicon.icns" "${RESOURCES_DIR}/AppIcon.icns"
fi

# Create launcher script
echo "Creating launcher..."
cat > "${MACOS_DIR}/${APP_NAME}" << 'EOF'
#!/bin/bash

# Sephia Launcher
PROJECT_DIR="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI"

# Change to project directory
cd "$PROJECT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the Electron app
npm run electron-dev
EOF

# Make launcher executable
chmod +x "${MACOS_DIR}/${APP_NAME}"

echo "✅ Sephia.app created successfully!"
echo "📍 Location: ${APP_DIR}"
echo "🚀 You can now launch Sephia from your Applications folder!"
echo ""
echo "To run Sephia:"
echo "1. Open Finder"
echo "2. Go to Applications"
echo "3. Double-click on Sephia"
echo ""
echo "Or from Terminal: open '${APP_DIR}'"