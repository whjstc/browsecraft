# BrowseCraft MCP Server（中文文档）

[English README](./README.md)

提供浏览器自动化能力的 MCP Server，支持可访问性快照与基于 ref 的交互。

## 配置

### Claude Desktop

在 `claude_desktop_config.json` 中加入：

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

### 环境变量

- `BROWSECRAFT_CDP_ENDPOINT`：CDP WebSocket 端点
- `BROWSECRAFT_CDP_PORT`：CDP 端口（默认 `9222`）
- `BROWSECRAFT_BROWSER_TYPE`：`auto|chrome|roxy|camoufox`

## 工具列表

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

## 典型调用流程

1. 调用 `browser_navigate` 打开目标页面
2. 调用 `browser_snapshot` 获取带 `e1`、`e2` 等 ref 的元素快照
3. 使用 `browser_click_ref` / `browser_fill_ref`
4. 重复“快照 + 交互”直到完成

## 许可证

MIT
