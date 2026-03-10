/**
 * BrowseCraft Core - 模板缓存系统
 *
 * 学习和缓存页面元素模板,减少重复的 AI 分析
 * 从 roxy-ai-server-template.cjs 迁移
 */

import fs from 'node:fs'
import path from 'node:path'

export class TemplateManager {
  constructor(options = {}) {
    this.templateDir = options.templateDir || path.join(process.cwd(), '.templates')
    this.templates = new Map()

    // 确保模板目录存在
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true })
    }

    // 加载已保存的模板
    this._loadFromDisk()
  }

  /**
   * 从磁盘加载模板
   */
  _loadFromDisk() {
    try {
      const files = fs.readdirSync(this.templateDir)
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const content = fs.readFileSync(path.join(this.templateDir, file), 'utf8')
        const template = JSON.parse(content)
        this.templates.set(template.id, template)
      }
    } catch (error) {
      // 目录不存在或读取失败,忽略
    }
  }

  /**
   * 保存模板到磁盘
   */
  _saveToDisk(template) {
    const filepath = path.join(this.templateDir, `${template.id}.json`)
    fs.writeFileSync(filepath, JSON.stringify(template, null, 2))
  }

  /**
   * 根据 URL 匹配模板
   */
  match(url) {
    for (const [, template] of this.templates) {
      if (url.includes(template.urlPattern)) {
        return template
      }
    }
    return null
  }

  /**
   * 学习页面模板
   * @param {object} params - { name, urlPattern, elements, url }
   * @param {import('playwright-core').Page} [page] - 可选,用于验证 selectors
   */
  async learn({ name, urlPattern, elements, url }, page) {
    if (!name || !urlPattern || !elements) {
      throw new Error('Missing required fields: name, urlPattern, elements')
    }

    const template = {
      id: `template_${Date.now()}`,
      name,
      urlPattern,
      elements,
      createdAt: new Date().toISOString(),
      url: url || null,
    }

    // 验证 selectors (如果提供了 page)
    if (page) {
      template.validated = {}
      for (const [key, selector] of Object.entries(elements)) {
        try {
          const count = await page.locator(selector).count()
          template.validated[key] = { selector, exists: count > 0 }
        } catch (error) {
          template.validated[key] = { selector, exists: false, error: error.message }
        }
      }
    }

    this.templates.set(template.id, template)
    this._saveToDisk(template)
    return template
  }

  /**
   * 更新模板
   */
  update(templateId, updates) {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    if (updates.elements) {
      template.elements = { ...template.elements, ...updates.elements }
    }
    if (updates.name) {
      template.name = updates.name
    }

    template.updatedAt = new Date().toISOString()
    this.templates.set(templateId, template)
    this._saveToDisk(template)
    return template
  }

  /**
   * 删除模板
   */
  delete(templateId) {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template ${templateId} not found`)
    }

    const filepath = path.join(this.templateDir, `${templateId}.json`)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    this.templates.delete(templateId)
  }

  /**
   * 获取单个模板
   */
  get(templateId) {
    return this.templates.get(templateId) || null
  }

  /**
   * 列出所有模板
   */
  list() {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      urlPattern: t.urlPattern,
      elements: Object.keys(t.elements),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  }

  /**
   * 使用模板执行操作
   * @param {string} templateId
   * @param {string} action - elements 中定义的 key
   * @param {object} params - { text } 填写文本,不传则点击
   * @param {import('playwright-core').Page} page
   */
  async execute(templateId, action, params, page) {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const selector = template.elements[action]
    if (!selector) {
      throw new Error(`Action "${action}" not defined in template`)
    }

    if (params?.text) {
      await page.fill(selector, params.text)
      return { action: 'fill', selector, text: params.text }
    } else {
      await page.click(selector)
      return { action: 'click', selector }
    }
  }

  /**
   * 模板数量
   */
  get size() {
    return this.templates.size
  }
}
