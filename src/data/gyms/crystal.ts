import type { GymLeader } from './emerald'

export const CRYSTAL_GYMS: GymLeader[] = [
  {
    id: 'falkner',
    name: 'Falkner',
    badge: 1,
    badgeName: 'Zephyr Badge',
    city: 'Violet City',
    type: 'Flying',
    team: [
      { name: 'pidgey', level: 7, moves: ['tackle', 'sand-attack'] },
      { name: 'pidgeotto', level: 9, moves: ['tackle', 'sand-attack', 'gust'] },
    ],
  },
  {
    id: 'bugsy',
    name: 'Bugsy',
    badge: 2,
    badgeName: 'Hive Badge',
    city: 'Azalea Town',
    type: 'Bug',
    team: [
      {
        name: 'metapod',
        level: 14,
        moves: ['tackle', 'string-shot', 'harden'],
      },
      {
        name: 'kakuna',
        level: 14,
        moves: ['poison-sting', 'string-shot', 'harden'],
      },
      {
        name: 'scyther',
        level: 16,
        moves: ['quick-attack', 'leer', 'focus-energy', 'fury-cutter'],
      },
    ],
  },
  {
    id: 'whitney',
    name: 'Whitney',
    badge: 3,
    badgeName: 'Plain Badge',
    city: 'Goldenrod City',
    type: 'Normal',
    team: [
      {
        name: 'clefairy',
        level: 18,
        moves: ['metronome', 'sing', 'double-slap', 'minimize'],
      },
      {
        name: 'miltank',
        level: 20,
        moves: ['stomp', 'attract', 'milk-drink', 'rollout'],
      },
    ],
  },
  {
    id: 'morty',
    name: 'Morty',
    badge: 4,
    badgeName: 'Fog Badge',
    city: 'Ecruteak City',
    type: 'Ghost',
    team: [
      {
        name: 'gastly',
        level: 21,
        moves: ['hypnosis', 'lick', 'night-shade', 'mean-look'],
      },
      {
        name: 'haunter',
        level: 21,
        moves: ['hypnosis', 'lick', 'night-shade', 'mean-look'],
      },
      {
        name: 'haunter',
        level: 23,
        moves: ['hypnosis', 'lick', 'night-shade', 'mean-look'],
      },
      {
        name: 'gengar',
        level: 25,
        moves: ['hypnosis', 'lick', 'night-shade', 'mean-look'],
      },
    ],
  },
  {
    id: 'chuck',
    name: 'Chuck',
    badge: 5,
    badgeName: 'Storm Badge',
    city: 'Cianwood City',
    type: 'Fighting',
    team: [
      {
        name: 'primeape',
        level: 27,
        moves: ['low-kick', 'leer', 'focus-energy', 'karate-chop'],
      },
      {
        name: 'poliwrath',
        level: 30,
        moves: ['surf', 'body-slam', 'hypnosis', 'dynamic-punch'],
      },
    ],
  },
  {
    id: 'jasmine',
    name: 'Jasmine',
    badge: 6,
    badgeName: 'Mineral Badge',
    city: 'Olivine City',
    type: 'Steel',
    team: [
      {
        name: 'magnemite',
        level: 30,
        moves: ['thundershock', 'thunder-wave', 'sonicboom', 'swift'],
      },
      {
        name: 'magnemite',
        level: 30,
        moves: ['thundershock', 'thunder-wave', 'sonicboom', 'swift'],
      },
      {
        name: 'steelix',
        level: 35,
        moves: ['iron-tail', 'bind', 'screech', 'rock-throw'],
      },
    ],
  },
  {
    id: 'pryce',
    name: 'Pryce',
    badge: 7,
    badgeName: 'Glacier Badge',
    city: 'Mahogany Town',
    type: 'Ice',
    team: [
      {
        name: 'seel',
        level: 27,
        moves: ['icy-wind', 'headbutt', 'aurora-beam', 'rest'],
      },
      {
        name: 'dewgong',
        level: 29,
        moves: ['icy-wind', 'headbutt', 'aurora-beam', 'rest'],
      },
      {
        name: 'piloswine',
        level: 31,
        moves: ['icy-wind', 'mud-slap', 'blizzard', 'amnesia'],
      },
    ],
  },
  {
    id: 'clair',
    name: 'Clair',
    badge: 8,
    badgeName: 'Rising Badge',
    city: 'Blackthorn City',
    type: 'Dragon',
    team: [
      {
        name: 'dragonair',
        level: 37,
        moves: ['thunder-wave', 'agility', 'slam', 'dragon-breath'],
      },
      {
        name: 'dragonair',
        level: 37,
        moves: ['thunder-wave', 'agility', 'slam', 'dragon-breath'],
      },
      {
        name: 'dragonair',
        level: 37,
        moves: ['thunder-wave', 'agility', 'slam', 'dragon-breath'],
      },
      {
        name: 'kingdra',
        level: 40,
        moves: ['smokescreen', 'surf', 'hyper-beam', 'dragon-breath'],
      },
    ],
  },
]
