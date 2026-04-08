import { useMemo, useRef, useState } from 'react'

const TEAM_STORAGE_KEY = 'pmh_team_v1'
const MAX_MOVES_PER_MEMBER = 4

export interface TeamMemberConfig {
  name: string
  moves: string[]
}

interface StoredTeamPayload {
  members: TeamMemberConfig[]
}

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

function toMoveSlots(
  members: TeamMemberConfig[],
  teamSize: number,
): string[][] {
  const slots = Array.from({ length: teamSize }, () => []) as string[][]
  members.slice(0, teamSize).forEach((member, index) => {
    slots[index] = [...member.moves]
  })
  return slots
}

function normalizeMoveName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeMoveList(values: string[]): string[] {
  return values
    .map(normalizeMoveName)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, MAX_MOVES_PER_MEMBER)
}

function normalizeMember(member: TeamMemberConfig): TeamMemberConfig {
  return {
    name: member.name.trim().toLowerCase(),
    moves: normalizeMoveList(member.moves),
  }
}

function toMembersFromNames(
  values: string[],
  teamSize: number,
): TeamMemberConfig[] {
  return values
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, teamSize)
    .map((name) => ({ name, moves: [] }))
}

function readConfiguredTeam(
  defaultTeam: string[],
  teamSize: number,
): TeamMemberConfig[] {
  const raw = localStorage.getItem(TEAM_STORAGE_KEY)
  if (!raw) return toMembersFromNames(defaultTeam, teamSize)

  try {
    const parsed = JSON.parse(raw) as StoredTeamPayload | string[]

    if (Array.isArray(parsed)) {
      return toMembersFromNames(parsed, teamSize)
    }

    if (!parsed || !Array.isArray(parsed.members)) {
      return toMembersFromNames(defaultTeam, teamSize)
    }

    return parsed.members
      .map(normalizeMember)
      .filter((member) => Boolean(member.name))
      .slice(0, teamSize)
  } catch {
    return toMembersFromNames(defaultTeam, teamSize)
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
  const [teamMembers, setTeamMembers] = useState<TeamMemberConfig[]>(() =>
    readConfiguredTeam(defaultTeam, teamSize),
  )
  const [teamDraft, setTeamDraft] = useState<string[]>(() => {
    const configured = readConfiguredTeam(defaultTeam, teamSize)
    return toTeamSlots(
      configured.map((member) => member.name),
      teamSize,
    )
  })
  const [teamMovesDraft, setTeamMovesDraft] = useState<string[][]>(() =>
    toMoveSlots(readConfiguredTeam(defaultTeam, teamSize), teamSize),
  )
  const [teamSlotErrors, setTeamSlotErrors] = useState<(string | null)[]>(() =>
    Array.from({ length: teamSize }, () => null),
  )
  const [teamMoveErrors, setTeamMoveErrors] = useState<(string | null)[]>(() =>
    Array.from({ length: teamSize }, () => null),
  )
  const [activeTeamSlot, setActiveTeamSlot] = useState<number | null>(null)
  const teamDraftRef = useRef(teamDraft)
  const teamMovesDraftRef = useRef(teamMovesDraft)
  const teamNames = useMemo(
    () => teamMembers.map((member) => member.name),
    [teamMembers],
  )

  function prepareTeamEditor(): void {
    const nextTeamDraft = toTeamSlots(teamNames, teamSize)
    const nextMoveDraft = toMoveSlots(teamMembers, teamSize)

    teamDraftRef.current = nextTeamDraft
    teamMovesDraftRef.current = nextMoveDraft
    setTeamDraft(nextTeamDraft)
    setTeamMovesDraft(nextMoveDraft)
    setTeamSlotErrors(Array.from({ length: teamSize }, () => null))
    setTeamMoveErrors(Array.from({ length: teamSize }, () => null))
    onError(null)
  }

  function updateTeamSlot(index: number, value: string): void {
    setTeamDraft((current) => {
      const next = [...current]
      next[index] = value
      teamDraftRef.current = next
      return next
    })

    setTeamMoveErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })

    setTeamSlotErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })
  }

  function addTeamMove(index: number, value: string): boolean {
    const normalizedMove = normalizeMoveName(value)
    if (!normalizedMove) return false

    if (!teamDraftRef.current[index]?.trim()) {
      setTeamMoveErrors((current) => {
        const next = [...current]
        next[index] = 'Add a Pokemon in this slot before adding moves.'
        return next
      })
      return false
    }

    const currentMoves = teamMovesDraftRef.current[index] ?? []
    if (currentMoves.includes(normalizedMove)) {
      setTeamMoveErrors((current) => {
        const next = [...current]
        next[index] = 'That move is already added.'
        return next
      })
      return false
    }

    if (currentMoves.length >= MAX_MOVES_PER_MEMBER) {
      setTeamMoveErrors((current) => {
        const next = [...current]
        next[index] = `Use up to ${MAX_MOVES_PER_MEMBER} moves per Pokemon.`
        return next
      })
      return false
    }

    setTeamMovesDraft((current) => {
      const next = current.map((moves) => [...moves])
      next[index] = [...(next[index] ?? []), normalizedMove]
      teamMovesDraftRef.current = next
      return next
    })

    setTeamSlotErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })

    setTeamMoveErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })

    return true
  }

  function removeTeamMove(index: number, moveIndex: number): void {
    setTeamMovesDraft((current) => {
      const next = current.map((moves) => [...moves])
      next[index] = (next[index] ?? []).filter(
        (_, currentIndex) => currentIndex !== moveIndex,
      )
      teamMovesDraftRef.current = next
      return next
    })

    setTeamMoveErrors((current) => {
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
    const parsedMoveDrafts = teamMovesDraft.map(normalizeMoveList)

    const nextErrors = normalized.map((name) => {
      if (!name) return null
      if (!pokemonNameSet.has(name)) return `Not available in ${gameLabel}.`
      return null
    })

    const nextMoveErrors = parsedMoveDrafts.map((moves, index) => {
      if (!normalized[index] && moves.length > 0) {
        return 'Add a Pokemon in this slot before adding moves.'
      }

      if (moves.length > MAX_MOVES_PER_MEMBER) {
        return `Use up to ${MAX_MOVES_PER_MEMBER} moves per Pokemon.`
      }

      return null
    })

    setTeamSlotErrors(nextErrors)
    setTeamMoveErrors(nextMoveErrors)

    if (nextErrors.some(Boolean) || nextMoveErrors.some(Boolean)) {
      onError('Fix invalid team entries before continuing.')
      return false
    }

    const nextTeam = normalized
      .map((name, index) => ({
        name,
        moves: parsedMoveDrafts[index],
      }))
      .filter((member) => Boolean(member.name))

    if (!nextTeam.length) {
      onError('Enter at least one valid Pokémon for your team.')
      return false
    }

    localStorage.setItem(
      TEAM_STORAGE_KEY,
      JSON.stringify({ members: nextTeam }),
    )
    setTeamMembers(nextTeam)
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
    teamMembers,
    teamMoveErrors,
    teamMovesDraft,
    teamNames,
    teamSlotErrors,
    addTeamMove,
    removeTeamMove,
    updateTeamSlot,
  }
}
