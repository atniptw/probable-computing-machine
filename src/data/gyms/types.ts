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
