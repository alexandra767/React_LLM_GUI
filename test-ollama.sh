#!/bin/bash

echo "Testing Ollama connection..."

# Test if Ollama is running
echo -n "Checking if Ollama is running... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama is running"
else
    echo "✗ Ollama is not running"
    echo "Please start Ollama with: ollama serve"
    exit 1
fi

# List available models
echo -e "\nAvailable models:"
curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "Could not list models"

# Test streaming with a simple prompt
echo -e "\nTesting streaming with deepseek-r1:8b-m4..."
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-r1:8b-m4",
    "prompt": "Say hello in one sentence.",
    "stream": true
  }' 2>/dev/null | head -5

echo -e "\n\nIf you see model errors above, install the model with:"
echo "ollama pull deepseek-r1:8b-m4"