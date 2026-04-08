import { expect, test } from '@playwright/test'

import { APP_ENTRY_PATH, setupApiRoutes } from './helpers'

test.describe('Team flow', () => {
  test('edited team appears in matchup after saving', async ({ page }) => {
    await setupApiRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ENTRY_PATH)

    // Open team editor and change slot 1 from the default (swampert) to flygon
    await page.getByRole('button', { name: 'Edit Team' }).click()
    await page.getByLabel('Team Slot 1', { exact: true }).fill('flygon')
    await page.getByRole('button', { name: 'Save Team' }).click()

    // Saving returns to the battle screen
    await expect(page.getByLabel('Opponent Pokemon')).toBeVisible()

    // Select an opponent via typeahead
    await page.getByLabel('Opponent Pokemon').fill('swam')
    await expect(page.getByRole('button', { name: 'Swampert' })).toBeVisible()
    await page.getByRole('button', { name: 'Swampert' }).click()

    // Slot 0 is now flygon — matchup heading should reflect that
    await expect(
      page.getByRole('heading', { name: 'Swampert vs Flygon' }),
    ).toBeVisible()
  })

  test('team persists across page reload', async ({ page }) => {
    await setupApiRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ENTRY_PATH)

    // Edit slot 1 and save
    await page.getByRole('button', { name: 'Edit Team' }).click()
    await page.getByLabel('Team Slot 1', { exact: true }).fill('gardevoir')
    await page.getByRole('button', { name: 'Save Team' }).click()
    await expect(page.getByLabel('Opponent Pokemon')).toBeVisible()

    // Reload — route mocks persist across reloads
    await page.reload()

    // Re-open editor and confirm the saved value survived the reload
    await page.getByRole('button', { name: 'Edit Team' }).click()
    await expect(page.getByLabel('Team Slot 1', { exact: true })).toHaveValue(
      'gardevoir',
    )
  })
})
