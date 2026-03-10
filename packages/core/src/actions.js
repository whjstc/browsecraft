/**
 * BrowseCraft Core - 操作封装
 *
 * 统一的浏览器操作接口
 */

import { retryWithBackoff, smartWait, dismissCookieBanner } from './utils.js'

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
   * 点击元素（带重试）
   */
  async click(selector, options = {}) {
    return retryWithBackoff(async () => {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 })
      await this.page.click(selector, {
        timeout: options.timeout || 10000,
      })
      return { action: 'click', selector }
    }, { retries: options.retries || 3 })
  }

  /**
   * 填写文本（带重试）
   */
  async fill(selector, value, options = {}) {
    return retryWithBackoff(async () => {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 })
      await this.page.fill(selector, value, {
        timeout: options.timeout || 10000,
      })
      return { action: 'fill', selector, value }
    }, { retries: options.retries || 3 })
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

  /**
   * 关闭 Cookie 同意弹窗
   */
  async dismissCookies() {
    const result = await dismissCookieBanner(this.page)
    return { action: 'dismissCookies', dismissed: result }
  }

  /**
   * 智能等待（元素/网络空闲）
   */
  async smartWait(options = {}) {
    await smartWait(this.page, options)
    return { action: 'smartWait', ...options }
  }

  // === 新增命令：对齐 agent-browser ===

  /**
   * 双击元素
   */
  async dblclick(selector, options = {}) {
    await this.page.dblclick(selector, { timeout: options.timeout || 10000 })
    return { action: 'dblclick', selector }
  }

  /**
   * 聚焦元素
   */
  async focus(selector) {
    await this.page.focus(selector)
    return { action: 'focus', selector }
  }

  /**
   * 滚动页面或元素
   */
  async scroll(options = {}) {
    const { selector, direction = 'down', amount = 500 } = options
    if (selector) {
      await this.page.locator(selector).scrollIntoViewIfNeeded()
      return { action: 'scroll', selector }
    }
    const delta = direction === 'up' || direction === 'left' ? -amount : amount
    const x = direction === 'left' || direction === 'right' ? delta : 0
    const y = direction === 'up' || direction === 'down' ? delta : 0
    await this.page.mouse.wheel(x, y)
    return { action: 'scroll', direction, amount }
  }

  /**
   * 滚动元素到视图
   */
  async scrollIntoView(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded()
    return { action: 'scrollIntoView', selector }
  }

  /**
   * 上传文件
   */
  async upload(selector, files) {
    await this.page.locator(selector).setInputFiles(files)
    return { action: 'upload', selector, files: Array.isArray(files) ? files : [files] }
  }

  /**
   * 拖拽
   */
  async drag(sourceSelector, targetSelector) {
    await this.page.dragAndDrop(sourceSelector, targetSelector)
    return { action: 'drag', source: sourceSelector, target: targetSelector }
  }

  /**
   * 勾选复选框
   */
  async check(selector) {
    await this.page.check(selector)
    return { action: 'check', selector }
  }

  /**
   * 取消勾选复选框
   */
  async uncheck(selector) {
    await this.page.uncheck(selector)
    return { action: 'uncheck', selector }
  }

  /**
   * 获取元素 HTML
   */
  async getHtml(selector, options = {}) {
    const html = options.outer
      ? await this.page.locator(selector).evaluate(el => el.outerHTML)
      : await this.page.locator(selector).innerHTML()
    return { selector, html }
  }

  /**
   * 获取表单值
   */
  async getValue(selector) {
    const value = await this.page.locator(selector).inputValue()
    return { selector, value }
  }

  /**
   * 获取元素属性
   */
  async getAttr(selector, attribute) {
    const value = await this.page.locator(selector).getAttribute(attribute)
    return { selector, attribute, value }
  }

  /**
   * 获取匹配元素数量
   */
  async getCount(selector) {
    const count = await this.page.locator(selector).count()
    return { selector, count }
  }

  /**
   * 获取元素边界框
   */
  async getBox(selector) {
    const box = await this.page.locator(selector).boundingBox()
    return { selector, box }
  }

  /**
   * 导出 PDF
   */
  async pdf(path, options = {}) {
    await this.page.pdf({
      path,
      format: options.format || 'A4',
      printBackground: options.background !== false,
    })
    return { action: 'pdf', path }
  }

  /**
   * 设置视口大小
   */
  async setViewport(width, height) {
    await this.page.setViewportSize({ width, height })
    return { action: 'setViewport', width, height }
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector) {
    const visible = await this.page.locator(selector).isVisible()
    return { selector, visible }
  }

  /**
   * 检查元素是否启用
   */
  async isEnabled(selector) {
    const enabled = await this.page.locator(selector).isEnabled()
    return { selector, enabled }
  }

  /**
   * 检查元素是否被勾选
   */
  async isChecked(selector) {
    const checked = await this.page.locator(selector).isChecked()
    return { selector, checked }
  }

  /**
   * 语义定位 - 按角色查找
   */
  async findByRole(role, options = {}) {
    const locator = this.page.getByRole(role, options.name ? { name: options.name } : undefined)
    const count = await locator.count()
    return { role, name: options.name, count, locator }
  }

  /**
   * 语义定位 - 按文本查找
   */
  async findByText(text, options = {}) {
    const locator = this.page.getByText(text, { exact: options.exact })
    const count = await locator.count()
    return { text, count, locator }
  }

  /**
   * 语义定位 - 按标签查找
   */
  async findByLabel(label, options = {}) {
    const locator = this.page.getByLabel(label, { exact: options.exact })
    const count = await locator.count()
    return { label, count, locator }
  }

  /**
   * 语义定位 - 按占位符查找
   */
  async findByPlaceholder(placeholder, options = {}) {
    const locator = this.page.getByPlaceholder(placeholder, { exact: options.exact })
    const count = await locator.count()
    return { placeholder, count, locator }
  }

  /**
   * 获取/设置 cookies
   */
  async getCookies() {
    const context = this.page.context()
    const cookies = await context.cookies()
    return { cookies }
  }

  /**
   * 清除 cookies
   */
  async clearCookies() {
    const context = this.page.context()
    await context.clearCookies()
    return { action: 'clearCookies' }
  }

  /**
   * 获取 localStorage
   */
  async getStorage(key) {
    const value = await this.page.evaluate(k => localStorage.getItem(k), key)
    return { key, value }
  }

  /**
   * 设置 localStorage
   */
  async setStorage(key, value) {
    await this.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value])
    return { action: 'setStorage', key, value }
  }

  /**
   * 高亮元素（调试用）
   */
  async highlight(selector) {
    await this.page.evaluate(s => {
      const el = document.querySelector(s)
      if (el) {
        el.style.outline = '3px solid red'
        el.style.outlineOffset = '2px'
      }
    }, selector)
    return { action: 'highlight', selector }
  }
}
