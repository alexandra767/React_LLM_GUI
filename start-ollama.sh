#!/bin/bash

# Check if ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 2
    echo "Ollama started"
else
    echo "Ollama is already running"
fi

# List available models
echo "Available models:"
ollama list