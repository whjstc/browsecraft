# BrowseCraft CLI（中文文档）

面向可重复 AI Agent 工作流的浏览器自动化 CLI。

[English README](./README.md)

## 功能

- 持久浏览器架构 + 无状态命令
- 基于 ref 的快照流（`snapshot` → `click-ref` / `fill-ref`）
- 集成 RoxyBrowser 与 Camoufox
- 多会话隔离（`--session`）
- 标签页与 frame 管理
- 模板缓存命令
- 全局 JSON 输出（`--json`）

## 安装

```bash
npm install -g browsecraft-cli
```

## 核心流程

```bash
browsecraft start
browsecraft open https://example.com
browsecraft snapshot -i -c -d 6
browsecraft click-ref e2
browsecraft screenshot result.png
browsecraft stop
```

## 生命周期命令

- `browsecraft start [--type chrome|roxy|camoufox]`
- `browsecraft connect <endpoint> --type <chrome|roxy|camoufox>`
- `browsecraft status`
- `browsecraft stop`

## 快照命令

- `browsecraft snapshot [-i] [-c] [-d depth]`
- `browsecraft click-ref <ref>`
- `browsecraft fill-ref <ref> <text>`

## 标签页与 Frame

- `browsecraft tab list`
- `browsecraft tab new [url]`
- `browsecraft tab switch <index>`
- `browsecraft tab close [index]`
- `browsecraft frame list`
- `browsecraft frame switch <index>`
- `browsecraft frame clear`

## 模板命令

- `browsecraft template learn <name> <urlPattern> <key=selector...>`
- `browsecraft template execute <templateId> <action> [text]`
- `browsecraft template list`
- `browsecraft template delete <templateId>`

## 工作流命令

- `browsecraft workflow run <file.yml> [key=value ...]`
- `browsecraft workflow validate <file.yml> [key=value ...]`
- `browsecraft workflow dry-run <file.yml> [key=value ...]`

## 常用选项

- `--local`：使用 `./.browsecraft/`
- `--global`：使用 `~/.browsecraft/`（默认）
- `--session`：按会话隔离状态
- `--json`：所有命令统一 JSON 包装输出
- `--type`：`chrome|roxy|camoufox`
- `--headless`
- `--camoufox-path`
- `BROWSECRAFT_MAX_TABS`（环境变量）：每个上下文最大标签页（默认 `8`）

## 退出码

- `0`：成功
- `1`：检查失败（`exists` / `visible` / `assert`）
- `2`：错误
