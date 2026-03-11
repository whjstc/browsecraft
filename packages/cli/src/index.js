#!/usr/bin/env node

/**
 * BrowseCraft CLI - 持久浏览器架构
 * 学习 Rodney 的设计，最省 token (~68 tokens)
 */

import { parseArgs } from 'node:util'
import { loadConfig } from './config.js'
import * as lifecycle from './commands/lifecycle.js'
import * as navigation from './commands/navigation.js'
import * as interaction from './commands/interaction.js'
import * as snapshot from './commands/snapshot.js'
import * as check from './commands/check.js'
import * as utility from './commands/utility.js'
import * as advanced from './commands/advanced.js'
import * as find from './commands/find.js'
import * as get from './commands/get.js'
import * as settings from './commands/settings.js'
import * as cfg from './commands/config.js'
import * as tab from './commands/tab.js'
import * as template from './commands/template.js'
import * as frame from './commands/frame.js'
import * as workflow from './commands/workflow.js'

// 命令映射
const commands = {
  // 生命周期 (5)
  start: lifecycle.start,
  close: lifecycle.stop,
  stop: lifecycle.stop,
  disconnect: lifecycle.disconnect,
  doctor: lifecycle.doctor,
  'cleanup-profiles': lifecycle.cleanupProfiles,
  connect: lifecycle.connect,
  status: lifecycle.status,
  'roxy-list': lifecycle.roxyList,
  'roxy-doctor': lifecycle.roxyDoctor,

  // 导航 (4)
  open: navigation.open,
  back: navigation.back,
  forward: navigation.forward,
  reload: navigation.reload,

  // 基础交互 (4)
  click: interaction.click,
  fill: interaction.fill,
  type: interaction.type,
  select: interaction.select,

  // 高级交互 (10)
  hover: advanced.hover,
  press: advanced.press,
  dblclick: advanced.dblclick,
  focus: advanced.focus,
  scroll: advanced.scroll,
  upload: advanced.upload,
  drag: advanced.drag,
  check: advanced.check,
  uncheck: advanced.uncheck,
  highlight: advanced.highlight,

  // 快照 + ref (3)
  snapshot: snapshot.snapshot,
  'click-ref': snapshot.clickRef,
  'fill-ref': snapshot.fillRef,

  // 语义定位 (7)
  'find-role': find.findRole,
  'find-text': find.findText,
  'find-label': find.findLabel,
  'find-placeholder': find.findPlaceholder,
  'click-role': find.clickRole,
  'click-text': find.clickText,
  'fill-label': find.fillLabel,

  // 获取信息 (7)
  text: utility.getText,
  'get-html': get.getHtml,
  'get-value': get.getValue,
  'get-attr': get.getAttr,
  'get-count': get.getCount,
  'get-box': get.getBox,
  'get-title': get.getTitle,
  'get-url': get.getUrl,

  // 检查 (3)
  exists: check.exists,
  visible: check.visible,
  assert: check.assert,

  // 工具 (6)
  screenshot: utility.screenshot,
  js: utility.js,
  info: utility.info,
  'wait-for': utility.waitFor,
  'dismiss-cookies': utility.dismissCookies,

  // 配置管理 (1)
  config: cfg.config,

  // 设置和存储 (6)
  'set-viewport': settings.setViewport,
  'get-cookies': settings.getCookies,
  'clear-cookies': settings.clearCookies,
  'get-storage': settings.getStorage,
  'set-storage': settings.setStorage,
  pdf: settings.pdf,

  // tab 管理 (1)
  tab: tab.tab,

  // frame 管理 (1)
  frame: frame.frame,

  // 模板缓存 (1)
  template: template.template,

  // 工作流 (1)
  workflow: workflow.workflow,
}

// 帮助文档
const helpText = `
BrowseCraft - Browser automation for AI agents (with memory)

Lifecycle:
  browsecraft start [--type chrome|roxy|camoufox] [--headless] [--profile NAME] [--profile-dir PATH]
  browsecraft start --type roxy [--roxy-api URL] [--roxy-token KEY] [--roxy-window-id ID]
  browsecraft start --type camoufox [--camoufox-path /path/to/camoufox]
  browsecraft connect <endpoint> [--type chrome|camoufox|roxy]
  browsecraft close
  browsecraft stop        Alias of close
  browsecraft disconnect
  browsecraft doctor [--type chrome|roxy|camoufox]
  browsecraft cleanup-profiles
  browsecraft status
  browsecraft roxy-list [--roxy-api URL] [--roxy-token KEY]
  browsecraft roxy-doctor [--roxy-api URL] [--roxy-token KEY] [--roxy-workspace-id ID] [--roxy-window-id ID]

Navigation:
  browsecraft open <url>
  browsecraft back
  browsecraft forward
  browsecraft reload

Interaction:
  browsecraft click <selector>
  browsecraft fill <selector> <text>
  browsecraft type <selector> <text>
  browsecraft select <selector> <value>
  browsecraft hover <selector>
  browsecraft press <key>
  browsecraft dblclick <selector>
  browsecraft focus <selector>
  browsecraft scroll [direction|selector] [amount]
  browsecraft upload <selector> <file...>
  browsecraft drag <source> <target>
  browsecraft check <selector>
  browsecraft uncheck <selector>
  browsecraft highlight <selector>

Snapshot (ref-based):
  browsecraft snapshot [-i] [-c] [-d depth]
  browsecraft click-ref <ref>
  browsecraft fill-ref <ref> <text>

Semantic Locators:
  browsecraft find-role <role> [name]
  browsecraft find-text <text>
  browsecraft find-label <label>
  browsecraft find-placeholder <placeholder>
  browsecraft click-role <role> [name]
  browsecraft click-text <text>
  browsecraft fill-label <label> <text>

Get Info:
  browsecraft text <selector>
  browsecraft get-html <selector>
  browsecraft get-value <selector>
  browsecraft get-attr <selector> <attribute>
  browsecraft get-count <selector>
  browsecraft get-box <selector>
  browsecraft get-title
  browsecraft get-url

Checks (exit 0=pass, 1=fail, 2=error):
  browsecraft exists <selector>
  browsecraft visible <selector>
  browsecraft assert <js-expression> [expected]

Utility:
  browsecraft screenshot [path]
  browsecraft pdf [path]
  browsecraft js <expression>
  browsecraft info
  browsecraft wait-for <selector>
  browsecraft dismiss-cookies

Settings & Storage:
  browsecraft set-viewport <width> <height>
  browsecraft get-cookies
  browsecraft clear-cookies
  browsecraft get-storage <key>
  browsecraft set-storage <key> <value>

Tab Management:
  browsecraft tab list
  browsecraft tab new [url]
  browsecraft tab switch <index>
  browsecraft tab close [index]

Frame Management:
  browsecraft frame list
  browsecraft frame switch <index>
  browsecraft frame clear

Template:
  browsecraft template learn <name> <urlPattern> <key=selector...>
  browsecraft template execute <templateId> <action> [text]
  browsecraft template list
  browsecraft template delete <templateId>

Workflow:
  browsecraft workflow run <file.yml> [key=value ...]
  browsecraft workflow validate <file.yml> [key=value ...]
  browsecraft workflow dry-run <file.yml> [key=value ...]

Config:
  browsecraft config show
  browsecraft config set <KEY> <VALUE>
  browsecraft config get <KEY>
  browsecraft config delete <KEY>

Options:
  --local   Use project-local session (./.browsecraft/)
  --global  Use global session (~/.browsecraft/) [default]
  --session Session name for multi-session isolation
  --json    Output command result as JSON
  --type    Browser type (chrome|roxy|camoufox)
  --headless  Run in headless mode
  --profile   Fixed Chrome profile name for persistent login state
  --profile-dir  Explicit Chrome user-data-dir path for persistent login state
  --roxy-api      RoxyBrowser API URL (default: http://127.0.0.1:50000)
  --roxy-token    RoxyBrowser API token
  --roxy-window-id    RoxyBrowser window/dir ID to open
  --roxy-workspace-id RoxyBrowser workspace ID
  --camoufox-path     Camoufox executable path (or use CAMOUFOX_PATH env)
  BROWSECRAFT_MAX_TABS  Max tabs kept per context (default: 8, 0 means unlimited)
  BROWSECRAFT_PROFILE_DIR  Explicit Chrome user-data-dir path

Exit codes:
  0  Success
  1  Check failed
  2  Error
`.trim()

// 主函数
async function main() {
  // 最先加载配置（合并 .env 和 config.json 到 process.env）
  await loadConfig()

  const { values, positionals } = parseArgs({
    options: {
      local: { type: 'boolean' },
      global: { type: 'boolean' },
      session: { type: 'string' },
      json: { type: 'boolean' },
      type: { type: 'string' },
      headless: { type: 'boolean' },
      profile: { type: 'string' },
      'profile-dir': { type: 'string' },
      timeout: { type: 'string' },
      help: { type: 'boolean' },
      'roxy-api': { type: 'string' },
      'roxy-token': { type: 'string' },
      'roxy-window-id': { type: 'string' },
      'roxy-workspace-id': { type: 'string' },
      'camoufox-path': { type: 'string' },
    },
    allowPositionals: true,
    strict: false,
  })

  const cmd = positionals[0]
  const args = positionals.slice(1)

  if (values.session) {
    process.env.BROWSECRAFT_SESSION = values.session
  }

  // 显示帮助
  if (values.help || !cmd || cmd === 'help') {
    console.log(helpText)
    process.exit(0)
  }

  // 查找命令
  if (!commands[cmd]) {
    console.error(`Unknown command: ${cmd}`)
    console.error(`Run "browsecraft help" for usage`)
    process.exit(2)
  }

  const formatArg = (value) => {
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  if (values.json) {
    const originalLog = console.log
    const captured = []
    console.log = (...items) => {
      captured.push(items.map(formatArg).join(' '))
    }

    try {
      const result = await commands[cmd](args, values)
      originalLog(JSON.stringify({
        success: true,
        command: cmd,
        args,
        output: captured,
        result: result ?? null,
      }, null, 2))
      process.exit(0)
    } catch (error) {
      console.error(JSON.stringify({
        success: false,
        command: cmd,
        args,
        output: captured,
        error: error.message,
      }, null, 2))
      process.exit(2)
    } finally {
      console.log = originalLog
    }
  }

  try {
    await commands[cmd](args, values)
    process.exit(0)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(2)
  }
}

main()
