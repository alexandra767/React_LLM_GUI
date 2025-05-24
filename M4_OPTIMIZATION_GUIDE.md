# M4 MacBook Pro (24GB) Optimization Guide for LLM Models

## Optimizations Applied

### 1. Model-Specific Settings
The app now automatically detects model size and applies optimized settings:

#### Large Models (14B, 32B, 70B)
- **Context Window**: 16384 tokens (doubled with 24GB RAM)
- **GPU Layers**: 99 (all layers on Metal GPU)
- **Batch Size**: 512 (optimized for 24GB)
- **Thread Count**: 8 cores (optimal for M4's 10-core CPU)

#### Medium Models (7B, 8B)
- **Context Window**: 24576 tokens
- **GPU Layers**: 50
- **Batch Size**: 1024
- **Thread Count**: 8 cores

#### Small Models (≤3B)
- **Context Window**: 32768 tokens (maximum context)
- **GPU Layers**: 50
- **Batch Size**: 1024
- **Thread Count**: 8 cores

### 2. M4-Specific Optimizations
- **use_mmap**: true (memory-mapped file loading)
- **use_mlock**: false (don't lock memory, better for macOS)
- **f16_kv**: true (16-bit key-value cache, reduces memory)
- **main_gpu**: 0 (use primary Metal GPU)

## Performance Tips

### For deepseek-r1:14b-m4

1. **Check Model Loading**:
   ```bash
   ollama run deepseek-r1:14b-m4 --verbose
   ```

2. **Monitor GPU Usage**:
   - Open Activity Monitor > Window > GPU History
   - You should see Metal GPU usage when generating

3. **Optimal Ollama Settings**:
   ```bash
   # Set memory limit (adjust based on your RAM)
   export OLLAMA_MAX_LOADED_MODELS=1
   export OLLAMA_NUM_PARALLEL=1
   
   # Restart Ollama
   ollama stop
   ollama serve
   ```

4. **If Still Slow**:
   - Close other applications to free RAM
   - Try the quantized version: `ollama pull deepseek-r1:14b-q4_K_M`
   - Reduce context in settings if needed

### Expected Performance on M4 with 24GB RAM
- **14B models**: 25-40 tokens/second
- **8B models**: 50-80 tokens/second
- **3B models**: 100-150 tokens/second

### Connection Methods
1. **Primary**: HTTP API to Ollama (used 99% of the time)
2. **Fallback**: Terminal commands (only when HTTP fails in Electron)

## Troubleshooting

If the model is still slow:

1. **Check Ollama logs**:
   ```bash
   tail -f ~/.ollama/logs/server.log
   ```

2. **Verify Metal is being used**:
   Look for "metal" in the logs when model loads

3. **Memory pressure**:
   - 14B models need ~16GB free RAM
   - Close Chrome/Safari tabs
   - Restart your Mac if needed

4. **Try smaller context**:
   The app will now use 8192 context for 14B models instead of 32768