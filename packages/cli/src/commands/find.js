/**
 * 语义定位命令 - find role/text/label/placeholder
 */

import { withPage } from './base.js'

/**
 * 按角色查找
 */
export async function findRole(args, options) {
  const role = args[0]
  const name = args.slice(1).join(' ') || undefined

  if (!role) {
    throw new Error('Usage: browsecraft find-role <role> [name]')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.findByRole(role, { name })

  if (result.count === 0) {
    console.log(`No elements found with role "${role}"${name ? ` and name "${name}"` : ''}`)
    process.exit(1)
  }

  // 获取匹配元素信息
  const locator = result.locator
  const texts = []
  for (let i = 0; i < Math.min(result.count, 10); i++) {
    const text = await locator.nth(i).textContent()
    texts.push(text?.trim() || '')
  }

  console.log(`Found ${result.count} element(s):`)
  texts.forEach((t, i) => console.log(`  ${i + 1}. ${t || '(empty)'}`))
}

/**
 * 按文本查找
 */
export async function findText(args, options) {
  const text = args.join(' ')
  if (!text) {
    throw new Error('Usage: browsecraft find-text <text>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.findByText(text)
  console.log(`Found ${result.count} element(s) matching "${text}"`)
}

/**
 * 按标签查找
 */
export async function findLabel(args, options) {
  const label = args.join(' ')
  if (!label) {
    throw new Error('Usage: browsecraft find-label <label>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.findByLabel(label)
  console.log(`Found ${result.count} element(s) with label "${label}"`)
}

/**
 * 按占位符查找
 */
export async function findPlaceholder(args, options) {
  const placeholder = args.join(' ')
  if (!placeholder) {
    throw new Error('Usage: browsecraft find-placeholder <placeholder>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.findByPlaceholder(placeholder)
  console.log(`Found ${result.count} element(s) with placeholder "${placeholder}"`)
}

/**
 * 按角色点击
 */
export async function clickRole(args, options) {
  const role = args[0]
  const name = args.slice(1).join(' ') || undefined

  if (!role) {
    throw new Error('Usage: browsecraft click-role <role> [name]')
  }

  const { page } = await withPage(options.local)
  await page.getByRole(role, name ? { name } : undefined).click()
  console.log(`Clicked: role=${role}${name ? ` name="${name}"` : ''}`)
}

/**
 * 按文本点击
 */
export async function clickText(args, options) {
  const text = args.join(' ')
  if (!text) {
    throw new Error('Usage: browsecraft click-text <text>')
  }

  const { page } = await withPage(options.local)
  await page.getByText(text).click()
  console.log(`Clicked: text="${text}"`)
}

/**
 * 按标签填写
 */
export async function fillLabel(args, options) {
  const label = args[0]
  const text = args.slice(1).join(' ')

  if (!label || !text) {
    throw new Error('Usage: browsecraft fill-label <label> <text>')
  }

  const { page } = await withPage(options.local)
  await page.getByLabel(label).fill(text)
  console.log(`Filled: label="${label}"`)
}
