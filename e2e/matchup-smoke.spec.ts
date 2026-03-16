import { expect, test } from '@playwright/test'

test('user can submit two pokemon and see matchup results', async ({ page }) => {
  await page.route('**/api/v2/type?limit=100', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { name: 'electric', url: 'https://pokeapi.co/api/v2/type/electric' },
          { name: 'water', url: 'https://pokeapi.co/api/v2/type/water' },
        ],
      }),
    })
  })

  await page.route('**/api/v2/type/electric', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'electric',
        damage_relations: {
          double_damage_to: [{ name: 'water' }],
          half_damage_to: [{ name: 'electric' }],
          no_damage_to: [{ name: 'ground' }],
          double_damage_from: [{ name: 'ground' }],
          half_damage_from: [{ name: 'flying' }, { name: 'steel' }],
          no_damage_from: [],
        },
      }),
    })
  })

  await page.route('**/api/v2/type/water', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'water',
        damage_relations: {
          double_damage_to: [{ name: 'fire' }, { name: 'ground' }, { name: 'rock' }],
          half_damage_to: [{ name: 'water' }, { name: 'grass' }, { name: 'dragon' }],
          no_damage_to: [],
          double_damage_from: [{ name: 'electric' }, { name: 'grass' }],
          half_damage_from: [{ name: 'fire' }, { name: 'water' }, { name: 'ice' }, { name: 'steel' }],
          no_damage_from: [],
        },
      }),
    })
  })

  await page.route('**/api/v2/pokemon/pikachu', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'pikachu',
        types: [{ slot: 1, type: { name: 'electric' } }],
      }),
    })
  })

  await page.route('**/api/v2/pokemon/blastoise', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'blastoise',
        types: [{ slot: 1, type: { name: 'water' } }],
      }),
    })
  })

  await page.goto('/')

  await page.getByLabel('Pokémon 1').first().fill('pikachu')
  await page.getByLabel('Pokémon 1').nth(1).fill('blastoise')
  await page.getByRole('button', { name: 'Check Matchups' }).click()

  await expect(page.getByRole('heading', { name: 'Matchup Results' })).toBeVisible()
  await expect(page.getByText('Super effective: 1')).toBeVisible()
  await expect(page.getByText('2x')).toBeVisible()
  await expect(page.getByText('1x')).toBeVisible()
})
