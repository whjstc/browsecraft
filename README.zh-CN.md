# BrowseCraft（中文文档）

面向 AI Agent 的通用浏览器自动化工具，重点优化可重复工作流。

[English README](./README.md)

## 它是什么

BrowseCraft 不是只适合一次性打开页面、点一下、抓个结果的工具，而是更适合需要反复执行的浏览器任务。

它主要面向这类场景：

- 重复登录和数据采集
- 批量表单填写和后台操作
- 需要指纹浏览器的反检测流程
- 需要保留状态、可复跑、可编排的浏览器任务

项目提供多种形态：

- `browsecraft-cli`：命令行直接调用
- `@browsecraft/http-api`：HTTP 服务集成
- `browsecraft-mcp-server`：给 MCP 客户端接入
- Skill 资产：给技能平台和 Agent 生态分发

## 核心特性

- 多浏览器支持：`RoxyBrowser`、`Chrome`、`Firefox`、`Edge`
- 多接口形态：`CLI` / `HTTP API` / `MCP Server` / `Skill`
- 面向记忆的自动化：模板缓存 + 基于 `ref` 的快照交互
- 低 token 成本，适合 Agent 高频调用

## 为什么是 BrowseCraft

很多浏览器自动化工具更偏“一次性执行”。
BrowseCraft 关注的是更长期、更稳定的工作流：

- 浏览器状态在命令之间持续保留
- 已经学过的页面结构可以复用
- 能明确控制 tab 和 frame
- 能接入指纹浏览器，而不是只支持本地 Chrome
- 同一套能力同时暴露给 CLI、API、MCP

## 工作原理

BrowseCraft 以 Playwright 为执行层，通过 CDP 或浏览器专用启动链路去控制不同后端。

```text
BrowseCraft CLI / API / MCP
          |
          v
     BrowseCraft Core
          |
          v
       Playwright
          |
          +--> Chrome / Edge / 其他 CDP 端点
          +--> RoxyBrowser API -> 打开浏览器窗口 -> CDP
```

核心执行模型是“持久会话 + 语义快照”：

1. 启动或连接浏览器
2. 在多个命令之间保留会话状态
3. 对当前页面做快照
4. 通过 `ref` 或稳定命令交互
5. 必要时把页面结构学习成模板供下次复用

这也是它更适合重复任务，而不只是一次性浏览的原因。

## 核心概念

- `Session`：隔离状态文件，支持多任务并行
- `Snapshot ref`：把可见元素映射成 `e2`、`e5` 这类稳定引用
- `Tabs / Frames`：显式切换上下文，避免 Agent 猜错页面
- `Template cache`：把重复页面的选择器固化下来
- `Workflow YAML`：把浏览器步骤变成可复跑的流程

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

## 安装

### CLI

```bash
npm install -g browsecraft-cli
```

### Agent Skill

浏览仓库中的所有 skills 并交互选择：

```bash
npx skills add https://github.com/whjstc/browsecraft
```

直接按名称安装 BrowseCraft：

```bash
npx skills add https://github.com/whjstc/browsecraft --skill browsecraft
```

### Monorepo 开发

```bash
npm install
npm run build
```

需要 Node `>=18`。

## 典型使用方式

### 1. 本地直接启动受控浏览器

```bash
browsecraft start --type chrome
browsecraft open https://example.com
browsecraft snapshot
```

默认情况下，这会为本次启动创建一个新的 Chrome 用户目录。
如果你希望跨重启保留 cookie 和登录态，应该使用固定 profile：

```bash
browsecraft start --type chrome --profile work
browsecraft open https://example.com
```

如果你希望完全控制浏览器状态保存位置，可以直接指定目录：

```bash
browsecraft start --type chrome --profile-dir ~/.config/browsecraft/profiles/work
```

### 2. 连接已存在的浏览器调试端点

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
browsecraft open https://example.com
```

### 3. 用命名会话隔离任务

```bash
browsecraft --session lead-gen start
browsecraft --session lead-gen open https://crm.example.com
browsecraft --session lead-gen snapshot
```

### 4. 输出机器可读 JSON

```bash
browsecraft --json status
browsecraft --json get-title
```

## 浏览器后端

### RoxyBrowser

如果你需要指纹 Chromium、反检测能力、以及由 Roxy 自己维护的长期浏览器身份，RoxyBrowser 是更推荐的后端。

在 BrowseCraft 接入 RoxyBrowser 之前，先在左侧边栏打开 `API & AI MCP` 页面，然后在 `API 设置` 区域确认这 3 个字段：

1. `API 启用状态`：必须打开
2. `API 密钥`：复制当前显示的密钥
3. `端口设置`：确认界面里显示的 host 和 port，通常是 `127.0.0.1:50000`

也就是说，BrowseCraft 的参数通常和这几个界面字段一一对应：

- `--roxy-api` -> `端口设置`（默认一般是 `http://127.0.0.1:50000`）
- `--roxy-token` -> `API 密钥`
- `--roxy-window-id` -> 目标浏览器配置文件的 `dirId`，它不是这个 API 页面上的字段

它和普通 Chrome 的关键差异：

- 一般不需要 `--profile` 或 `--profile-dir`。
- 持续浏览器身份由 Roxy 自己的浏览器配置文件（`dirId`）承担，不是 BrowseCraft 管理的本地 Chrome `user-data-dir`。
- 根据 Roxy 官方 API 文档，`/browser/open` 场景下 `--user-data-dir` 属于系统内置参数，修改不会生效。
- Roxy 官方 API 文档还说明了浏览器配置文件打开时 `headless` 当前不支持。

如何查找连接端点：

- 如果你已经知道要打开哪个 Roxy 配置文件，直接执行 `browsecraft start --type roxy ...`。BrowseCraft 会调用 `/browser/open`，并自动拿到返回的 `ws` 端点。
- 如果某个 Roxy 浏览器已经处于打开状态，可以通过 Roxy 的连接信息接口拿到它的 `ws` 或 `http` 端点，再用 `browsecraft connect <endpoint> --type roxy` 接入。

最少需要这些信息：

- `roxy-api`：本地 API 地址，通常是 `http://127.0.0.1:50000`
- `roxy-token`：`API -> API Configuration -> API Key` 中的 token
- `roxy-window-id`：目标浏览器配置文件 id（`dirId`）
- `roxy-workspace-id`：如果不是默认工作区，还需要目标工作区 id

```bash
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID
browsecraft connect ws://127.0.0.1:54485/devtools/browser/xxx --type roxy
```

典型流程：

```bash
browsecraft roxy-doctor
browsecraft roxy-list --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN
browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token YOUR_TOKEN --roxy-window-id YOUR_ID
browsecraft open https://example.com
browsecraft snapshot
```

`browsecraft roxy-list` 故意不直接为每个窗口打印 websocket endpoint。因为真实 ws 往往需要调用打开窗口接口后才会返回，那样会让“列出窗口”这个只读命令产生副作用。它现在输出的是稳定标识，以及每个窗口对应的一条可复制 `browsecraft start --type roxy ...` 启动命令。

更安全的发现命令是 `browsecraft roxy-doctor`。它会检查：

- 本地 Roxy API 是否可达
- token 是否有效
- 目标 workspace 是否存在
- 目标浏览器窗口是否存在

### Camoufox

BrowseCraft 已经移除内建 Camoufox 支持。

如果你需要使用 Camoufox，请改用专用工具，例如 [`camoufox-cli`](https://github.com/Bin-Huang/camoufox-cli)。

### Chrome（已开启调试端口）

```bash
browsecraft connect http://127.0.0.1:9222 --type chrome
```

## 推荐命令流程

对动态页面，通常下面这条路径更稳定：

```bash
browsecraft status
browsecraft open https://target.site
browsecraft snapshot -i -c
browsecraft click-ref e2
browsecraft snapshot -i -c
browsecraft screenshot final.png
```

建议优先：

- 在交互前先 `snapshot`
- 优先用 `click-ref` / `fill-ref`，少依赖脆弱原始选择器
- 并发任务时始终带 `--session`
- 需要持续登录态时使用固定 `--profile`
- 需要切上下文时显式使用 `tab` 和 `frame`

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

这个保护是为了防止 Agent 在循环中无限开 tab，最终把内存打满。

## 模板缓存命令

```bash
browsecraft template learn "crm-login" "crm.example.com" email="input#username" submit="button[type=submit]"
browsecraft template list
browsecraft template execute template_xxx email "user@example.com"
browsecraft template delete template_xxx
```

如果你经常在同一类页面上重复操作，模板缓存可以减少每次重新发现选择器的成本。

## 工作流引擎（YAML）

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

推荐这样用：

- `validate`：先检查步骤和变量是否完整
- `dry-run`：先看展开后的执行计划
- `run`：流程稳定后再真正执行

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

## 配置优先级

BrowseCraft 按下面顺序读取配置：

1. CLI 参数
2. shell 环境变量
3. 项目级 `.browsecraft/.env`
4. 全局 `~/.browsecraft/.env`
5. 全局 `~/.browsecraft/config.json`

这样可以在不改全局默认值的前提下，为某个项目做局部覆盖。

## 持续登录态

如果你希望长期复用同一个浏览器身份，应该使用固定 Chrome profile：

```bash
browsecraft start --type chrome --profile crm
```

它会复用：

```text
~/.browsecraft/user-data/profile-crm
```

推荐这样理解：

- `--session`：隔离任务状态文件
- `--profile`：隔离浏览器 cookie、缓存和登录态
- `--profile-dir`：自己精确指定浏览器状态目录

例如：

```bash
browsecraft --session sales start --type chrome --profile crm
browsecraft --session sales open https://crm.example.com
```

这样任务状态和浏览器身份是分开的，比把两者混在一个概念里更稳妥。

如果你希望把浏览器状态放到加密磁盘、同步目录或已有状态目录里，应该使用 `--profile-dir`。

不要在同一条命令里同时传 `--profile` 和 `--profile-dir`。前者表示“BrowseCraft 管理的命名 profile”，后者表示“你自己指定的精确 user-data-dir 路径”。

## 应该选哪种接口

- 本地脚本和人工操作：选 `CLI`
- 其他服务要驱动浏览器：选 `HTTP API`
- Agent 客户端说 MCP：选 `MCP Server`
- 要作为可安装能力分发：选 Skill 形态

## 当前范围

目前已经完成：

- 核心浏览器连接器和动作层
- CLI 命令面
- HTTP API
- MCP Server
- 模板缓存
- YAML 工作流执行
- RoxyBrowser 集成

目前还没完善到位：

- 所有接口的端到端测试覆盖
- 除 npm 和技能平台之外更成熟的公共分发流程

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
- Skill 资产：`skills/browsecraft/`（发布维护文档见 `docs/skill-release/`）

## 许可证

MIT
