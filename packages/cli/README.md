# BrowseCraft CLI

Browser automation CLI for AI agents - minimal token cost (~68 tokens)

## 特点

- **最省 token** - 初始成本仅 ~68 tokens（vs Playwright MCP 的 ~3,600 tokens）
- **持久浏览器架构** - 学习 Rodney，浏览器持久运行，CLI 无状态
- **无障碍快照** - 使用 ref 标识符（e1, e2, e3...）而非截图
- **智能重试** - 内置指数退避重试机制
- **Cookie 处理** - 自动关闭 Cookie 同意弹窗

## 安装

```bash
npm install -g browsecraft
```

## 快速开始

```bash
# 1. 启动浏览器
browsecraft start

# 2. 导航到网页
browsecraft open https://example.com

# 3. 获取无障碍快照
browsecraft snapshot -i -c -d 6 > page.yaml

# 4. 通过 ref 点击元素
browsecraft click-ref e2

# 5. 截图验证
browsecraft screenshot result.png

# 6. 关闭浏览器
browsecraft stop
```

## 命令列表

### 生命周期

- `browsecraft start` - 启动浏览器
- `browsecraft stop` - 停止浏览器
- `browsecraft connect <endpoint>` - 连接已有浏览器（Chrome 用 http/ws；Camoufox 用 ws）
- `browsecraft status` - 查看浏览器状态

### 导航

- `browsecraft open <url>` - 打开 URL
- `browsecraft back` - 后退
- `browsecraft forward` - 前进
- `browsecraft reload` - 刷新

### 交互

- `browsecraft click <selector>` - 点击元素
- `browsecraft fill <selector> <text>` - 填写文本
- `browsecraft type <selector> <text>` - 逐字符输入
- `browsecraft select <selector> <value>` - 选择下拉选项

### 快照（基于 ref）

- `browsecraft snapshot [-i] [-c] [-d depth]` - 捕获无障碍快照
- `browsecraft click-ref <ref>` - 通过 ref 点击
- `browsecraft fill-ref <ref> <text>` - 通过 ref 填写

### Tab 管理

- `browsecraft tab list` - 列出当前标签页
- `browsecraft tab new [url]` - 新建标签页
- `browsecraft tab switch <index>` - 切换活动标签页
- `browsecraft tab close [index]` - 关闭标签页

### 检查（退出码：0=pass, 1=fail, 2=error）

- `browsecraft exists <selector>` - 检查元素是否存在
- `browsecraft visible <selector>` - 检查元素是否可见
- `browsecraft assert <js-expression> [expected]` - 断言 JavaScript 表达式

### 工具

- `browsecraft screenshot [path]` - 截图
- `browsecraft js <expression>` - 执行 JavaScript
- `browsecraft info` - 获取页面信息
- `browsecraft wait-for <selector>` - 等待元素出现
- `browsecraft dismiss-cookies` - 关闭 Cookie 弹窗
- `browsecraft text <selector>` - 获取元素文本

## 选项

- `--local` - 使用项目级会话（`./.browsecraft/`）
- `--global` - 使用全局会话（`~/.browsecraft/`）[默认]
- `--session` - 会话名（隔离状态文件）
- `--type` - 浏览器类型（chrome|roxy|camoufox）
- `--headless` - 无头模式
- `--camoufox-path` - Camoufox 可执行文件路径（也可用 `CAMOUFOX_PATH`）
- `BROWSECRAFT_MAX_TABS` - 每个 context 保留的最大标签页数量（默认 8）

## 退出码

- `0` - 成功
- `1` - 检查失败（exists/visible/assert）
- `2` - 错误

## 架构

BrowseCraft CLI 采用"持久浏览器 + 无状态命令"架构：

1. **浏览器持久运行** - `browsecraft start` 启动浏览器后台进程
2. **状态保存** - CDP 端点保存到 `~/.browsecraft/state.json`
3. **命令无状态** - 每个命令读取状态，连接浏览器，执行操作，退出
4. **最小开销** - 每次命令仅传输必要数据，无需重复发送页面内容

## 与竞品对比

| 特性 | BrowseCraft CLI | Rodney | Playwright MCP |
|------|----------------|--------|----------------|
| Token 成本 | ~68 | ~68 | ~3,600 |
| 无障碍快照 | ✅ | ✅ | ✅ |
| 模板缓存 | ✅ | ❌ | ❌ |
| 指纹浏览器 | ✅ | ❌ | ❌ |
| 智能重试 | ✅ | ❌ | ❌ |
| Cookie 处理 | ✅ | ❌ | ❌ |

## License

MIT
