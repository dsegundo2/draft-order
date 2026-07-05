import { chromium } from '@playwright/test'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'

const baseUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173'
const siteRoot = 'https://dsegundo2.github.io/draft-order'
const groups = {
  hb: { title: 'Fantasy Order 2026 🏆', description: 'Live knockout standings.', image: 'og-standings.png' },
  winks: { title: 'Winks Fantasy Order 2026 🏆', description: 'Live knockout standings for the Winks group.', image: 'og-standings-winks.png' },
}
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })

function withMetadata(html, id, group, version) {
  const routeRoot = `${siteRoot}/${id}/`
  return html
    .replaceAll('__OG_VERSION__', version)
    .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${group.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${group.description}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(" \/>)/, `$1${routeRoot}${group.image}?v=${version}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${routeRoot}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/, `$1${group.title}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(" \/>)/, `$1${routeRoot}${group.image}?v=${version}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(" \/>)/, `$1${routeRoot}$2`)
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${group.title.replace(' 🏆', '')}$2`)
}

try {
  for (const [id, group] of Object.entries(groups)) {
    const route = id === 'hb' ? '/' : `/${id}`
    let loaded = false
    for (let attempt = 0; attempt < 30 && !loaded; attempt += 1) {
      try {
        await page.goto(`${baseUrl}${route}?social-preview=1`, { waitUntil: 'networkidle' })
        loaded = true
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    if (!loaded) throw new Error(`Preview server did not become ready at ${baseUrl}`)
    await page.locator('.social-preview.is-ready').waitFor({ state: 'visible', timeout: 30_000 })
    const rows = await page.locator('.preview-row').count()
    const expectedRows = id === 'winks' ? 10 : 12
    if (rows !== expectedRows) throw new Error(`Expected ${expectedRows} ${id} preview rows, received ${rows}`)
    await page.screenshot({ path: `dist/${group.image}`, type: 'png' })
  }

  const version = `${Date.now()}`
  const indexPath = new URL('../dist/index.html', import.meta.url)
  const baseHtml = await readFile(indexPath, 'utf8')
  await writeFile(indexPath, baseHtml.replaceAll('__OG_VERSION__', version))

  for (const [id, group] of Object.entries(groups)) {
    const directory = new URL(`../dist/${id}/`, import.meta.url)
    await mkdir(directory, { recursive: true })
    await cp(new URL('../dist/assets/', import.meta.url), new URL('assets/', directory), { recursive: true })
    await cp(new URL(`../dist/${group.image}`, import.meta.url), new URL(group.image, directory))
    await cp(new URL(`../dist/${id === 'winks' ? 'winks-header.png' : 'fantasy-order-header.png'}`, import.meta.url), new URL(id === 'winks' ? 'winks-header.png' : 'fantasy-order-header.png', directory))
    await writeFile(new URL('index.html', directory), withMetadata(baseHtml, id, group, version))
  }
} finally {
  await browser.close()
}
