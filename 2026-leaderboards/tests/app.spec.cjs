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

test('loads the Winks group from its URL with its roster and header', async ({ page }) => {
  await mockEspn(page)
  await page.goto('/winks')
  await expect(page.getByRole('heading', { name: 'Winks Fantasy Order 2026' })).toBeVisible()
  await expect(page.locator('.table-body li')).toHaveCount(10)
  for (const manager of ['Lisa', 'Sharla', 'Nolan', 'Hayden', 'Tim', 'Cheri', 'Kahlah', 'Kim', 'Scott', 'Pap']) {
    await expect(page.getByRole('button', { name: new RegExp(`View ${manager},`) })).toBeVisible()
  }
  await expect(page.locator('.app-header')).toHaveCSS('background-image', /winks-header\.png/)
})

test('keeps the default group at both the current URL and /hb', async ({ page }) => {
  await mockEspn(page)
  for (const route of ['/', '/hb']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: 'Fantasy Order 2026' })).toBeVisible()
    await expect(page.locator('.table-body li')).toHaveCount(12)
    await expect(page.getByRole('button', { name: /View Ryan H\./ })).toBeVisible()
  }
})

test('refresh recalculates live goals and half-points from the latest score', async ({ page }) => {
  let score = 1
  await page.route('**/scoreboard?**', (route) => {
    const live = event('France', score, 'Sweden', 0, { round: 'round-of-32', completed: false })
    live.date = new Date().toISOString()
    live.status.type.state = 'in'
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ events: [live] }) })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /View Jeff, France, 0.5 points/ })).toBeVisible()
  score = 2
  await page.getByRole('button', { name: 'Refresh' }).click()
  const updatedFrance = page.getByRole('button', { name: /View Jeff, France, 1 points/ })
  await expect(updatedFrance).toBeVisible()
  await expect(updatedFrance.locator('.goals')).toHaveText('2')
  await expect(updatedFrance.locator('.when.today-match')).toHaveText('Live 2–0')
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
    return { player: box('.player'), points: box('.points'), wins: box('.wins'), goals: box('.goals') }
  })
  expect(layout.player.right).toBeLessThan(layout.points.left)
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
  const opponent = page.locator('.opponent.next-match').first()
  const when = page.locator('.when.next-match').first()
  await expect(opponent).toHaveText('vs Bosnia and Herzegovina')
  await expect(when).toHaveText('Fri, Jul 10 · 4:30 PM PT')
  const containment = await opponent.evaluate((element) => {
    const row = element.closest('.row')
    const playerBox = row.querySelector('.player').getBoundingClientRect()
    const opponentBox = element.getBoundingClientRect()
    const whenBox = row.querySelector('.when').getBoundingClientRect()
    return {
      opponentContained: opponentBox.left >= playerBox.left && opponentBox.right <= playerBox.right,
      whenContained: whenBox.left >= playerBox.left && whenBox.right <= playerBox.right,
      contentFits: row.scrollHeight <= row.clientHeight,
    }
  })
  expect(containment).toEqual({ opponentContained: true, whenContained: true, contentFits: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})



const finalFourPayload = { events: [
  event('Mexico', 10, 'Poland', 0, { winner: 'Mexico', round: 'round-of-32' }),
  event('Brazil', 1, 'Germany', 0, { winner: 'Brazil', round: 'semifinals' }),
  event('Argentina', 1, 'France', 0, { winner: 'Argentina', round: 'semifinals' }),
  event('Brazil', 1, 'Argentina', 0, { winner: 'Brazil', round: 'final' }),
  event('Germany', 3, 'France', 2, { winner: 'Germany', round: '3rd-place-match' }),
] }

const incompleteFinalFourPayload = { events: [
  event('Brazil', 0, 'Germany', 0, { completed: false, round: 'semifinals' }),
  event('Argentina', 0, 'France', 0, { completed: false, round: 'semifinals' }),
] }


const tiedFinalFourPayload = { events: [
  event('Brazil', 1, 'Germany', 0, { winner: 'Brazil', round: 'semifinals' }),
  event('Argentina', 1, 'France', 0, { winner: 'Argentina', round: 'semifinals' }),
  event('Brazil', 0, 'Argentina', 0, { completed: false, round: 'final' }),
  event('Germany', 0, 'France', 0, { completed: false, round: '3rd-place-match' }),
] }

test('renders complete final four as official placements ahead of higher points', async ({ page }) => {
  await mockEspn(page, finalFourPayload)
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Final Four official placements' })).toBeVisible()
  await expect(page.getByRole('button', { name: /View Ryan H\., Brazil, World Cup champion/ }).locator('.placement-marker')).toHaveText('🥇')
  await expect(page.getByRole('button', { name: /View Diego, Argentina, World Cup runner-up/ }).locator('.placement-marker')).toHaveText('🥈')
  await expect(page.getByRole('button', { name: /View Ryan L\., Germany, Third-place winner/ }).locator('.placement-marker')).toHaveText('🥉')
  await expect(page.getByRole('button', { name: /View Jeff, France, Fourth place/ }).locator('.placement-marker')).toHaveText('4')
  await expect(page.locator('.final-four-team')).toHaveText(['🇧🇷Brazil', '🇦🇷Argentina', '🇩🇪Germany', '🇫🇷France'])
  await expect(page.locator('.final-four-card .final-four-stats')).toHaveCount(0)
  await expect(page.locator('.section-divider')).toContainText('Remaining standings')
  await expect(page.locator('.table-body').last().locator('.team-name').first()).toHaveText('Mexico')
  await expect(page.getByRole('button', { name: /View Ryan H\./ })).toHaveCount(1)
})

test('renders incomplete final four with neutral labels on mobile without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockEspn(page, incompleteFinalFourPayload)
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Final Four official placements' })).toBeVisible()
  await expect(page.locator('.placement-pill')).toHaveText(['Final Four TBD', 'Final Four TBD', 'Final Four TBD', 'Final Four TBD'])
  await expect(page.locator('.placement-marker').first()).toHaveText('TBD')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})


test('renders tied final-four placeholders before placement games finish on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockEspn(page, tiedFinalFourPayload)
  await page.goto('/')
  await expect(page.locator('.placement-marker')).toHaveText(['T-1', 'T-1', 'T-3', 'T-3'])
  await expect(page.locator('.placement-pill')).toHaveText(['Tied for 1st', 'Tied for 1st', 'Tied for 3rd', 'Tied for 3rd'])
  await expect(page.locator('.placement-marker')).not.toHaveText(['3', '4'])
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

test('Winks social preview is group-specific', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 })
  await mockEspn(page)
  await page.goto('/winks?social-preview=1')
  await expect(page.locator('.preview-header')).toContainText('Winks Fantasy Order 2026')
  await expect(page.locator('.preview-header')).toHaveCSS('background-image', /winks-header\.png/)
  await expect(page.locator('.preview-row')).toHaveCount(10)
  for (const manager of ['Lisa', 'Sharla', 'Nolan', 'Hayden', 'Tim', 'Cheri', 'Kahlah', 'Kim', 'Scott', 'Pap']) {
    await expect(page.locator('.preview-standings')).toContainText(manager)
  }
})
