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
browsecraft close
```

## 生命周期命令

- `browsecraft start [--type chrome|roxy|camoufox]`
- `browsecraft connect <endpoint> --type <chrome|roxy|camoufox>`
- `browsecraft status`
- `browsecraft doctor [--type chrome|roxy|camoufox]`
- `browsecraft cleanup-profiles`
- `browsecraft close`
- `browsecraft stop`（`close` 的别名）
- `browsecraft disconnect`
- `browsecraft roxy-list`
- `browsecraft roxy-doctor`

### `close` 与 `disconnect` 的区别

- `browsecraft close` 用于结束当前由 BrowseCraft 管理的会话。
- 对 BrowseCraft 自己启动的本地 Chrome 和 Camoufox，`close` 会真正关闭浏览器进程。
- 对 BrowseCraft 自己启动的 RoxyBrowser 窗口，`close` 会调用 Roxy API 真正关闭该窗口。
- 对通过 `browsecraft connect` 连接的外部浏览器，`close` 会退化为断开当前会话，不会关闭外部浏览器。
- `browsecraft stop` 保留为 `close` 的兼容别名。
- `browsecraft disconnect` 始终只清理当前会话，不尝试关闭底层浏览器或窗口。

### `doctor`

- `browsecraft doctor` 会检查当前会话、Chrome、RoxyBrowser、Camoufox 以及残留的 profile 目录。
- 每个检查项都会输出 `OK` / `WARN` / `FAIL` / `SKIP`，并在需要处理时给出具体的 `Next:` 命令。
- 如果只想检查某个后端，可以用 `browsecraft doctor --type roxy` 这类形式。

### `cleanup-profiles`

- `browsecraft cleanup-profiles` 用来清理遗留的临时 `profile-<端口>` 目录。
- 通过 `--profile` 或 `--profile-dir` 使用的命名 profile 不会被删除。
- 如果当前还有活动会话正在使用某个临时 profile，该目录也会被跳过。

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
