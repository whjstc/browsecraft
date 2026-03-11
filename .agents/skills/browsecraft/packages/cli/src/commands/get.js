/**
 * 获取信息命令 - get text/html/value/attr/count/box
 */

import { withPage } from './base.js'

/**
 * 获取元素 HTML
 */
export async function getHtml(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft get-html <selector>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getHtml(selector, { outer: options.outer })
  console.log(result.html)
}

/**
 * 获取表单值
 */
export async function getValue(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft get-value <selector>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getValue(selector)
  console.log(result.value)
}

/**
 * 获取元素属性
 */
export async function getAttr(args, options) {
  const selector = args[0]
  const attribute = args[1]
  if (!selector || !attribute) {
    throw new Error('Usage: browsecraft get-attr <selector> <attribute>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getAttr(selector, attribute)
  console.log(result.value)
}

/**
 * 获取匹配元素数量
 */
export async function getCount(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft get-count <selector>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getCount(selector)
  console.log(result.count)
}

/**
 * 获取元素边界框
 */
export async function getBox(args, options) {
  const selector = args[0]
  if (!selector) {
    throw new Error('Usage: browsecraft get-box <selector>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getBox(selector)
  if (result.box) {
    console.log(`x:${result.box.x} y:${result.box.y} w:${result.box.width} h:${result.box.height}`)
  } else {
    console.log('Element not visible')
  }
}

/**
 * 获取页面标题
 */
export async function getTitle(args, options) {
  const { page } = await withPage(options.local)
  console.log(await page.title())
}

/**
 * 获取页面 URL
 */
export async function getUrl(args, options) {
  const { page } = await withPage(options.local)
  console.log(page.url())
}
