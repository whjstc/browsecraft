/**
 * 工具命令 - screenshot/js/info/wait/dismiss-cookies
 */

import { withPage } from './base.js'

/**
 * 截图
 */
export async function screenshot(args, options) {
  const filePath = args[0] || `screenshot-${Date.now()}.png`

  const { actions } = await withPage(options.local)
  await actions.screenshot(filePath)
  console.log(`Saved: ${filePath}`)
}

/**
 * 执行 JavaScript
 */
export async function js(args, options) {
  const expression = args.join(' ')
  if (!expression) {
    throw new Error('Usage: browsecraft js <expression>')
  }

  const { page } = await withPage(options.local)
  const result = await page.evaluate(expression)

  if (result !== undefined && result !== null) {
    console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))
  }
}

/**
 * 获取页面信息
 */
export async function info(args, options) {
  const { page } = await withPage(options.local)

  console.log(`Title: ${await page.title()}`)
  console.log(`URL: ${page.url()}`)
}

/**
 * 等待元素出现
 */
export async function waitFor(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft wait-for <selector>')
  }

  const { page } = await withPage(options.local)
  await page.locator(selector).waitFor({ state: 'visible', timeout: options.timeout || 30000 })
  console.log(`Found: ${selector}`)
}

/**
 * 关闭 Cookie 弹窗
 */
export async function dismissCookies(args, options) {
  const { actions } = await withPage(options.local)
  const result = await actions.dismissCookies()
  console.log(result.dismissed ? 'Cookie banner dismissed' : 'No cookie banner found')
}

/**
 * 获取元素文本
 */
export async function getText(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft text <selector>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getText(selector)
  console.log(result.text)
}
