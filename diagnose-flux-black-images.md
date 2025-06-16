# Flux Black Image Diagnosis Guide

## Issue
When using `@flux:20` or `@flux:30` commands, the generated images are black (1.8KB PNG files).

## Root Cause Analysis

1. **Model Mapping Fixed**: The 'flux' model key was missing from the model mapping in ImageGenerationService.js. This has been fixed.

2. **Potential VAE Issue**: The `--fp32-vae` flag in the M4 optimization script might be causing VAE decoding issues, resulting in black images.

## Solutions to Try

### 1. Test Without fp32-vae Flag
```bash
cd ai-tools/ComfyUI
./start-comfyui-m4-test.sh
```
Then try generating an image with `@flux:10 a red square`

### 2. Check Model Loading
Open `test-flux-model-loading.html` in your browser while ComfyUI is running to:
- Verify all models are loaded correctly
- Test simple generation workflows
- Check for any model-specific errors

### 3. Use Lower Steps Initially
The M4 Pro takes a long time per step. Try:
- `@flux:4 simple test image` (very fast, for testing)
- `@flux:8 a beautiful sunset` (reasonable quality)
- `@flux:12 detailed portrait` (good quality)

### 4. Monitor Generation
Watch the ComfyUI terminal output for any VAE-related errors during generation.

## Memory Optimization Tips for M4 Pro

1. **Close unnecessary apps** before generating images
2. **Use smaller resolutions**: The default 768x768 is good
3. **Limit steps**: 8-12 steps provide good results
4. **Restart ComfyUI** between long generation sessions

## Verification Steps

1. Check if new images are still black:
   ```bash
   ls -lah ai-tools/ComfyUI/output/Sephia_*.png | tail -5
   ```

2. View image properties:
   ```bash
   sips -g all ai-tools/ComfyUI/output/Sephia_LATEST.png
   ```

3. Check ComfyUI logs for errors:
   ```bash
   tail -50 ai-tools/ComfyUI/comfyui_m4_test.log | grep -i error
   ```

## Expected Timeline on M4 Pro
- 4 steps: ~15 minutes
- 8 steps: ~25 minutes  
- 12 steps: ~40 minutes
- 20 steps: ~60+ minutes

## If Issues Persist

1. Try the original SD1.5 models instead (if available)
2. Use even lower CFG values (2.0-3.0)
3. Test with very simple prompts first
4. Consider using cloud-based image generation for complex scenes