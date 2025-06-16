#!/bin/bash

# Kill any existing Ollama process
pkill ollama

# Start Ollama with CORS support
echo "Starting Ollama with CORS support..."
OLLAMA_ORIGINS="*" OLLAMA_HOST="0.0.0.0:11434" ollama serve &

# Wait for Ollama to start
sleep 3

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Ollama is running with CORS enabled"
    echo "Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name'
else
    echo "Failed to start Ollama"
fi