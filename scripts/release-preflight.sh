#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/3] CLI help smoke test"
node packages/cli/src/index.js help >/dev/null

echo "[2/3] npm pack dry-run"
npm_config_cache=.npm-cache npm pack --dry-run --workspace=browsecraft >/dev/null
npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/core >/dev/null
npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/http-api >/dev/null
npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/mcp-server >/dev/null

echo "[3/3] cleanup"
rm -rf .npm-cache

echo "Release preflight passed."
