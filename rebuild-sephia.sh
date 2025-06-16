#!/bin/bash

echo "Rebuilding Sephia app with proper branding..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/

# Ensure we have the React build
if [ ! -d "build" ]; then
    echo "Building React app first..."
    npm run build
fi

# Build the Electron app with proper branding
echo "Building Electron app..."
npx electron-builder build --mac --config electron-builder-config.json

# Check if the build was successful
if [ -f "dist/Sephia-0.1.0-arm64.dmg" ] || [ -f "dist/Sephia-0.1.0.dmg" ]; then
    echo "Build successful! DMG created in dist/"
    echo "You can install the app by opening the DMG file."
else
    echo "Build may have failed. Checking for app bundle..."
    if [ -d "dist/mac*/Sephia.app" ]; then
        echo "App bundle found. You can copy it to Applications manually."
    else
        echo "Build failed. Please check the errors above."
    fi
fi