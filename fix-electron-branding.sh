#!/bin/bash

echo "🧠⚡ Fixing Electron App Branding..."
echo ""

# Check if the Electron app exists
if [ ! -d "dist/mac-arm64/Electron.app" ]; then
    echo "❌ Electron app not found in dist/mac-arm64/"
    echo "Please run: npm run electron:build first"
    exit 1
fi

# Copy to Applications as Sephia.app
echo "Creating Sephia.app from Electron build..."
rm -rf /Applications/Sephia.app
cp -R dist/mac-arm64/Electron.app /Applications/Sephia.app

# Update Info.plist
echo "Updating app info..."
/usr/libexec/PlistBuddy -c "Set :CFBundleName Sephia" /Applications/Sephia.app/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Sephia" /Applications/Sephia.app/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.sephia.app" /Applications/Sephia.app/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable Sephia" /Applications/Sephia.app/Contents/Info.plist

# Rename the executable
mv /Applications/Sephia.app/Contents/MacOS/Electron /Applications/Sephia.app/Contents/MacOS/Sephia

# Copy the correct icon
echo "Setting app icon..."
cp public/favicon.icns /Applications/Sephia.app/Contents/Resources/electron.icns 2>/dev/null

# Update Helper apps
for helper in "Electron Helper" "Electron Helper (GPU)" "Electron Helper (Plugin)" "Electron Helper (Renderer)"; do
    if [ -d "/Applications/Sephia.app/Contents/Frameworks/$helper.app" ]; then
        mv "/Applications/Sephia.app/Contents/Frameworks/$helper.app" "/Applications/Sephia.app/Contents/Frameworks/Sephia Helper.app" 2>/dev/null
    fi
done

echo ""
echo "✅ Sephia.app has been fixed!"
echo ""
echo "The app is now in /Applications/Sephia.app"
echo "It should now show 'Sephia' in the sidebar with the correct icon."
echo ""
echo "⚠️  Note: You may need to restart the app for all changes to take effect."