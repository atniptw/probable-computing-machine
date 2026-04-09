export interface GameDefinition {
  version: string
  label: string
  generation: number
  defaultTeam: string[]
}

export const SUPPORTED_GAMES: GameDefinition[] = [
  { version: 'red', label: 'Pokémon Red', generation: 1, defaultTeam: [] },
  {
    version: 'crystal',
    label: 'Pokémon Crystal',
    generation: 2,
    defaultTeam: [],
  },
  {
    version: 'emerald',
    label: 'Pokémon Emerald',
    generation: 3,
    defaultTeam: [],
  },
  {
    version: 'platinum',
    label: 'Pokémon Platinum',
    generation: 4,
    defaultTeam: [],
  },
  {
    version: 'black-2',
    label: 'Pokémon Black 2',
    generation: 5,
    defaultTeam: [],
  },
  { version: 'x', label: 'Pokémon X', generation: 6, defaultTeam: [] },
  {
    version: 'ultra-sun',
    label: 'Pokémon Ultra Sun',
    generation: 7,
    defaultTeam: [],
  },
  { version: 'sword', label: 'Pokémon Sword', generation: 8, defaultTeam: [] },
  {
    version: 'scarlet',
    label: 'Pokémon Scarlet',
    generation: 9,
    defaultTeam: [],
  },
]

export const DEFAULT_GAME_VERSION = 'emerald'

export function getGameDefinition(version: string): GameDefinition | null {
  return SUPPORTED_GAMES.find((game) => game.version === version) ?? null
}
