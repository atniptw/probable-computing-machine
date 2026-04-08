import type { Page, Route } from '@playwright/test'

export const APP_ENTRY_PATH = '/'

type PokemonRouteHandler = (route: Route) => void | Promise<void>

async function defaultPokemonHandler(route: Route): Promise<void> {
  const name = (
    route.request().url().split('/').pop() ?? 'unknown'
  ).toLowerCase()
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
      types: types.map((type, index) => ({
        slot: index + 1,
        type: { name: type },
      })),
      past_types: [],
      sprites: { front_default: null },
    }),
  })
}

export async function setupApiRoutes(
  page: Page,
  pokemonHandler: PokemonRouteHandler = defaultPokemonHandler,
): Promise<void> {
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
          half_damage_to: [
            { name: 'electric' },
            { name: 'grass' },
            { name: 'dragon' },
          ],
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
          double_damage_to: [
            { name: 'ground' },
            { name: 'fire' },
            { name: 'rock' },
          ],
          half_damage_to: [
            { name: 'water' },
            { name: 'grass' },
            { name: 'dragon' },
          ],
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

  await page.route('**/api/v2/pokemon/*', pokemonHandler)
}
