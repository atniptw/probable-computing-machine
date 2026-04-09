import { expect, test } from '@playwright/test'

import { APP_ENTRY_PATH, setupApiRoutes } from './helpers'

test.describe('Battle Screen - Matchup viewer flow', () => {
  test('shows matchup viewer details after typeahead opponent selection', async ({
    page,
  }) => {
    await setupApiRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })

    await test.step('Open battle screen and type opponent query', async () => {
      await page.goto(APP_ENTRY_PATH)
      await page.getByLabel('Opponent Pokemon').fill('sala')
      await expect(
        page.getByRole('button', { name: 'Salamence' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Salamence' }).click()
    })

    await test.step('See matchup viewer sections and selected pokemon', async () => {
      await expect(
        page.getByRole('heading', { name: 'Swampert vs Salamence' }),
      ).toHaveCount(1)
      await expect(page.getByLabel('Matchup viewer')).toBeVisible()
      await expect(page.getByLabel('Your side')).toBeVisible()
      await expect(page.getByLabel('Opponent side')).toBeVisible()
      await expect(page.getByText('Threats to Salamence')).toBeVisible()
    })

    await test.step('Cycle team members and keep matchup UI interactive', async () => {
      await page.getByRole('button', { name: 'Next team member' }).click()
      await expect(
        page.getByRole('heading', { name: 'Manectric vs Salamence' }),
      ).toBeVisible()
    })
  })

  test('shows matchup viewer after selecting a gym leader team Pokémon', async ({
    page,
  }) => {
    await setupApiRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })

    await test.step('Open battle screen and switch to Gym Leader mode', async () => {
      await page.goto(APP_ENTRY_PATH)
      await page.getByRole('button', { name: 'Gym Leader' }).click()
      await expect(page.getByRole('button', { name: /Wattson/i })).toBeVisible()
    })

    await test.step('Select Wattson and click a team Pokémon', async () => {
      await page.getByRole('button', { name: /Wattson/i }).click()
      await expect(
        page.getByRole('button', { name: /manectric/i }),
      ).toBeVisible()
      await page.getByRole('button', { name: /manectric/i }).click()
    })

    await test.step('See matchup viewer render for selected Pokémon', async () => {
      await expect(
        page.getByRole('heading', { name: 'Swampert vs Manectric' }),
      ).toBeVisible()
      await expect(page.getByLabel('Matchup viewer')).toBeVisible()
    })
  })
})
