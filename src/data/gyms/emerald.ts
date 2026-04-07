export interface GymPokemon {
  name: string // PokéAPI name: lowercase, hyphenated
  level: number
}

export interface GymLeader {
  id: string
  name: string
  badge: number
  badgeName: string
  city: string
  type: string
  team: GymPokemon[]
}

export const EMERALD_GYMS: GymLeader[] = [
  {
    id: 'roxanne',
    name: 'Roxanne',
    badge: 1,
    badgeName: 'Stone Badge',
    city: 'Rustboro City',
    type: 'Rock',
    team: [
      { name: 'geodude', level: 14 },
      { name: 'geodude', level: 14 },
      { name: 'nosepass', level: 15 },
    ],
  },
  {
    id: 'brawly',
    name: 'Brawly',
    badge: 2,
    badgeName: 'Knuckle Badge',
    city: 'Dewford Town',
    type: 'Fighting',
    team: [
      { name: 'machop', level: 17 },
      { name: 'meditite', level: 17 },
      { name: 'makuhita', level: 19 },
    ],
  },
  {
    id: 'wattson',
    name: 'Wattson',
    badge: 3,
    badgeName: 'Dynamo Badge',
    city: 'Mauville City',
    type: 'Electric',
    team: [
      { name: 'voltorb', level: 20 },
      { name: 'electrike', level: 20 },
      { name: 'magneton', level: 22 },
      { name: 'manectric', level: 24 },
    ],
  },
  {
    id: 'flannery',
    name: 'Flannery',
    badge: 4,
    badgeName: 'Heat Badge',
    city: 'Lavaridge Town',
    type: 'Fire',
    team: [
      { name: 'numel', level: 26 },
      { name: 'slugma', level: 26 },
      { name: 'camerupt', level: 28 },
      { name: 'torkoal', level: 29 },
    ],
  },
  {
    id: 'norman',
    name: 'Norman',
    badge: 5,
    badgeName: 'Balance Badge',
    city: 'Petalburg City',
    type: 'Normal',
    team: [
      { name: 'spinda', level: 27 },
      { name: 'vigoroth', level: 27 },
      { name: 'linoone', level: 29 },
      { name: 'slaking', level: 31 },
    ],
  },
  {
    id: 'winona',
    name: 'Winona',
    badge: 6,
    badgeName: 'Feather Badge',
    city: 'Fortree City',
    type: 'Flying',
    team: [
      { name: 'swablu', level: 29 },
      { name: 'tropius', level: 29 },
      { name: 'pelipper', level: 30 },
      { name: 'skarmory', level: 31 },
      { name: 'altaria', level: 33 },
    ],
  },
  {
    id: 'tate-liza',
    name: 'Tate & Liza',
    badge: 7,
    badgeName: 'Mind Badge',
    city: 'Mossdeep City',
    type: 'Psychic',
    team: [
      { name: 'solrock', level: 42 },
      { name: 'lunatone', level: 42 },
    ],
  },
  {
    id: 'juan',
    name: 'Juan',
    badge: 8,
    badgeName: 'Rain Badge',
    city: 'Sootopolis City',
    type: 'Water',
    team: [
      { name: 'luvdisc', level: 41 },
      { name: 'whiscash', level: 41 },
      { name: 'sealeo', level: 43 },
      { name: 'crawdaunt', level: 43 },
      { name: 'kingdra', level: 46 },
    ],
  },
]

export function getGymsForGame(gameVersion: string): GymLeader[] {
  if (gameVersion === 'emerald') return EMERALD_GYMS
  return []
}

export function getGymById(
  gameVersion: string,
  gymId: string,
): GymLeader | null {
  return getGymsForGame(gameVersion).find((g) => g.id === gymId) ?? null
}
