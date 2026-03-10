# BrowseCraft CLI

Browser automation CLI for repeatable AI-agent workflows.

[中文文档 (Chinese)](./README.zh-CN.md)

## Features

- Persistent browser architecture with stateless commands
- Ref-based snapshot flow (`snapshot` → `click-ref` / `fill-ref`)
- RoxyBrowser and Camoufox integration
- Multi-session isolation (`--session`)
- Tab and frame management
- Template cache commands
- Global JSON output (`--json`)

## Install

```bash
npm install -g browsecraft-cli
```

## Core Workflow

```bash
browsecraft start
browsecraft open https://example.com
browsecraft snapshot -i -c -d 6
browsecraft click-ref e2
browsecraft screenshot result.png
browsecraft stop
```

## Lifecycle

- `browsecraft start [--type chrome|roxy|camoufox]`
- `browsecraft connect <endpoint> --type <chrome|roxy|camoufox>`
- `browsecraft status`
- `browsecraft stop`

## Snapshot

- `browsecraft snapshot [-i] [-c] [-d depth]`
- `browsecraft click-ref <ref>`
- `browsecraft fill-ref <ref> <text>`

## Tabs and Frames

- `browsecraft tab list`
- `browsecraft tab new [url]`
- `browsecraft tab switch <index>`
- `browsecraft tab close [index]`
- `browsecraft frame list`
- `browsecraft frame switch <index>`
- `browsecraft frame clear`

## Templates

- `browsecraft template learn <name> <urlPattern> <key=selector...>`
- `browsecraft template execute <templateId> <action> [text]`
- `browsecraft template list`
- `browsecraft template delete <templateId>`

## Workflow

- `browsecraft workflow run <file.yml> [key=value ...]`
- `browsecraft workflow validate <file.yml> [key=value ...]`
- `browsecraft workflow dry-run <file.yml> [key=value ...]`

## Options

- `--local`: use `./.browsecraft/`
- `--global`: use `~/.browsecraft/` (default)
- `--session`: isolate state per session
- `--json`: JSON output wrapper for all commands
- `--type`: `chrome|roxy|camoufox`
- `--headless`
- `--camoufox-path`
- `BROWSECRAFT_MAX_TABS` (env): max tabs per context (default `8`)

## Exit Codes

- `0`: success
- `1`: check failed (`exists` / `visible` / `assert`)
- `2`: error
