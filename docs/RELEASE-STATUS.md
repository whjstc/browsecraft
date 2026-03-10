# 发布状态（2026-03-10）

## 已完成

- Camoufox 自动启动与生命周期管理已发布到本地分支。
- Skill 分发资产与发布预检流程已落地。
- 预检脚本通过：`scripts/release-preflight.sh`

## 当前阻塞

- npm 正式发布需要联网权限与用户授权。
- 本次执行 `npm publish --workspace=@browsecraft/core --access public` 的提权请求被拒绝。

## 待执行命令（按顺序）

1. `npm publish --workspace=@browsecraft/core --access public`
2. `npm publish --workspace=browsecraft --access public`
3. `npm publish --workspace=@browsecraft/http-api --access public`
4. `npm publish --workspace=@browsecraft/mcp-server --access public`

## 发布后动作

- 回填 npm 包链接到 `README.md`
- 按 `packages/skill/release-checklist.md` 发布 skills.sh / clawhub.ai / playbooks.com
