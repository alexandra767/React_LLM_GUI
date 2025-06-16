#!/bin/bash

# Build script for Sephia Electron app
set -e

echo "🚀 Building Sephia for macOS..."

# Check if electron-builder is installed
if ! npm list electron-builder &>/dev/null; then
    echo "📦 Installing electron-builder..."
    npm install --save-dev electron-builder
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist build

# Build React app for production
echo "⚛️ Building React app..."
npm run build

# Update package.json with proper app name and build config
echo "📝 Configuring electron-builder..."
cat > electron-builder-config.json << 'EOF'
{
  "appId": "com.sephia.app",
  "productName": "Sephia",
  "directories": {
    "output": "dist"
  },
  "files": [
    "build/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "icon": "public/favicon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
EOF

# Create entitlements file for macOS
mkdir -p build
cat > build/entitlements.mac.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
EOF

# Build the Electron app
echo "🔨 Building Electron app..."
npx electron-builder --mac --config electron-builder-config.json

# Find the built app
APP_PATH=$(find dist -name "Sephia.app" -type d | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "❌ Error: Could not find built app"
    exit 1
fi

echo "✅ Build complete: $APP_PATH"

# Ask if user wants to install to Applications
read -p "📁 Install Sephia to /Applications? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Installing to /Applications..."
    # Remove old version if exists
    if [ -d "/Applications/Sephia.app" ]; then
        echo "🗑️  Removing old version..."
        rm -rf "/Applications/Sephia.app"
    fi
    # Copy new version
    cp -R "$APP_PATH" /Applications/
    echo "✅ Sephia installed to /Applications"
    echo "🚀 You can now launch Sephia from your Applications folder!"
else
    echo "ℹ️  Skipped installation. App is available at: $APP_PATH"
fi

# Clean up temporary config file
rm -f electron-builder-config.json

echo "🎉 Done!"