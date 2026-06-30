const { expect, test } = require('@playwright/test')

const event = (a, aScore, b, bScore, { winner, round = 'group-stage', completed = true } = {}) => ({
  season: { slug: round },
  status: { type: { completed } },
  competitions: [{ competitors: [
    { winner: winner === a, score: String(aScore), team: { displayName: a } },
    { winner: winner === b, score: String(bScore), team: { displayName: b } },
  ] }],
})

const payload = { events: [
  event('Brazil', 2, 'Scotland', 1, { winner: 'Brazil', round: 'round-of-32' }),
  event('Brazil', 1, 'France', 1),
  event('Germany', 1, 'Paraguay', 1, { winner: 'Paraguay', round: 'round-of-32' }),
  event('Netherlands', 1, 'Morocco', 1, { winner: 'Morocco', round: 'round-of-32' }),
] }

async function mockEspn(page, body = payload) {
  await page.route('**/scoreboard?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }))
}

test('renders standings calculated from ESPN and opens accurate eliminated team detail', async ({ page }) => {
  await mockEspn(page)
  await page.goto('/')
  await expect(page).toHaveTitle('Fantasy Order 2026')
  await expect(page.getByRole('heading', { name: 'Fantasy Order 2026' })).toBeVisible()
  await expect(page.getByText(/Updated/)).toBeVisible()
  await expect(page.getByRole('button', { name: /View Ryan H.*, 4 points/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /View Ryan L.*, 0.5 points/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /View Grant.*, 0.5 points/ })).toBeVisible()
  await page.getByRole('button', { name: /View Ryan L/ }).click()
  await expect(page.getByRole('heading', { name: 'Germany' })).toBeVisible()
  await expect(page.getByText('Elimination match')).toBeVisible()
  await expect(page.getByLabel('Germany details').getByText('Loss').first()).toBeVisible()
  await expect(page.getByLabel('Germany details')).not.toContainText('1–1')
  await expect(page.getByLabel('Germany details').locator('.stat-strip strong').first()).toHaveText('0.5')
  await expect(page.getByLabel('Germany details').locator('.breakdown p').first()).toContainText('0.5')
  await expect(page.getByLabel('Germany details')).toContainText('83,516,593')
  await expect(page.getByRole('link', { name: 'World Bank population data · 2024' })).toHaveAttribute('href', 'https://data.worldbank.org/indicator/SP.POP.TOTL')
  await expect(page.getByRole('heading', { name: 'Knockout wins' })).toHaveCount(0)
})

test('shows an honest error with no fake standings when ESPN fails, then retries', async ({ page }) => {
  await page.route('**/scoreboard?**', (route) => route.fulfill({ status: 503, body: '' }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText("couldn't reach ESPN")
  await expect(page.getByRole('button', { name: /View Ryan H/ })).toHaveCount(0)
  await page.unroute('**/scoreboard?**')
  await mockEspn(page)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('button', { name: /View Ryan H.*, 4 points/ })).toBeVisible()
})

test('mobile standings have separated columns and detail returns cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockEspn(page)
  await page.goto('/')
  const layout = await page.locator('.row').first().evaluate((row) => {
    const box = (selector) => row.querySelector(selector).getBoundingClientRect()
    return { manager: box('.manager'), team: box('.team'), points: box('.points'), wins: box('.wins'), goals: box('.goals') }
  })
  expect(layout.team.top).toBeGreaterThan(layout.manager.top)
  expect(layout.wins.left - layout.points.right).toBeGreaterThanOrEqual(7)
  expect(layout.goals.left - layout.wins.right).toBeGreaterThanOrEqual(7)
  const density = await page.evaluate(() => {
    const header = document.querySelector('.app-header').getBoundingClientRect()
    const leaderboard = document.querySelector('.leaderboard').getBoundingClientRect()
    const row = document.querySelector('.row').getBoundingClientRect()
    const legend = document.querySelector('.legend').getBoundingClientRect()
    return { headerTop: header.top, headerHeight: header.height, leaderboardTop: leaderboard.top, rowHeight: row.height, legendHeight: legend.height }
  })
  expect(density.headerTop).toBeLessThanOrEqual(20)
  expect(density.headerHeight).toBeLessThanOrEqual(170)
  expect(density.leaderboardTop).toBeLessThanOrEqual(205)
  expect(density.rowHeight).toBeLessThanOrEqual(78)
  expect(density.legendHeight).toBeLessThanOrEqual(52)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /View Ryan L/ }).click()
  await expect(page.getByRole('heading', { name: 'Germany' })).toBeVisible()
  await expect(page.getByLabel('Germany details').getByText('Eliminated', { exact: true })).toBeVisible()
  const detailDensity = await page.getByLabel('Germany details').evaluate((detail) => {
    const header = detail.querySelector('.detail-header').getBoundingClientRect()
    const stats = detail.querySelector('.stat-strip').getBoundingClientRect()
    const back = detail.querySelector('.back-button').getBoundingClientRect()
    return { headerTop: header.top, headerHeight: header.height, statsHeight: stats.height, backWidth: back.width, backHeight: back.height }
  })
  expect(detailDensity.headerTop).toBeLessThanOrEqual(56)
  expect(detailDensity.headerHeight).toBeLessThanOrEqual(92)
  expect(detailDensity.statsHeight).toBeLessThanOrEqual(82)
  expect(detailDensity.backWidth).toBeGreaterThanOrEqual(44)
  expect(detailDensity.backHeight).toBeGreaterThanOrEqual(44)
  await page.getByRole('button', { name: 'Back to standings' }).click()
  await expect(page.getByRole('heading', { name: 'Fantasy Order 2026' })).toBeVisible()
})

test('320px standings do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockEspn(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: /View Ryan H/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const compact = await page.evaluate(() => ({
    headerBottom: document.querySelector('.app-header').getBoundingClientRect().bottom,
    leaderboardTop: document.querySelector('.leaderboard').getBoundingClientRect().top,
    legendWidth: document.querySelector('.legend').getBoundingClientRect().width,
    viewportWidth: window.innerWidth,
  }))
  expect(compact.headerBottom).toBeLessThanOrEqual(174)
  expect(compact.leaderboardTop).toBeLessThanOrEqual(186)
  expect(compact.legendWidth).toBeLessThanOrEqual(compact.viewportWidth - 24)
})

test('long future game metadata stays contained on narrow mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockEspn(page, { events: [{
    date: '2099-07-10T23:30:00Z',
    status: { type: { completed: false, state: 'pre' } },
    competitions: [{ competitors: [
      { team: { displayName: 'Brazil' } },
      { team: { displayName: 'Bosnia and Herzegovina' } },
    ] }],
  }] })
  await page.goto('/')
  const metadata = page.locator('.next-match').first()
  await expect(metadata).toBeVisible()
  await expect(metadata).toContainText('Bosnia and Herzegovina')
  await expect(metadata.locator('time')).toHaveText('Fri, Jul 10 · 4:30 PM PT')
  const containment = await metadata.evaluate((element) => {
    const metadataBox = element.getBoundingClientRect()
    const teamBox = element.closest('.team').getBoundingClientRect()
    return {
      contained: metadataBox.left >= teamBox.left && metadataBox.right <= teamBox.right,
      opponentEllipsis: getComputedStyle(element.querySelector('span')).textOverflow,
      timeVisible: element.querySelector('time').getBoundingClientRect().right <= teamBox.right,
    }
  })
  expect(containment).toEqual({ contained: true, opponentEllipsis: 'ellipsis', timeVisible: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('social preview renders all current rows and eliminated styling', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 })
  await mockEspn(page)
  await page.goto('/?social-preview=1')
  await expect(page.getByRole('main', { name: 'Fantasy Order leaderboard preview' })).toBeVisible()
  await expect(page.locator('.preview-row')).toHaveCount(12)
  await expect(page.locator('.preview-row.is-eliminated')).toHaveCount(2)
  await expect(page.locator('.preview-head').first()).toHaveText('#Team / ManagerPoints')
  await expect(page.locator('.preview-head').first()).not.toContainText('GF')
  await expect(page.locator('.preview-head').first()).not.toContainText('W')
  await expect(page.locator('.preview-header')).toContainText('🏆')
  await expect(page.locator('.preview-header p')).toContainText('PT')
  const previewChrome = await page.locator('.preview-column').first().evaluate((element) => {
    const styles = getComputedStyle(element)
    return { borderWidth: styles.borderTopWidth, boxShadow: styles.boxShadow }
  })
  expect(previewChrome).toEqual({ borderWidth: '0px', boxShadow: 'none' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
})
