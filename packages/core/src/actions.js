/**
 * BrowseCraft Core - 操作封装
 *
 * 统一的浏览器操作接口
 */

export class BrowserActions {
  constructor(connector) {
    this.connector = connector
  }

  get page() {
    return this.connector.getPage()
  }

  /**
   * 导航到 URL
   */
  async navigate(url, options = {}) {
    await this.page.goto(url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: options.timeout || 30000,
    })
    return { url: this.page.url(), title: await this.page.title() }
  }

  /**
   * 获取页面信息
   */
  async getInfo() {
    return {
      url: this.page.url(),
      title: await this.page.title(),
    }
  }

  /**
   * 点击元素
   */
  async click(selector, options = {}) {
    await this.page.click(selector, {
      timeout: options.timeout || 10000,
    })
    return { action: 'click', selector }
  }

  /**
   * 填写文本
   */
  async fill(selector, value, options = {}) {
    await this.page.fill(selector, value, {
      timeout: options.timeout || 10000,
    })
    return { action: 'fill', selector, value }
  }

  /**
   * 输入文本 (逐字符)
   */
  async type(selector, value, options = {}) {
    await this.page.locator(selector).pressSequentially(value, {
      delay: options.delay || 50,
    })
    return { action: 'type', selector, value }
  }

  /**
   * 截图
   */
  async screenshot(path, options = {}) {
    const buffer = await this.page.screenshot({
      path,
      fullPage: options.fullPage || false,
      type: options.type || 'png',
    })
    return { action: 'screenshot', path, size: buffer.length }
  }

  /**
   * 获取元素文本
   */
  async getText(selector) {
    const text = await this.page.locator(selector).textContent()
    return { selector, text: text?.trim() }
  }

  /**
   * 获取所有匹配元素的文本
   */
  async getTexts(selector, limit = 10) {
    const elements = await this.page.locator(selector).all()
    const texts = []
    for (const el of elements.slice(0, limit)) {
      const text = await el.textContent()
      if (text?.trim()) texts.push(text.trim())
    }
    return { selector, count: elements.length, texts }
  }

  /**
   * 等待元素出现
   */
  async waitFor(selector, options = {}) {
    await this.page.waitForSelector(selector, {
      state: options.state || 'visible',
      timeout: options.timeout || 30000,
    })
    return { action: 'waitFor', selector }
  }

  /**
   * 执行自定义 JavaScript
   */
  async evaluate(code) {
    const result = await this.page.evaluate(code)
    return { result }
  }

  /**
   * 执行 Playwright 代码 (高级)
   */
  async execute(code) {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction('page', code)
    const result = await fn(this.page)
    return { result }
  }

  /**
   * 获取页面 Accessibility 快照
   */
  async snapshot() {
    const tree = await this.page.accessibility?.snapshot()
    return { url: this.page.url(), snapshot: tree }
  }

  /**
   * 选择下拉框选项
   */
  async select(selector, value) {
    await this.page.selectOption(selector, value)
    return { action: 'select', selector, value }
  }

  /**
   * 悬停
   */
  async hover(selector) {
    await this.page.hover(selector)
    return { action: 'hover', selector }
  }

  /**
   * 按键
   */
  async press(key) {
    await this.page.keyboard.press(key)
    return { action: 'press', key }
  }

  /**
   * 等待指定时间
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms)
    return { action: 'wait', ms }
  }
}
