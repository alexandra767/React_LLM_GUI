#!/bin/bash

echo "🧠⚡ Creating Simple Sephia Launcher..."
echo ""

# Remove old launcher
rm -rf /Applications/Sephia.app

# Use the existing start-sephia.sh script
SCRIPT_PATH="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/start-sephia.sh"

# Check if start-sephia.sh exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Creating start-sephia.sh..."
    cat > "$SCRIPT_PATH" << 'EOF'
#!/bin/bash
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI
./node_modules/.bin/electron electron-prod.js
EOF
    chmod +x "$SCRIPT_PATH"
fi

# Create the app using osacompile (native macOS method)
echo "Building app with osacompile..."
osacompile -o /Applications/Sephia.app -e "do shell script \"cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI && ./node_modules/.bin/electron electron-prod.js\""

# Copy the icon
if [ -f "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" ]; then
    echo "Setting icon..."
    cp "/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/favicon.icns" "/Applications/Sephia.app/Contents/Resources/applet.icns"
fi

# Update the Info.plist to show proper name
/usr/libexec/PlistBuddy -c "Set :CFBundleName Sephia" /Applications/Sephia.app/Contents/Info.plist 2>/dev/null

echo ""
echo "✅ Simple Sephia launcher created!"
echo ""
echo "Double-click Sephia in /Applications to launch."