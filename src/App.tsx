import { useEffect, useMemo, useState } from 'react'
import {
  getPokemon,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
} from './services/pokeapi'
import {
  rankTeamAgainstOpponent,
  type RankedTeamBuckets,
} from './services/ranking'
import { DEFAULT_GAME_VERSION, getGameDefinition } from './data/games'
import BattleResultsPanel from './components/AppView/BattleResultsPanel'
import BattleSelectorSection from './components/AppView/BattleSelectorSection'
import TeamConfigurationSection from './components/AppView/TeamConfigurationSection'
import TeamEditorPanel from './components/AppView/TeamEditorPanel'
import { usePokemonNameIndex } from './hooks/usePokemonNameIndex'
import { usePokemonSuggestions } from './hooks/usePokemonSuggestions'
import { useTeamPreview } from './hooks/useTeamPreview'
import styles from './App.module.css'

const EMERALD_DEFAULT_TEAM = [
  'swampert',
  'manectric',
  'breloom',
  'gardevoir',
  'flygon',
  'salamence',
]
const TEAM_SIZE = 6
const MAX_SUGGESTIONS = 20

type Screen = 'battle' | 'team'

function createEmptyRankedBuckets(): RankedTeamBuckets {
  return {
    best: [],
    good: [],
    neutral: [],
    risky: [],
  }
}

function readConfiguredTeam(): string[] {
  const raw = localStorage.getItem('pmh_team_v1')
  if (!raw) return [...EMERALD_DEFAULT_TEAM]
  try {
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return [...EMERALD_DEFAULT_TEAM]
    return parsed
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, TEAM_SIZE)
  } catch {
    return [...EMERALD_DEFAULT_TEAM]
  }
}

function readSelectedGame(): string {
  const raw = localStorage.getItem('pmh_game_v1')?.trim().toLowerCase()
  if (!raw) return DEFAULT_GAME_VERSION
  return getGameDefinition(raw) ? raw : DEFAULT_GAME_VERSION
}

function toTeamSlots(values: string[]): string[] {
  const slots = Array.from({ length: TEAM_SIZE }, () => '')
  values.slice(0, TEAM_SIZE).forEach((name, index) => {
    slots[index] = name
  })
  return slots
}

export default function App() {
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>(() =>
    readSelectedGame(),
  )
  const [screen, setScreen] = useState<Screen>('battle')
  const [teamDraft, setTeamDraft] = useState<string[]>(() =>
    toTeamSlots(readConfiguredTeam()),
  )
  const [teamSlotErrors, setTeamSlotErrors] = useState<(string | null)[]>(() =>
    Array.from({ length: TEAM_SIZE }, () => null),
  )
  const [teamNames, setTeamNames] = useState<string[]>(() =>
    readConfiguredTeam(),
  )
  const [activeTeamSlot, setActiveTeamSlot] = useState<number | null>(null)
  const [opponentInput, setOpponentInput] = useState('')
  const [opponent, setOpponent] = useState<Awaited<
    ReturnType<typeof getPokemon>
  > | null>(null)
  const [rankedBuckets, setRankedBuckets] = useState<RankedTeamBuckets>(() =>
    createEmptyRankedBuckets(),
  )
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedGame = useMemo(() => {
    return (
      getGameDefinition(selectedGameVersion) ??
      getGameDefinition(DEFAULT_GAME_VERSION)!
    )
  }, [selectedGameVersion])

  const { pokemonNameIndex, nameIndexReady } = usePokemonNameIndex({
    generation: selectedGame.generation,
    label: selectedGame.label,
    version: selectedGame.version,
    onError: setError,
  })

  const { teamPreview } = useTeamPreview({
    generation: selectedGame.generation,
    teamNames,
  })

  useEffect(() => {
    localStorage.setItem('pmh_game_v1', selectedGame.version)
  }, [selectedGame.version])

  const normalizedOpponent = opponentInput.trim().toLowerCase()
  const pokemonNameSet = useMemo(
    () => new Set(pokemonNameIndex),
    [pokemonNameIndex],
  )
  const exactMatchFound = pokemonNameSet.has(normalizedOpponent)

  const { getSuggestions } = usePokemonSuggestions({
    maxSuggestions: MAX_SUGGESTIONS,
    pokemonNameIndex,
  })

  const opponentSuggestions = getSuggestions(normalizedOpponent)

  function clearMatchupResults(): void {
    setOpponent(null)
    setRankedBuckets(createEmptyRankedBuckets())
  }

  function openTeamEditor(): void {
    setTeamDraft(toTeamSlots(teamNames))
    setTeamSlotErrors(Array.from({ length: TEAM_SIZE }, () => null))
    setError(null)
    setScreen('team')
  }

  useEffect(() => {
    if (!pokemonNameIndex.length) return

    const teamStillValid = teamNames.every((name) => pokemonNameSet.has(name))
    if (!teamStillValid) {
      clearMatchupResults()
      setError(
        `Your saved team has Pokémon outside the ${selectedGame.label} Pokédex. Tap Edit Team to fix it.`,
      )
    }
  }, [pokemonNameIndex.length, pokemonNameSet, selectedGame.label, teamNames])

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

  function saveTeam(): void {
    if (!nameIndexReady) {
      setError(
        'Pokédex index is still loading. Please wait a moment and try again.',
      )
      return
    }

    const normalized = teamDraft.map((slot) => slot.trim().toLowerCase())
    const nextErrors = normalized.map((name) => {
      if (!name) return null
      if (!pokemonNameSet.has(name))
        return `Not available in ${selectedGame.label}.`
      return null
    })

    setTeamSlotErrors(nextErrors)

    if (nextErrors.some(Boolean)) {
      setError('Fix invalid team entries before continuing.')
      return
    }

    const nextTeam = normalized.filter(Boolean)
    if (!nextTeam.length) {
      setError('Enter at least one valid Pokémon for your team.')
      return
    }

    localStorage.setItem('pmh_team_v1', JSON.stringify(nextTeam))
    setTeamNames(nextTeam)
    setScreen('battle')
    setError(null)
    setActiveTeamSlot(null)
  }

  useEffect(() => {
    if (screen !== 'battle') {
      setLoading(false)
      return
    }

    if (!normalizedOpponent) {
      clearMatchupResults()
      setError(null)
      return
    }

    if (!nameIndexReady) return

    if (!exactMatchFound) {
      clearMatchupResults()
      setError(null)
      return
    }

    if (!teamNames.length) {
      clearMatchupResults()
      setError(null)
      return
    }

    const invalidSavedTeam = teamNames.some((name) => !pokemonNameSet.has(name))
    if (invalidSavedTeam) {
      clearMatchupResults()
      setError(
        `Your saved team has Pokémon outside the ${selectedGame.label} Pokédex.`,
      )
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const [typeMap, opponentPokemon, teamPokemon] = await Promise.all([
          getTypeMap({ generation: selectedGame.generation }),
          getPokemon(normalizedOpponent, {
            generation: selectedGame.generation,
          }),
          Promise.all(
            teamNames.map((name) =>
              getPokemon(name, { generation: selectedGame.generation }),
            ),
          ),
        ])

        if (cancelled) return

        const nextRanked = rankTeamAgainstOpponent(
          teamPokemon,
          opponentPokemon,
          typeMap,
        )

        setOpponent(opponentPokemon)
        setRankedBuckets(nextRanked)
        setShowOtherOptions(false)
      } catch (err) {
        if (cancelled) return
        if (err instanceof PokemonNotFoundError) {
          setError('Pokémon not found. Please select a valid name.')
        } else if (err instanceof RateLimitError) {
          setError('Rate limit reached. Please wait a moment and try again.')
        } else {
          setError('Network error. Please check your connection and try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    exactMatchFound,
    nameIndexReady,
    normalizedOpponent,
    pokemonNameSet,
    screen,
    selectedGame.generation,
    selectedGame.label,
    teamNames,
  ])

  function handleGameChange(nextVersion: string): void {
    setSelectedGameVersion(nextVersion)
    setOpponentInput('')
    clearMatchupResults()
    setShowOtherOptions(false)
    setError(null)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Pokémon Matchup Helper</h1>
        {screen === 'battle' && (
          <button
            type="button"
            className={styles.editTeamButton}
            onClick={openTeamEditor}
          >
            Edit Team
          </button>
        )}
      </header>

      {screen === 'battle' ? (
        <BattleSelectorSection
          selectedGameVersion={selectedGame.version}
          onGameChange={handleGameChange}
          opponentInput={opponentInput}
          onOpponentInputChange={(value) => {
            setOpponentInput(value)
            setShowOtherOptions(false)
          }}
          normalizedOpponent={normalizedOpponent}
          exactMatchFound={exactMatchFound}
          opponentSuggestions={opponentSuggestions}
          onSuggestionSelect={setOpponentInput}
        />
      ) : (
        <TeamConfigurationSection
          selectedGameVersion={selectedGame.version}
          onGameChange={handleGameChange}
          onBack={() => {
            setScreen('battle')
            setError(null)
          }}
        />
      )}

      {error && (
        <div className={styles.banner} role="alert">
          {error}
        </div>
      )}

      <main className={styles.resultsPane}>
        {screen === 'team' ? (
          <TeamEditorPanel
            teamDraft={teamDraft}
            teamSlotErrors={teamSlotErrors}
            activeTeamSlot={activeTeamSlot}
            getSuggestions={getSuggestions}
            onSlotChange={updateTeamSlot}
            onSlotFocus={setActiveTeamSlot}
            onSlotBlur={(index) => {
              window.setTimeout(() => {
                setActiveTeamSlot((current) =>
                  current === index ? null : current,
                )
              }, 120)
            }}
            onSuggestionSelect={(index, name) => {
              updateTeamSlot(index, name)
              setActiveTeamSlot(null)
            }}
            onSave={saveTeam}
            saveDisabled={!nameIndexReady}
          />
        ) : (
          <BattleResultsPanel
            teamNames={teamNames}
            normalizedOpponent={normalizedOpponent}
            loading={loading}
            hasOpponent={opponent !== null}
            rankedBuckets={rankedBuckets}
            selectedGameLabel={selectedGame.label}
            showOtherOptions={showOtherOptions}
            onToggleOtherOptions={() =>
              setShowOtherOptions((current) => !current)
            }
            teamPreview={teamPreview}
            onEditTeam={openTeamEditor}
          />
        )}
      </main>
    </div>
  )
}
