import test from 'node:test'
import assert from 'node:assert/strict'
import { flattenFrames, getFrameByIndex } from '../src/commands/frame-utils.js'

function createFrame({ name, url, children = [] }) {
  return {
    name: () => name || '',
    url: () => url || '',
    childFrames: () => children,
  }
}

test('flattenFrames returns breadth-first order with depth', () => {
  const child1 = createFrame({ name: 'child1', url: 'https://a/1' })
  const child2 = createFrame({ name: 'child2', url: 'https://a/2' })
  const root = createFrame({ name: 'root', url: 'https://a', children: [child1, child2] })

  const items = flattenFrames(root)
  assert.equal(items.length, 3)
  assert.equal(items[0].name, 'root')
  assert.equal(items[0].depth, 0)
  assert.equal(items[1].name, 'child1')
  assert.equal(items[1].depth, 1)
  assert.equal(items[2].name, 'child2')
  assert.equal(items[2].depth, 1)
})

test('getFrameByIndex returns matched frame entry', () => {
  const child = createFrame({ name: 'child', url: 'https://a/child' })
  const root = createFrame({ name: 'root', url: 'https://a', children: [child] })
  const page = { mainFrame: () => root }

  const result = getFrameByIndex(page, 1)
  assert.equal(result.item?.name, 'child')
  assert.equal(result.item?.url, 'https://a/child')
})
