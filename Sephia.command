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

# Start ComfyUI in background if not running
if ! curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    echo "   Starting ComfyUI for image generation..."
    nohup ./start-comfyui.sh > /tmp/comfyui.log 2>&1 &
    echo "   Waiting for ComfyUI to start..."
    # Wait up to 30 seconds for ComfyUI to be ready
    for i in {1..30}; do
        if curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
            echo "   ✅ ComfyUI is ready!"
            break
        fi
        sleep 1
        echo "   Waiting... ($i/30)"
    done
fi

# Start Bark TTS in background if not running
if ! curl -s http://localhost:8189/status > /dev/null 2>&1; then
    echo "   Starting Bark TTS for AI voices..."
    cd ai-tools/ComfyUI
    nohup ./start-bark-tts.sh > /tmp/bark-tts.log 2>&1 &
    cd ../..
    echo "   Bark TTS starting in background..."
fi

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