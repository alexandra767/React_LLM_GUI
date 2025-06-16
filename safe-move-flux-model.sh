#!/bin/bash

# Safe Flux Model Transfer Script
# Handles large 21GB+ model files without crashing

echo "🚀 Safe Flux Model Transfer Script"
echo "=================================="

# Source and destination paths
SOURCE="/Volumes/Alexandra-External-SSD-Storge/comfyui-models/flux1-dev.safetensors"
DEST_DIR="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/ai-tools/ComfyUI/models/checkpoints"
DEST_FILE="$DEST_DIR/flux1-dev.safetensors"
UNET_LINK="/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/ai-tools/ComfyUI/models/unet/flux1-dev.safetensors"

# Check if source exists
if [ ! -f "$SOURCE" ]; then
    echo "❌ Source file not found: $SOURCE"
    exit 1
fi

# Get file size
FILE_SIZE=$(stat -f%z "$SOURCE" 2>/dev/null || stat -c%s "$SOURCE" 2>/dev/null)
FILE_SIZE_GB=$((FILE_SIZE / 1024 / 1024 / 1024))
echo "📊 File size: ${FILE_SIZE_GB}GB"

# Check available space
AVAILABLE_SPACE=$(df -k "$DEST_DIR" | tail -1 | awk '{print $4}')
AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
echo "💾 Available space: ${AVAILABLE_GB}GB"

if [ $AVAILABLE_GB -lt $((FILE_SIZE_GB + 5)) ]; then
    echo "❌ Not enough space! Need at least $((FILE_SIZE_GB + 5))GB free"
    exit 1
fi

# Remove existing symlinks
echo "🔗 Removing existing symlinks..."
[ -L "$DEST_FILE" ] && rm -f "$DEST_FILE"
[ -L "$UNET_LINK" ] && rm -f "$UNET_LINK"

# Use rsync for safe, resumable transfer with progress
echo "📦 Starting transfer using rsync (resumable)..."
echo "This may take 10-20 minutes depending on your SSD speed..."

# Run rsync with progress, partial transfers, and bandwidth limiting
rsync -avh --progress --partial --inplace \
      --bwlimit=500000 \
      "$SOURCE" "$DEST_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Transfer completed successfully!"
    
    # Verify file integrity
    echo "🔍 Verifying file integrity..."
    SOURCE_SIZE=$(stat -f%z "$SOURCE" 2>/dev/null || stat -c%s "$SOURCE" 2>/dev/null)
    DEST_SIZE=$(stat -f%z "$DEST_FILE" 2>/dev/null || stat -c%s "$DEST_FILE" 2>/dev/null)
    
    if [ "$SOURCE_SIZE" -eq "$DEST_SIZE" ]; then
        echo "✅ File sizes match!"
        
        # Create symlink in unet directory
        echo "🔗 Creating unet symlink..."
        ln -sf "$DEST_FILE" "$UNET_LINK"
        
        echo "🎉 Flux model successfully moved to internal SSD!"
        echo ""
        echo "📍 Model locations:"
        echo "   Checkpoint: $DEST_FILE"
        echo "   UNET link: $UNET_LINK"
        
        # Optional: Remove source file
        echo ""
        read -p "Delete source file to free up external drive space? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$SOURCE"
            echo "✅ Source file deleted"
        fi
    else
        echo "❌ File sizes don't match! Transfer may be corrupted."
        echo "Source: $SOURCE_SIZE bytes"
        echo "Dest: $DEST_SIZE bytes"
        exit 1
    fi
else
    echo "❌ Transfer failed! The partial file is preserved for resuming."
    echo "Run this script again to resume the transfer."
    exit 1
fi