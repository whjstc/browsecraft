#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Run tests"
npm test

echo "[2/4] Release preflight"
bash scripts/release-preflight.sh

echo "[3/4] Export skill assets"
bash scripts/export-skill-assets.sh

echo "[4/4] Summary"
cat <<'TXT'
Release loop completed.

Manual steps still required:
1) npm publish (OTP or bypass token)
   NPM_OTP=123456 bash scripts/publish-npm.sh
2) Submit dist assets to:
   - skills.sh
   - clawhub.ai
   - playbooks.com
3) Update ROADMAP status after links are available.
TXT
