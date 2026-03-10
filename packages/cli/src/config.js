/**
 * 配置加载器
 *
 * 优先级（高到低）：
 * 1. CLI 参数（由调用方处理）
 * 2. shell 环境变量（process.env，已生效）
 * 3. ./.browsecraft/.env（项目级）
 * 4. ~/.browsecraft/.env（全局）
 * 5. ~/.browsecraft/config.json（browsecraft config set 写入）
 *
 * 调用 loadConfig() 后，所有配置都合并到 process.env，
 * 后续代码统一读 process.env.XXX 即可。
 */

import { readFileSync, existsSync } from 'node:fs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const GLOBAL_DIR = join(homedir(), '.browsecraft')
const GLOBAL_ENV_FILE = join(GLOBAL_DIR, '.env')
const GLOBAL_CONFIG_FILE = join(GLOBAL_DIR, 'config.json')
const LOCAL_ENV_FILE = join(process.cwd(), '.browsecraft', '.env')

/**
 * 解析 .env 文件，返回 key-value 对象
 */
function parseEnvFile(filePath) {
  const result = {}
  const content = readFileSync(filePath, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIdx = line.indexOf('=')
    if (eqIdx < 1) continue
    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()
    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

/**
 * 将 key-value 对象写入 process.env（不覆盖已有的）
 */
function applyToEnv(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (!(k in process.env)) {
      process.env[k] = v
    }
  }
}

/**
 * 加载所有配置源，合并到 process.env
 * 优先级：shell env > 项目 .env > 全局 .env > config.json
 */
export async function loadConfig() {
  // 3. 项目级 .env
  if (existsSync(LOCAL_ENV_FILE)) {
    try { applyToEnv(parseEnvFile(LOCAL_ENV_FILE)) } catch {}
  }

  // 4. 全局 .env
  if (existsSync(GLOBAL_ENV_FILE)) {
    try { applyToEnv(parseEnvFile(GLOBAL_ENV_FILE)) } catch {}
  }

  // 5. config.json
  if (existsSync(GLOBAL_CONFIG_FILE)) {
    try {
      const cfg = JSON.parse(readFileSync(GLOBAL_CONFIG_FILE, 'utf-8'))
      applyToEnv(cfg)
    } catch {}
  }
}

/**
 * 读取 config.json（仅 browsecraft 自己管理的配置）
 */
export function readConfigFile() {
  if (!existsSync(GLOBAL_CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(GLOBAL_CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * 写入 config.json
 */
export function writeConfigFile(cfg) {
  mkdirSync(GLOBAL_DIR, { recursive: true })
  writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n', 'utf-8')
}

/**
 * 已知的配置键说明
 */
export const CONFIG_KEYS = {
  ROXY_API: 'RoxyBrowser API URL (default: http://127.0.0.1:50000)',
  ROXY_TOKEN: 'RoxyBrowser API token',
  ROXY_WORKSPACE_ID: 'RoxyBrowser default workspace ID',
  ROXY_WINDOW_ID: 'RoxyBrowser default window dirId',
}
