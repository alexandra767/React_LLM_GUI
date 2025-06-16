#!/bin/bash

echo "🧠⚡ Fixing Sephia Helper Apps..."
echo ""

APP_PATH="/Applications/Sephia.app"
FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

# First, restore the main executable name to Electron (required for helpers to work)
echo "Restoring Electron executable name..."
if [ -f "$APP_PATH/Contents/MacOS/Sephia" ]; then
    mv "$APP_PATH/Contents/MacOS/Sephia" "$APP_PATH/Contents/MacOS/Electron"
fi

# Update Info.plist to use Electron as executable but keep Sephia as display name
echo "Updating Info.plist..."
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable Electron" "$APP_PATH/Contents/Info.plist"

# The app will still show as Sephia because of CFBundleName and CFBundleDisplayName

echo ""
echo "✅ Fixed!"
echo ""
echo "The app should now launch properly and still show as 'Sephia' in the UI."