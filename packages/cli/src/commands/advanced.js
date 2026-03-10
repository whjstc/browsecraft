/**
 * 更多交互命令 - hover/press/dblclick/focus/scroll/upload/drag/check/uncheck
 */

import { withPage } from './base.js'

/**
 * 悬停
 */
export async function hover(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft hover <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.hover(selector)
  console.log(`Hovered: ${selector}`)
}

/**
 * 按键
 */
export async function press(args, options) {
  const key = args[0]
  if (!key) {
    throw new Error('Usage: browsecraft press <key>')
  }

  const { actions } = await withPage(options.local)
  await actions.press(key)
  console.log(`Pressed: ${key}`)
}

/**
 * 双击
 */
export async function dblclick(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft dblclick <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.dblclick(selector)
  console.log(`Double-clicked: ${selector}`)
}

/**
 * 聚焦
 */
export async function focus(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft focus <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.focus(selector)
  console.log(`Focused: ${selector}`)
}

/**
 * 滚动
 */
export async function scroll(args, options) {
  const selectorOrDirection = args[0] || 'down'
  const amount = parseInt(args[1]) || 500

  const { actions } = await withPage(options.local)

  // 如果是方向
  if (['up', 'down', 'left', 'right'].includes(selectorOrDirection)) {
    await actions.scroll({ direction: selectorOrDirection, amount })
    console.log(`Scrolled ${selectorOrDirection} ${amount}px`)
  } else {
    // 当做选择器，滚动到视图
    await actions.scrollIntoView(selectorOrDirection)
    console.log(`Scrolled into view: ${selectorOrDirection}`)
  }
}

/**
 * 上传文件
 */
export async function upload(args, options) {
  const selector = args[0]
  const files = args.slice(1)

  if (!selector || files.length === 0) {
    throw new Error('Usage: browsecraft upload <selector> <file1> [file2...]')
  }

  const { actions } = await withPage(options.local)
  await actions.upload(selector, files.length === 1 ? files[0] : files)
  console.log(`Uploaded ${files.length} file(s) to ${selector}`)
}

/**
 * 拖拽
 */
export async function drag(args, options) {
  const source = args[0]
  const target = args[1]

  if (!source || !target) {
    throw new Error('Usage: browsecraft drag <source-selector> <target-selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.drag(source, target)
  console.log(`Dragged: ${source} → ${target}`)
}

/**
 * 勾选复选框
 */
export async function check(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft check <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.check(selector)
  console.log(`Checked: ${selector}`)
}

/**
 * 取消勾选
 */
export async function uncheck(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft uncheck <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.uncheck(selector)
  console.log(`Unchecked: ${selector}`)
}

/**
 * 高亮元素
 */
export async function highlight(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft highlight <selector>')
  }

  const { actions } = await withPage(options.local)
  await actions.highlight(selector)
  console.log(`Highlighted: ${selector}`)
}
