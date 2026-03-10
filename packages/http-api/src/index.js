#!/usr/bin/env node

/**
 * BrowseCraft HTTP API Server
 *
 * 通用浏览器自动化 REST API
 * 从 roxy-ai-server-template.cjs 迁移
 */

import express from 'express'
import bodyParser from 'body-parser'
import { BrowserConnector, BrowserActions, TemplateManager } from '@browsecraft/core'
import { createTemplateRoutes } from './routes/template.js'
import { createBrowserRoutes } from './routes/browser.js'

export async function createServer(options = {}) {
  const port = options.port || process.env.PORT || 3000
  const templateDir = options.templateDir || undefined

  // 初始化核心组件
  const connector = new BrowserConnector({
    cdpEndpoint: options.cdpEndpoint || process.env.ROXY_CDP || process.env.CDP_ENDPOINT,
    cdpPort: options.cdpPort || process.env.CDP_PORT,
    cdpHost: options.cdpHost || process.env.CDP_HOST,
    type: options.browserType || 'auto',
  })

  const templateManager = new TemplateManager({ templateDir })
  let actions = null

  // 懒连接: 第一次请求时才连接浏览器
  async function ensureConnected() {
    if (!actions) {
      await connector.connect()
      actions = new BrowserActions(connector)
    }
    return actions
  }

  function getPage() {
    return connector.getPage()
  }

  // Express app
  const app = express()
  app.use(bodyParser.json())

  // 连接中间件
  app.use(async (req, res, next) => {
    try {
      await ensureConnected()
      next()
    } catch (error) {
      res.status(503).json({ error: `Browser not connected: ${error.message}` })
    }
  })

  // 挂载路由
  const browserRoutes = createBrowserRoutes(
    { execute: (code) => actions.execute(code), navigate: (url) => actions.navigate(url), getInfo: () => actions.getInfo() },
    templateManager,
    getPage
  )
  const templateRoutes = createTemplateRoutes(templateManager, getPage)

  app.use('/template', templateRoutes)
  app.use('/', browserRoutes)

  // 启动
  const server = app.listen(port, () => {
    console.log(`🌐 BrowseCraft HTTP API 运行在 http://localhost:${port}`)
    console.log(`📋 模板目录: ${templateManager.templateDir}`)
    console.log(`📋 已加载模板: ${templateManager.size}`)
  })

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n👋 关闭服务器...')
    await connector.disconnect()
    server.close()
    process.exit(0)
  })

  return { app, server, connector, templateManager }
}

// 直接运行
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isMain) {
  createServer()
}
