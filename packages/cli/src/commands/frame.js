/**
 * Frame 管理命令 - frame list/switch/clear
 */

import { withPage } from './base.js'
import { loadState, saveState } from '../state.js'

function flattenFrames(rootFrame) {
  const result = []
  const queue = [{ frame: rootFrame, depth: 0, parent: null }]

  while (queue.length > 0) {
    const current = queue.shift()
    const name = current.frame.name() || '(no-name)'
    result.push({
      frame: current.frame,
      depth: current.depth,
      parent: current.parent,
      name,
      url: current.frame.url() || 'about:blank',
    })

    for (const child of current.frame.childFrames()) {
      queue.push({ frame: child, depth: current.depth + 1, parent: name })
    }
  }

  return result
}

export async function frame(args, options) {
  const sub = args[0]
  const subArgs = args.slice(1)

  switch (sub) {
    case 'list':
      return listFrames(subArgs, options)
    case 'switch':
      return switchFrame(subArgs, options)
    case 'clear':
      return clearFrame(subArgs, options)
    default:
      throw new Error('Usage: browsecraft frame <list|switch|clear> [args...]')
  }
}

async function listFrames(args, options) {
  const { page } = await withPage(options.local)
  const frames = flattenFrames(page.mainFrame())
  const state = await loadState(options.local)
  const active = Number.isInteger(state?.activeFrameIndex) ? state.activeFrameIndex : null

  frames.forEach((item, index) => {
    const mark = active === index ? '*' : ' '
    const indent = '  '.repeat(item.depth)
    console.log(`${mark} [${index}] ${indent}${item.name} ${item.url}`)
  })

  return frames.map((item, index) => ({
    index,
    depth: item.depth,
    name: item.name,
    url: item.url,
    active: active === index,
  }))
}

async function switchFrame(args, options) {
  const index = Number.parseInt(args[0], 10)
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Usage: browsecraft frame switch <index>')
  }

  const { page } = await withPage(options.local)
  const frames = flattenFrames(page.mainFrame())
  if (!frames[index]) {
    throw new Error(`Frame ${index} not found`)
  }

  const state = await loadState(options.local)
  await saveState({
    ...state,
    activeFrameIndex: index,
    updatedAt: new Date().toISOString(),
  }, options.local)

  console.log(`Switched active frame to [${index}] ${frames[index].url}`)
  return { activeFrameIndex: index, url: frames[index].url, name: frames[index].name }
}

async function clearFrame(args, options) {
  const state = await loadState(options.local)
  await saveState({
    ...state,
    activeFrameIndex: null,
    updatedAt: new Date().toISOString(),
  }, options.local)

  console.log('Active frame cleared (back to main frame)')
  return { activeFrameIndex: null }
}
