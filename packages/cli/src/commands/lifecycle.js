/**
 * 生命周期命令 - start/stop/connect/status
 */

import { chromium } from 'playwright-core'
import { saveState, loadState, deleteState } from '../state.js'

/**
 * 启动浏览器
 */
export async function start(args, options) {
  const local = options.local || false
  const browserType = options.type || 'chrome'
  const headless = options.headless || false

  // RoxyBrowser 模式：通过 API 启动窗口
  if (browserType === 'roxy' || options['roxy-api']) {
    return startRoxy(options, local)
  }

  // 检查是否已有运行中的浏览器
  const existingState = await loadState(local)
  if (existingState) {
    try {
      const browser = await chromium.connectOverCDP(existingState.cdpEndpoint, { timeout: 3000 })
      browser.close()
      console.log(`Browser already running at ${existingState.cdpEndpoint}`)
      return
    } catch {
      // 旧的连接已失效，继续启动新的
      await deleteState(local)
    }
  }

  // 启动浏览器
  let cdpPort = 9222 + Math.floor(Math.random() * 1000)

  const { execSync, spawn } = await import('node:child_process')
  const os = await import('node:os')
  const path = await import('node:path')

  // 查找 Chrome 路径
  let chromePath
  if (process.platform === 'darwin') {
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]
    for (const p of paths) {
      try {
        await import('node:fs/promises').then(fs => fs.access(p))
        chromePath = p
        break
      } catch {}
    }
  } else if (process.platform === 'linux') {
    try {
      chromePath = execSync('which google-chrome || which chromium-browser || which chromium', { encoding: 'utf-8' }).trim()
    } catch {}
  }

  if (!chromePath) {
    throw new Error('Chrome not found. Install Chrome or specify --cdp-endpoint.')
  }

  // 创建用户数据目录
  const dataDir = path.join(os.homedir(), '.browsecraft', 'user-data', `profile-${cdpPort}`)
  await import('node:fs/promises').then(fs => fs.mkdir(dataDir, { recursive: true }))

  // 启动 Chrome
  const chromeArgs = [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${dataDir}`,
  ]

  if (headless) {
    chromeArgs.push('--headless=new')
  }

  const child = spawn(chromePath, chromeArgs, {
    detached: true,
    stdio: 'ignore',
  })

  child.unref()

  // 等待 CDP 就绪
  const cdpEndpoint = `http://127.0.0.1:${cdpPort}`
  let wsEndpoint = null

  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`${cdpEndpoint}/json/version`)
      const data = await resp.json()
      wsEndpoint = data.webSocketDebuggerUrl
      break
    } catch {
      await new Promise(res => setTimeout(res, 500))
    }
  }

  if (!wsEndpoint) {
    throw new Error('Browser failed to start within 15 seconds')
  }

  // 保存状态
  await saveState({
    cdpEndpoint: wsEndpoint,
    browserType,
    pid: child.pid,
    dataDir,
    scope: local ? 'local' : 'global',
    startedAt: new Date().toISOString(),
  }, local)

  console.log(`Browser started (pid: ${child.pid})`)
  console.log(`CDP: ${wsEndpoint}`)
}

/**
 * 停止浏览器
 */
export async function stop(args, options) {
  const local = options.local || false
  const state = await loadState(local)

  if (!state) {
    console.log('No browser running')
    return
  }

  // 尝试优雅关闭
  try {
    const browser = await chromium.connectOverCDP(state.cdpEndpoint, { timeout: 5000 })
    await browser.close()
  } catch {
    // 如果 CDP 连接失败，直接杀进程
    if (state.pid) {
      try {
        process.kill(state.pid)
      } catch {}
    }
  }

  await deleteState(local)
  console.log('Browser stopped')
}

/**
 * 连接到已有浏览器
 */
export async function connect(args, options) {
  const local = options.local || false
  const cdpEndpoint = args[0]

  if (!cdpEndpoint) {
    throw new Error('Usage: browsecraft connect <cdp-endpoint>')
  }

  // 验证连接
  let wsEndpoint = cdpEndpoint

  // 如果是 HTTP URL，获取 WebSocket 端点
  if (cdpEndpoint.startsWith('http')) {
    try {
      const resp = await fetch(`${cdpEndpoint}/json/version`)
      const data = await resp.json()
      wsEndpoint = data.webSocketDebuggerUrl
    } catch {
      throw new Error(`Cannot connect to ${cdpEndpoint}`)
    }
  }

  // 验证 WebSocket 连接
  const browser = await chromium.connectOverCDP(wsEndpoint, { timeout: 10000 })
  const contexts = browser.contexts()
  const pages = contexts.length > 0 ? contexts[0].pages().length : 0

  await saveState({
    cdpEndpoint: wsEndpoint,
    browserType: options.type || 'chrome',
    scope: local ? 'local' : 'global',
    connectedAt: new Date().toISOString(),
  }, local)

  console.log(`Connected to ${wsEndpoint}`)
  console.log(`Pages: ${pages}`)
}

/**
 * 获取 Roxy API 通用配置
 */
function roxyConfig(options) {
  return {
    apiBase: options['roxy-api'] || process.env.ROXY_API || 'http://127.0.0.1:50000',
    apiToken: options['roxy-token'] || process.env.ROXY_TOKEN || '',
  }
}

/**
 * 自动发现 RoxyBrowser 工作区列表
 */
async function fetchRoxyWorkspaces(apiBase, headers) {
  const resp = await fetch(`${apiBase}/browser/workspace`, { headers })
  const data = await resp.json()
  if (data.code !== 0) throw new Error(`RoxyBrowser API error: ${data.msg}`)
  return data?.data?.rows || []
}

/**
 * 获取指定工作区下的浏览器窗口列表
 */
async function fetchRoxyBrowsers(apiBase, headers, workspaceId) {
  const resp = await fetch(`${apiBase}/browser/list?workspaceId=${workspaceId}`, { headers })
  const data = await resp.json()
  if (data.code !== 0) throw new Error(`RoxyBrowser API error: ${data.msg}`)
  return data?.data?.rows || []
}

/**
 * 命令行交互式选择（readline）
 */
async function promptSelect(items, display) {
  const { createInterface } = await import('node:readline')
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  const ask = (q) => new Promise(res => rl.question(q, res))

  items.forEach((item, i) => process.stderr.write(`  [${i + 1}] ${display(item)}\n`))
  process.stderr.write('\n')

  let choice
  while (true) {
    const input = await ask(`Select [1-${items.length}]: `)
    const n = parseInt(input.trim(), 10)
    if (n >= 1 && n <= items.length) { choice = items[n - 1]; break }
    process.stderr.write(`Please enter a number between 1 and ${items.length}\n`)
  }
  rl.close()
  return choice
}

/**
 * 通过 RoxyBrowser API 启动浏览器窗口
 */
async function startRoxy(options, local) {
  const { apiBase, apiToken } = roxyConfig(options)
  const headless = options.headless || false
  const headers = {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: apiToken } : {}),
  }

  let dirId = options['roxy-window-id'] || null
  let workspaceId = options['roxy-workspace-id'] || null

  // 自动发现工作区 + 交互式选择
  if (!dirId) {
    // 1. 确定工作区
    if (!workspaceId) {
      const workspaces = await fetchRoxyWorkspaces(apiBase, headers)
      if (workspaces.length === 0) throw new Error('No RoxyBrowser workspaces found')
      if (workspaces.length === 1) {
        workspaceId = workspaces[0].id
        process.stderr.write(`Using workspace: ${workspaces[0].workspaceName} (id=${workspaceId})\n`)
      } else {
        process.stderr.write('Select workspace:\n')
        const ws = await promptSelect(workspaces, w => `${w.workspaceName} (id=${w.id})`)
        workspaceId = ws.id
      }
    }

    // 2. 列出该工作区的浏览器窗口
    const browsers = await fetchRoxyBrowsers(apiBase, headers, workspaceId)
    if (browsers.length === 0) {
      throw new Error(`No browser windows in workspace ${workspaceId}. Please create one in RoxyBrowser first.`)
    }
    if (browsers.length === 1) {
      dirId = browsers[0].dirId
      const name = browsers[0].windowName || '(unnamed)'
      process.stderr.write(`Using browser: ${name} (dirId=${dirId})\n`)
    } else {
      process.stderr.write('Select browser window:\n')
      const b = await promptSelect(browsers, b => `${b.windowName || '(unnamed)'}  (dirId=${b.dirId})`)
      dirId = b.dirId
    }
  }

  // 打开浏览器窗口（dirId 是字符串 UUID）
  const openResp = await fetch(`${apiBase}/browser/open`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId: Number(workspaceId) || 0, dirId, headless }),
  })

  const openData = await openResp.json()
  if (openData.code !== 0) {
    throw new Error(`RoxyBrowser open failed: ${openData.msg}`)
  }

  const wsEndpoint = openData?.data?.ws
  if (!wsEndpoint) {
    throw new Error(`RoxyBrowser did not return a WebSocket URL. Response: ${JSON.stringify(openData)}`)
  }

  await saveState({
    cdpEndpoint: wsEndpoint,
    browserType: 'roxy',
    roxyApi: apiBase,
    roxyWindowId: dirId,
    scope: local ? 'local' : 'global',
    startedAt: new Date().toISOString(),
  }, local)

  console.log(`RoxyBrowser started (window id: ${dirId})`)
  console.log(`CDP: ${wsEndpoint}`)
}

/**
 * 列出 RoxyBrowser 可用工作区和窗口
 */
export async function roxyList(args, options) {
  const { apiBase, apiToken } = roxyConfig(options)
  const headers = {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: apiToken } : {}),
  }

  // 自动发现工作区
  const workspaces = await fetchRoxyWorkspaces(apiBase, headers)
  if (workspaces.length === 0) {
    console.log('No RoxyBrowser workspaces found')
    return
  }

  for (const ws of workspaces) {
    console.log(`\nWorkspace: ${ws.workspaceName} (id=${ws.id})`)
    const browsers = await fetchRoxyBrowsers(apiBase, headers, ws.id)
    if (browsers.length === 0) {
      console.log('  (no browser windows)')
    } else {
      for (const b of browsers) {
        const name = b.windowName || '(unnamed)'
        const status = b.status !== undefined ? `  status=${b.status}` : ''
        console.log(`  [${b.dirId}] ${name}${status}`)
      }
    }
  }
}

/**
 * 查看浏览器状态
 */
export async function status(args, options) {
  const local = options.local || false
  const state = await loadState(local)

  if (!state) {
    console.log('No browser session')
    return
  }

  // 检查连接是否有效
  let alive = false
  let pages = 0

  try {
    const browser = await chromium.connectOverCDP(state.cdpEndpoint, { timeout: 3000 })
    alive = true
    const contexts = browser.contexts()
    pages = contexts.length > 0 ? contexts[0].pages().length : 0
  } catch {
    alive = false
  }

  console.log(`Status: ${alive ? 'running' : 'disconnected'}`)
  console.log(`CDP: ${state.cdpEndpoint}`)
  if (state.pid) console.log(`PID: ${state.pid}`)
  if (alive) console.log(`Pages: ${pages}`)
  if (state.startedAt) console.log(`Started: ${state.startedAt}`)
}
