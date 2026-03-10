/**
 * 导航命令 - open/back/forward/reload
 */

import { withPage } from './base.js'

/**
 * 打开 URL
 */
export async function open(args, options) {
  const url = args[0]
  if (!url) {
    throw new Error('Usage: browsecraft open <url>')
  }

  // 自动补全协议
  const fullUrl = url.startsWith('http') ? url : `https://${url}`

  const { actions } = await withPage(options.local)
  const result = await actions.navigate(fullUrl)
  console.log(`${result.title}`)
  console.log(`${result.url}`)
}

/**
 * 后退
 */
export async function back(args, options) {
  const { page } = await withPage(options.local)
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 })
  console.log(`${await page.title()}`)
  console.log(`${page.url()}`)
}

/**
 * 前进
 */
export async function forward(args, options) {
  const { page } = await withPage(options.local)
  await page.goForward({ waitUntil: 'domcontentloaded', timeout: 10000 })
  console.log(`${await page.title()}`)
  console.log(`${page.url()}`)
}

/**
 * 刷新
 */
export async function reload(args, options) {
  const { page } = await withPage(options.local)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })
  console.log(`${await page.title()}`)
  console.log(`${page.url()}`)
}
