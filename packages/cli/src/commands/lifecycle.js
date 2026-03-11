/**
 * 生命周期命令 - start/stop/connect/status
 */

import { chromium, firefox } from 'playwright-core'
import { saveState, loadState, deleteState } from '../state.js'

export function getChromeProfileDir(profileName, pathModule, osModule) {
  if (!profileName) return null
  const normalized = profileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  if (!normalized) return null
  return pathModule.join(osModule.homedir(), '.browsecraft', 'user-data', `profile-${normalized}`)
}

export function resolveChromeDataDir(options, pathModule, osModule) {
  const explicitDir = options['profile-dir'] || process.env.BROWSECRAFT_PROFILE_DIR || null
  if (explicitDir) {
    return pathModule.resolve(explicitDir)
  }

  return getChromeProfileDir(options.profile, pathModule, osModule)
}

export function resolveChromeDataDirInfo(options, pathModule, osModule, cdpPort) {
  const namedDir = resolveChromeDataDir(options, pathModule, osModule)
  if (namedDir) {
    return {
      dataDir: namedDir,
      transientProfile: false,
    }
  }

  return {
    dataDir: pathModule.join(osModule.homedir(), '.browsecraft', 'user-data', `profile-${cdpPort}`),
    transientProfile: true,
  }
}

export async function findChromePath(execSync, accessFn) {
  if (process.platform === 'darwin') {
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]
    for (const candidate of paths) {
      try {
        await accessFn(candidate)
        return candidate
      } catch {}
    }
    return null
  }

  if (process.platform === 'linux') {
    try {
      return execSync('which google-chrome || which chromium-browser || which chromium', { encoding: 'utf-8' }).trim() || null
    } catch {}
  }

  return null
}

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

  if (browserType === 'camoufox' || browserType === 'firefox') {
    return startCamoufox(options, local)
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

  if (options.profile && options['profile-dir']) {
    throw new Error('Use either --profile or --profile-dir, not both')
  }

  // 查找 Chrome 路径
  const chromePath = await findChromePath(execSync, async (candidate) => import('node:fs/promises').then(fs => fs.access(candidate)))

  if (!chromePath) {
    throw new Error('Chrome not found. Install Chrome or specify --cdp-endpoint.')
  }

  const { dataDir, transientProfile } = resolveChromeDataDirInfo(options, path, os, cdpPort)
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
    owner: 'browsecraft',
    activeTabIndex: 0,
    activeFrameIndex: null,
    pid: child.pid,
    dataDir,
    transientProfile,
    scope: local ? 'local' : 'global',
    startedAt: new Date().toISOString(),
  }, local)

  console.log(`Browser started (pid: ${child.pid})`)
  console.log(`CDP: ${wsEndpoint}`)
}

async function startCamoufox(options, local) {
  const existingState = await loadState(local)
  if (existingState) {
    try {
      const browser = await connectByState(existingState, 3000)
      await browser.close().catch(() => {})
      console.log(`Browser already running at ${existingState.cdpEndpoint}`)
      return
    } catch {
      await deleteState(local)
    }
  }

  const { spawn, execSync } = await import('node:child_process')
  const path = await import('node:path')
  const fs = await import('node:fs/promises')
  const camoufoxPath = await resolveCamoufoxPath(options, execSync, fs)

  const helperPath = path.resolve(process.cwd(), 'packages/cli/src/camoufox-server.js')
  const helperConfig = JSON.stringify({
    headless: options.headless || false,
    executablePath: camoufoxPath || undefined,
  })

  const child = spawn(process.execPath, [helperPath, helperConfig], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let wsEndpoint = null

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Camoufox failed to start within 15 seconds'))
    }, 15000)

    child.stdout.on('data', (buffer) => {
      const text = buffer.toString()
      const match = text.match(/WS_ENDPOINT=(.+)/)
      if (match) {
        wsEndpoint = match[1].trim()
        clearTimeout(timer)
        resolve()
      }
    })

    child.stderr.on('data', (buffer) => {
      const text = buffer.toString().trim()
      if (text) {
        clearTimeout(timer)
        reject(new Error(`Camoufox start failed: ${text}`))
      }
    })

    child.on('exit', (code) => {
      if (!wsEndpoint) {
        clearTimeout(timer)
        reject(new Error(`Camoufox process exited early (code: ${code ?? 'unknown'})`))
      }
    })
  })

  child.unref()

  await saveState({
    cdpEndpoint: wsEndpoint,
    browserType: 'camoufox',
    owner: 'browsecraft',
    activeTabIndex: 0,
    activeFrameIndex: null,
    pid: child.pid,
    camoufoxPath: camoufoxPath || undefined,
    scope: local ? 'local' : 'global',
    startedAt: new Date().toISOString(),
  }, local)

  console.log(`Camoufox started (pid: ${child.pid})`)
  console.log(`WS: ${wsEndpoint}`)
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

  try {
    if (state.owner === 'external') {
      await disconnect(args, options)
      return
    }

    if (state.browserType === 'roxy' && state.roxyWindowId) {
      await closeRoxyWindow(state, options)
      await deleteState(local)
      console.log(`RoxyBrowser window closed (${state.roxyWindowId})`)
      return
    }

    await closeManagedBrowser(state)
    await deleteState(local)
    await cleanupTransientProfile(state)
    console.log('Browser stopped')
  } catch (error) {
    throw new Error(`Failed to stop browser: ${error.message}`)
  }
}

export async function disconnect(args, options) {
  const local = options.local || false
  const state = await loadState(local)

  if (!state) {
    console.log('No browser session')
    return
  }

  try {
    const browser = await connectByState(state, 5000)
    await browser.close().catch(() => {})
  } catch {}

  await deleteState(local)
  console.log('Session disconnected')
}

/**
 * 连接到已有浏览器
 */
export async function connect(args, options) {
  const local = options.local || false
  const endpoint = args[0]
  const browserType = options.type || 'chrome'

  if (!endpoint) {
    throw new Error('Usage: browsecraft connect <endpoint>')
  }

  // 验证连接
  let wsEndpoint = endpoint

  // Chromium 类浏览器支持通过 HTTP /json/version 自动发现 ws
  if (browserType !== 'camoufox' && browserType !== 'firefox' && endpoint.startsWith('http')) {
    try {
      const resp = await fetch(`${endpoint}/json/version`)
      const data = await resp.json()
      wsEndpoint = data.webSocketDebuggerUrl
    } catch {
      throw new Error(`Cannot connect to ${endpoint}`)
    }
  }

  // 验证连接
  const browser = await connectByType(browserType, wsEndpoint, 10000)
  const contexts = browser.contexts()
  const pages = contexts.length > 0 ? contexts[0].pages().length : 0
  await browser.close().catch(() => {})

  await saveState({
    cdpEndpoint: wsEndpoint,
    browserType,
    owner: 'external',
    activeTabIndex: 0,
    activeFrameIndex: null,
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

export async function closeManagedBrowser(state) {
  if (state.pid) {
    try {
      await terminateManagedProcess(state.pid)
      return
    } catch {}
  }

  try {
    const browser = await connectByState(state, 5000)
    await browser.close()
    return
  } catch {}

  throw new Error('unable to reach managed browser process')
}

export async function terminateManagedProcess(pid, killFn = process.kill) {
  const probes = 12

  try {
    killFn(pid, 'SIGTERM')
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
    return
  }

  for (let index = 0; index < probes; index += 1) {
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      killFn(pid, 0)
    } catch (error) {
      if (error?.code === 'ESRCH') return
      throw error
    }
  }

  killFn(pid, 'SIGKILL')
}

export async function cleanupTransientProfile(state, rmFn) {
  if (!state?.transientProfile || !state?.dataDir) return

  const remove = rmFn || (async (target) => {
    const fs = await import('node:fs/promises')
    await fs.rm(target, { recursive: true, force: true })
  })

  await remove(state.dataDir)
}

export function resolveRoxyStopConfig(state, options) {
  const { apiBase, apiToken } = roxyConfig(options)
  return {
    apiBase: state.roxyApi || apiBase,
    apiToken,
    workspaceId: state.roxyWorkspaceId || 0,
    dirId: state.roxyWindowId || '',
  }
}

export async function closeRoxyWindow(state, options) {
  const { apiBase, apiToken, workspaceId, dirId } = resolveRoxyStopConfig(state, options)
  const headers = {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: apiToken } : {}),
  }

  const response = await fetch(`${apiBase}/browser/close`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId: Number(workspaceId) || 0, dirId }),
  })

  const data = await response.json()
  if (data.code !== 0) {
    throw new Error(data.msg || 'RoxyBrowser API error')
  }
}

export function quoteShell(value) {
  if (value === null || value === undefined) return "''"
  const text = String(value)
  if (/^[a-zA-Z0-9_./:-]+$/.test(text)) return text
  return `'${text.replace(/'/g, `'\"'\"'`)}'`
}

export function buildRoxyStartHint(apiBase, apiToken, workspaceId, dirId) {
  const parts = [
    'browsecraft',
    'start',
    '--type',
    'roxy',
    '--roxy-api',
    quoteShell(apiBase),
  ]

  if (apiToken) {
    parts.push('--roxy-token', quoteShell(apiToken))
  }
  if (workspaceId !== null && workspaceId !== undefined) {
    parts.push('--roxy-workspace-id', String(workspaceId))
  }
  if (dirId) {
    parts.push('--roxy-window-id', quoteShell(dirId))
  }

  return parts.join(' ')
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
    owner: 'browsecraft',
    activeTabIndex: 0,
    activeFrameIndex: null,
    roxyApi: apiBase,
    roxyWorkspaceId: Number(workspaceId) || 0,
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
        console.log(`    start: ${buildRoxyStartHint(apiBase, apiToken, ws.id, b.dirId)}`)
      }
    }
  }
}

export async function roxyDoctor(args, options) {
  const report = await inspectRoxy(options)

  const ok = report.checks.every(item => item.ok)

  console.log(`Roxy API: ${apiBase}`)
  console.log(`Token: ${apiToken ? 'provided' : 'missing'}`)
  for (const item of report.checks) {
    console.log(`${item.ok ? 'OK' : 'FAIL'}  ${item.name}  ${item.detail}`)
  }

  if (!ok) {
    console.log('\nSuggested next steps:')
    let stepNumber = 1
    console.log(`  ${stepNumber}. Configure API: browsecraft config set ROXY_API ${quoteShell(apiBase)}`)
    stepNumber += 1
    if (!apiToken) {
      console.log(`  ${stepNumber}. Configure token: browsecraft config set ROXY_TOKEN YOUR_TOKEN`)
      stepNumber += 1
    }
    console.log(`  ${stepNumber}. List windows: browsecraft roxy-list --roxy-api ${quoteShell(apiBase)}${apiToken ? ` --roxy-token ${quoteShell(apiToken)}` : ''}`)
    stepNumber += 1
    if (targetWorkspace && browsers.length > 0) {
      console.log(`  ${stepNumber}. Start one window: ${buildRoxyStartHint(apiBase, apiToken || 'YOUR_TOKEN', targetWorkspace.id, browsers[0].dirId)}`)
    }
  }

  return report
}

export async function inspectRoxy(options) {
  const { apiBase, apiToken } = roxyConfig(options)
  const headers = {
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: apiToken } : {}),
  }

  const report = {
    apiBase,
    tokenProvided: Boolean(apiToken),
    checks: [],
  }

  try {
    const response = await fetch(apiBase, { method: 'GET' })
    report.checks.push({
      name: 'api_reachable',
      ok: response.ok || response.status < 500,
      detail: `HTTP ${response.status}`,
    })
  } catch (error) {
    report.checks.push({
      name: 'api_reachable',
      ok: false,
      detail: error.message,
    })
  }

  let workspaces = []
  try {
    workspaces = await fetchRoxyWorkspaces(apiBase, headers)
    report.checks.push({
      name: 'workspace_list',
      ok: true,
      detail: `${workspaces.length} workspace(s)`,
    })
  } catch (error) {
    report.checks.push({
      name: 'workspace_list',
      ok: false,
      detail: error.message,
    })
  }

  const requestedWorkspaceId = options['roxy-workspace-id'] || process.env.ROXY_WORKSPACE_ID || null
  const requestedDirId = options['roxy-window-id'] || process.env.ROXY_WINDOW_ID || null

  let targetWorkspace = null
  if (workspaces.length > 0) {
    if (requestedWorkspaceId) {
      targetWorkspace = workspaces.find(item => String(item.id) === String(requestedWorkspaceId)) || null
      report.checks.push({
        name: 'workspace_selected',
        ok: Boolean(targetWorkspace),
        detail: targetWorkspace
          ? `workspace ${targetWorkspace.workspaceName} (id=${targetWorkspace.id})`
          : `workspace ${requestedWorkspaceId} not found`,
      })
    } else if (workspaces.length === 1) {
      targetWorkspace = workspaces[0]
      report.checks.push({
        name: 'workspace_selected',
        ok: true,
        detail: `single workspace ${targetWorkspace.workspaceName} (id=${targetWorkspace.id})`,
      })
    } else {
      report.checks.push({
        name: 'workspace_selected',
        ok: false,
        detail: 'multiple workspaces found; set --roxy-workspace-id or ROXY_WORKSPACE_ID',
      })
    }
  }

  let browsers = []
  if (targetWorkspace) {
    try {
      browsers = await fetchRoxyBrowsers(apiBase, headers, targetWorkspace.id)
      report.checks.push({
        name: 'window_list',
        ok: true,
        detail: `${browsers.length} window(s) in workspace ${targetWorkspace.id}`,
      })
    } catch (error) {
      report.checks.push({
        name: 'window_list',
        ok: false,
        detail: error.message,
      })
    }
  }

  if (targetWorkspace && requestedDirId) {
    const browser = browsers.find(item => String(item.dirId) === String(requestedDirId)) || null
    report.checks.push({
      name: 'window_selected',
      ok: Boolean(browser),
      detail: browser
        ? `window ${browser.windowName || '(unnamed)'} (dirId=${browser.dirId})`
        : `window ${requestedDirId} not found in workspace ${targetWorkspace.id}`,
    })
  } else if (targetWorkspace && browsers.length === 1) {
    const browser = browsers[0]
    report.checks.push({
      name: 'window_selected',
      ok: true,
      detail: `single window ${browser.windowName || '(unnamed)'} (dirId=${browser.dirId})`,
    })
  } else if (targetWorkspace && browsers.length > 1 && !requestedDirId) {
    report.checks.push({
      name: 'window_selected',
      ok: false,
      detail: 'multiple windows found; set --roxy-window-id or ROXY_WINDOW_ID',
    })
  }

  return report
}

export async function inspectSession(local = false) {
  const state = await loadState(local)
  if (!state) {
    return {
      present: false,
      status: 'ok',
      detail: 'no active browser session',
      next: null,
      state: null,
    }
  }

  try {
    const browser = await connectByState(state, 3000)
    const contexts = browser.contexts()
    const pages = contexts.length > 0 ? contexts[0].pages().length : 0
    await browser.close().catch(() => {})
    return {
      present: true,
      status: 'ok',
      detail: `${state.browserType} session running (${pages} page${pages === 1 ? '' : 's'})`,
      next: state.owner === 'external' ? 'browsecraft disconnect' : 'browsecraft close',
      state,
    }
  } catch {
    return {
      present: true,
      status: 'warn',
      detail: `${state.browserType} session state exists but browser is disconnected`,
      next: state.owner === 'external' ? 'browsecraft disconnect' : 'browsecraft close',
      state,
    }
  }
}

export async function inspectProfiles(local = false) {
  const path = await import('node:path')
  const os = await import('node:os')
  const fs = await import('node:fs/promises')
  const baseDir = local
    ? path.join(process.cwd(), '.browsecraft', 'user-data')
    : path.join(os.homedir(), '.browsecraft', 'user-data')

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const dirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
    const transient = dirs.filter(name => /^profile-\d+$/.test(name))
    const named = dirs.filter(name => name.startsWith('profile-') && !/^profile-\d+$/.test(name))
    return {
      baseDir,
      total: dirs.length,
      transientCount: transient.length,
      namedCount: named.length,
      next: transient.length > 0 ? `find ${baseDir} -maxdepth 1 -type d -name 'profile-*'` : null,
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        baseDir,
        total: 0,
        transientCount: 0,
        namedCount: 0,
        next: null,
      }
    }
    throw error
  }
}

export async function doctor(args, options) {
  const local = options.local || false
  const targetType = options.type || 'auto'
  const sections = []
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const packageJsonPath = path.resolve(import.meta.dirname, '..', '..', 'package.json')
  const version = await fs.readFile(packageJsonPath, 'utf8')
    .then(content => JSON.parse(content).version || 'unknown')
    .catch(() => 'unknown')

  console.log('BrowseCraft Doctor')
  console.log(`Version: ${version}`)
  console.log(`Mode: ${local ? 'local' : 'global'} session scope`)

  console.log('\nChecking session state...')
  const session = await inspectSession(local)
  sections.push({
    title: 'Session',
    status: session.status,
    detail: session.detail,
    next: session.next,
  })

  if (targetType === 'auto' || targetType === 'chrome') {
    console.log('Checking Chrome availability...')
    const { execSync } = await import('node:child_process')
    const fs = await import('node:fs/promises')
    const chromePath = await findChromePath(execSync, async (candidate) => fs.access(candidate))
    sections.push({
      title: 'Chrome',
      status: chromePath ? 'ok' : 'fail',
      detail: chromePath || 'Chrome/Chromium not found',
      next: chromePath ? null : 'Install Chrome or use browsecraft connect <endpoint> --type chrome',
    })
  } else {
    sections.push({
      title: 'Chrome',
      status: 'skip',
      detail: `skipped for --type ${targetType}`,
      next: null,
    })
  }

  if (targetType === 'auto' || targetType === 'camoufox') {
    console.log('Checking Camoufox availability...')
    const { execSync } = await import('node:child_process')
    const fs = await import('node:fs/promises')
    const camoufoxPath = await resolveCamoufoxPath(options, execSync, fs)
    sections.push({
      title: 'Camoufox',
      status: camoufoxPath ? 'ok' : 'skip',
      detail: camoufoxPath || 'not found',
      next: camoufoxPath ? null : 'Install Camoufox or set CAMOUFOX_PATH / --camoufox-path when needed',
    })
  } else {
    sections.push({
      title: 'Camoufox',
      status: 'skip',
      detail: `skipped for --type ${targetType}`,
      next: null,
    })
  }

  if (targetType === 'auto' || targetType === 'roxy') {
    console.log('Checking RoxyBrowser API...')
    const roxy = await inspectRoxy(options)
    const roxyOk = roxy.checks.every(item => item.ok)
    const firstFailure = roxy.checks.find(item => !item.ok) || null
    sections.push({
      title: 'RoxyBrowser',
      status: roxyOk ? 'ok' : 'fail',
      detail: roxyOk
        ? `${roxy.checks.length} checks passed against ${roxy.apiBase}`
        : `${firstFailure?.name || 'check_failed'}: ${firstFailure?.detail || 'unknown error'}`,
      next: roxyOk ? null : `browsecraft roxy-doctor${options.type ? ` --type ${options.type}` : ''}`,
    })
  } else {
    sections.push({
      title: 'RoxyBrowser',
      status: 'skip',
      detail: `skipped for --type ${targetType}`,
      next: null,
    })
  }

  console.log('Checking profile directories...')
  const profiles = await inspectProfiles(local)
  sections.push({
    title: 'Profiles',
    status: profiles.transientCount > 0 ? 'warn' : 'ok',
    detail: `${profiles.total} total, ${profiles.transientCount} transient, ${profiles.namedCount} named`,
    next: profiles.next,
  })

  console.log('')
  for (const section of sections) {
    const label = section.status.toUpperCase().padEnd(4, ' ')
    console.log(`${label} ${section.title}  ${section.detail}`)
    if (section.next) {
      console.log(`      Next: ${section.next}`)
    }
  }

  return { version, targetType, sections }
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
    const browser = await connectByState(state, 3000)
    alive = true
    const contexts = browser.contexts()
    pages = contexts.length > 0 ? contexts[0].pages().length : 0
    await browser.close().catch(() => {})
  } catch {
    alive = false
  }

  console.log(`Status: ${alive ? 'running' : 'disconnected'}`)
  console.log(`CDP: ${state.cdpEndpoint}`)
  if (state.pid) console.log(`PID: ${state.pid}`)
  if (alive) console.log(`Pages: ${pages}`)
  if (state.startedAt) console.log(`Started: ${state.startedAt}`)
}

function connectByType(type, endpoint, timeout = 5000) {
  if (type === 'camoufox' || type === 'firefox') {
    return firefox.connect(endpoint, { timeout })
  }
  return chromium.connectOverCDP(endpoint, { timeout })
}

function connectByState(state, timeout = 5000) {
  return connectByType(state.browserType || 'chrome', state.cdpEndpoint, timeout)
}

async function resolveCamoufoxPath(options, execSync, fs) {
  const preferred = options['camoufox-path'] || process.env.CAMOUFOX_PATH
  if (preferred) return preferred

  if (process.platform === 'darwin') {
    const macCandidates = [
      '/Applications/Camoufox.app/Contents/MacOS/Camoufox',
      '/Applications/Camoufox.app/Contents/MacOS/camoufox',
    ]
    for (const candidate of macCandidates) {
      try {
        await fs.access(candidate)
        return candidate
      } catch {}
    }
  }

  try {
    const found = execSync('which camoufox || which camoufox-bin', { encoding: 'utf-8' }).trim()
    if (found) return found
  } catch {}

  return null
}
