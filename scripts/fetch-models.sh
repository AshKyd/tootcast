#!/bin/bash

# Exit on error
set -e

AI_DIR="static/ai"
MODELS_DIR="$AI_DIR/models"
WASM_DIR="$AI_DIR/wasm"
BASE_URL="https://huggingface.co"

# Function to fetch a model
fetch_model() {
    local model_id=$1     # e.g., whisper-tiny.en
    local repo="Xenova/$model_id"
    local dest="$MODELS_DIR/$model_id"

    echo "-------------------------------------------------------"
    echo "📥 Checking model: $model_id"
    echo "-------------------------------------------------------"

    mkdir -p "$dest/onnx"

    # Base configuration and tokenizer files
    local files=(
        "config.json"
        "generation_config.json"
        "tokenizer_config.json"
        "tokenizer.json"
        "vocab.json"
        "preprocessor_config.json"
    )

    for file in "${files[@]}"; do
        if [ -f "$dest/$file" ]; then
            echo "✔ $file already exists, skipping."
        else
            echo "📄 Downloading $file..."
            curl -L -s -f "$BASE_URL/$repo/resolve/main/$file" -o "$dest/$file" || echo "⚠️  Skipping optional $file (not found)"
        fi
    done

    # ONNX Runtime files (Quantized versions for performance/size)
    local onnx_files=(
        "encoder_model_quantized.onnx"
        "decoder_model_merged_quantized.onnx"
    )

    for onnx_file in "${onnx_files[@]}"; do
        if [ -f "$dest/onnx/$onnx_file" ]; then
            echo "✔ $onnx_file already exists, skipping."
        else
            echo "🧠 Downloading ONNX $onnx_file..."
            curl -L -s -f "$BASE_URL/$repo/resolve/main/onnx/$onnx_file" -o "$dest/onnx/$onnx_file"
        fi
    done
}

# 1. Fetch Models
mkdir -p "$MODELS_DIR"
fetch_model "whisper-tiny.en"
fetch_model "whisper-tiny"

# 2. Copy WASM Binaries from node_modules
mkdir -p "$WASM_DIR"
echo "-------------------------------------------------------"
echo "📦 Syncing WASM binaries from node_modules..."
echo "-------------------------------------------------------"

if [ -d "node_modules/@xenova/transformers/dist" ]; then
    cp node_modules/@xenova/transformers/dist/ort-wasm*.wasm "$WASM_DIR/"
    echo "✅ WASM binaries copied to $WASM_DIR"
else
    echo "❌ Error: Could not find node_modules/@xenova/transformers/dist"
    exit 1
fi

# 3. Brotli Compression
echo "-------------------------------------------------------"
echo "🌀 Compressing assets with Brotli (-9)..."
echo "-------------------------------------------------------"

# Find all relevant files and compress them
find "$AI_DIR" -type f \( -name "*.onnx" -o -name "*.json" -o -name "*.wasm" -o -name "*.js" \) -exec echo "🗜️ Compressing {}..." \; -exec brotli -f -9 {} \;

echo "✅ All assets compressed."

# 4. Cleanup old paths
echo "-------------------------------------------------------"
echo "🧹 Cleaning up old paths..."
rm -rf static/models static/wasm

echo "-------------------------------------------------------"
echo "📍 Assets: $AI_DIR"
echo "-------------------------------------------------------"