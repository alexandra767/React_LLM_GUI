#!/bin/bash

# Sephia App Launcher
# Double-click this file to start Sephia

cd "$(dirname "$0")"

echo ""
echo "   🧠⚡ SEPHIA"
echo "   Connect to Local LLMs"
echo ""
echo "   Starting..."
echo ""

# Check if packaged app exists
if [ -d "dist/mac-arm64/Sephia.app" ]; then
    echo "   Launching packaged app..."
    open "dist/mac-arm64/Sephia.app"
elif [ -d "dist/Sephia.app" ]; then
    echo "   Launching packaged app..."
    open "dist/Sephia.app"
else
    echo "   Starting in development mode..."
    ./start-sephia.command
fi