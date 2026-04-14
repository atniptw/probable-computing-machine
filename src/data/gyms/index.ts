export type { GymLeader, GymPokemon } from './types'

import { BLACK2_GYMS } from './black-2'
import { CRYSTAL_GYMS } from './crystal'
import { EMERALD_GYMS } from './emerald'
import { PLATINUM_GYMS } from './platinum'
import { RED_GYMS } from './red'
import { SWORD_GYMS } from './sword'
import { ULTRA_SUN_GYMS } from './ultra-sun'
import type { GymLeader } from './types'

const GAME_MAP: Record<string, GymLeader[]> = {
  emerald: EMERALD_GYMS,
  'black-2': BLACK2_GYMS,
  crystal: CRYSTAL_GYMS,
  platinum: PLATINUM_GYMS,
  red: RED_GYMS,
  sword: SWORD_GYMS,
  'ultra-sun': ULTRA_SUN_GYMS,
}

export function getGymsForGame(gameVersion: string): GymLeader[] {
  return GAME_MAP[gameVersion] ?? []
}

export function getGymById(
  gameVersion: string,
  gymId: string,
): GymLeader | null {
  return getGymsForGame(gameVersion).find((g) => g.id === gymId) ?? null
}
