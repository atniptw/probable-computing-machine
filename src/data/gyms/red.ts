import type { GymLeader } from './emerald'

export const RED_GYMS: GymLeader[] = [
  {
    id: 'brock',
    name: 'Brock',
    badge: 1,
    badgeName: 'Boulder Badge',
    city: 'Pewter City',
    type: 'Rock',
    team: [
      {
        name: 'geodude',
        level: 12,
        moves: ['tackle', 'defense-curl'],
      },
      {
        name: 'onix',
        level: 14,
        moves: ['tackle', 'screech'],
      },
    ],
  },
  {
    id: 'misty',
    name: 'Misty',
    badge: 2,
    badgeName: 'Cascade Badge',
    city: 'Cerulean City',
    type: 'Water',
    team: [
      {
        name: 'staryu',
        level: 18,
        moves: ['tackle', 'harden', 'water-gun', 'bubblebeam'],
      },
      {
        name: 'starmie',
        level: 21,
        moves: ['tackle', 'harden', 'water-gun', 'bubblebeam'],
      },
    ],
  },
  {
    id: 'lt-surge',
    name: 'Lt. Surge',
    badge: 3,
    badgeName: 'Thunder Badge',
    city: 'Vermilion City',
    type: 'Electric',
    team: [
      {
        name: 'voltorb',
        level: 21,
        moves: ['tackle', 'screech', 'sonic-boom'],
      },
      {
        name: 'pikachu',
        level: 18,
        moves: ['thundershock', 'growl', 'quick-attack', 'thunder-wave'],
      },
      {
        name: 'raichu',
        level: 24,
        moves: ['thundershock', 'growl', 'thunder-wave', 'mega-punch'],
      },
    ],
  },
  {
    id: 'erika',
    name: 'Erika',
    badge: 4,
    badgeName: 'Rainbow Badge',
    city: 'Celadon City',
    type: 'Grass',
    team: [
      {
        name: 'victreebel',
        level: 29,
        moves: ['wrap', 'acid', 'stun-spore', 'razor-leaf'],
      },
      {
        name: 'tangela',
        level: 24,
        moves: ['constrict', 'absorb', 'growth', 'poisonpowder'],
      },
      {
        name: 'vileplume',
        level: 29,
        moves: ['sleep-powder', 'stun-spore', 'acid', 'petal-dance'],
      },
    ],
  },
  {
    id: 'koga',
    name: 'Koga',
    badge: 5,
    badgeName: 'Soul Badge',
    city: 'Fuchsia City',
    type: 'Poison',
    team: [
      {
        name: 'koffing',
        level: 37,
        moves: ['smog', 'smokescreen', 'sludge', 'haze'],
      },
      {
        name: 'muk',
        level: 39,
        moves: ['disable', 'pound', 'minimize', 'screech'],
      },
      {
        name: 'koffing',
        level: 37,
        moves: ['smog', 'smokescreen', 'sludge', 'haze'],
      },
      {
        name: 'weezing',
        level: 43,
        moves: ['smog', 'smokescreen', 'sludge', 'haze'],
      },
    ],
  },
  {
    id: 'sabrina',
    name: 'Sabrina',
    badge: 6,
    badgeName: 'Marsh Badge',
    city: 'Saffron City',
    type: 'Psychic',
    team: [
      {
        name: 'mr-mime',
        level: 37,
        moves: ['psybeam', 'substitute', 'meditate', 'psychic'],
      },
      {
        name: 'kadabra',
        level: 38,
        moves: ['kinesis', 'recover', 'psywave', 'psychic'],
      },
      {
        name: 'venomoth',
        level: 38,
        moves: ['leech-life', 'stun-spore', 'sleep-powder', 'psychic'],
      },
      {
        name: 'alakazam',
        level: 43,
        moves: ['kinesis', 'recover', 'headbutt', 'psychic'],
      },
    ],
  },
  {
    id: 'blaine',
    name: 'Blaine',
    badge: 7,
    badgeName: 'Volcano Badge',
    city: 'Cinnabar Island',
    type: 'Fire',
    team: [
      {
        name: 'growlithe',
        level: 42,
        moves: ['ember', 'leer', 'agility', 'fire-blast'],
      },
      {
        name: 'ponyta',
        level: 40,
        moves: ['ember', 'stomp', 'fire-spin', 'take-down'],
      },
      {
        name: 'rapidash',
        level: 42,
        moves: ['fire-spin', 'stomp', 'take-down', 'agility'],
      },
      {
        name: 'arcanine',
        level: 47,
        moves: ['ember', 'leer', 'flamethrower', 'fire-blast'],
      },
    ],
  },
  {
    id: 'giovanni',
    name: 'Giovanni',
    badge: 8,
    badgeName: 'Earth Badge',
    city: 'Viridian City',
    type: 'Ground',
    team: [
      {
        name: 'rhyhorn',
        level: 45,
        moves: ['horn-attack', 'stomp', 'fury-attack', 'horn-drill'],
      },
      {
        name: 'dugtrio',
        level: 42,
        moves: ['scratch', 'dig', 'sand-attack', 'slash'],
      },
      {
        name: 'nidoqueen',
        level: 44,
        moves: ['double-kick', 'body-slam', 'fury-swipes', 'earthquake'],
      },
      {
        name: 'nidoking',
        level: 45,
        moves: ['horn-attack', 'poison-sting', 'thrash', 'earthquake'],
      },
      {
        name: 'rhydon',
        level: 50,
        moves: ['horn-attack', 'stomp', 'fury-attack', 'earthquake'],
      },
    ],
  },
]
