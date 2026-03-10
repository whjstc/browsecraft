/**
 * 工具函数 - 重试、等待、Cookie 处理
 */

/**
 * 带指数退避的重试机制
 * @param {Function} fn - 要执行的异步函数
 * @param {Object} options - 配置选项
 * @param {number} options.retries - 重试次数（默认 3）
 * @param {number} options.baseDelay - 基础延迟（默认 500ms）
 * @param {number} options.maxDelay - 最大延迟（默认 15000ms）
 * @returns {Promise<any>} 函数执行结果
 */
export async function retryWithBackoff(fn, options = {}) {
  const { retries = 3, baseDelay = 500, maxDelay = 15000 } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) {
        throw error
      }

      // 指数退避 + 随机抖动
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      const jitter = delay * (0.75 + Math.random() * 0.5)

      await new Promise(res => setTimeout(res, jitter))
    }
  }
}

/**
 * 智能等待策略
 * @param {Page} page - Playwright Page 对象
 * @param {Object} options - 等待选项
 * @param {string} options.selector - 元素选择器
 * @param {string} options.state - 等待状态 (visible|hidden|attached|detached)
 * @param {number} options.timeout - 超时时间（默认 30000ms）
 * @returns {Promise<void>}
 */
export async function smartWait(page, options = {}) {
  const { selector, state = 'visible', timeout = 30000 } = options

  if (selector) {
    await page.locator(selector).waitFor({ state, timeout })
  } else {
    // 等待网络空闲
    await page.waitForLoadState('networkidle', { timeout })
  }
}

/**
 * 处理 Cookie 同意弹窗
 * @param {Page} page - Playwright Page 对象
 * @returns {Promise<boolean>} 是否成功关闭弹窗
 */
export async function dismissCookieBanner(page) {
  const selectors = [
    // 英文
    'button[aria-label*="accept" i]',
    'button[aria-label*="agree" i]',
    'button:has-text(/accept|agree|allow/i)',
    'a:has-text(/accept|agree|allow/i)',
    '.cc-btn-accept',
    '.cookie-accept',
    '#accept-cookies',
    // 中文
    'button:has-text(/接受|同意|允许/)',
    'a:has-text(/接受|同意|允许/)',
    // 通用 class
    '[class*="cookie"][class*="accept"]',
    '[class*="consent"][class*="accept"]',
    '[id*="cookie"][id*="accept"]',
  ]

  for (const selector of selectors) {
    try {
      const button = await page.locator(selector).first()
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click()
        return true
      }
    } catch {
      // 继续尝试下一个选择器
    }
  }

  return false
}

/**
 * 安全执行 JavaScript（带错误处理）
 * @param {Page} page - Playwright Page 对象
 * @param {string|Function} code - 要执行的代码
 * @returns {Promise<any>} 执行结果
 */
export async function safeEvaluate(page, code) {
  try {
    return await page.evaluate(code)
  } catch (error) {
    throw new Error(`JavaScript execution failed: ${error.message}`)
  }
}

/**
 * 等待元素稳定（不再移动）
 * @param {Page} page - Playwright Page 对象
 * @param {string} selector - 元素选择器
 * @param {number} stableTime - 稳定时间（默认 500ms）
 * @returns {Promise<void>}
 */
export async function waitForStable(page, selector, stableTime = 500) {
  const locator = page.locator(selector).first()
  await locator.waitFor({ state: 'visible' })

  let lastBox = await locator.boundingBox()
  const startTime = Date.now()

  while (Date.now() - startTime < stableTime) {
    await page.waitForTimeout(100)
    const currentBox = await locator.boundingBox()

    if (!currentBox || !lastBox) {
      lastBox = currentBox
      continue
    }

    // 检查位置是否变化
    if (
      Math.abs(currentBox.x - lastBox.x) > 1 ||
      Math.abs(currentBox.y - lastBox.y) > 1
    ) {
      lastBox = currentBox
      continue
    }

    return // 元素已稳定
  }
}
