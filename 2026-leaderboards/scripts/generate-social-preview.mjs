import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const baseUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })

try {
  let loaded = false
  for (let attempt = 0; attempt < 30 && !loaded; attempt += 1) {
    try {
      await page.goto(`${baseUrl}/?social-preview=1`, { waitUntil: 'networkidle' })
      loaded = true
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  if (!loaded) throw new Error(`Preview server did not become ready at ${baseUrl}`)
  await page.locator('.social-preview.is-ready').waitFor({ state: 'visible', timeout: 30_000 })
  const rows = await page.locator('.preview-row').count()
  if (rows !== 12) throw new Error(`Expected 12 preview rows, received ${rows}`)
  await page.screenshot({ path: 'dist/og-standings.png', type: 'png' })
  const indexPath = 'dist/index.html'
  const index = await readFile(indexPath, 'utf8')
  await writeFile(indexPath, index.replaceAll('__OG_VERSION__', `${Date.now()}`))
} finally {
  await browser.close()
}
