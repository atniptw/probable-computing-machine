import { PLATINUM_GYMS } from './platinum'
import { RED_GYMS } from './red'

export interface GymPokemon {
  name: string // PokéAPI name: lowercase, hyphenated
  level: number
  moves: string[] // PokéAPI move names: lowercase, hyphenated
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
      {
        name: 'geodude',
        level: 14,
        moves: ['tackle', 'defense-curl', 'mud-sport', 'rock-throw'],
      },
      {
        name: 'geodude',
        level: 14,
        moves: ['tackle', 'defense-curl', 'mud-sport', 'rock-throw'],
      },
      {
        name: 'nosepass',
        level: 15,
        moves: ['tackle', 'harden', 'rock-throw', 'block'],
      },
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
      {
        name: 'machop',
        level: 17,
        moves: ['low-kick', 'leer', 'focus-energy', 'karate-chop'],
      },
      {
        name: 'meditite',
        level: 17,
        moves: ['bide', 'meditate', 'confusion', 'detect'],
      },
      {
        name: 'makuhita',
        level: 19,
        moves: ['arm-thrust', 'fake-out', 'vital-throw', 'whirlwind'],
      },
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
      {
        name: 'voltorb',
        level: 20,
        moves: ['charge', 'spark', 'rollout', 'screech'],
      },
      {
        name: 'electrike',
        level: 20,
        moves: ['leer', 'howl', 'spark', 'quick-attack'],
      },
      {
        name: 'magneton',
        level: 22,
        moves: ['metal-sound', 'supersonic', 'thunder-wave', 'spark'],
      },
      {
        name: 'manectric',
        level: 24,
        moves: ['leer', 'howl', 'spark', 'quick-attack'],
      },
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
      {
        name: 'numel',
        level: 26,
        moves: ['ember', 'magnitude', 'focus-energy', 'tackle'],
      },
      {
        name: 'slugma',
        level: 26,
        moves: ['smog', 'ember', 'rock-throw', 'harden'],
      },
      {
        name: 'camerupt',
        level: 28,
        moves: ['ember', 'magnitude', 'focus-energy', 'amnesia'],
      },
      {
        name: 'torkoal',
        level: 29,
        moves: ['body-slam', 'protect', 'flamethrower', 'attract'],
      },
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
      {
        name: 'spinda',
        level: 27,
        moves: ['teeter-dance', 'psybeam', 'facade', 'encore'],
      },
      {
        name: 'vigoroth',
        level: 27,
        moves: ['slash', 'encore', 'uproar', 'facade'],
      },
      {
        name: 'linoone',
        level: 29,
        moves: ['headbutt', 'belly-drum', 'facade', 'slash'],
      },
      {
        name: 'slaking',
        level: 31,
        moves: ['yawn', 'encore', 'facade', 'swagger'],
      },
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
      {
        name: 'swablu',
        level: 29,
        moves: ['peck', 'astonish', 'sing', 'fury-attack'],
      },
      {
        name: 'tropius',
        level: 29,
        moves: ['magical-leaf', 'stomp', 'sweet-scent', 'whirlwind'],
      },
      {
        name: 'pelipper',
        level: 30,
        moves: ['water-gun', 'supersonic', 'wing-attack', 'protect'],
      },
      {
        name: 'skarmory',
        level: 31,
        moves: ['fury-attack', 'feint-attack', 'aerial-ace', 'steel-wing'],
      },
      {
        name: 'altaria',
        level: 33,
        moves: ['dragon-breath', 'take-down', 'aerial-ace', 'dragon-dance'],
      },
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
      {
        name: 'solrock',
        level: 42,
        moves: ['light-screen', 'psywave', 'rock-slide', 'solar-beam'],
      },
      {
        name: 'lunatone',
        level: 42,
        moves: ['reflect', 'psywave', 'ice-beam', 'calm-mind'],
      },
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
      {
        name: 'luvdisc',
        level: 41,
        moves: ['charm', 'water-pulse', 'attract', 'sweet-kiss'],
      },
      {
        name: 'whiscash',
        level: 41,
        moves: ['tickle', 'water-pulse', 'amnesia', 'earthquake'],
      },
      {
        name: 'sealeo',
        level: 43,
        moves: ['water-pulse', 'body-slam', 'aurora-beam', 'ice-ball'],
      },
      {
        name: 'crawdaunt',
        level: 43,
        moves: ['taunt', 'water-pulse', 'crabhammer', 'swords-dance'],
      },
      {
        name: 'kingdra',
        level: 46,
        moves: ['smokescreen', 'water-pulse', 'dragon-dance', 'double-team'],
      },
    ],
  },
]

export function getGymsForGame(gameVersion: string): GymLeader[] {
  if (gameVersion === 'emerald') return EMERALD_GYMS
  if (gameVersion === 'platinum') return PLATINUM_GYMS
  if (gameVersion === 'red') return RED_GYMS
  return []
}

export function getGymById(
  gameVersion: string,
  gymId: string,
): GymLeader | null {
  return getGymsForGame(gameVersion).find((g) => g.id === gymId) ?? null
}
