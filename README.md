# BrowseCraft

Universal browser automation for AI agents, optimized for repeatable workflows.

[中文文档 (Chinese)](./README.zh-CN.md)

## Highlights

- Multi-browser support: `RoxyBrowser`, `Camoufox`, `Chrome`, `Firefox`, `Edge`
- Multiple interfaces: `CLI` / `HTTP API` / `MCP Server` / `Skill assets`
- Memory-oriented automation: template cache + ref-based snapshot flow
- Low-token operational model for agent usage

## Quick Start (CLI)

```bash
npm install -g browsecraft

browsecraft start
browsecraft open https://example.com
browsecraft snapshot -i -c -d 6 > page.yaml
browsecraft click-ref e2
browsecraft screenshot result.png
browsecraft stop
```

## Browser Backends

### RoxyBrowser

```bash
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID
browsecraft connect ws://127.0.0.1:54485/devtools/browser/xxx --type roxy
```

### Camoufox

```bash
browsecraft start --type camoufox
browsecraft connect ws://127.0.0.1:9222/... --type camoufox
```

### Chrome (existing debug endpoint)

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
```

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

## Template Cache CLI

```bash
browsecraft template learn "linkedin-login" "linkedin.com" email="input#username" submit="button[type=submit]"
browsecraft template list
browsecraft template execute template_xxx email "user@example.com"
browsecraft template delete template_xxx
```

## Workflow Engine (YAML)

```yaml
name: LinkedIn Search
vars:
  keyword: founder shanghai saas
steps:
  - action: open
    url: https://www.linkedin.com
  - action: fill
    selector: input[role=combobox]
    value: "{{keyword}}"
  - action: press
    key: Enter
  - action: wait-for
    selector: main
  - action: screenshot
    path: linkedin-search.png
```

```bash
browsecraft workflow validate workflows/linkedin.yml keyword="founder shanghai saas"
browsecraft workflow dry-run workflows/linkedin.yml keyword="founder shanghai saas"
browsecraft workflow run workflows/linkedin.yml keyword="founder shanghai saas"
```

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

- Runbook: `docs/RELEASE-RUNBOOK.md`
- Live status: `docs/RELEASE-STATUS.md`
- Skill assets: `SKILL.md`, `packages/skill/`

## License

MIT
