#!/bin/bash

echo "🎨 Starting ComfyUI for Sephia Image Generation..."

cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/ai-tools/ComfyUI

# Link desktop models if they exist
DESKTOP_MODELS="/Users/alexandratitus767/Desktop/comfyui-models"
if [ -d "$DESKTOP_MODELS" ]; then
  echo "🔗 Linking desktop models folder..."
  # Create backup of current models if it's not already a symlink
  if [ -d "models" ] && [ ! -L "models" ]; then
    mv models models.backup.$(date +%Y%m%d_%H%M%S)
  fi
  # Remove existing symlink if present
  rm -f models
  # Create symlink to desktop models
  ln -sf "$DESKTOP_MODELS" models
  echo "✅ Models linked from desktop"
else
  echo "⚠️  Desktop models folder not found at $DESKTOP_MODELS"
fi

# Activate virtual environment
source venv/bin/activate

# Start ComfyUI with API enabled
echo "Starting ComfyUI on http://localhost:8188"
python main.py --listen 127.0.0.1 --port 8188 --enable-cors-header "*"