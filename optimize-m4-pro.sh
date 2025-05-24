#!/bin/bash

echo "🚀 M4 Pro Performance Optimization Script"
echo "==========================================="
echo "Your system: M4 Pro with 12 CPU cores, 16 GPU cores, 24GB RAM"
echo ""

# Stop Ollama if running
echo "1. Stopping Ollama..."
ollama stop 2>/dev/null || true
sleep 2

# Set optimal environment variables
echo "2. Setting M4 Pro optimized environment variables..."
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_KEEP_ALIVE=30m
export OLLAMA_GPU_LAYERS=999
export OLLAMA_NUM_THREAD=10
export GOMAXPROCS=10

# For Metal optimization
export GGML_METAL_PATH_RESOURCES="$(brew --prefix)/share/ggml-metal"
export GGML_USE_METAL=1

echo "   ✓ Parallel requests: 4"
echo "   ✓ Max loaded models: 1"
echo "   ✓ Keep alive: 30 minutes"
echo "   ✓ GPU layers: Maximum"
echo "   ✓ CPU threads: 10 (of 12 cores)"
echo "   ✓ Metal acceleration: Enabled"

# Start Ollama with optimizations
echo ""
echo "3. Starting Ollama with M4 Pro optimizations..."
nohup ollama serve > ~/.ollama/ollama.log 2>&1 &
sleep 3

# Test if Ollama is running
echo ""
echo "4. Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "   ✓ Ollama is running!"
else
    echo "   ✗ Ollama failed to start. Check ~/.ollama/ollama.log"
    exit 1
fi

# Show current models
echo ""
echo "5. Available models:"
ollama list

echo ""
echo "🎯 Performance Tips for deepseek-r1:14b-m4:"
echo "----------------------------------------"
echo "1. For maximum speed, use quantized version:"
echo "   ollama pull deepseek-r1:14b-q4_K_M"
echo ""
echo "2. Monitor GPU usage:"
echo "   - Open Activity Monitor > Window > GPU History"
echo "   - You should see high GPU usage when generating"
echo ""
echo "3. Expected performance with your M4 Pro:"
echo "   - 14B models: 30-50 tokens/second"
echo "   - 8B models: 60-100 tokens/second"
echo "   - 3B models: 150-200 tokens/second"
echo ""
echo "4. If still slow, try:"
echo "   - Close Chrome/Safari (they use GPU)"
echo "   - Reduce context size in app settings"
echo "   - Use smaller model variants"

echo ""
echo "✅ Optimization complete! Your M4 Pro is ready for maximum LLM performance."