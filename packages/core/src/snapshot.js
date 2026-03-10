/**
 * 无障碍快照管理器
 * 注意：通过 CDP 连接时，page.accessibility 不可用，使用 evaluate 替代
 */

export class SnapshotManager {
  constructor() {
    this.refMap = new Map() // ref -> selector 映射
    this.refCounter = 0
  }

  /**
   * 捕获页面无障碍快照
   * @param {Page} page - Playwright Page 对象
   * @param {Object} options - 配置选项
   * @param {boolean} options.interestingOnly - 仅包含可交互元素（默认 true）
   * @returns {Promise<{yaml: string, refMap: Map}>}
   */
  async capture(page, options = {}) {
    const { interestingOnly = true } = options

    // 使用 evaluate 获取可交互元素（兼容 CDP 连接）
    const elements = await page.evaluate(() => {
      function getInteractiveElements() {
        const elements = []
        const selectors = [
          'a[href]',
          'button',
          'input:not([type="hidden"])',
          'select',
          'textarea',
          '[role="button"]',
          '[role="link"]',
          '[role="textbox"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[role="tab"]',
          '[role="menuitem"]',
        ]

        const seen = new Set()

        for (const selector of selectors) {
          const els = document.querySelectorAll(selector)
          for (const el of els) {
            if (seen.has(el)) continue
            seen.add(el)

            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue

            const text = el.getAttribute('aria-label') ||
                         el.title ||
                         el.innerText?.slice(0, 100) ||
                         el.value ||
                         el.placeholder ||
                         ''

            // 生成唯一 selector
            let uniqueSelector = selector
            if (el.id) {
              uniqueSelector = `#${el.id}`
            } else if (el.className) {
              const classes = el.className.split(' ').filter(c => c).join('.')
              if (classes) uniqueSelector = `${el.tagName.toLowerCase()}.${classes}`
            }

            elements.push({
              tag: el.tagName.toLowerCase(),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              name: text.trim(),
              selector: uniqueSelector,
              type: el.type || null,
            })
          }
        }

        return elements
      }

      return getInteractiveElements()
    })

    // 重置 ref 计数器
    this.refCounter = 0
    this.refMap.clear()

    // 生成 YAML 格式
    let yaml = ''
    for (const el of elements) {
      this.refCounter++
      const ref = `e${this.refCounter}`
      this.refMap.set(ref, el.selector)

      const name = el.name ? ` "${el.name}"` : ''
      const type = el.type ? ` (${el.type})` : ''
      yaml += `- ${el.role}${name}${type} [${ref}]\n`
    }

    return {
      yaml,
      refMap: this.refMap,
      url: page.url(),
      title: await page.title(),
    }
  }

  /**
   * 通过 ref 点击元素
   * @param {Page} page - Playwright Page 对象
   * @param {string} ref - 元素 ref（例如 "e2"）
   * @returns {Promise<void>}
   */
  async clickByRef(page, ref) {
    const selector = this.refMap.get(ref)

    if (!selector) {
      throw new Error(`Ref "${ref}" not found in snapshot`)
    }

    await page.click(selector)
  }

  /**
   * 通过 ref 填写文本
   * @param {Page} page - Playwright Page 对象
   * @param {string} ref - 元素 ref
   * @param {string} text - 要填写的文本
   * @returns {Promise<void>}
   */
  async fillByRef(page, ref, text) {
    const selector = this.refMap.get(ref)

    if (!selector) {
      throw new Error(`Ref "${ref}" not found in snapshot`)
    }

    await page.fill(selector, text)
  }
}
