#!/bin/bash

echo "🧠⚡ Creating NVM-aware Sephia Launcher..."
echo ""

# Remove old launcher
rm -rf /Applications/Sephia.app

# Create launcher script that loads NVM
LAUNCHER_SCRIPT="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/sephia-launcher.sh"
cat > "$LAUNCHER_SCRIPT" << 'EOF'
#!/bin/bash

# Setup NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Change to project directory
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI

# Run Electron
exec node ./node_modules/.bin/electron electron-prod.js
EOF
chmod +x "$LAUNCHER_SCRIPT"

# Create the app using osacompile with Terminal
echo "Building app..."
osacompile -o /Applications/Sephia.app << 'EOF'
on run
    tell application "Terminal"
        activate
        set newWindow to do script "cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI && export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && source \"$NVM_DIR/nvm.sh\" && node ./node_modules/.bin/electron electron-prod.js; exit"
        
        -- Hide Terminal window after launch
        delay 2
        set visible of window 1 to false
    end tell
end run
EOF

# Copy the icon
if [ -f "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" ]; then
    echo "Setting icon..."
    cp "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" "/Applications/Sephia.app/Contents/Resources/applet.icns"
fi

# Update the Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleName Sephia" /Applications/Sephia.app/Contents/Info.plist 2>/dev/null
/usr/libexec/PlistBuddy -c "Set :LSUIElement 1" /Applications/Sephia.app/Contents/Info.plist 2>/dev/null

echo ""
echo "✅ NVM-aware Sephia launcher created!"
echo ""
echo "The app will:"
echo "  • Open Terminal briefly to load NVM"
echo "  • Launch Sephia with the correct Node.js version"
echo "  • Hide the Terminal window"
echo ""
echo "Double-click Sephia in /Applications to launch."