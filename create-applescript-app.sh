#!/bin/bash

echo "🧠⚡ Creating Sephia AppleScript App..."

# Create the app using AppleScript
osacompile -o /Applications/Sephia.app -e '
on run
    tell application "Terminal"
        activate
        do script "cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI && npm run electron:dev"
        delay 2
        set miniaturized of window 1 to true
    end tell
end run'

# Copy the icon
cp /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns /Applications/Sephia.app/Contents/Resources/applet.icns

echo "✅ Sephia AppleScript app created!"
echo "📍 Double-click Sephia in Applications to launch"