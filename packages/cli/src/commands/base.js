/**
 * 命令基础模块 - withPage 模式
 */

import { BrowserConnector, BrowserActions, SnapshotManager } from '@browsecraft/core'
import { loadState } from '../state.js'

/**
 * 获取浏览器连接和页面
 * @param {boolean} local - 是否使用本地状态
 * @returns {Promise<{state, connector, page, actions, snapshot}>}
 */
export async function withPage(local = false) {
  const state = await loadState(local)

  if (!state || !state.cdpEndpoint) {
    throw new Error('Browser not started. Run: browsecraft start')
  }

  const connector = new BrowserConnector({
    cdpEndpoint: state.cdpEndpoint,
    type: state.browserType || 'auto',
  })

  await connector.connect()

  const actions = new BrowserActions(connector)
  const snapshot = new SnapshotManager()

  return {
    state,
    connector,
    page: connector.getPage(),
    actions,
    snapshot,
  }
}
