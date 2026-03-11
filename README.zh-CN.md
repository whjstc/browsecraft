# BrowseCraft（中文文档）

面向 AI Agent 的通用浏览器自动化工具，重点优化可重复工作流。

[English README](./README.md)

## 核心特性

- 多浏览器支持：`RoxyBrowser`、`Camoufox`、`Chrome`、`Firefox`、`Edge`
- 多接口形态：`CLI` / `HTTP API` / `MCP Server` / `Skill`
- 面向记忆的自动化：模板缓存 + 基于 `ref` 的快照交互
- 低 token 成本，适合 Agent 高频调用

## 快速开始（CLI）

```bash
npm install -g browsecraft-cli

browsecraft start
browsecraft open https://example.com
browsecraft snapshot -i -c -d 6 > page.yaml
browsecraft click-ref e2
browsecraft screenshot result.png
browsecraft stop
```

## 浏览器后端

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

### Chrome（已开启调试端口）

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
```

## 会话、标签页、Frame

```bash
browsecraft --session sales start
browsecraft tab list
browsecraft tab new https://example.com
browsecraft tab switch 2
browsecraft frame list
browsecraft frame switch 1
browsecraft frame clear
```

使用 `BROWSECRAFT_MAX_TABS` 限制标签页上限：

```bash
export BROWSECRAFT_MAX_TABS=8
```

## 模板缓存命令

```bash
browsecraft template learn "linkedin-login" "linkedin.com" email="input#username" submit="button[type=submit]"
browsecraft template list
browsecraft template execute template_xxx email "user@example.com"
browsecraft template delete template_xxx
```

## 工作流引擎（YAML）

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

## JSON 输出

所有 CLI 命令都支持 `--json` 便于程序集成：

```bash
browsecraft --json status
```

## HTTP API

```bash
node packages/http-api/src/index.js
curl -X POST http://localhost:3000/goto -d '{"url":"https://example.com"}'
```

## MCP Server

在 MCP 客户端中配置：

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

## 项目结构

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

## 发布参考

- npm 发布脚本：`scripts/publish-npm.sh`（支持 `NPM_OTP=123456`）
- 发布预检：`scripts/release-preflight.sh`
- 一键发布准备：`npm run release:loop`
- 导出平台资产：`npm run release:skill`
- Skill 资产：`SKILL.md`、`packages/skill/`

## 许可证

MIT
