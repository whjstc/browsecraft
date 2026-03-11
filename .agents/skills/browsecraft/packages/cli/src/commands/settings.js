/**
 * 设置和存储命令 - set viewport/cookies/storage
 */

import { withPage } from './base.js'

/**
 * 设置视口大小
 */
export async function setViewport(args, options) {
  const width = parseInt(args[0])
  const height = parseInt(args[1])

  if (!width || !height) {
    throw new Error('Usage: browsecraft set-viewport <width> <height>')
  }

  const { actions } = await withPage(options.local)
  await actions.setViewport(width, height)
  console.log(`Viewport set to ${width}x${height}`)
}

/**
 * 获取 cookies
 */
export async function getCookies(args, options) {
  const { actions } = await withPage(options.local)
  const result = await actions.getCookies()
  console.log(JSON.stringify(result.cookies, null, 2))
}

/**
 * 清除 cookies
 */
export async function clearCookies(args, options) {
  const { actions } = await withPage(options.local)
  await actions.clearCookies()
  console.log('Cookies cleared')
}

/**
 * 获取 localStorage
 */
export async function getStorage(args, options) {
  const key = args[0]
  if (!key) {
    throw new Error('Usage: browsecraft get-storage <key>')
  }

  const { actions } = await withPage(options.local)
  const result = await actions.getStorage(key)
  console.log(result.value)
}

/**
 * 设置 localStorage
 */
export async function setStorage(args, options) {
  const key = args[0]
  const value = args.slice(1).join(' ')

  if (!key || !value) {
    throw new Error('Usage: browsecraft set-storage <key> <value>')
  }

  const { actions } = await withPage(options.local)
  await actions.setStorage(key, value)
  console.log(`Storage set: ${key}`)
}

/**
 * 导出 PDF
 */
export async function pdf(args, options) {
  const path = args[0] || `page-${Date.now()}.pdf`

  const { actions } = await withPage(options.local)
  await actions.pdf(path)
  console.log(`PDF saved: ${path}`)
}
