#!/bin/bash

echo "🧠⚡ Creating Final Sephia App..."

# Remove old app
rm -rf /Applications/Sephia.app

# Create new AppleScript app that uses our start script
osacompile -o /Applications/Sephia.app -e '
on run
    tell application "Terminal"
        activate
        do script "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/start-sephia.sh"
    end tell
end run'

# Copy the icon
cp /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns /Applications/Sephia.app/Contents/Resources/applet.icns

echo "✅ Final Sephia app created!"
echo "📍 Double-click Sephia in Applications to launch"