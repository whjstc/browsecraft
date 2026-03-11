import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { workflow } from '../src/commands/workflow.js'

function withCapturedConsole(fn) {
  const logs = []
  const originalLog = console.log
  console.log = (...args) => {
    logs.push(args.join(' '))
  }

  return Promise.resolve()
    .then(fn)
    .then((result) => ({ logs, result }))
    .finally(() => {
      console.log = originalLog
    })
}

test('workflow validate accepts templated yaml and prints summary', async () => {
  const base = mkdtempSync(join(tmpdir(), 'browsecraft-workflow-'))
  const file = join(base, 'demo.yml')
  const prevCwd = process.cwd()

  writeFileSync(file, [
    'name: Demo Workflow',
    'vars:',
    '  keyword: founder',
    'steps:',
    '  - action: open',
    '    url: https://example.com?q={{keyword}}',
    '  - action: wait-for',
    '    selector: main',
  ].join('\n') + '\n')

  try {
    process.chdir(base)
    const { logs } = await withCapturedConsole(() => workflow(['validate', 'demo.yml'], {}))
    assert.ok(logs.some((line) => line.includes('Workflow valid: Demo Workflow (2 steps)')))
  } finally {
    process.chdir(prevCwd)
    rmSync(base, { recursive: true, force: true })
  }
})

test('workflow dry-run resolves variables from CLI args', async () => {
  const base = mkdtempSync(join(tmpdir(), 'browsecraft-workflow-'))
  const file = join(base, 'demo.yml')
  const prevCwd = process.cwd()

  writeFileSync(file, [
    'steps:',
    '  - name: Open Search',
    '    action: open',
    '    url: https://example.com?q={{keyword}}',
    '  - action: fill',
    '    selector: input[name=q]',
    '    value: "{{keyword}}"',
  ].join('\n') + '\n')

  try {
    process.chdir(base)
    const { logs } = await withCapturedConsole(() => workflow(['dry-run', 'demo.yml', 'keyword=sales'], {}))
    assert.ok(logs.includes('[1] Open Search -> open'))
    assert.ok(logs.includes('[2] fill -> fill'))
  } finally {
    process.chdir(prevCwd)
    rmSync(base, { recursive: true, force: true })
  }
})
