/**
 * 状态管理 - 读写 .browsecraft/state.json
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

function normalizeSessionName(sessionName) {
  const name = (sessionName || process.env.BROWSECRAFT_SESSION || 'default').trim()
  const normalized = name.replace(/[^a-zA-Z0-9_-]/g, '_')
  return normalized || 'default'
}

/**
 * 获取状态文件路径
 * @param {boolean} local - 是否使用本地状态（项目级）
 * @returns {string} 状态文件路径
 */
export function getStatePath(local = false) {
  const sessionName = normalizeSessionName()
  const dir = local
    ? path.join(process.cwd(), '.browsecraft')
    : path.join(os.homedir(), '.browsecraft')

  if (sessionName === 'default') {
    return path.join(dir, 'state.json')
  }

  return path.join(dir, `state-${sessionName}.json`)
}

/**
 * 加载状态
 * @param {boolean} local - 是否使用本地状态
 * @returns {Promise<Object|null>} 状态对象或 null
 */
export async function loadState(local = false) {
  const statePath = getStatePath(local)

  try {
    const content = await fs.readFile(statePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * 保存状态
 * @param {Object} state - 状态对象
 * @param {boolean} local - 是否使用本地状态
 * @returns {Promise<void>}
 */
export async function saveState(state, local = false) {
  const statePath = getStatePath(local)
  const dir = path.dirname(statePath)

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true })

  await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8')
}

/**
 * 删除状态
 * @param {boolean} local - 是否使用本地状态
 * @returns {Promise<void>}
 */
export async function deleteState(local = false) {
  const statePath = getStatePath(local)

  try {
    await fs.unlink(statePath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}
