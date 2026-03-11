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

function resolveConfigPaths(options = {}) {
  const cwd = options.cwd ?? process.cwd()
  const home = options.homeDir ?? homedir()
  const globalDir = join(home, '.browsecraft')

  return {
    globalDir,
    globalEnvFile: join(globalDir, '.env'),
    globalConfigFile: join(globalDir, 'config.json'),
    localEnvFile: join(cwd, '.browsecraft', '.env'),
  }
}

/**
 * 解析 .env 文本内容，返回 key-value 对象
 */
export function parseEnvContent(content) {
  const result = {}

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const normalized = line.startsWith('export ')
      ? line.slice('export '.length).trim()
      : line

    const eqIdx = normalized.indexOf('=')
    if (eqIdx < 1) continue

    const key = normalized.slice(0, eqIdx).trim()
    if (!key) continue

    let value = normalized.slice(eqIdx + 1).trim()

    // 去除包裹引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    } else {
      // 非引号值支持内联注释：FOO=bar # comment
      const hashIdx = value.indexOf(' #')
      if (hashIdx >= 0) {
        value = value.slice(0, hashIdx).trim()
      }
    }

    result[key] = value
  }

  return result
}

/**
 * 解析 .env 文件，返回 key-value 对象
 */
function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return parseEnvContent(content)
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
export async function loadConfig(options = {}) {
  const paths = resolveConfigPaths(options)

  // 3. 项目级 .env
  if (existsSync(paths.localEnvFile)) {
    try { applyToEnv(parseEnvFile(paths.localEnvFile)) } catch {}
  }

  // 4. 全局 .env
  if (existsSync(paths.globalEnvFile)) {
    try { applyToEnv(parseEnvFile(paths.globalEnvFile)) } catch {}
  }

  // 5. config.json
  if (existsSync(paths.globalConfigFile)) {
    try {
      const cfg = JSON.parse(readFileSync(paths.globalConfigFile, 'utf-8'))
      applyToEnv(cfg)
    } catch {}
  }
}

/**
 * 读取 config.json（仅 browsecraft 自己管理的配置）
 */
export function readConfigFile(options = {}) {
  const { globalConfigFile } = resolveConfigPaths(options)

  if (!existsSync(globalConfigFile)) return {}
  try {
    return JSON.parse(readFileSync(globalConfigFile, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * 写入 config.json
 */
export function writeConfigFile(cfg, options = {}) {
  const { globalDir, globalConfigFile } = resolveConfigPaths(options)
  mkdirSync(globalDir, { recursive: true })
  writeFileSync(globalConfigFile, JSON.stringify(cfg, null, 2) + '\n', 'utf-8')
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
