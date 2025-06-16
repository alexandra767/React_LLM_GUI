#!/bin/bash

echo "🚀 Preparing to run 32B model on M4 Pro"
echo "========================================"
echo ""

# Step 1: Show current memory usage
echo "1. Current memory usage:"
echo "------------------------"
memory_pressure

echo ""
echo "2. Closing memory-heavy apps..."
echo "-------------------------------"
# Close common memory-heavy apps (will only close if running)
osascript -e 'quit app "Google Chrome"' 2>/dev/null && echo "   ✓ Closed Chrome"
osascript -e 'quit app "Safari"' 2>/dev/null && echo "   ✓ Closed Safari"
osascript -e 'quit app "Slack"' 2>/dev/null && echo "   ✓ Closed Slack"
osascript -e 'quit app "Discord"' 2>/dev/null && echo "   ✓ Closed Discord"
osascript -e 'quit app "Microsoft Teams"' 2>/dev/null && echo "   ✓ Closed Teams"

echo ""
echo "3. Restarting Ollama with optimizations..."
echo "------------------------------------------"
# Stop Ollama
ollama stop 2>/dev/null || true
sleep 2

# Set environment for 32B model
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_KEEP_ALIVE=5m  # Unload after 5 min to save memory
export OLLAMA_NUM_PARALLEL=1  # Only 1 request at a time for 32B

# Start Ollama
echo "   Starting Ollama..."
nohup ollama serve > ~/.ollama/ollama.log 2>&1 &
sleep 3

# Check if running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "   ✓ Ollama is running!"
else
    echo "   ✗ Ollama failed to start"
    exit 1
fi

echo ""
echo "4. Memory after cleanup:"
echo "------------------------"
memory_pressure | grep -E "(System-wide|Free|Swap)"

echo ""
echo "5. Testing 32B model..."
echo "----------------------"
# Test the model with a simple prompt
echo "   Sending test prompt to deepseek-r1:32b..."
echo '{"model": "deepseek-r1:32b", "prompt": "Hello", "stream": false}' | \
    curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d @- | jq -r '.response' 2>/dev/null || echo "   ⚠️  Model test failed - may need more memory"

echo ""
echo "✅ Setup complete! You can now use the 32B model in your app."
echo ""
echo "⚡ Quick Tips:"
echo "   • Keep Activity Monitor open to watch memory"
echo "   • If it's slow, the model is likely swapping to disk"
echo "   • For best performance, keep 20GB+ free"
echo "   • The app will auto-apply optimized settings for 32B"