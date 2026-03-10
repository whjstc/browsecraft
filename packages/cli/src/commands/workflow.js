/**
 * 工作流命令 - workflow run
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import yaml from 'js-yaml'
import { withPage } from './base.js'
import { template as runTemplateCommand } from './template.js'
import * as navigation from './navigation.js'
import * as interaction from './interaction.js'
import * as advanced from './advanced.js'
import * as snapshot from './snapshot.js'
import * as utility from './utility.js'

function parseVars(args) {
  const vars = {}
  for (const arg of args) {
    const idx = arg.indexOf('=')
    if (idx > 0) {
      vars[arg.slice(0, idx)] = arg.slice(idx + 1)
    }
  }
  return vars
}

function applyTemplate(value, vars = {}) {
  if (typeof value === 'string') {
    return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim()
      return vars[trimmed] ?? ''
    })
  }
  if (Array.isArray(value)) {
    return value.map(item => applyTemplate(item, vars))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, applyTemplate(v, vars)]))
  }
  return value
}

async function runStep(step, options, vars) {
  const action = step.action
  switch (action) {
    case 'open':
    case 'navigate':
      return navigation.open([step.url], options)
    case 'click':
      return interaction.click([step.selector], options)
    case 'fill':
      return interaction.fill([step.selector, step.value ?? ''], options)
    case 'click-ref':
      return snapshot.clickRef([step.ref], options)
    case 'fill-ref':
      return snapshot.fillRef([step.ref, step.value ?? ''], options)
    case 'snapshot':
      return snapshot.snapshot([
        ...(step.interactive ? ['-i'] : []),
        ...(step.compact ? ['-c'] : []),
        ...(step.depth ? ['-d', String(step.depth)] : []),
      ], options)
    case 'wait-for':
      return utility.waitFor([step.selector], options)
    case 'screenshot':
      return utility.screenshot([step.path || `workflow-${Date.now()}.png`], options)
    case 'press':
      return advanced.press([step.key], options)
    case 'js':
      return utility.js([step.expression], options)
    case 'template':
      return runTemplateCommand([
        'execute',
        step.templateId,
        step.templateAction,
        ...(step.text ? [step.text] : []),
      ], options)
    case 'assert-visible': {
      const { page } = await withPage(options.local)
      const visible = await page.locator(step.selector).first().isVisible()
      if (!visible) {
        throw new Error(step.message || `Assertion failed: ${step.selector} is not visible`)
      }
      console.log(`Asserted visible: ${step.selector}`)
      return
    }
    default:
      throw new Error(`Unsupported workflow action: ${action}`)
  }
}

export async function workflow(args, options) {
  const sub = args[0]
  if (sub !== 'run') {
    throw new Error('Usage: browsecraft workflow run <file.yml> [key=value ...]')
  }

  const file = args[1]
  if (!file) {
    throw new Error('Usage: browsecraft workflow run <file.yml> [key=value ...]')
  }

  const filePath = path.resolve(process.cwd(), file)
  const content = await fs.readFile(filePath, 'utf-8')
  const doc = yaml.load(content)
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid workflow file')
  }

  const steps = Array.isArray(doc.steps) ? doc.steps : []
  if (steps.length === 0) {
    throw new Error('Workflow has no steps')
  }

  const vars = {
    ...doc.vars,
    ...parseVars(args.slice(2)),
  }

  for (let index = 0; index < steps.length; index++) {
    const raw = steps[index]
    const step = applyTemplate(raw, vars)
    console.log(`→ [${index + 1}/${steps.length}] ${step.name || step.action}`)
    await runStep(step, options, vars)
  }

  console.log(`Workflow completed: ${doc.name || path.basename(filePath)}`)
}
