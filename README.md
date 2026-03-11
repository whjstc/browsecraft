# BrowseCraft

Universal browser automation for AI agents, optimized for repeatable workflows.

[中文文档 (Chinese)](./README.zh-CN.md)

## What It Is

BrowseCraft is a browser automation toolkit for agents that need to do the same class of work repeatedly, not just one-off browsing.

It is designed for workflows such as:

- repeated login and data extraction
- bulk form filling and back-office operations
- anti-detection browsing through fingerprint browsers
- scheduled or scripted browser tasks that need stable state

The project ships in multiple forms:

- `browsecraft-cli` for direct shell usage
- `@browsecraft/http-api` for service-to-service integration
- `browsecraft-mcp-server` for MCP clients
- skill assets for skill registries and agent ecosystems

## Highlights

- Multi-browser support: `RoxyBrowser`, `Camoufox`, `Chrome`, `Firefox`, `Edge`
- Multiple interfaces: `CLI` / `HTTP API` / `MCP Server` / `Skill assets`
- Memory-oriented automation: template cache + ref-based snapshot flow
- Low-token operational model for agent usage

## Why BrowseCraft

Most browser tools are good at “open page, click once, extract result”.
BrowseCraft is aimed at the next layer up:

- preserve a browser session across commands
- reuse learned selectors and page structure
- operate across tabs and nested frames
- work with fingerprint browsers instead of plain local Chrome only
- expose the same capability set through CLI, API, and MCP

## How It Works

BrowseCraft uses Playwright as the execution layer and connects it to different browser backends through CDP or browser-specific startup flows.

```text
BrowseCraft CLI / API / MCP
          |
          v
     BrowseCraft Core
          |
          v
       Playwright
          |
          +--> Chrome / Edge / other CDP endpoints
          +--> RoxyBrowser API -> launched browser window -> CDP
          +--> Camoufox launcher -> Firefox-compatible endpoint
```

The automation model is built around persistent browser state:

1. start or connect to a browser
2. keep the session alive across commands
3. take a semantic snapshot of the page
4. interact through `ref` ids or stable commands
5. optionally learn a template for later reuse

That is why the tool is better suited to repeatable tasks than pure one-shot browsing.

## Core Concepts

- `Session`: isolates state files so multiple tasks can run independently
- `Snapshot refs`: maps visible elements to stable ids like `e2`, `e5`
- `Tabs and frames`: lets agents switch context explicitly instead of guessing
- `Template cache`: stores reusable selectors for repeated pages
- `Workflow YAML`: turns shell-like browser steps into replayable flows

## Quick Start (CLI)

```bash
npm install -g browsecraft-cli

browsecraft start
browsecraft open https://example.com
browsecraft snapshot -i -c -d 6 > page.yaml
browsecraft click-ref e2
browsecraft screenshot result.png
browsecraft stop
```

## Installation

### CLI

```bash
npm install -g browsecraft-cli
```

### Monorepo Development

```bash
npm install
npm run build
```

Node `>=18` is required.

## Typical Usage Patterns

### 1. Start a managed browser locally

```bash
browsecraft start --type chrome
browsecraft open https://example.com
browsecraft snapshot
```

By default, this creates a fresh Chrome user-data directory for that run.
Use a fixed profile when you want cookies and login state to persist across restarts:

```bash
browsecraft start --type chrome --profile work
browsecraft open https://example.com
```

If you need full control over where Chrome state is stored, use an explicit directory:

```bash
browsecraft start --type chrome --profile-dir ~/.config/browsecraft/profiles/work
```

### 2. Attach to an existing browser endpoint

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
browsecraft open https://example.com
```

### 3. Run isolated work in a named session

```bash
browsecraft --session lead-gen start
browsecraft --session lead-gen open https://crm.example.com
browsecraft --session lead-gen snapshot
```

### 4. Use machine-friendly JSON output

```bash
browsecraft --json status
browsecraft --json get-title
```

## Browser Backends

### RoxyBrowser

RoxyBrowser is the preferred backend when you need fingerprinted Chromium profiles, anti-detection settings, and long-lived browser identities managed by Roxy itself.

Before using BrowseCraft with RoxyBrowser, open the left sidebar item `API & AI MCP`, then confirm these fields on the `API Settings` panel:

1. `API Status`: enabled
2. `API Key`: copy the displayed key
3. `Port Settings`: confirm the host and port shown in the UI, typically `127.0.0.1:50000`

In other words, the BrowseCraft flags usually map to the RoxyBrowser screen like this:

- `--roxy-api` -> `Port Settings` (`http://127.0.0.1:50000` by default)
- `--roxy-token` -> `API Key`
- `--roxy-window-id` -> the target browser profile `dirId`, not the API screen itself

Important behavior differences from plain Chrome:

- You usually do not need `--profile` or `--profile-dir` here.
- The durable browser identity is the Roxy browser profile itself (`dirId`), not a local Chrome user-data-dir managed by BrowseCraft.
- According to Roxy's API docs, `--user-data-dir` is a built-in system parameter and modifying it does not take effect for `/browser/open`.
- Roxy's API docs also note that `headless` is currently not supported for browser profile opening.

How to find the connection endpoint:

- If you already know the profile you want, call `browsecraft start --type roxy ...`. BrowseCraft uses Roxy's `/browser/open` and receives the `ws` endpoint automatically.
- If you are attaching to an already opened Roxy profile, use Roxy's connection info API to get its `ws` or `http` endpoint, then call `browsecraft connect <endpoint> --type roxy`.

Minimum information you need:

- `roxy-api`: local API host, usually `http://127.0.0.1:50000`
- `roxy-token`: API key from `API -> API Configuration -> API Key`
- `roxy-window-id`: target Roxy browser profile id (`dirId`)
- `roxy-workspace-id`: target workspace id if you are not using the default one

```bash
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID
browsecraft connect ws://127.0.0.1:54485/devtools/browser/xxx --type roxy
```

Typical flow:

```bash
browsecraft roxy-doctor
browsecraft roxy-list --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID
browsecraft open https://example.com
browsecraft snapshot
```

`browsecraft roxy-list` intentionally does not print a websocket endpoint for every window. That would require opening windows as a side effect. Instead, it prints the durable identifiers and a copy-pasteable `browsecraft start --type roxy ...` command for each window.

`browsecraft roxy-doctor` is the safer discovery command. It checks:

- whether the local Roxy API is reachable
- whether your token works
- whether the selected workspace exists
- whether the selected browser window exists

### Camoufox

Camoufox is useful when you want a Firefox-family anti-detection backend instead of Chromium.

BrowseCraft currently supports Camoufox in two ways:

1. launch Camoufox for you with `browsecraft start --type camoufox`
2. connect to an existing Camoufox websocket endpoint with `browsecraft connect <ws-endpoint> --type camoufox`

Setup options:

- install the Camoufox package and fetch the browser binary
- or provide the binary path explicitly with `--camoufox-path`

```bash
browsecraft start --type camoufox
browsecraft connect ws://127.0.0.1:9222/... --type camoufox
```

If you want to run Camoufox as a remote server yourself, the official docs expose:

```bash
python -m camoufox server
```

That server prints a websocket endpoint such as:

```text
ws://localhost:1234/hello
```

Then you can attach BrowseCraft to it:

```bash
browsecraft connect ws://localhost:1234/hello --type camoufox
```

Important caveats:

- the Camoufox remote server is marked experimental in the official docs
- one server uses one browser instance, so fingerprints do not rotate between sessions automatically
- BrowseCraft does not currently expose a first-class `--profile` abstraction for Camoufox like it now does for Chrome
- if you need durable login state with Camoufox today, the safer pattern is to keep a long-lived Camoufox instance or manage that lifecycle on the Camoufox side

### Chrome (existing debug endpoint)

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
```

## Command Flow Recommendations

For unstable pages, this sequence is usually the most reliable:

```bash
browsecraft status
browsecraft open https://target.site
browsecraft snapshot -i -c
browsecraft click-ref e2
browsecraft snapshot -i -c
browsecraft screenshot final.png
```

Prefer:

- `snapshot` before interaction on dynamic pages
- `click-ref` / `fill-ref` over brittle raw selectors when possible
- named `--session` values for concurrent work
- fixed `--profile` values when you need durable login state
- `tab` and `frame` commands instead of implicit page guessing

## Session, Tabs, Frames

```bash
browsecraft --session sales start
browsecraft tab list
browsecraft tab new https://example.com
browsecraft tab switch 2
browsecraft frame list
browsecraft frame switch 1
browsecraft frame clear
```

Use `BROWSECRAFT_MAX_TABS` to cap tab growth:

```bash
export BROWSECRAFT_MAX_TABS=8
```

This guard exists to prevent runaway tab creation from exhausting memory during agent loops.

## Template Cache CLI

```bash
browsecraft template learn "crm-login" "crm.example.com" email="input#username" submit="button[type=submit]"
browsecraft template list
browsecraft template execute template_xxx email "user@example.com"
browsecraft template delete template_xxx
```

Templates are useful when the same site structure appears repeatedly and you want to reuse known selectors instead of rediscovering them each run.

## Workflow Engine (YAML)

```yaml
name: CRM Dashboard Check
vars:
  customer: acme
steps:
  - action: open
    url: https://crm.example.com
  - action: fill
    selector: input[name=customer]
    value: "{{customer}}"
  - action: wait-for
    selector: main
  - action: screenshot
    path: crm-dashboard.png
```

```bash
browsecraft workflow validate workflows/crm-dashboard.yml customer="acme"
browsecraft workflow dry-run workflows/crm-dashboard.yml customer="acme"
browsecraft workflow run workflows/crm-dashboard.yml customer="acme"
```

Use:

- `validate` to catch malformed steps and missing variables
- `dry-run` to inspect the resolved plan before execution
- `run` only after the flow is stable

## JSON Output

All CLI commands support `--json` for programmatic integration:

```bash
browsecraft --json status
```

## HTTP API

```bash
node packages/http-api/src/index.js
curl -X POST http://localhost:3000/goto -d '{"url":"https://example.com"}'
```

## MCP Server

Configure in your MCP client:

```json
{
  "mcpServers": {
    "browsecraft": {
      "command": "node",
      "args": ["/path/to/browsecraft/packages/mcp-server/src/index.js"]
    }
  }
}
```

## Configuration

BrowseCraft resolves configuration in this order:

1. CLI flags
2. shell environment variables
3. project-level `.browsecraft/.env`
4. global `~/.browsecraft/.env`
5. global `~/.browsecraft/config.json`

This is useful when you want local project overrides without rewriting your global defaults.

## Persistent Login State

If you want a durable browser identity, use a fixed Chrome profile:

```bash
browsecraft start --type chrome --profile crm
```

This reuses:

```text
~/.browsecraft/user-data/profile-crm
```

Recommended pattern:

- use `--session` to isolate task state files
- use `--profile` to isolate browser cookies and login state
- use `--profile-dir` when you want to manage the storage location yourself

Example:

```bash
browsecraft --session sales start --type chrome --profile crm
browsecraft --session sales open https://crm.example.com
```

This keeps operational state and browser identity separate, which is safer than overloading one concept for both.

Use `--profile-dir` when you want the exact browser state path to live in a custom location such as an encrypted disk, synced workspace, or existing browser-state folder.

Do not pass both `--profile` and `--profile-dir` in the same command. `--profile` selects a named BrowseCraft-managed profile, while `--profile-dir` points to an exact user-data directory.

## When To Use Which Interface

- Choose `CLI` for local automation and scripts
- Choose `HTTP API` when another service needs to drive the browser
- Choose `MCP Server` when your agent client speaks MCP
- Choose skill packaging when distributing BrowseCraft as an installable capability

## Current Scope

Implemented now:

- core browser connector and action layer
- CLI command surface
- HTTP API server
- MCP server
- template cache
- YAML workflow execution
- RoxyBrowser integration
- Camoufox integration

Not finished yet:

- broader end-to-end test coverage across all interfaces
- more polished public distribution workflows beyond npm and skill registries

## Project Layout

```text
browsecraft/
├── packages/
│   ├── core/
│   ├── cli/
│   ├── http-api/
│   ├── mcp-server/
│   └── skill/
├── docs/
└── scripts/
```

## Release References

- npm publish helper: `scripts/publish-npm.sh` (supports `NPM_OTP=123456`)
- preflight checks: `scripts/release-preflight.sh`
- one-command release loop: `npm run release:loop`
- export platform assets: `npm run release:skill`
- Skill assets: `SKILL.md`, `packages/skill/`

## License

MIT
