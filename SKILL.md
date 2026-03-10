---
name: browsecraft
description: 带记忆的浏览器自动化技能。适用于重复网页任务（登录、采集、批量点击、表单填写、截图与状态检查），支持 RoxyBrowser、Camoufox、Chrome。
allowed-tools: Bash(browsecraft:*), Bash(node packages/http-api/src/index.js:*), Bash(node packages/mcp-server/src/index.js:*)
---

# BrowseCraft Skill

## 推荐执行流

1. `browsecraft status` 检查会话状态
2. 未启动时执行 `browsecraft start`
3. `browsecraft open <url>` 进入页面
4. `browsecraft snapshot` 获取可交互元素
5. 优先用 `click-ref` / `fill-ref` 执行动作
6. 每次关键跳转后再次 `snapshot`
7. 结束前 `browsecraft screenshot`

## 浏览器启动策略

- RoxyBrowser：`browsecraft start --type roxy --roxy-api ... --roxy-token ... --roxy-window-id ...`
- Camoufox：`browsecraft start --type camoufox`（可选 `--camoufox-path`）
- 已有浏览器端点：`browsecraft connect <endpoint> --type <chrome|camoufox|roxy>`

## 稳定性规则

- 找不到元素：先 `snapshot` 再重试，不盲点点击。
- 页面未稳定：用 `wait-for` 或 `smart` 类等待（按命令能力）。
- 输出结果时固定结构：目标 / 步骤 / 结果 / 异常 / 下一步。
