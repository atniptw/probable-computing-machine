import { expect, test } from '@playwright/test'

test('user selects opponent and sees ranked matchup cards', async ({ page }) => {
  await page.route('**/api/v2/pokemon?limit=1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 2,
        results: [
          { name: 'salamence', url: 'https://pokeapi.co/api/v2/pokemon/373/' },
          { name: 'swampert', url: 'https://pokeapi.co/api/v2/pokemon/260/' },
        ],
      }),
    })
  })

  await page.route('**/api/v2/pokemon?limit=2', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 2,
        results: [
          { name: 'salamence', url: 'https://pokeapi.co/api/v2/pokemon/373/' },
          { name: 'swampert', url: 'https://pokeapi.co/api/v2/pokemon/260/' },
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

  await page.route('**/api/v2/pokemon/*', async (route) => {
    const name = route.request().url().split('/').pop() ?? 'unknown'
    const isOpponent = name.toLowerCase() === 'salamence'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name,
        types: [{ slot: 1, type: { name: isOpponent ? 'water' : 'electric' } }],
        sprites: { front_default: null },
      }),
    })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Save Team' })).toBeEnabled()
  await page.getByLabel('Team Pokemon 1').fill('swampert')
  await page.getByLabel('Team Pokemon 2').fill('')
  await page.getByLabel('Team Pokemon 3').fill('')
  await page.getByLabel('Team Pokemon 4').fill('')
  await page.getByLabel('Team Pokemon 5').fill('')
  await page.getByLabel('Team Pokemon 6').fill('')
  await page.getByRole('button', { name: 'Save Team' }).click()
  await expect(page.getByLabel('Opponent Pokemon')).toBeVisible()

  await page.getByLabel('Opponent Pokemon').fill('sala')
  await expect(page.getByRole('heading', { name: 'BEST' })).toHaveCount(0)

  await page.getByLabel('Opponent Pokemon').fill('salamence')

  await expect(page.getByRole('heading', { name: 'BEST' })).toBeVisible()
  await expect(page.getByText('swampert')).toBeVisible()
  const bestCard = page.getByRole('button', { name: /Best/i }).first()
  await bestCard.click()
  await expect(bestCard.getByText('Attack effectiveness:')).toBeVisible()
})
