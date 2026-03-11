/**
 * BrowseCraft Core - 浏览器连接管理
 *
 * 支持多种浏览器后端:
 * - RoxyBrowser (Chromium + CDP)
 * - Camoufox (Firefox + WebDriver)
 * - Chrome/Edge (Chromium + CDP)
 * - 任何支持 CDP 或 WebDriver 的浏览器
 */

import { chromium, firefox } from 'playwright-core'

/**
 * 浏览器连接器
 */
export class BrowserConnector {
  constructor(options = {}) {
    this.options = {
      type: options.type || 'auto', // auto | roxy | camoufox | chrome | firefox
      cdpHost: options.cdpHost || '127.0.0.1',
      cdpPort: options.cdpPort || null,
      cdpEndpoint: options.cdpEndpoint || null, // 完整的 ws:// URL
      roxyApiEndpoint: options.roxyApiEndpoint || null,
      roxyApiToken: options.roxyApiToken || null,
      roxyWindowId: options.roxyWindowId || null,
      roxyWorkspaceId: options.roxyWorkspaceId || 1,
      headless: options.headless ?? false,
      timeout: options.timeout || 30000,
      maxTabs: options.maxTabs ?? Number.parseInt(process.env.BROWSECRAFT_MAX_TABS || '8', 10),
    }

    this.browser = null
    this.context = null
    this.page = null
  }

  /**
   * 连接到浏览器
   */
  async connect() {
    if (this.browser) return this

    const { type } = this.options

    switch (type) {
      case 'roxy':
        await this._connectRoxy()
        break
      case 'camoufox':
        await this._connectCamoufox()
        break
      case 'chrome':
      case 'chromium':
        await this._connectChromium()
        break
      case 'firefox':
        await this._connectFirefox()
        break
      case 'auto':
        await this._autoConnect()
        break
      default:
        throw new Error(`Unknown browser type: ${type}`)
    }

    return this
  }

  /**
   * 自动发现并连接
   */
  async _autoConnect() {
    // 尝试 CDP 端点
    if (this.options.cdpEndpoint) {
      return this._connectChromium()
    }

    // 尝试 RoxyBrowser API
    if (this.options.roxyApiEndpoint) {
      return this._connectRoxy()
    }

    // 尝试自动发现 CDP 端口
    if (this.options.cdpPort) {
      return this._connectChromium()
    }

    throw new Error(
      'Cannot auto-detect browser. Please provide cdpEndpoint, cdpPort, or roxyApiEndpoint.'
    )
  }

  /**
   * 连接 RoxyBrowser
   */
  async _connectRoxy() {
    let cdpEndpoint = this.options.cdpEndpoint

    if (!cdpEndpoint) {
      // 如果提供了 RoxyBrowser API,先启动浏览器窗口
      if (this.options.roxyApiEndpoint && this.options.roxyWindowId) {
        cdpEndpoint = await this._launchRoxyWindow()
      } else if (this.options.cdpPort) {
        // 通过 CDP 端口发现
        cdpEndpoint = await this._discoverCDP(this.options.cdpHost, this.options.cdpPort)
      } else {
        throw new Error('RoxyBrowser requires cdpEndpoint, cdpPort, or API configuration')
      }
    }

    this.browser = await chromium.connectOverCDP(cdpEndpoint)
    await this._setupPage()
  }

  /**
   * 通过 RoxyBrowser API 启动浏览器窗口
   */
  async _launchRoxyWindow() {
    const { roxyApiEndpoint, roxyApiToken, roxyWindowId, roxyWorkspaceId, headless } = this.options

    const response = await fetch(`${roxyApiEndpoint}/browser/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${roxyApiToken}`,
      },
      body: JSON.stringify({
        workspaceId: roxyWorkspaceId,
        dirId: roxyWindowId,
        headless,
        args: ['--remote-allow-origins=*'],
      }),
    })

    const data = await response.json()

    if (data.code !== 0) {
      throw new Error(`RoxyBrowser API error: ${data.msg}`)
    }

    return data.data.ws
  }

  /**
   * 连接 Chromium 系浏览器 (Chrome, Edge)
   */
  async _connectChromium() {
    let cdpEndpoint = this.options.cdpEndpoint

    if (!cdpEndpoint && this.options.cdpPort) {
      cdpEndpoint = await this._discoverCDP(this.options.cdpHost, this.options.cdpPort)
    }

    if (!cdpEndpoint) {
      throw new Error('Chromium requires cdpEndpoint or cdpPort')
    }

    this.browser = await chromium.connectOverCDP(cdpEndpoint)
    await this._setupPage()
  }

  /**
   * 连接 Firefox 系浏览器 (Camoufox)
   */
  async _connectCamoufox() {
    // Camoufox 基于 Firefox,使用 WebDriver 协议
    // 需要 Camoufox 提供的连接端点
    const cdpEndpoint = this.options.cdpEndpoint

    if (!cdpEndpoint) {
      throw new Error('Camoufox requires a connection endpoint')
    }

    // Firefox 通过 CDP 连接 (如果 Camoufox 支持)
    this.browser = await firefox.connect(cdpEndpoint)
    await this._setupPage()
  }

  /**
   * 连接 Firefox
   */
  async _connectFirefox() {
    return this._connectCamoufox()
  }

  /**
   * 通过 HTTP API 发现 CDP WebSocket 端点
   */
  async _discoverCDP(host, port) {
    const url = `http://${host}:${port}/json/version`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.webSocketDebuggerUrl) {
      throw new Error(`CDP endpoint not found at ${url}`)
    }

    return data.webSocketDebuggerUrl
  }

  /**
   * 设置默认页面
   */
  async _setupPage() {
    const contexts = this.browser.contexts()
    this.context = contexts[0] || await this.browser.newContext()
    this._bindTabGuard()

    const pages = this.context.pages()
    this.page = pages[0] || await this.context.newPage()
    await this._enforceTabLimit()
  }

  _bindTabGuard() {
    if (this._tabGuardBound || !this.context) return
    this._tabGuardBound = true
    this.context.on('page', () => {
      this._enforceTabLimit().catch(() => {})
    })
  }

  async _enforceTabLimit() {
    const maxTabs = Number(this.options.maxTabs)
    if (!Number.isFinite(maxTabs) || maxTabs <= 0) return

    const pages = this.context.pages()
    if (pages.length <= maxTabs) return

    const overflowCount = pages.length - maxTabs
    const overflowPages = pages.slice(0, overflowCount)
    for (const extraPage of overflowPages) {
      await extraPage.close().catch(() => {})
    }

    if (this.page && this.page.isClosed()) {
      const remained = this.context.pages()
      this.page = remained[0] || null
    }
  }

  /**
   * 获取当前页面
   */
  getPage() {
    return this.page
  }

  /**
   * 获取浏览器实例
   */
  getBrowser() {
    return this.browser
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.browser) {
      await this.browser.close().catch(() => {})
      this.browser = null
      this.context = null
      this.page = null
    }
  }
}
