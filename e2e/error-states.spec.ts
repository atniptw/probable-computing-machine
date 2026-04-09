import { expect, test } from '@playwright/test'

import { APP_ENTRY_PATH, seedTeam, setupApiRoutes } from './helpers'

test.describe('Error states', () => {
  test('shows error banner when saved team contains a pokemon outside the pokedex', async ({
    page,
  }) => {
    // Seed localStorage with an invalid team before the app initialises
    await page.addInitScript(() => {
      localStorage.setItem(
        'pmh_team_v1',
        JSON.stringify({ members: [{ name: 'charizard', moves: [] }] }),
      )
    })
    await setupApiRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ENTRY_PATH)

    // The validation fires once the pokedex loads and charizard is not found
    await expect(page.getByRole('alert')).toContainText(
      'outside the Pokémon Emerald Pokedex',
    )
  })

  test('shows error banner when the pokemon API returns 404', async ({
    page,
  }) => {
    await seedTeam(page, 'emerald', ['swampert'])
    await setupApiRoutes(page, async (route) => {
      await route.fulfill({ status: 404 })
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ENTRY_PATH)

    // Typeahead still works (uses the pokedex index, not the pokemon endpoint)
    await page.getByLabel('Opponent Pokemon').fill('swam')
    await expect(page.getByRole('button', { name: 'Swampert' })).toBeVisible()
    await page.getByRole('button', { name: 'Swampert' }).click()

    // Matchup fetch hits 404 → not-found banner
    await expect(page.getByRole('alert')).toContainText('Pokemon not found')
  })
})
