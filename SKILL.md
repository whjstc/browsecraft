---
name: browsecraft
description: Memory-oriented browser automation skill for repeatable web workflows (login, extraction, bulk actions, form filling, screenshots, checks) across RoxyBrowser, Camoufox, and Chrome.
allowed-tools: Bash(browsecraft:*), Bash(node packages/http-api/src/index.js:*), Bash(node packages/mcp-server/src/index.js:*)
---

# BrowseCraft Skill

## Recommended Flow

1. Check status: `browsecraft status`
2. Start browser if needed: `browsecraft start`
3. Open target page: `browsecraft open <url>`
4. Capture snapshot: `browsecraft snapshot`
5. Prefer `click-ref` / `fill-ref` for stable interactions
6. Re-snapshot after page transitions
7. Capture result evidence: `browsecraft screenshot`

## Backend Strategy

- RoxyBrowser: `browsecraft start --type roxy --roxy-api ... --roxy-token ... --roxy-window-id ...`
- Camoufox: `browsecraft start --type camoufox` (optional `--camoufox-path`)
- Existing endpoint: `browsecraft connect <endpoint> --type <chrome|camoufox|roxy>`

## Stability Rules

- If element lookup fails: refresh with `snapshot`, then retry.
- If page is unstable: use `wait-for` before interaction.
- Always return structured output: objective / steps / result / failure reason / next action.
