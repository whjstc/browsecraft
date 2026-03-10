# BrowseCraft Skill（发布资产）

本目录用于维护 BrowseCraft 在 Skill 生态（skills.sh / ClawHub / playbooks）的统一发布资产。

## 目录说明

- `prompt.md`：Skill 的核心系统提示词（单一真源）。
- `release-checklist.md`：三平台发布与回归检查清单。
- `platform-matrix.md`：三平台字段与提交流程差异。
- `examples/`：可复现的用户任务示例。
- 根目录 `SKILL.md`：对外分发入口（skills.sh / CLI 技能安装）。

## 维护原则

1. 先更新 `prompt.md`，再同步到各平台。
2. 每次发布都执行 `release-checklist.md`。
3. 平台特定字段仅放在提交流程中，不污染统一 prompt。
