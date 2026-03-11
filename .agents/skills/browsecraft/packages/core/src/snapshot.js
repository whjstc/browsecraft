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
   * @param {boolean} options.compact - 紧凑输出（默认 false）
   * @param {number} options.maxDepth - 最大 DOM 深度（默认 8）
   * @returns {Promise<{yaml: string, refMap: Map}>}
   */
  async capture(page, options = {}) {
    const { interestingOnly = true, compact = false, maxDepth = 8 } = options

    // 使用 evaluate 获取可交互元素（兼容 CDP 连接）
    const elements = await page.evaluate(({ interestingOnly, maxDepth }) => {
      function getSnapshotElements() {
        const elements = []
        const queue = [{ node: document.body, depth: 0 }]
        const isInteractiveElement = (el) => {
          const tag = el.tagName?.toLowerCase()
          if (!tag) return false
          const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'summary']
          if (interactiveTags.includes(tag)) return true
          const role = el.getAttribute('role')
          if (role && ['button', 'link', 'textbox', 'checkbox', 'radio', 'tab', 'menuitem'].includes(role)) {
            return true
          }
          return !!(el.onclick || el.hasAttribute('contenteditable'))
        }

        while (queue.length > 0) {
          const { node, depth } = queue.shift()
          if (!node || depth > maxDepth) continue
          if (node !== document.body) {
            const el = /** @type {HTMLElement} */ (node)
            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue

            if (interestingOnly && !isInteractiveElement(el)) {
              // skip
            } else {
            const text = el.getAttribute('aria-label') ||
                         el.title ||
                         el.innerText?.slice(0, 100) ||
                         el.value ||
                         el.placeholder ||
                         ''

            // 生成唯一 selector
            let uniqueSelector = el.tagName.toLowerCase()
            if (el.id) {
              uniqueSelector = `#${el.id}`
            } else if (el.className) {
              const classes = String(el.className).split(' ').filter(c => c).slice(0, 3).join('.')
              if (classes) uniqueSelector = `${el.tagName.toLowerCase()}.${classes}`
            }

            elements.push({
              tag: el.tagName.toLowerCase(),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              name: text.trim(),
              selector: uniqueSelector,
              type: el.type || null,
              depth,
            })
            }
          }

          if (node.children && node.children.length > 0) {
            for (const child of node.children) {
              queue.push({ node: child, depth: depth + 1 })
            }
          }
        }

        return elements
      }

      return getSnapshotElements()
    }, { interestingOnly, maxDepth })

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
      if (compact) {
        yaml += `- ${el.role} [${ref}] ${el.selector}\n`
      } else {
        yaml += `- ${el.role}${name}${type} [${ref}] (d=${el.depth})\n`
      }
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
