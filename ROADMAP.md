# BrowseCraft 开发路线图

## 当前状态

- ✅ **56 个 CLI 命令** - 已超出 agent-browser 的 50+ 命令规模
- ✅ **模板缓存系统** - 减少 90% token 消耗
- ✅ **指纹浏览器支持** - RoxyBrowser / Camoufox
- ✅ **HTTP API** - REST 接口
- ✅ **MCP Server** - Claude Desktop 集成（13 个工具，维持不扩张）
- ✅ **语义定位** - find-role/find-text/find-label
- ✅ **Bun 构建脚本** - 生成跨平台二进制（实验性）

## 执行原则（2026-03-10 更新）

1. **主战场是 CLI + Skill 分发**：先验证重复任务场景价值，不追求“形态齐全”。
2. **MCP 进入维护态**：只修 bug，不做 13→54 工具补齐。
3. **先单渠道打穿再复制**：skills.sh → clawhub.ai → playbooks.com，按顺序推进。

## 剩余功能规划

### P0 - 核心发布（本周）

| 功能 | 说明 | 工作量 | 状态 |
|------|------|--------|------|
| **发布 npm** | `browsecraft` + `@browsecraft/core` + `@browsecraft/http-api` + `@browsecraft/mcp-server` | 30 分钟 | ⛔ 阻塞（需 2FA OTP 或 bypass token） |
| **发布预检脚本** | `scripts/release-preflight.sh`（help + pack dry-run + 清理） | 15 分钟 | ✅ 已完成 |
| **README 更新** | 命令数量、已完成能力、待发布能力拆分清楚 | 30 分钟 | ✅ 已完成 |
| **Skill 包骨架** | 建立 `packages/skill`，沉淀统一 prompt / metadata / 示例 | 1 小时 | ✅ 已完成 |
| **最小验证闭环** | 产出 1 个可复现 demo（安装→运行→结果） | 1 小时 | ✅ 已完成 |

### P1 - 生态集成（1-2 周）

| 功能 | 说明 | 工作量 | 状态 |
|------|------|--------|------|
| **发布 skills.sh** | 提交 skill 定义到 skills.sh registry | 1 小时 | ⏳ 待做 |
| **发布 clawhub.ai** | OpenClaw 生态集成 | 1 小时 | ⏳ 待做 |
| **发布 playbooks.com** | 提交到 playbooks skill marketplace | 1 小时 | ⏳ 待做 |
| **Homebrew tap** | `brew install browsecraft/tap/browsecraft` | 30 分钟 | ⏳ 待做 |
| **Skill 兼容矩阵** | 记录三平台字段差异与适配策略 | 1 小时 | ⏳ 待做 |

### P2 - 功能增强（1 个月）

| 功能 | 说明 | 工作量 | 状态 |
|------|------|--------|------|
| **snapshot 增强** | `-i` 仅交互元素 / `-c` 紧凑模式 / `-d` 深度限制 | 30 分钟 | ✅ 已完成 |
| **`--json` 输出** | 所有命令支持 JSON 输出，方便程序解析 | 30 分钟 | ✅ 已完成 |
| **`--session` 多会话** | 并行运行多个浏览器实例 | 1 小时 | ✅ 已完成 |
| **模板缓存 CLI** | `browsecraft template learn/execute/list/delete` | 30 分钟 | ✅ 已完成 |
| **tab/frame 管理** | `tab new/close/switch`、`frame switch` | 30 分钟 | 🚧 部分完成（tab 已完成，frame 待做） |

### P3 - 高级特性（2-3 个月）

| 功能 | 说明 | 工作量 | 状态 |
|------|------|--------|------|
| **工作流引擎** | YAML 工作流定义 + AI 步骤支持 | 2 小时 | ⏳ 待做 |
| **daemon 架构** | 真正的独立二进制（需要时再做） | 3 小时 | 🔮 未来 |
| **网络拦截** | `network route/unroute/mock` | 1 小时 | 🔮 未来 |
| **录制功能** | `record start/stop` 视频录制 | 1 小时 | 🔮 未来 |
| **性能分析** | `trace start/stop` 性能追踪 | 1 小时 | 🔮 未来 |

## 差异化定位

### 我们的独特优势

| 特性 | BrowseCraft | agent-browser | Playwright MCP |
|------|------------|---------------|----------------|
| **模板缓存** | ✅ 学一次，重复跑 | ❌ | ❌ |
| **指纹浏览器** | ✅ RoxyBrowser/Camoufox | ❌ | ❌ |
| **多产品形态** | ✅ CLI + HTTP + MCP + Skill | CLI only | MCP only |
| **Token 成本** | ~68 (CLI) / ~3,600 (MCP) | ~68 | ~3,600 |
| **命令数量** | 56 | 50+ | ~15 |

### 目标用户场景

1. **重复任务自动化** - 每天登录同一网站、定期数据采集
2. **SDR 外联** - LinkedIn 连接请求、邮件营销（需反检测）
3. **测试自动化** - 回归测试、表单验证
4. **个人效率** - 抢票、批量操作、自动填表

### 一句话定位

> **BrowseCraft — 带记忆的浏览器自动化工具**
>
> agent-browser 适合一次性任务，BrowseCraft 适合重复任务。

## 发布策略

### 短期（本周）

1. 发布 npm 包（4 个包）
2. 更新 README 和文档
3. 写一篇博客："我做了一个带记忆的浏览器自动化工具"

### 中期（1 个月）

1. 上架 skills.sh / playbooks / clawhub
2. 录制 demo 视频展示模板缓存
3. 在 HN/Reddit 发帖
4. 参与 agent-browser 社区讨论

### 长期（3-6 个月）

1. 积累用户反馈
2. 根据需求决定是否实现 daemon 架构
3. 考虑 Homebrew core 提交（需要 75+ stars）

## 技术债务

| 问题 | 影响 | 优先级 |
|------|------|--------|
| Bun 二进制 WebSocket 兼容 | 独立二进制不可用 | P3（等上游修复） |
| 缺少单元测试 | 代码质量 | P2 |
| 缺少集成测试 | 稳定性 | P2 |
| Skill 平台规范差异 | 上架效率与可维护性 | P1 |

## 成功指标

- **1 周内**: npm 发布 + skills.sh 首发 + 1 个可复现 demo
- **1 个月内**: 50+ GitHub stars
- **3 个月内**: 100+ weekly npm downloads
- **6 个月内**: 500+ stars，进入 Homebrew core

## 参考资源

- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [skills.sh](https://skills.sh)
- [playbooks.com](https://playbooks.com)
- [clawhub.ai](https://clawhub.ai)
