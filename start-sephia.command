#!/bin/bash

# Change to the app directory
cd "$(dirname "$0")"

echo "🧠⚡ Starting Sephia..."
echo ""

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start ComfyUI if not already running
if ! lsof -i:8188 > /dev/null 2>&1; then
    echo "Starting ComfyUI for image generation..."
    ./start-comfyui.sh &
    COMFYUI_PID=$!
    echo "ComfyUI starting in background..."
else
    echo "ComfyUI already running on port 8188"
fi

# Start React in background
echo "Starting React server..."
npm start &
REACT_PID=$!

# Wait for React to be ready
echo "Waiting for React to start..."
sleep 8

# Start Electron
echo "Starting Sephia app..."
npm run electron:start

# When Electron closes, kill React and ComfyUI
kill $REACT_PID 2>/dev/null
if [ ! -z "$COMFYUI_PID" ]; then
    kill $COMFYUI_PID 2>/dev/null
    echo "ComfyUI stopped."
fi

echo ""
echo "Sephia closed."