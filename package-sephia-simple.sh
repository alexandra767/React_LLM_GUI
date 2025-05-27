#!/bin/bash

echo "🧠⚡ Simple Sephia Packaging"
echo ""

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/

# Build the app with just DMG
echo "Building Sephia..."
npm run build

echo "Packaging for macOS..."
npx electron-builder --mac --config.mac.target=dmg

echo ""
echo "✅ Build complete!"
echo ""
echo "Look for your app in the dist/ folder"