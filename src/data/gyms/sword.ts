import type { GymLeader } from './types'

export const SWORD_GYMS: GymLeader[] = [
  {
    id: 'milo',
    name: 'Milo',
    badge: 1,
    badgeName: 'Grass Badge',
    city: 'Turffield',
    type: 'Grass',
    team: [
      {
        name: 'gossifleur',
        level: 19,
        moves: ['round', 'rapid-spin', 'magical-leaf', 'stun-spore'],
      },
      {
        name: 'eldegoss',
        level: 20,
        moves: ['round', 'rapid-spin', 'magical-leaf', 'cotton-spore'],
      },
    ],
  },
  {
    id: 'nessa',
    name: 'Nessa',
    badge: 2,
    badgeName: 'Water Badge',
    city: 'Hulbury',
    type: 'Water',
    team: [
      {
        name: 'goldeen',
        level: 22,
        moves: ['peck', 'tail-whip', 'supersonic', 'water-pulse'],
      },
      {
        name: 'arrokuda',
        level: 23,
        moves: ['bite', 'aqua-jet', 'crunch', 'hone-claws'],
      },
      {
        name: 'drednaw',
        level: 24,
        moves: ['bite', 'water-gun', 'headbutt', 'razor-shell'],
      },
    ],
  },
  {
    id: 'kabu',
    name: 'Kabu',
    badge: 3,
    badgeName: 'Fire Badge',
    city: 'Motostoke',
    type: 'Fire',
    team: [
      {
        name: 'ninetales',
        level: 25,
        moves: ['quick-attack', 'ember', 'will-o-wisp', 'confuse-ray'],
      },
      {
        name: 'arcanine',
        level: 25,
        moves: ['bite', 'ember', 'leer', 'fire-fang'],
      },
      {
        name: 'centiskorch',
        level: 27,
        moves: ['smokescreen', 'fire-spin', 'steamroller', 'coil'],
      },
    ],
  },
  {
    id: 'bea',
    name: 'Bea',
    badge: 4,
    badgeName: 'Fighting Badge',
    city: 'Stow-on-Side',
    type: 'Fighting',
    team: [
      {
        name: 'hitmontop',
        level: 34,
        moves: ['rolling-kick', 'triple-kick', 'rapid-spin', 'counter'],
      },
      {
        name: 'pangoro',
        level: 34,
        moves: ['arm-thrust', 'work-up', 'slash', 'night-slash'],
      },
      {
        name: 'machamp',
        level: 36,
        moves: ['cross-chop', 'scary-face', 'strength', 'knock-off'],
      },
    ],
  },
  {
    id: 'opal',
    name: 'Opal',
    badge: 5,
    badgeName: 'Fairy Badge',
    city: 'Ballonlea',
    type: 'Fairy',
    team: [
      {
        name: 'weezing-galar',
        level: 36,
        moves: ['tackle', 'smog', 'smokescreen', 'strange-steam'],
      },
      {
        name: 'mawile',
        level: 36,
        moves: ['astonish', 'bite', 'iron-head', 'play-rough'],
      },
      {
        name: 'togekiss',
        level: 38,
        moves: ['air-slash', 'ancient-power', 'dazzling-gleam', 'aura-sphere'],
      },
      {
        name: 'alcremie',
        level: 38,
        moves: [
          'sweet-kiss',
          'draining-kiss',
          'misty-terrain',
          'dazzling-gleam',
        ],
      },
    ],
  },
  {
    id: 'gordie',
    name: 'Gordie',
    badge: 6,
    badgeName: 'Rock Badge',
    city: 'Circhester',
    type: 'Rock',
    team: [
      {
        name: 'barbaracle',
        level: 40,
        moves: ['rock-slide', 'smack-down', 'cross-chop', 'slash'],
      },
      {
        name: 'shuckle',
        level: 40,
        moves: ['rollout', 'rock-throw', 'encore', 'gastro-acid'],
      },
      {
        name: 'stonjourner',
        level: 41,
        moves: ['rock-throw', 'rock-polish', 'rock-slide', 'body-press'],
      },
      {
        name: 'coalossal',
        level: 42,
        moves: ['rock-slide', 'flamethrower', 'ancient-power', 'tar-shot'],
      },
    ],
  },
  {
    id: 'piers',
    name: 'Piers',
    badge: 7,
    badgeName: 'Dark Badge',
    city: 'Spikemuth',
    type: 'Dark',
    team: [
      {
        name: 'scrafty',
        level: 44,
        moves: ['fake-out', 'brick-break', 'crunch', 'scary-face'],
      },
      {
        name: 'malamar',
        level: 45,
        moves: ['foul-play', 'night-slash', 'topsy-turvy', 'swagger'],
      },
      {
        name: 'skuntank',
        level: 45,
        moves: ['crunch', 'night-slash', 'flamethrower', 'toxic'],
      },
      {
        name: 'obstagoon',
        level: 46,
        moves: ['night-slash', 'facade', 'hyper-voice', 'parting-shot'],
      },
    ],
  },
  {
    id: 'raihan',
    name: 'Raihan',
    badge: 8,
    badgeName: 'Dragon Badge',
    city: 'Hammerlocke',
    type: 'Dragon',
    team: [
      {
        name: 'gigalith',
        level: 46,
        moves: ['stealth-rock', 'rock-slide', 'heavy-slam', 'explosion'],
      },
      {
        name: 'sandaconda',
        level: 46,
        moves: ['sandstorm', 'coil', 'slam', 'earth-power'],
      },
      {
        name: 'flygon',
        level: 47,
        moves: ['dragon-claw', 'earthquake', 'crunch', 'rock-slide'],
      },
      {
        name: 'duraludon',
        level: 48,
        moves: ['dragon-pulse', 'flash-cannon', 'metal-sound', 'thunder'],
      },
    ],
  },
]
