#!/bin/bash

echo "🎨 Starting ComfyUI for Sephia Image Generation..."

cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/ai-tools/ComfyUI

# Activate virtual environment
source venv/bin/activate

# Start ComfyUI with API enabled
echo "Starting ComfyUI on http://localhost:8188"
python main.py --listen 127.0.0.1 --port 8188 --enable-cors-header "*"