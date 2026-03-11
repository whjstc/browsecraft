#!/bin/bash
# BrowseCraft 构建脚本

set -e

DIST_DIR="dist"
mkdir -p "$DIST_DIR"

echo "=== Building BrowseCraft ==="

# 单文件 bundle
echo "[1/2] Building Node.js bundle..."
bun build packages/cli/src/index.js \
  --outfile "$DIST_DIR/browsecraft.mjs" \
  --target node \
  --external playwright-core

echo "  → $DIST_DIR/browsecraft.mjs ($(du -h "$DIST_DIR/browsecraft.mjs" | cut -f1))"

# 跨平台二进制（macOS arm64/x64, Linux x64）
echo "[2/2] Cross-compiling binaries..."
for target in bun-darwin-arm64 bun-darwin-x64 bun-linux-x64; do
  OUTNAME="browsecraft-${target#bun-}"
  echo "  Building $OUTNAME..."
  if bun build packages/cli/src/index.js \
    --compile \
    --target "$target" \
    --outfile "$DIST_DIR/$OUTNAME" \
    --external playwright-core \
    --external chromium-bidi \
    --external electron 2>/dev/null; then
    echo "  → $DIST_DIR/$OUTNAME ($(du -h "$DIST_DIR/$OUTNAME" | cut -f1))"
  else
    echo "  → Skipped $OUTNAME"
  fi
done

echo ""
echo "Build complete!"
echo ""
echo "Primary distribution: npm install -g browsecraft"
echo "Binary note: Bun binaries are experimental (playwright WebSocket compat issue)"
echo "  Once resolved, binaries will work as standalone executables."
