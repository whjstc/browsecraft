/**
 * Frame utilities
 */

export function flattenFrames(rootFrame) {
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

export function getFrameByIndex(page, index) {
  const frames = flattenFrames(page.mainFrame())
  return {
    frames,
    item: Number.isInteger(index) ? frames[index] || null : null,
  }
}
