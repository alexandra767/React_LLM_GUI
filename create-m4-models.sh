#!/bin/bash

# Script to create M4-optimized variants of all Ollama models

echo "Creating M4-optimized model variants..."

# Function to create M4 model with optimized settings
create_m4_model() {
    local base_model=$1
    local m4_model="${base_model}-m4"
    
    # Skip if already has -m4 suffix
    if [[ $base_model == *"-m4" ]]; then
        echo "Skipping $base_model (already M4 variant)"
        return
    fi
    
    echo "Creating $m4_model from $base_model..."
    
    # Create a Modelfile with M4 optimizations
    cat > /tmp/Modelfile-m4 << EOF
FROM $base_model

# M4 Pro 24GB optimizations - only valid Ollama parameters
PARAMETER num_ctx 32768
PARAMETER num_gpu 999
PARAMETER num_thread 12
PARAMETER temperature 0.7
PARAMETER top_p 0.95
PARAMETER repeat_penalty 1.1
PARAMETER repeat_last_n 64

# System prompt for M4 optimization awareness
SYSTEM You are running on an M4 Pro MacBook with 24GB unified memory, optimized for maximum performance.
EOF

    # Create the M4 model
    ollama create "$m4_model" -f /tmp/Modelfile-m4
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully created $m4_model"
    else
        echo "❌ Failed to create $m4_model"
    fi
    
    # Clean up
    rm -f /tmp/Modelfile-m4
}

# Get list of models with full names including tags
models=$(ollama list | tail -n +2 | awk '{print $1}')

# Track processed base models to avoid duplicates (using a simple list for compatibility)
processed_models=""

# Create M4 variants for each model
for model in $models; do
    # Get base name without tag
    base_name=$(echo $model | cut -d':' -f1)
    
    # Skip if we've already processed this base model
    if [[ $processed_models == *"$base_name"* ]]; then
        echo "Already processed $base_name, skipping..."
        continue
    fi
    
    # Mark as processed
    processed_models="$processed_models $base_name"
    
    # Use the full model name including tag if present
    create_m4_model "$model"
done

echo "Done! Run 'ollama list' to see all models including M4 variants."