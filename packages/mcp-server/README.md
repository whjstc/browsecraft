# BrowseCraft MCP Server

MCP server for browser automation with accessibility snapshots and ref-based interaction.

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "browsecraft": {
      "command": "node",
      "args": ["/path/to/browsecraft/packages/mcp-server/src/index.js"],
      "env": {
        "BROWSECRAFT_CDP_PORT": "9222"
      }
    }
  }
}
```

### Environment Variables

- `BROWSECRAFT_CDP_ENDPOINT`: CDP WebSocket endpoint
- `BROWSECRAFT_CDP_PORT`: CDP port (default `9222`)
- `BROWSECRAFT_BROWSER_TYPE`: `auto|chrome|roxy|camoufox`

## Tools

- `browser_navigate`
- `browser_snapshot`
- `browser_click`
- `browser_click_ref`
- `browser_fill`
- `browser_fill_ref`
- `browser_screenshot`
- `browser_evaluate`
- `browser_info`
- `browser_back`
- `browser_forward`
- `browser_wait`
- `browser_dismiss_cookies`

## Typical Flow

1. Call `browser_navigate` to open target page
2. Call `browser_snapshot` to get ref-mapped elements (`e1`, `e2`, ...)
3. Use `browser_click_ref` / `browser_fill_ref`
4. Repeat snapshot + interaction until completion

## License

MIT
