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
  await expect(page.getByRole('button', { name: /View Ryan H.*, 3 points/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /View Ryan L.*, 0 points/ })).toBeVisible()
  await page.getByRole('button', { name: /View Ryan L/ }).click()
  await expect(page.getByRole('heading', { name: 'Germany' })).toBeVisible()
  await expect(page.getByText('Elimination match')).toBeVisible()
  await expect(page.getByLabel('Germany details').getByText('L 1–1').first()).toBeVisible()
})

test('shows an honest error with no fake standings when ESPN fails, then retries', async ({ page }) => {
  await page.route('**/scoreboard?**', (route) => route.fulfill({ status: 503, body: '' }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText("couldn't reach ESPN")
  await expect(page.getByRole('button', { name: /View Ryan H/ })).toHaveCount(0)
  await page.unroute('**/scoreboard?**')
  await mockEspn(page)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('button', { name: /View Ryan H.*, 3 points/ })).toBeVisible()
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /View Ryan L/ }).click()
  await expect(page.getByRole('heading', { name: 'Germany' })).toBeVisible()
  await expect(page.getByLabel('Germany details').getByText('Eliminated', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back to standings' }).click()
  await expect(page.getByRole('heading', { name: 'Fantasy Order 2026' })).toBeVisible()
})

test('320px standings do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockEspn(page)
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
