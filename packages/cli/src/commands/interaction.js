/**
 * 交互命令 - click/fill/type/select
 */

import { withPage } from './base.js'

/**
 * 点击元素
 */
export async function click(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft click <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.click(selector)
  console.log(`Clicked: ${selector}`)
}

/**
 * 填写文本
 */
export async function fill(args, options) {
  const selector = args[0]
  const text = args.slice(1).join(' ')

  if (!selector || !text) {
    throw new Error('Usage: browsecraft fill <selector> <text>')
  }

  const { actions } = await withPage(options.local)
  await actions.fill(selector, text)
  console.log(`Filled: ${selector}`)
}

/**
 * 逐字符输入
 */
export async function type(args, options) {
  const selector = args[0]
  const text = args.slice(1).join(' ')

  if (!selector || !text) {
    throw new Error('Usage: browsecraft type <selector> <text>')
  }

  const { actions } = await withPage(options.local)
  await actions.type(selector, text)
  console.log(`Typed: ${selector}`)
}

/**
 * 选择下拉选项
 */
export async function select(args, options) {
  const selector = args[0]
  const value = args[1]

  if (!selector || !value) {
    throw new Error('Usage: browsecraft select <selector> <value>')
  }

  const { actions } = await withPage(options.local)
  await actions.select(selector, value)
  console.log(`Selected: ${selector} = ${value}`)
}
