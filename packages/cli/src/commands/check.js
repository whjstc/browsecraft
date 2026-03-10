/**
 * 检查命令 - exists/visible/assert
 * 退出码: 0=pass, 1=fail, 2=error
 */

import { withPage } from './base.js'

/**
 * 检查元素是否存在
 */
export async function exists(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft exists <selector>')
  }

  const { page } = await withPage(options.local)

  try {
    const count = await page.locator(selector).count()
    if (count > 0) {
      console.log(`true`)
      process.exit(0)
    } else {
      console.log(`false`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(2)
  }
}

/**
 * 检查元素是否可见
 */
export async function visible(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft visible <selector>')
  }

  const { page } = await withPage(options.local)

  try {
    const isVisible = await page.locator(selector).first().isVisible({ timeout: 1000 })
    if (isVisible) {
      console.log(`true`)
      process.exit(0)
    } else {
      console.log(`false`)
      process.exit(1)
    }
  } catch {
    console.log(`false`)
    process.exit(1)
  }
}

/**
 * 断言 JavaScript 表达式
 */
export async function assert(args, options) {
  const expression = args[0]
  const expected = args[1]

  if (!expression) {
    throw new Error('Usage: browsecraft assert <js-expression> [expected]')
  }

  const { page } = await withPage(options.local)

  try {
    const result = await page.evaluate(expression)

    if (expected !== undefined) {
      // 比较结果
      const match = String(result) === expected
      console.log(match ? 'true' : 'false')
      process.exit(match ? 0 : 1)
    } else {
      // 检查真值
      if (result) {
        console.log(`true`)
        process.exit(0)
      } else {
        console.log(`false`)
        process.exit(1)
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(2)
  }
}
