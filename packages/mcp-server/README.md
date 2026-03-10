# BrowseCraft MCP Server

MCP Server for Claude Desktop - browser automation with accessibility snapshots

## 配置

### Claude Desktop

在 `claude_desktop_config.json` 中添加：

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

- `BROWSECRAFT_CDP_ENDPOINT` - CDP WebSocket 端点
- `BROWSECRAFT_CDP_PORT` - CDP 端口（默认 9222）
- `BROWSECRAFT_BROWSER_TYPE` - 浏览器类型（auto|chrome|roxy|camoufox）

## 工具列表

| 工具 | 描述 |
|------|------|
| `browser_navigate` | 导航到 URL |
| `browser_snapshot` | 获取无障碍快照（带 ref） |
| `browser_click` | 通过选择器点击 |
| `browser_click_ref` | 通过 ref 点击 |
| `browser_fill` | 通过选择器填写 |
| `browser_fill_ref` | 通过 ref 填写 |
| `browser_screenshot` | 截图 |
| `browser_evaluate` | 执行 JavaScript |
| `browser_info` | 获取页面信息 |
| `browser_back` | 后退 |
| `browser_forward` | 前进 |
| `browser_wait` | 等待元素 |
| `browser_dismiss_cookies` | 关闭 Cookie 弹窗 |

## 使用流程

1. Claude 调用 `browser_navigate` 打开页面
2. Claude 调用 `browser_snapshot` 获取无障碍快照
3. 快照返回带 ref 标识的元素列表（e1, e2, e3...）
4. Claude 调用 `browser_click_ref e2` 点击目标元素
5. 重复步骤 2-4 完成任务

## License

MIT
