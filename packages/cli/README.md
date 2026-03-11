# BrowseCraft CLI

Browser automation CLI for repeatable AI-agent workflows.

[中文文档 (Chinese)](./README.zh-CN.md)

## Features

- Persistent browser architecture with stateless commands
- Ref-based snapshot flow (`snapshot` → `click-ref` / `fill-ref`)
- RoxyBrowser integration
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
browsecraft close
```

## Lifecycle

- `browsecraft start [--type chrome|roxy]`
- `browsecraft connect <endpoint> --type <chrome|roxy>`
- `browsecraft status`
- `browsecraft doctor [--type chrome|roxy|camoufox]`
- `browsecraft cleanup-profiles`
- `browsecraft close`
- `browsecraft stop` (alias of `close`)
- `browsecraft disconnect`
- `browsecraft roxy-list`
- `browsecraft roxy-doctor`

### Close vs Disconnect

- `browsecraft close` ends the current BrowseCraft-managed session.
- For local Chrome started by BrowseCraft, `close` shuts down the browser process.
- For RoxyBrowser windows started by BrowseCraft, `close` calls the Roxy API to close that window.
- For browsers attached via `browsecraft connect`, `close` falls back to a session disconnect and leaves the external browser running.
- `browsecraft stop` is kept as a backward-compatible alias of `close`.
- `browsecraft disconnect` always clears the current session without attempting to close the underlying browser/window.

### Doctor

- `browsecraft doctor` runs environment checks for session state, Chrome, RoxyBrowser, and leftover profile directories.
- Each section prints `OK` / `WARN` / `FAIL` / `SKIP` plus a concrete `Next:` command when action is needed.
- Use `browsecraft doctor --type roxy` when you only want to verify the Roxy path.
- `browsecraft doctor --type camoufox` explains that built-in Camoufox support has been removed and points you to `camoufox-cli`.

### Cleanup Profiles

- `browsecraft cleanup-profiles` removes leftover transient `profile-<port>` directories.
- Named profiles created by `--profile` or `--profile-dir` are preserved.
- The command also skips the active session's current profile if one is still in use.

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
- `--type`: `chrome|roxy`
- `--headless`
- `BROWSECRAFT_MAX_TABS` (env): max tabs per context (default `8`)

## Exit Codes

- `0`: success
- `1`: check failed (`exists` / `visible` / `assert`)
- `2`: error
