/**
 * BrowseCraft HTTP API - 模板路由
 */

import { Router } from 'express'

export function createTemplateRoutes(templateManager, getPage) {
  const router = Router()

  // 学习页面模板
  router.post('/learn', async (req, res) => {
    try {
      const { name, urlPattern, elements } = req.body
      const page = getPage()
      const template = await templateManager.learn(
        { name, urlPattern, elements, url: page.url() },
        page
      )
      res.json({ success: true, template, message: `模板 "${name}" 已学习并保存` })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  // 使用模板执行操作
  router.post('/execute', async (req, res) => {
    try {
      const { templateId, action, params } = req.body
      if (!templateId || !action) {
        return res.status(400).json({ error: 'Missing required fields: templateId, action' })
      }
      const result = await templateManager.execute(templateId, action, params, getPage())
      const template = templateManager.get(templateId)
      res.json({ success: true, template: template.name, result })
    } catch (error) {
      res.status(500).json({ error: error.message, hint: '模板可能已过期,请使用 POST /template/update 更新' })
    }
  })

  // 更新模板
  router.post('/update', async (req, res) => {
    try {
      const { templateId, elements } = req.body
      if (!templateId) {
        return res.status(400).json({ error: 'Missing templateId' })
      }
      const template = templateManager.update(templateId, { elements })
      res.json({ success: true, template, message: '模板已更新' })
    } catch (error) {
      res.status(404).json({ error: error.message })
    }
  })

  // 列出所有模板
  router.get('/list', (req, res) => {
    const list = templateManager.list()
    res.json({ count: list.length, templates: list })
  })

  // 删除模板
  router.delete('/:id', (req, res) => {
    try {
      templateManager.delete(req.params.id)
      res.json({ success: true, message: `模板 ${req.params.id} 已删除` })
    } catch (error) {
      res.status(404).json({ error: error.message })
    }
  })

  return router
}
