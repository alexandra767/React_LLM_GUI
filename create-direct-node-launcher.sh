#!/bin/bash

echo "🧠⚡ Creating Direct Node Sephia Launcher..."
echo ""

# Remove old launcher
rm -rf /Applications/Sephia.app

# Create the app using osacompile with direct node path
echo "Building app with direct node path..."
osacompile -o /Applications/Sephia.app -e "do shell script \"cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI && /Users/alexandratitus767/.nvm/versions/node/v22.16.0/bin/node ./node_modules/.bin/electron electron-prod.js\""

# Copy the icon
if [ -f "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" ]; then
    echo "Setting icon..."
    cp "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" "/Applications/Sephia.app/Contents/Resources/applet.icns"
fi

# Update the Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleName Sephia" /Applications/Sephia.app/Contents/Info.plist 2>/dev/null

echo ""
echo "✅ Direct Node Sephia launcher created!"
echo ""
echo "This launcher uses the direct path to Node.js."
echo "No Terminal window will appear."
echo ""
echo "Double-click Sephia in /Applications to launch."