#!/bin/bash

echo "🧠 Checking 32B Model Compatibility for M4 Pro (24GB)"
echo "===================================================="
echo ""

# Check current memory usage
echo "1. Current Memory Status:"
vm_stat | grep -E "(free|wired|compressed|Pages active)" | sed 's/Pages //g' | awk '{printf "   %-20s %8.2f GB\n", $1, $2 * 4096 / 1024 / 1024 / 1024}'

# Calculate available memory
FREE_MEM=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
INACTIVE_MEM=$(vm_stat | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
PURGEABLE_MEM=$(vm_stat | grep "Pages purgeable" | awk '{print $3}' | sed 's/\.//')
AVAILABLE_MEM=$((($FREE_MEM + $INACTIVE_MEM + $PURGEABLE_MEM) * 4096 / 1024 / 1024 / 1024))

echo ""
echo "   Available Memory: ~${AVAILABLE_MEM}GB"

# Check if 32B model can run
echo ""
echo "2. 32B Model Compatibility:"
if [ $AVAILABLE_MEM -ge 18 ]; then
    echo "   ✅ You have enough memory for deepseek-r1:32b (Q4 quantized)"
    echo "   Expected performance: 15-25 tokens/second"
elif [ $AVAILABLE_MEM -ge 16 ]; then
    echo "   ⚠️  Memory is tight but should work with deepseek-r1:32b (Q4)"
    echo "   Close other applications for best performance"
else
    echo "   ❌ Not enough free memory for 32B model"
    echo "   Need at least 16GB free, you have ${AVAILABLE_MEM}GB"
    echo "   Try closing applications or use a smaller model"
fi

# Show current Ollama models
echo ""
echo "3. Installed Models:"
ollama list | grep -E "(Model|32b|14b|8b)" | head -10

# Performance tips
echo ""
echo "4. 32B Model Performance Tips:"
echo "   • Use Q4_K_M quantization: ollama pull deepseek-r1:32b-q4_K_M"
echo "   • Keep context size at 8192 (automatically set)"
echo "   • Close Chrome/Safari to free GPU memory"
echo "   • Monitor memory pressure in Activity Monitor"
echo "   • If slow, try: export OLLAMA_MAX_LOADED_MODELS=1"

# Test if 32B model is available
echo ""
echo "5. Testing 32B Model:"
if ollama list | grep -q "32b"; then
    echo "   ✅ 32B model found! You can use it in the app."
    MODEL_NAME=$(ollama list | grep "32b" | head -1 | awk '{print $1}')
    echo "   Model: $MODEL_NAME"
else
    echo "   ℹ️  No 32B model installed yet."
    echo "   To install: ollama pull deepseek-r1:32b-q4_K_M"
fi