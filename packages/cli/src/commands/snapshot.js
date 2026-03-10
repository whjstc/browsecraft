/**
 * 快照命令 - snapshot/click-ref/fill-ref
 */

import { withPage } from './base.js'
import { saveState, loadState } from '../state.js'

/**
 * 捕获无障碍快照
 */
export async function snapshot(args, options) {
  const { page, snapshot: snapshotManager } = await withPage(options.local)
  const interestingOnly = args.includes('-i') || args.includes('--interactive')
  const compact = args.includes('-c') || args.includes('--compact')
  const depthArgIndex = args.findIndex(a => a === '-d' || a === '--depth')
  const maxDepth = depthArgIndex >= 0 ? Number.parseInt(args[depthArgIndex + 1], 10) : 8

  const result = await snapshotManager.capture(page, {
    interestingOnly,
    compact,
    maxDepth: Number.isFinite(maxDepth) && maxDepth > 0 ? maxDepth : 8,
  })

  // 保存 refMap 到状态（用于后续 click-ref）
  const state = await loadState(options.local)
  state.lastSnapshot = {
    refMap: Array.from(result.refMap.entries()),
    capturedAt: new Date().toISOString(),
  }
  await saveState(state, options.local)

  console.log(result.yaml.trimEnd())
}

/**
 * 通过 ref 点击
 */
export async function clickRef(args, options) {
  const ref = args[0]
  if (!ref) {
    throw new Error('Usage: browsecraft click-ref <ref>')
  }

  const { page } = await withPage(options.local)

  // 从状态恢复 refMap
  const state = await loadState(options.local)
  if (!state.lastSnapshot) {
    throw new Error('No snapshot found. Run: browsecraft snapshot')
  }

  const refMap = new Map(state.lastSnapshot.refMap)
  const selector = refMap.get(ref)

  if (!selector) {
    throw new Error(`Ref "${ref}" not found in snapshot`)
  }

  await page.click(selector)
  console.log(`Clicked: ${ref} (${selector})`)
}

/**
 * 通过 ref 填写文本
 */
export async function fillRef(args, options) {
  const ref = args[0]
  const text = args.slice(1).join(' ')

  if (!ref || !text) {
    throw new Error('Usage: browsecraft fill-ref <ref> <text>')
  }

  const { page } = await withPage(options.local)

  // 从状态恢复 refMap
  const state = await loadState(options.local)
  if (!state.lastSnapshot) {
    throw new Error('No snapshot found. Run: browsecraft snapshot')
  }

  const refMap = new Map(state.lastSnapshot.refMap)
  const selector = refMap.get(ref)

  if (!selector) {
    throw new Error(`Ref "${ref}" not found in snapshot`)
  }

  await page.fill(selector, text)
  console.log(`Filled: ${ref} (${selector})`)
}
