import { useState } from 'react'

const TEAM_STORAGE_KEY = 'pmh_team_v1'

interface UseTeamConfigurationParams {
  defaultTeam: string[]
  gameLabel: string
  nameIndexReady: boolean
  onError: (message: string | null) => void
  pokemonNameSet: Set<string>
  teamSize: number
}

function toTeamSlots(values: string[], teamSize: number): string[] {
  const slots = Array.from({ length: teamSize }, () => '')
  values.slice(0, teamSize).forEach((name, index) => {
    slots[index] = name
  })
  return slots
}

function readConfiguredTeam(defaultTeam: string[], teamSize: number): string[] {
  const raw = localStorage.getItem(TEAM_STORAGE_KEY)
  if (!raw) return [...defaultTeam]
  try {
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return [...defaultTeam]
    return parsed
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, teamSize)
  } catch {
    return [...defaultTeam]
  }
}

export function useTeamConfiguration({
  defaultTeam,
  gameLabel,
  nameIndexReady,
  onError,
  pokemonNameSet,
  teamSize,
}: UseTeamConfigurationParams) {
  const [teamNames, setTeamNames] = useState<string[]>(() =>
    readConfiguredTeam(defaultTeam, teamSize),
  )
  const [teamDraft, setTeamDraft] = useState<string[]>(() =>
    toTeamSlots(readConfiguredTeam(defaultTeam, teamSize), teamSize),
  )
  const [teamSlotErrors, setTeamSlotErrors] = useState<(string | null)[]>(() =>
    Array.from({ length: teamSize }, () => null),
  )
  const [activeTeamSlot, setActiveTeamSlot] = useState<number | null>(null)

  function prepareTeamEditor(): void {
    setTeamDraft(toTeamSlots(teamNames, teamSize))
    setTeamSlotErrors(Array.from({ length: teamSize }, () => null))
    onError(null)
  }

  function updateTeamSlot(index: number, value: string): void {
    setTeamDraft((current) => {
      const next = [...current]
      next[index] = value
      return next
    })

    setTeamSlotErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })
  }

  function saveTeam(): boolean {
    if (!nameIndexReady) {
      onError(
        'Pokédex index is still loading. Please wait a moment and try again.',
      )
      return false
    }

    const normalized = teamDraft.map((slot) => slot.trim().toLowerCase())
    const nextErrors = normalized.map((name) => {
      if (!name) return null
      if (!pokemonNameSet.has(name)) return `Not available in ${gameLabel}.`
      return null
    })

    setTeamSlotErrors(nextErrors)

    if (nextErrors.some(Boolean)) {
      onError('Fix invalid team entries before continuing.')
      return false
    }

    const nextTeam = normalized.filter(Boolean)
    if (!nextTeam.length) {
      onError('Enter at least one valid Pokémon for your team.')
      return false
    }

    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(nextTeam))
    setTeamNames(nextTeam)
    setActiveTeamSlot(null)
    onError(null)
    return true
  }

  return {
    activeTeamSlot,
    prepareTeamEditor,
    saveTeam,
    setActiveTeamSlot,
    teamDraft,
    teamNames,
    teamSlotErrors,
    updateTeamSlot,
  }
}
