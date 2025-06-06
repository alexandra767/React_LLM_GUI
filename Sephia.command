#!/bin/bash

# Sephia App Launcher
# Double-click this file to start Sephia

# Store the script directory in a variable
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "   🧠⚡ SEPHIA"
echo "   Connect to Local LLMs"
echo ""
echo "   Starting..."
echo ""

# Start ComfyUI in background if not running
if ! curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    echo "   Starting ComfyUI for image generation..."
    nohup "$SCRIPT_DIR/ai-tools/ComfyUI/start-comfyui-m4.sh" > /tmp/comfyui.log 2>&1 &
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

# Bark TTS disabled - user doesn't use it
# if ! curl -s http://localhost:8189/status > /dev/null 2>&1; then
#     echo "   Starting Bark TTS for AI voices..."
#     # Use absolute path and subshell to avoid changing current directory
#     (cd "$SCRIPT_DIR/ai-tools/ComfyUI" && nohup ./start-bark-tts.sh > /tmp/bark-tts.log 2>&1 &)
#     echo "   Bark TTS starting in background..."
# fi

# Check if packaged app exists
if [ -d "$SCRIPT_DIR/dist/mac-arm64/Sephia.app" ]; then
    echo "   Launching packaged app..."
    open "$SCRIPT_DIR/dist/mac-arm64/Sephia.app"
elif [ -d "$SCRIPT_DIR/dist/Sephia.app" ]; then
    echo "   Launching packaged app..."
    open "$SCRIPT_DIR/dist/Sephia.app"
else
    echo "   Starting in development mode..."
    # Set up NVM paths
    export PATH="/Users/alexandratitus767/.nvm/versions/node/v22.16.0/bin:$PATH"
    export NVM_DIR="$HOME/.nvm"
    
    # Run the start script
    "$SCRIPT_DIR/start-sephia.command"
fi