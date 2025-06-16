#!/bin/bash

echo "🧠⚡ Fixing Sephia App..."

# Remove old app
rm -rf /Applications/Sephia.app

# Create new AppleScript app with proper paths
osacompile -o /Applications/Sephia.app -e '
on run
    tell application "Terminal"
        activate
        do script "export PATH=\"/Users/alexandratitus767/.nvm/versions/node/v22.16.0/bin:$PATH\" && cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI && npm run electron:dev"
    end tell
end run'

# Copy the icon
cp /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns /Applications/Sephia.app/Contents/Resources/applet.icns

echo "✅ Sephia app fixed!"
echo "📍 Double-click Sephia in Applications to launch"