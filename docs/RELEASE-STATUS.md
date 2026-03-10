# 发布状态（2026-03-10）

## 已完成

- Camoufox 自动启动与生命周期管理已发布到本地分支。
- Skill 分发资产与发布预检流程已落地。
- CLI 功能增强：`snapshot -i/-c/-d`、`--session` 多会话、`tab` 管理、`template` 管理、`--json` 输出。
- Tab 保护机制：`BROWSECRAFT_MAX_TABS`（默认 8）防止标签页无限增长。
- 预检脚本通过：`scripts/release-preflight.sh`

## 当前阻塞

- `frame switch` 尚未实现（ROADMAP 对应项部分完成）。
- 浏览器真实 E2E 场景（Roxy/Camoufox/Chrome）尚未在本机全量回归。

## 待执行命令（按顺序）

1. `npm publish --workspace=@browsecraft/core --access public`
2. `npm publish --workspace=browsecraft --access public`
3. `npm publish --workspace=@browsecraft/http-api --access public`
4. `npm publish --workspace=@browsecraft/mcp-server --access public`

## 发布后动作

- 回填 npm 包链接到 `README.md`
- 按 `packages/skill/release-checklist.md` 发布 skills.sh / clawhub.ai / playbooks.com
