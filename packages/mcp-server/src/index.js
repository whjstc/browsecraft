#!/usr/bin/env node

/**
 * BrowseCraft MCP Server
 *
 * 基于 @browsecraft/core 的 MCP Server，为 Claude Desktop 设计
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { BrowserConnector, BrowserActions, SnapshotManager } from '@browsecraft/core'
import { tools } from './tools.js'

// 全局状态
let connector = null
let actions = null
let snapshotManager = new SnapshotManager()

/**
 * 懒连接浏览器
 */
async function ensureConnected() {
  if (connector) return

  // 从环境变量或默认值获取连接信息
  const cdpEndpoint = process.env.BROWSECRAFT_CDP_ENDPOINT
  const cdpPort = process.env.BROWSECRAFT_CDP_PORT
  const browserType = process.env.BROWSECRAFT_BROWSER_TYPE || 'auto'

  if (!cdpEndpoint && !cdpPort) {
    // 尝试自动发现
    connector = new BrowserConnector({
      type: browserType,
      cdpPort: 9222,
    })
  } else {
    connector = new BrowserConnector({
      type: browserType,
      cdpEndpoint,
      cdpPort: cdpPort ? parseInt(cdpPort) : undefined,
    })
  }

  await connector.connect()
  actions = new BrowserActions(connector)
}

/**
 * 处理工具调用
 */
async function handleToolCall(name, args) {
  await ensureConnected()

  const page = connector.getPage()

  switch (name) {
    case 'browser_navigate': {
      const url = args.url.startsWith('http') ? args.url : `https://${args.url}`
      const result = await actions.navigate(url)
      return text(`Navigated to ${result.url}\nTitle: ${result.title}`)
    }

    case 'browser_snapshot': {
      const result = await snapshotManager.capture(page)
      return text(`Page: ${result.title} (${result.url})\n\n${result.yaml}`)
    }

    case 'browser_click': {
      await actions.click(args.selector)
      return text(`Clicked: ${args.selector}`)
    }

    case 'browser_click_ref': {
      await snapshotManager.clickByRef(page, args.ref)
      return text(`Clicked ref: ${args.ref}`)
    }

    case 'browser_fill': {
      await actions.fill(args.selector, args.text)
      return text(`Filled: ${args.selector}`)
    }

    case 'browser_fill_ref': {
      await snapshotManager.fillByRef(page, args.ref, args.text)
      return text(`Filled ref: ${args.ref}`)
    }

    case 'browser_screenshot': {
      if (args.path) {
        await actions.screenshot(args.path)
        return text(`Screenshot saved to ${args.path}`)
      }

      // 返回 base64 图片
      const buffer = await page.screenshot({ type: 'png' })
      return {
        content: [{
          type: 'image',
          data: buffer.toString('base64'),
          mimeType: 'image/png',
        }],
      }
    }

    case 'browser_evaluate': {
      const result = await page.evaluate(args.expression)
      const output = result !== undefined && result !== null
        ? (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))
        : 'undefined'
      return text(output)
    }

    case 'browser_info': {
      const info = await actions.getInfo()
      return text(`Title: ${info.title}\nURL: ${info.url}`)
    }

    case 'browser_back': {
      await page.goBack()
      return text(`Back to: ${page.url()}`)
    }

    case 'browser_forward': {
      await page.goForward()
      return text(`Forward to: ${page.url()}`)
    }

    case 'browser_wait': {
      await page.locator(args.selector).waitFor({
        state: 'visible',
        timeout: args.timeout || 30000,
      })
      return text(`Element found: ${args.selector}`)
    }

    case 'browser_dismiss_cookies': {
      const result = await actions.dismissCookies()
      return text(result.dismissed ? 'Cookie banner dismissed' : 'No cookie banner found')
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

/**
 * 创建文本响应
 */
function text(content) {
  return { content: [{ type: 'text', text: content }] }
}

// 创建 MCP Server
const server = new Server(
  { name: 'browsecraft', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}))

// 注册工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    return await handleToolCall(name, args || {})
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    }
  }
})

// 启动服务器
const transport = new StdioServerTransport()
await server.connect(transport)
