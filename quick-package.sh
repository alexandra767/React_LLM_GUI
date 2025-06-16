#!/bin/bash

echo "🧠⚡ Quick Package Sephia"
echo ""

# Kill any existing process
pkill -f "npm start" 2>/dev/null
pkill -f "electron" 2>/dev/null

# Build only DMG for faster packaging
echo "Building Sephia DMG..."
npx electron-builder --mac --config.mac.target=dmg --config.directories.output=dist

echo ""
echo "✅ Build complete!"
echo ""

# Check if DMG was created
if [ -f "dist/Sephia-*.dmg" ]; then
    echo "🎉 Your Sephia app is ready!"
    echo ""
    ls -la dist/*.dmg
    echo ""
    echo "Double-click the DMG file to install Sephia!"
else
    echo "Looking for output files..."
    find dist -name "*.dmg" -o -name "*.app" 2>/dev/null
fi