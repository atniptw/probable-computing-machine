export interface GameDefinition {
  version: string
  label: string
  generation: number
}

export const SUPPORTED_GAMES: GameDefinition[] = [
  { version: 'red', label: 'Pokémon Red', generation: 1 },
  { version: 'crystal', label: 'Pokémon Crystal', generation: 2 },
  { version: 'emerald', label: 'Pokémon Emerald', generation: 3 },
  { version: 'platinum', label: 'Pokémon Platinum', generation: 4 },
  { version: 'black-2', label: 'Pokémon Black 2', generation: 5 },
  { version: 'x', label: 'Pokémon X', generation: 6 },
  { version: 'ultra-sun', label: 'Pokémon Ultra Sun', generation: 7 },
  { version: 'sword', label: 'Pokémon Sword', generation: 8 },
  { version: 'scarlet', label: 'Pokémon Scarlet', generation: 9 },
]

export const DEFAULT_GAME_VERSION = 'emerald'

export function getGameDefinition(version: string): GameDefinition | null {
  return SUPPORTED_GAMES.find((game) => game.version === version) ?? null
}
