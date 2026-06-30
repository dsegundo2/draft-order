const { expect, test } = require('@playwright/test')

test('shows standings and opens an eliminated manager detail', async ({ page }) => {
  await page.route('**/scoreboard?**', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'World Cup 2026' })).toBeVisible()
  await expect(page.getByRole('button', { name: /View Ryan H/ })).toBeVisible()
  await page.getByRole('button', { name: /View Noah/ }).click()
  await expect(page.getByRole('heading', { name: 'Mexico' })).toBeVisible()
  await expect(page.getByText('Elimination match')).toBeVisible()
})

test('mobile detail supports returning to the standings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/scoreboard?**', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: /View Ryan L/ }).click()
  await expect(page.getByRole('heading', { name: 'Germany' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to standings' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to standings' }).click()
  await expect(page.getByRole('heading', { name: 'World Cup 2026' })).toBeVisible()
})
