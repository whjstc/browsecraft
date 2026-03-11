# Skill 发布清单

## 0. 发布前统一检查

- [ ] `skills/browsecraft/` 已更新到最新能力边界
- [ ] README 未夸大未实现能力
- [ ] 至少 1 个可复现 demo 可完整跑通
- [ ] 执行 `npm run release:skill` 生成 `dist/skill/*`

## 1. skills.sh（首发渠道）

- [ ] 填写名称、描述、安装方式、仓库链接（参考 `dist/skills-sh-submission.md`）
- [ ] 粘贴统一 prompt（来自 `dist/prompt.md`）
- [ ] 验证安装后可调用 BrowseCraft CLI
- [ ] 记录发布链接和版本号

## 2. clawhub.ai

- [ ] 复用同一 prompt，仅补充平台必填字段（参考 `dist/clawhub-submission.md`）
- [ ] 验证 OpenClaw 下的安装和调用
- [ ] 记录平台页面链接

## 3. playbooks.com

- [ ] 复用同一 prompt 和 demo（参考 `dist/playbooks-submission.md`）
- [ ] 验证导入、执行、结果输出格式
- [ ] 记录平台页面链接

## 4. 发布后回归

- [ ] 三平台安装文档可用
- [ ] 提交 issue 模板收集用户反馈
- [ ] 更新 ROADMAP 状态与下周目标
