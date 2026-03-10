/**
 * 配置管理命令 - config set/get/show/delete
 */

import { readConfigFile, writeConfigFile, CONFIG_KEYS } from '../config.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const GLOBAL_DIR = join(homedir(), '.browsecraft')
const GLOBAL_ENV_FILE = join(GLOBAL_DIR, '.env')
const LOCAL_ENV_FILE = join(process.cwd(), '.browsecraft', '.env')

export async function config(args, options) {
  const sub = args[0]

  switch (sub) {
    case 'set':   return configSet(args.slice(1))
    case 'get':   return configGet(args.slice(1))
    case 'delete':
    case 'unset': return configDelete(args.slice(1))
    case 'show':
    default:      return configShow()
  }
}

/**
 * browsecraft config set KEY VALUE
 * 写入 ~/.browsecraft/config.json
 */
function configSet(args) {
  const [key, value] = args
  if (!key || value === undefined) {
    throw new Error('Usage: browsecraft config set <KEY> <VALUE>')
  }

  const cfg = readConfigFile()
  cfg[key] = value
  writeConfigFile(cfg)
  console.log(`Set ${key} in ~/.browsecraft/config.json`)
}

/**
 * browsecraft config get KEY
 * 读取当前生效的值（已经 loadConfig() 合并到 process.env）
 */
function configGet(args) {
  const [key] = args
  if (!key) throw new Error('Usage: browsecraft config get <KEY>')

  const value = process.env[key]
  if (value === undefined) {
    console.log(`${key} is not set`)
    process.exitCode = 1
  } else {
    console.log(value)
  }
}

/**
 * browsecraft config delete KEY
 * 从 config.json 删除一个键
 */
function configDelete(args) {
  const [key] = args
  if (!key) throw new Error('Usage: browsecraft config delete <KEY>')

  const cfg = readConfigFile()
  if (key in cfg) {
    delete cfg[key]
    writeConfigFile(cfg)
    console.log(`Deleted ${key} from ~/.browsecraft/config.json`)
  } else {
    console.log(`${key} not found in config.json`)
  }
}

/**
 * browsecraft config show
 * 显示所有配置来源和当前生效值
 */
function configShow() {
  const cfgFile = readConfigFile()
  const hasLocalEnv = existsSync(LOCAL_ENV_FILE)
  const hasGlobalEnv = existsSync(GLOBAL_ENV_FILE)

  console.log('Config sources (highest to lowest priority):')
  console.log('  1. CLI args (--roxy-token, --roxy-api, ...)')
  console.log('  2. Shell environment variables')
  console.log(`  3. Project .env  ${hasLocalEnv ? '✓ ' + LOCAL_ENV_FILE : '✗ (not found)'}`)
  console.log(`  4. Global .env   ${hasGlobalEnv ? '✓ ' + GLOBAL_ENV_FILE : '✗ (not found)'}`)
  console.log(`  5. config.json   ${GLOBAL_DIR}/config.json`)

  console.log('\nKnown settings (current effective value):')
  for (const [key, desc] of Object.entries(CONFIG_KEYS)) {
    const val = process.env[key]
    const inFile = key in cfgFile
    const display = val
      ? (key.toLowerCase().includes('token') ? val.slice(0, 8) + '...' : val)
      : '(not set)'
    const src = inFile ? ' [config.json]' : val ? ' [env]' : ''
    console.log(`  ${key}=${display}${src}`)
    console.log(`    ${desc}`)
  }

  console.log('\nTo set a value:')
  console.log('  browsecraft config set ROXY_TOKEN <your-token>')
  console.log('  browsecraft config set ROXY_API http://127.0.0.1:50000')
}
