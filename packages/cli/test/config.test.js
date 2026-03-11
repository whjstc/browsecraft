import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadConfig, parseEnvContent } from '../src/config.js'

test('parseEnvContent supports export, quotes and inline comments', () => {
  const parsed = parseEnvContent(`
# comment
export ROXY_API=http://127.0.0.1:50000
ROXY_TOKEN="abc 123"
ROXY_WORKSPACE_ID=workspace-1 # inline comment
ROXY_WINDOW_ID='window-1'
INVALID_LINE
`)

  assert.equal(parsed.ROXY_API, 'http://127.0.0.1:50000')
  assert.equal(parsed.ROXY_TOKEN, 'abc 123')
  assert.equal(parsed.ROXY_WORKSPACE_ID, 'workspace-1')
  assert.equal(parsed.ROXY_WINDOW_ID, 'window-1')
  assert.equal(parsed.INVALID_LINE, undefined)
})

test('loadConfig applies precedence: shell env > local env > global env > config json', async () => {
  const root = mkdtempSync(join(tmpdir(), 'browsecraft-config-'))
  const projectDir = join(root, 'project')
  const localDir = join(projectDir, '.browsecraft')
  const homeDir = join(root, 'home')
  const globalDir = join(homeDir, '.browsecraft')

  mkdirSync(localDir, { recursive: true })
  mkdirSync(globalDir, { recursive: true })

  writeFileSync(join(localDir, '.env'), [
    'ROXY_API=http://local.example:50000',
    'ROXY_TOKEN=local-token',
    'ROXY_WORKSPACE_ID=local-workspace',
  ].join('\n') + '\n')

  writeFileSync(join(globalDir, '.env'), [
    'ROXY_API=http://global.example:50000',
    'ROXY_TOKEN=global-token',
    'ROXY_WORKSPACE_ID=global-workspace',
    'ROXY_WINDOW_ID=global-window',
  ].join('\n') + '\n')

  writeFileSync(join(globalDir, 'config.json'), JSON.stringify({
    ROXY_API: 'http://config.example:50000',
    ROXY_TOKEN: 'config-token',
    ROXY_WORKSPACE_ID: 'config-workspace',
    ROXY_WINDOW_ID: 'config-window',
  }))

  const keys = ['ROXY_API', 'ROXY_TOKEN', 'ROXY_WORKSPACE_ID', 'ROXY_WINDOW_ID']
  const original = Object.fromEntries(keys.map((k) => [k, process.env[k]]))

  try {
    for (const key of keys) delete process.env[key]
    process.env.ROXY_TOKEN = 'shell-token'

    await loadConfig({ cwd: projectDir, homeDir })

    assert.equal(process.env.ROXY_API, 'http://local.example:50000')
    assert.equal(process.env.ROXY_TOKEN, 'shell-token')
    assert.equal(process.env.ROXY_WORKSPACE_ID, 'local-workspace')
    assert.equal(process.env.ROXY_WINDOW_ID, 'global-window')
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    }
    rmSync(root, { recursive: true, force: true })
  }
})
