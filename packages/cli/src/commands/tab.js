/**
 * Tab 管理命令 - tab list/new/switch/close
 */

import { withPage } from './base.js'
import { loadState, saveState } from '../state.js'

export async function tab(args, options) {
  const sub = args[0]
  const subArgs = args.slice(1)

  switch (sub) {
    case 'list':
      return tabList(subArgs, options)
    case 'new':
      return tabNew(subArgs, options)
    case 'switch':
      return tabSwitch(subArgs, options)
    case 'close':
      return tabClose(subArgs, options)
    default:
      throw new Error('Usage: browsecraft tab <list|new|switch|close> [args...]')
  }
}

async function tabList(args, options) {
  const { page } = await withPage(options.local)
  const pages = page.context().pages()
  const state = await loadState(options.local)
  const activeTabIndex = Number.isInteger(state?.activeTabIndex) ? state.activeTabIndex : 0

  pages.forEach((tabPage, index) => {
    const marker = index === activeTabIndex ? '*' : ' '
    const title = tabPage.url() === 'about:blank' ? '(blank)' : (tabPage.url() || '(unknown)')
    console.log(`${marker} [${index + 1}] ${title}`)
  })
}

async function tabNew(args, options) {
  const url = args[0]
  const { page } = await withPage(options.local)
  const context = page.context()
  const newPage = await context.newPage()

  if (url) {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    await newPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }

  const pages = context.pages()
  const activeTabIndex = pages.indexOf(newPage)

  const state = await loadState(options.local)
  await saveState({
    ...state,
    activeTabIndex,
    activeFrameIndex: null,
    updatedAt: new Date().toISOString(),
  }, options.local)

  console.log(`Opened tab [${activeTabIndex + 1}] ${newPage.url()}`)
}

async function tabSwitch(args, options) {
  const index = Number.parseInt(args[0], 10)
  if (!Number.isInteger(index) || index < 1) {
    throw new Error('Usage: browsecraft tab switch <index>')
  }

  const { page } = await withPage(options.local)
  const pages = page.context().pages()
  if (!pages[index - 1]) {
    throw new Error(`Tab ${index} not found`)
  }

  const state = await loadState(options.local)
  await saveState({
    ...state,
    activeTabIndex: index - 1,
    activeFrameIndex: null,
    updatedAt: new Date().toISOString(),
  }, options.local)

  const target = pages[index - 1]
  console.log(`Switched to [${index}] ${target.url()}`)
}

async function tabClose(args, options) {
  const requestedIndex = args[0] ? Number.parseInt(args[0], 10) : null
  if (args[0] && (!Number.isInteger(requestedIndex) || requestedIndex < 1)) {
    throw new Error('Usage: browsecraft tab close [index]')
  }

  const { page } = await withPage(options.local)
  const context = page.context()
  const pages = context.pages()
  const state = await loadState(options.local)
  const currentIndex = Number.isInteger(state?.activeTabIndex) ? state.activeTabIndex : 0
  const targetIndex = requestedIndex ? requestedIndex - 1 : currentIndex

  const targetPage = pages[targetIndex]
  if (!targetPage) {
    throw new Error(`Tab ${requestedIndex || targetIndex + 1} not found`)
  }

  await targetPage.close()

  let remaining = context.pages()
  if (remaining.length === 0) {
    remaining = [await context.newPage()]
  }

  const nextActiveTabIndex = Math.max(0, Math.min(targetIndex, remaining.length - 1))
  await saveState({
    ...state,
    activeTabIndex: nextActiveTabIndex,
    activeFrameIndex: null,
    updatedAt: new Date().toISOString(),
  }, options.local)

  console.log(`Closed tab [${targetIndex + 1}]`)
}
