#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PACKAGES=(
  "browsecraft-core"
  "browsecraft-cli"
  "browsecraft-http-api"
  "browsecraft-mcp-server"
)

OTP_ARGS=()
if [[ -n "${NPM_OTP:-}" ]]; then
  OTP_ARGS=(--otp "$NPM_OTP")
fi

echo "Publishing packages to npm..."
for pkg in "${PACKAGES[@]}"; do
  echo "-> ${pkg}"
  npm publish --workspace="${pkg}" --access public "${OTP_ARGS[@]}"
done

echo "All packages published."
