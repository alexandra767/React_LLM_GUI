#!/bin/bash

echo "🧠⚡ Quick Icon Setup for Sephia"
echo ""

# For now, we'll use the existing icons
# The brain-lightning icon will be shown in the app UI

cd public

# Check what we have
echo "Current icon files:"
ls -la favicon.* logo*.png

echo ""
echo "Your brain-lightning image is at: brain-lightning.jpg"
echo ""

echo "To use the brain-lightning as the app icon:"
echo "1. Install ImageMagick:"
echo "   brew install imagemagick"
echo ""
echo "2. Run the icon generator:"
echo "   node update-app-icon.js"
echo ""
echo "For now, the app will use the existing icons but show"
echo "your brain-lightning icon inside the app interface."