import { expect, test } from '@playwright/test'

test.describe('Battle Screen - Primary recommendation flow', () => {
  test('shows one best choice after typeahead opponent selection', async ({ page }) => {
    await page.route('**/api/v2/version/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'emerald',
          version_group: { name: 'ruby-sapphire' },
        }),
      })
    })

    await page.route('**/api/v2/version-group/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generation: { name: 'generation-iii' },
          pokedexes: [{ name: 'hoenn' }],
        }),
      })
    })

    await page.route('**/api/v2/pokedex/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pokemon_entries: [
            { pokemon_species: { name: 'swampert' } },
            { pokemon_species: { name: 'manectric' } },
            { pokemon_species: { name: 'breloom' } },
            { pokemon_species: { name: 'gardevoir' } },
            { pokemon_species: { name: 'flygon' } },
            { pokemon_species: { name: 'salamence' } },
          ],
        }),
      })
    })

    await page.route('**/api/v2/type?limit=100', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { name: 'electric', url: 'https://pokeapi.co/api/v2/type/electric' },
            { name: 'water', url: 'https://pokeapi.co/api/v2/type/water' },
            { name: 'ground', url: 'https://pokeapi.co/api/v2/type/ground' },
            { name: 'grass', url: 'https://pokeapi.co/api/v2/type/grass' },
          ],
        }),
      })
    })

    await page.route('**/api/v2/type/electric', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          damage_relations: {
            double_damage_to: [{ name: 'water' }, { name: 'flying' }],
            half_damage_to: [{ name: 'electric' }, { name: 'grass' }, { name: 'dragon' }],
            no_damage_to: [{ name: 'ground' }],
          },
        }),
      })
    })

    await page.route('**/api/v2/type/water', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          damage_relations: {
            double_damage_to: [{ name: 'ground' }, { name: 'fire' }, { name: 'rock' }],
            half_damage_to: [{ name: 'water' }, { name: 'grass' }, { name: 'dragon' }],
            no_damage_to: [],
          },
        }),
      })
    })

    await page.route('**/api/v2/type/ground', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          damage_relations: {
            double_damage_to: [{ name: 'electric' }],
            half_damage_to: [{ name: 'grass' }],
            no_damage_to: [{ name: 'flying' }],
          },
        }),
      })
    })

    await page.route('**/api/v2/type/grass', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          damage_relations: {
            double_damage_to: [{ name: 'water' }, { name: 'ground' }],
            half_damage_to: [{ name: 'fire' }, { name: 'grass' }],
            no_damage_to: [],
          },
        }),
      })
    })

    await page.route('**/api/v2/pokemon/*', async (route) => {
      const name = (route.request().url().split('/').pop() ?? 'unknown').toLowerCase()
      const typeByPokemon: Record<string, string[]> = {
        swampert: ['water', 'ground'],
        manectric: ['electric'],
        breloom: ['grass'],
        gardevoir: ['psychic'],
        flygon: ['dragon'],
        salamence: ['dragon', 'flying'],
      }
      const types = typeByPokemon[name] ?? ['normal']

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name,
          types: types.map((type, index) => ({ slot: index + 1, type: { name: type } })),
          past_types: [],
          sprites: { front_default: null },
        }),
      })
    })

    await page.setViewportSize({ width: 390, height: 844 })

    await test.step('Open battle screen and type opponent query', async () => {
      await page.goto('/')
      await expect(page.getByLabel('Game Version')).toHaveValue('emerald')
      await page.getByLabel('Opponent Pokemon').fill('sala')
      await expect(page.getByRole('button', { name: 'Salamence' })).toBeVisible()
      await page.getByRole('button', { name: 'Salamence' }).click()
    })

    await test.step('See one highlighted best choice and collapsed secondary options', async () => {
      await expect(page.getByText('Best Choice')).toHaveCount(1)
      await expect(page.getByText('Based on Pokémon Emerald type effectiveness rules')).toHaveCount(1)
      await expect(page.getByRole('button', { name: /Show other options/i })).toHaveCount(1)
      await expect(page.getByText('Risky')).toHaveCount(0)
    })

    await test.step('Expand other options and verify grouped sections', async () => {
      await page.getByRole('button', { name: /Show other options/i }).click()
      await expect(page.getByRole('heading', { name: /Also Good|Neutral|Risky/ }).first()).toBeVisible()
    })
  })
})
