# BrowseCraft 发布 Runbook（v0.1）

本文件用于“睡觉可执行”场景：先完成本地可自动部分，再进入人工发布步骤。

## A. 本地自动部分（可脚本化）

1. 校验帮助输出：
   - `node packages/cli/src/index.js help`
2. 打包预检查：
   - `npm_config_cache=.npm-cache npm pack --dry-run --workspace=browsecraft`
   - `npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/core`
   - `npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/http-api`
   - `npm_config_cache=.npm-cache npm pack --dry-run --workspace=@browsecraft/mcp-server`
3. 产物清理：
   - 删除本地 `.npm-cache`

## B. npm 发布（人工确认）

> 前置：`npm whoami` 已通过。

1. 发布顺序（避免依赖未解析）：
   1) `@browsecraft/core`
   2) `browsecraft`
   3) `@browsecraft/http-api`
   4) `@browsecraft/mcp-server`
2. 参考命令：
   - `npm publish --workspace=@browsecraft/core --access public`
   - `npm publish --workspace=browsecraft --access public`
   - `npm publish --workspace=@browsecraft/http-api --access public`
   - `npm publish --workspace=@browsecraft/mcp-server --access public`

## C. Skill 平台发布（人工操作）

统一素材来自：
- `SKILL.md`
- `packages/skill/prompt.md`
- `packages/skill/examples/linkedin-outreach.md`

按顺序发布：
1. skills.sh
2. clawhub.ai
3. playbooks.com

发布后把三个链接回填到 `packages/skill/release-checklist.md`。

## D. Homebrew Tap（人工操作）

> 前置：`gh auth status` 可用。

1. 初始化 tap：
   - `brew tap-new whjstc/tap`
2. 创建并推送仓库：
   - `cd "$(brew --repository)/Library/Taps/whjstc/homebrew-tap"`
   - `gh repo create whjstc/homebrew-tap --public --source=. --remote=origin --push`
3. 添加 formula（`browsecraft.rb`）并发布。
