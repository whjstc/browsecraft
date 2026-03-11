/**
 * BrowseCraft HTTP API - 浏览器操作路由
 */

import { Router } from 'express'

export function createBrowserRoutes(actions, templateManager, getPage) {
  const router = Router()

  // 获取页面快照 (带模板匹配)
  router.get('/snapshot', async (req, res) => {
    try {
      const page = getPage()
      const url = page.url()
      const snapshot = await page.accessibility.snapshot()
      const template = templateManager.match(url)

      if (template) {
        res.json({
          snapshot,
          template: { id: template.id, name: template.name, elements: template.elements },
          matched: true,
        })
      } else {
        res.json({
          snapshot,
          template: null,
          matched: false,
          hint: '可以使用 POST /template/learn 来学习此页面',
        })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // 智能操作 (自动使用模板)
  router.post('/smart-action', async (req, res) => {
    try {
      const { action, params } = req.body
      const page = getPage()
      const url = page.url()
      const template = templateManager.match(url)

      if (template && template.elements[action]) {
        const selector = template.elements[action]
        try {
          if (params?.text) {
            await page.fill(selector, params.text)
          } else {
            await page.click(selector)
          }
          res.json({ success: true, method: 'template', template: template.name, selector })
        } catch (error) {
          res.json({ success: false, method: 'template', error: error.message, hint: '模板可能已过期' })
        }
      } else {
        res.json({ success: false, method: 'none', hint: '没有匹配的模板,请先使用 GET /snapshot 分析页面' })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // 执行 Playwright 代码
  router.post('/execute', async (req, res) => {
    try {
      const result = await actions.execute(req.body.code)
      res.json({ success: true, ...result })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // 导航
  router.post('/goto', async (req, res) => {
    try {
      const result = await actions.navigate(req.body.url)
      res.json({ success: true, ...result })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // 页面信息
  router.get('/info', async (req, res) => {
    try {
      const info = await actions.getInfo()
      res.json({ success: true, info })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // 健康检查
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      connected: !!getPage(),
      templates: templateManager.size,
    })
  })

  return router
}
