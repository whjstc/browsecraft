#!/usr/bin/env node

import { firefox } from 'playwright-core'

async function main() {
  const configRaw = process.argv[2]
  if (!configRaw) {
    console.error('Missing config JSON')
    process.exit(2)
  }

  const config = JSON.parse(configRaw)
  const launchOptions = {
    headless: !!config.headless,
  }

  if (config.executablePath) {
    launchOptions.executablePath = config.executablePath
  }

  const server = await firefox.launchServer(launchOptions)
  const wsEndpoint = server.wsEndpoint()

  process.stdout.write(`WS_ENDPOINT=${wsEndpoint}\n`)

  const shutdown = async () => {
    try {
      await server.close()
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('disconnect', shutdown)

  setInterval(() => {}, 1 << 30)
}

main().catch((error) => {
  console.error(error?.message || String(error))
  process.exit(1)
})
