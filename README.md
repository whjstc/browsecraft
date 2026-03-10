# BrowseCraft

通用浏览器自动化工具,为 AI Agent 设计。

## 特性

- **多浏览器支持**: RoxyBrowser, Camoufox, Chrome, Firefox, Edge
- **多接入方式**: CLI / HTTP API / MCP Server / Skill
- **AI 优化**: 模板缓存系统,减少 90% token 消耗
- **工作流引擎（规划中）**: YAML 定义自动化流程,支持 AI 步骤
- **通用性**: 任何 AI Agent 都能使用 (OpenClaw, Claude, GPT, etc.)

## 快速开始

### CLI 模式（推荐，最省 token）

```bash
# 安装
npm install -g browsecraft

# 启动浏览器
browsecraft start

# 导航到网页
browsecraft open https://example.com

# 获取无障碍快照（带 ref）
browsecraft snapshot -i -c -d 6 > page.yaml

# 通过 ref 点击元素
browsecraft click-ref e2

# 截图
browsecraft screenshot result.png

# 停止浏览器
browsecraft stop
```

### HTTP API 模式

```bash
# 启动 HTTP API 服务器
node packages/http-api/src/index.js

# 通过 HTTP 调用
curl -X POST http://localhost:3000/goto -d '{"url":"https://example.com"}'
```

### MCP Server 模式

在 Claude Desktop 配置中添加：

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

## 连接浏览器

### RoxyBrowser
```bash
# 通过 RoxyBrowser API 启动并连接（推荐）
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID

# 已有 ws 端点时直接连接
browsecraft connect ws://127.0.0.1:54485/devtools/browser/xxx --type roxy
```

### Camoufox (Firefox)
```bash
# 自动启动并连接（支持从 PATH / CAMOUFOX_PATH / --camoufox-path 发现可执行文件）
browsecraft start --type camoufox

# 已有 ws 端点时也可直接连接
browsecraft connect ws://127.0.0.1:9222/... --type camoufox
```

### 普通 Chrome
```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
```

## 产品形态

### 1. CLI (最省 token, 推荐)
```bash
browsecraft start
browsecraft open https://linkedin.com
browsecraft snapshot
browsecraft click-ref e3
browsecraft fill "input#email" "user@example.com"
browsecraft click "button[type=submit]"
browsecraft screenshot login-result.png
browsecraft stop
```

AI Agent 只需 ~68 tokens 了解所有命令。

### 1.1 多会话与 Tab 管理
```bash
# 隔离会话（不同 state 文件）
browsecraft --session sales start
browsecraft --session ops start

# tab 管理
browsecraft tab list
browsecraft tab new https://example.com
browsecraft tab switch 2
browsecraft tab close 2
```

可通过环境变量限制标签页数量，避免内存被意外占满：

```bash
export BROWSECRAFT_MAX_TABS=8
```

### 2. HTTP API
```bash
node packages/http-api/src/index.js

# 通过 HTTP 调用
curl -X POST http://localhost:3000/goto -d '{"url":"https://example.com"}'
```

### 3. MCP Server
```json
{
  "mcpServers": {
    "browsecraft": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/src/index.js"]
    }
  }
}
```

### 4. Skill (OpenClaw / Claude Code，发布中)
```bash
# OpenClaw（待上架）
openclaw skills install browsecraft

# Claude Code（待上架）
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

## 发布参考

- 发布流程：`docs/RELEASE-RUNBOOK.md`
- Skill 资产：`SKILL.md`、`packages/skill/`
