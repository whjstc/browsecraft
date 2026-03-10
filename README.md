# BrowseCraft

通用浏览器自动化工具,为 AI Agent 设计。

## 特性

- **多浏览器支持**: RoxyBrowser, Camoufox, Chrome, Firefox, Edge
- **多接入方式**: CLI / HTTP API / MCP Server / Skill
- **AI 优化**: 模板缓存系统,减少 90% token 消耗
- **工作流引擎**: YAML 定义自动化流程,支持 AI 步骤
- **通用性**: 任何 AI Agent 都能使用 (OpenClaw, Claude, GPT, etc.)

## 快速开始

```bash
# 安装
npm install -g browsecraft

# 启动 HTTP API 服务器
browsecraft serve --port 3000

# 连接已有浏览器 (CDP)
browsecraft serve --cdp-port 54485

# 作为 MCP Server
browsecraft mcp

# 执行单次操作 (CLI 模式)
browsecraft navigate https://example.com
browsecraft screenshot output.png
browsecraft click "button.submit"
```

## 连接浏览器

### RoxyBrowser
```bash
# 自动发现 CDP 端点
browsecraft connect --type roxy --port 54485

# 通过 RoxyBrowser API 启动并连接
browsecraft connect --type roxy --api-token YOUR_TOKEN --window-id YOUR_ID
```

### Camoufox (Firefox)
```bash
browsecraft connect --type camoufox --port 9222
```

### 普通 Chrome
```bash
browsecraft connect --type chrome --port 9222
```

## 产品形态

### 1. CLI (最省 token, 推荐)
```bash
browsecraft navigate https://linkedin.com
browsecraft fill "input#email" "user@example.com"
browsecraft click "button[type=submit]"
browsecraft screenshot login-result.png
```

AI Agent 只需 ~68 tokens 了解所有命令。

### 2. HTTP API
```bash
browsecraft serve --port 3000

# 然后通过 HTTP 调用
curl -X POST http://localhost:3000/goto -d '{"url":"https://example.com"}'
```

### 3. MCP Server
```json
{
  "mcpServers": {
    "browsecraft": {
      "command": "browsecraft",
      "args": ["mcp", "--cdp-port", "54485"]
    }
  }
}
```

### 4. Skill (OpenClaw / Claude Code)
```bash
# OpenClaw
openclaw skills install browsecraft

# Claude Code
npx skills add browsecraft/browsecraft@automation
```

## 工作流定义

```yaml
# workflows/linkedin-outreach.yml
name: LinkedIn Outreach
triggers:
  - "linkedin outreach"
  - "发送 LinkedIn 连接请求"

steps:
  - name: 打开 LinkedIn
    action: navigate
    url: https://www.linkedin.com

  - name: 搜索目标
    action: fill
    selector: "input[role=combobox]"
    value: "{{target.query}}"

  - name: AI 生成消息
    action: ai_generate
    prompt: |
      根据目标信息生成个性化消息:
      姓名: {{prospect.name}}
      职位: {{prospect.title}}
      公司: {{prospect.company}}

  - name: 发送消息
    action: fill
    selector: "textarea#custom-message"
    value: "{{steps.AI生成消息.output}}"
```

## 架构

```
┌─────────────────────────────────────────┐
│            AI Agent (任何 AI)             │
│  (OpenClaw, Claude, GPT, Gemini, etc.)  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
  CLI      HTTP API    MCP Server
    │          │          │
    └──────────┼──────────┘
               │
┌──────────────┴──────────────────────────┐
│           BrowseCraft Core               │
│  - 浏览器连接管理                         │
│  - 模板缓存引擎                           │
│  - 工作流引擎                             │
│  - 操作封装                               │
└──────────────┬──────────────────────────┘
               │ Playwright
┌──────────────┴──────────────────────────┐
│              浏览器                       │
│  RoxyBrowser | Camoufox | Chrome | ...  │
└─────────────────────────────────────────┘
```

## 项目结构

```
browsecraft/
├── packages/
│   ├── core/          # 核心逻辑 (连接、操作、模板、工作流)
│   ├── http-api/      # HTTP API Server
│   ├── cli/           # CLI 工具
│   ├── mcp-server/    # MCP Server
│   └── skill/         # OpenClaw / Claude Code Skill
├── examples/          # 使用示例
├── docs/              # 文档
└── scripts/           # 工具脚本
```

## License

MIT
