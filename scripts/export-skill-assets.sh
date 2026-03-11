#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SKILL_DIR="packages/skill"
DIST_DIR="$SKILL_DIR/dist"
PROMPT_FILE="$SKILL_DIR/prompt.md"
EXAMPLE_FILE="$SKILL_DIR/examples/linkedin-outreach.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Missing prompt file: $PROMPT_FILE" >&2
  exit 1
fi

mkdir -p "$DIST_DIR"

cp "$PROMPT_FILE" "$DIST_DIR/prompt.md"
cp "$EXAMPLE_FILE" "$DIST_DIR/example-linkedin-outreach.md"
cp "SKILL.md" "$DIST_DIR/SKILL.md"

cat > "$DIST_DIR/skills-sh-submission.md" <<'MD'
# skills.sh Submission Draft

- Name: BrowseCraft
- Repo: https://github.com/whjstc/browsecraft
- Install: npx skills add whjstc/browsecraft
- Entry: SKILL.md

## Prompt

Use `prompt.md` in this folder.

## Demo

Use `example-linkedin-outreach.md` in this folder.
MD

cat > "$DIST_DIR/clawhub-submission.md" <<'MD'
# clawhub.ai Submission Draft

- Title: BrowseCraft Automation Assistant
- Category: Browser Automation
- Runtime: OpenClaw

## Description
Memory-oriented browser automation assistant for repeatable workflows.

## Prompt

Use `prompt.md` in this folder.

## Demo

Use `example-linkedin-outreach.md` in this folder.
MD

cat > "$DIST_DIR/playbooks-submission.md" <<'MD'
# playbooks.com Submission Draft

- Title: BrowseCraft Automation Assistant
- Type: Web Automation

## Description
Repeatable browser workflow assistant with template cache and semantic actions.

## Prompt

Use `prompt.md` in this folder.

## Demo

Use `example-linkedin-outreach.md` in this folder.
MD

cat > "$DIST_DIR/manifest.json" <<'JSON'
{
  "name": "BrowseCraft",
  "version": "0.1.1",
  "repo": "https://github.com/whjstc/browsecraft",
  "entry": "SKILL.md",
  "prompt": "prompt.md",
  "demo": "example-linkedin-outreach.md",
  "targets": [
    "skills.sh",
    "clawhub.ai",
    "playbooks.com"
  ]
}
JSON

echo "Exported skill assets to $DIST_DIR"
