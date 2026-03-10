/**
 * 模板命令 - template learn/execute/list/delete
 */

import os from 'node:os'
import path from 'node:path'
import { TemplateManager } from 'browsecraft-core'
import { withPage } from './base.js'

function getTemplateDir(local = false) {
  if (local) {
    return path.join(process.cwd(), '.browsecraft', 'templates')
  }
  return path.join(os.homedir(), '.browsecraft', 'templates')
}

function parseElements(pairs) {
  const elements = {}
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    if (idx <= 0) {
      throw new Error(`Invalid element mapping: ${pair}, expected key=selector`)
    }
    const key = pair.slice(0, idx).trim()
    const selector = pair.slice(idx + 1).trim()
    if (!key || !selector) {
      throw new Error(`Invalid element mapping: ${pair}, expected key=selector`)
    }
    elements[key] = selector
  }
  return elements
}

function buildTemplateManager(local = false) {
  return new TemplateManager({ templateDir: getTemplateDir(local) })
}

export async function template(args, options) {
  const sub = args[0]
  const subArgs = args.slice(1)

  switch (sub) {
    case 'learn':
      return learn(subArgs, options)
    case 'execute':
      return execute(subArgs, options)
    case 'list':
      return list(subArgs, options)
    case 'delete':
      return remove(subArgs, options)
    default:
      throw new Error('Usage: browsecraft template <learn|execute|list|delete> [...]')
  }
}

async function learn(args, options) {
  const name = args[0]
  const urlPattern = args[1]
  const mappings = args.slice(2)

  if (!name || !urlPattern || mappings.length === 0) {
    throw new Error('Usage: browsecraft template learn <name> <urlPattern> <key=selector...>')
  }

  const elements = parseElements(mappings)
  const manager = buildTemplateManager(options.local)
  const { page } = await withPage(options.local)
  const data = await manager.learn({
    name,
    urlPattern,
    elements,
    url: page.url(),
  }, page)

  console.log(`Template learned: ${data.id} (${data.name})`)
  return data
}

async function execute(args, options) {
  const templateId = args[0]
  const action = args[1]
  const text = args.slice(2).join(' ') || null

  if (!templateId || !action) {
    throw new Error('Usage: browsecraft template execute <templateId> <action> [text]')
  }

  const manager = buildTemplateManager(options.local)
  const { page } = await withPage(options.local)
  const result = await manager.execute(templateId, action, text ? { text } : {}, page)

  console.log(`Template action executed: ${action}`)
  return result
}

async function list(args, options) {
  const manager = buildTemplateManager(options.local)
  const templates = manager.list()
  for (const item of templates) {
    console.log(`${item.id} | ${item.name} | ${item.urlPattern} | ${item.elements.join(',')}`)
  }
  if (templates.length === 0) {
    console.log('No templates')
  }
  return templates
}

async function remove(args, options) {
  const templateId = args[0]
  if (!templateId) {
    throw new Error('Usage: browsecraft template delete <templateId>')
  }

  const manager = buildTemplateManager(options.local)
  manager.delete(templateId)
  console.log(`Template deleted: ${templateId}`)
  return { deleted: templateId }
}
