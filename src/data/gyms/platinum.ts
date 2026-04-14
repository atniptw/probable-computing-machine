import type { GymLeader } from './types'

export const PLATINUM_GYMS: GymLeader[] = [
  {
    id: 'roark',
    name: 'Roark',
    badge: 1,
    badgeName: 'Coal Badge',
    city: 'Oreburgh City',
    type: 'Rock',
    team: [
      {
        name: 'geodude',
        level: 12,
        moves: ['stealth-rock', 'tackle', 'defense-curl', 'mud-sport'],
      },
      {
        name: 'onix',
        level: 12,
        moves: ['stealth-rock', 'bind', 'rock-throw', 'screech'],
      },
      {
        name: 'cranidos',
        level: 14,
        moves: ['headbutt', 'leer', 'focus-energy', 'pursuit'],
      },
    ],
  },
  {
    id: 'gardenia',
    name: 'Gardenia',
    badge: 2,
    badgeName: 'Forest Badge',
    city: 'Eterna City',
    type: 'Grass',
    team: [
      {
        name: 'cherubi',
        level: 19,
        moves: ['leech-seed', 'growth', 'magical-leaf', 'grass-whistle'],
      },
      {
        name: 'turtwig',
        level: 19,
        moves: ['tackle', 'withdraw', 'mega-drain', 'curse'],
      },
      {
        name: 'roserade',
        level: 22,
        moves: ['mega-drain', 'magical-leaf', 'stun-spore', 'poison-sting'],
      },
    ],
  },
  {
    id: 'maylene',
    name: 'Maylene',
    badge: 3,
    badgeName: 'Cobble Badge',
    city: 'Veilstone City',
    type: 'Fighting',
    team: [
      {
        name: 'meditite',
        level: 27,
        moves: ['drain-punch', 'confusion', 'detect', 'bulk-up'],
      },
      {
        name: 'machoke',
        level: 27,
        moves: ['knock-off', 'vital-throw', 'seismic-toss', 'revenge'],
      },
      {
        name: 'lucario',
        level: 30,
        moves: ['drain-punch', 'quick-attack', 'force-palm', 'metal-claw'],
      },
    ],
  },
  {
    id: 'crasher-wake',
    name: 'Crasher Wake',
    badge: 4,
    badgeName: 'Fen Badge',
    city: 'Pastoria City',
    type: 'Water',
    team: [
      {
        name: 'gyarados',
        level: 33,
        moves: ['dragon-rage', 'ice-fang', 'aqua-tail', 'bite'],
      },
      {
        name: 'quagsire',
        level: 34,
        moves: ['mud-bomb', 'yawn', 'amnesia', 'mud-shot'],
      },
      {
        name: 'floatzel',
        level: 37,
        moves: ['aqua-jet', 'ice-fang', 'brine', 'crunch'],
      },
    ],
  },
  {
    id: 'fantina',
    name: 'Fantina',
    badge: 5,
    badgeName: 'Relic Badge',
    city: 'Hearthome City',
    type: 'Ghost',
    team: [
      {
        name: 'duskull',
        level: 36,
        moves: ['shadow-sneak', 'will-o-wisp', 'confuse-ray', 'protect'],
      },
      {
        name: 'haunter',
        level: 38,
        moves: ['destiny-bond', 'shadow-ball', 'hypnosis', 'mean-look'],
      },
      {
        name: 'mismagius',
        level: 40,
        moves: ['magical-leaf', 'psybeam', 'shadow-ball', 'confuse-ray'],
      },
    ],
  },
  {
    id: 'byron',
    name: 'Byron',
    badge: 6,
    badgeName: 'Mine Badge',
    city: 'Canalave City',
    type: 'Steel',
    team: [
      {
        name: 'magneton',
        level: 39,
        moves: ['supersonic', 'metal-sound', 'spark', 'thunder-wave'],
      },
      {
        name: 'steelix',
        level: 41,
        moves: ['screech', 'rock-tomb', 'iron-tail', 'sandstorm'],
      },
      {
        name: 'bastiodon',
        level: 41,
        moves: ['iron-defense', 'metal-burst', 'stone-edge', 'toxic'],
      },
    ],
  },
  {
    id: 'candice',
    name: 'Candice',
    badge: 7,
    badgeName: 'Icicle Badge',
    city: 'Snowpoint City',
    type: 'Ice',
    team: [
      {
        name: 'snover',
        level: 40,
        moves: ['grass-whistle', 'mist', 'ice-shard', 'razor-leaf'],
      },
      {
        name: 'sneasel',
        level: 42,
        moves: ['taunt', 'feint-attack', 'ice-shard', 'quick-attack'],
      },
      {
        name: 'medicham',
        level: 42,
        moves: ['drain-punch', 'confusion', 'ice-punch', 'detect'],
      },
      {
        name: 'abomasnow',
        level: 44,
        moves: ['blizzard', 'ice-shard', 'ingrain', 'wood-hammer'],
      },
    ],
  },
  {
    id: 'volkner',
    name: 'Volkner',
    badge: 8,
    badgeName: 'Beacon Badge',
    city: 'Sunyshore City',
    type: 'Electric',
    team: [
      {
        name: 'jolteon',
        level: 46,
        moves: ['thunder-wave', 'thunderbolt', 'quick-attack', 'shadow-ball'],
      },
      {
        name: 'raichu',
        level: 46,
        moves: ['thunderbolt', 'quick-attack', 'focus-blast', 'grass-knot'],
      },
      {
        name: 'luxray',
        level: 48,
        moves: ['thunder-fang', 'ice-fang', 'fire-fang', 'crunch'],
      },
      {
        name: 'electivire',
        level: 50,
        moves: ['thunder-punch', 'ice-punch', 'fire-punch', 'cross-chop'],
      },
    ],
  },
]
