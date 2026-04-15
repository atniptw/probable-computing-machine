import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GAME_VERSION, getGameDefinition } from './data/games'
import { getGymById } from './data/gyms'
import { getWildMoveset } from './services/pokeapi'
import BattleSelectorSection from './components/AppView/BattleSelectorSection'
import ErrorBoundary from './components/ErrorBoundary'

export type BattleMode = 'free' | 'gym'
import TeamConfigurationSection from './components/AppView/TeamConfigurationSection'
import TeamEditorPanel from './components/AppView/TeamEditorPanel'
import MatchupContainer from './components/MatchupViewer/MatchupContainer'
import { useMoveNameIndex } from './hooks/useMoveNameIndex'
import { usePokemonNameIndex } from './hooks/usePokemonNameIndex'
import { usePokemonSuggestions } from './hooks/usePokemonSuggestions'
import { useTeamConfiguration } from './hooks/useTeamConfiguration'
import styles from './App.module.css'

const TEAM_SIZE = 6
const MAX_SUGGESTIONS = 20

type Screen = 'battle' | 'team'

function readSelectedGame(): string {
  const raw = localStorage.getItem('pmh_game_v1')?.trim().toLowerCase()
  if (!raw) return DEFAULT_GAME_VERSION
  return getGameDefinition(raw) ? raw : DEFAULT_GAME_VERSION
}

export default function App() {
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>(() =>
    readSelectedGame(),
  )
  const [screen, setScreen] = useState<Screen>('battle')
  const [opponentInput, setOpponentInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [battleMode, setBattleMode] = useState<BattleMode>('free')
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null)
  const [opponentLevel, setOpponentLevel] = useState<number | null>(null)
  const [wildOpponentMoves, setWildOpponentMoves] = useState<string[]>([])

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
  const { moveNameIndex } = useMoveNameIndex({ onError: setError })

  useEffect(() => {
    localStorage.setItem('pmh_game_v1', selectedGame.version)
  }, [selectedGame.version])

  const normalizedOpponent = opponentInput.trim().toLowerCase()
  const pokemonNameSet = useMemo(
    () => new Set(pokemonNameIndex),
    [pokemonNameIndex],
  )
  const exactMatchFound = pokemonNameSet.has(normalizedOpponent)

  useEffect(() => {
    if (battleMode !== 'free' || !exactMatchFound || !normalizedOpponent) return
    let cancelled = false
    getWildMoveset(
      normalizedOpponent,
      selectedGameVersion,
      opponentLevel ?? undefined,
    )
      .then((moves) => {
        if (!cancelled) setWildOpponentMoves(moves)
      })
      .catch(() => {
        if (!cancelled) setWildOpponentMoves([])
      })
    return () => {
      cancelled = true
    }
  }, [
    battleMode,
    exactMatchFound,
    normalizedOpponent,
    selectedGameVersion,
    opponentLevel,
  ])

  const opponentMoves = useMemo(() => {
    if (battleMode === 'gym') {
      if (!selectedGymId || !normalizedOpponent) return []
      const gym = getGymById(selectedGameVersion, selectedGymId)
      return gym?.team.find((p) => p.name === normalizedOpponent)?.moves ?? []
    }
    // Only return wild moves when there is an exact match to prevent showing
    // stale moves from a previous opponent while a new name is being typed.
    return exactMatchFound ? wildOpponentMoves : []
  }, [
    battleMode,
    selectedGymId,
    normalizedOpponent,
    selectedGameVersion,
    wildOpponentMoves,
    exactMatchFound,
  ])

  const {
    activeTeamSlot,
    addTeamMove,
    prepareTeamEditor,
    removeTeamMove,
    resetTeam,
    saveTeam,
    setActiveTeamSlot,
    teamDraft,
    teamMembers,
    teamMoveErrors,
    teamMovesDraft,
    teamNames,
    teamSlotErrors,
    updateTeamSlot,
  } = useTeamConfiguration({
    defaultTeam: selectedGame.defaultTeam,
    gameLabel: selectedGame.label,
    nameIndexReady,
    onError: setError,
    pokemonNameSet,
    teamSize: TEAM_SIZE,
    version: selectedGame.version,
  })

  const { getSuggestions } = usePokemonSuggestions({
    maxSuggestions: MAX_SUGGESTIONS,
    pokemonNameIndex,
  })
  const { getSuggestions: getMoveSuggestions } = usePokemonSuggestions({
    maxSuggestions: MAX_SUGGESTIONS,
    pokemonNameIndex: moveNameIndex,
  })

  const opponentSuggestions = getSuggestions(normalizedOpponent)

  function openTeamEditor(): void {
    prepareTeamEditor()
    setScreen('team')
  }

  function handleGameChange(nextVersion: string): void {
    const nextGame =
      getGameDefinition(nextVersion) ?? getGameDefinition(DEFAULT_GAME_VERSION)!
    setSelectedGameVersion(nextVersion)
    setBattleMode('free')
    setSelectedGymId(null)
    setOpponentInput('')
    setOpponentLevel(null)
    setWildOpponentMoves([])
    setError(null)
    resetTeam(nextGame.version, nextGame.defaultTeam)
  }

  function handleBattleModeChange(mode: BattleMode): void {
    setBattleMode(mode)
    setOpponentInput('')
    setOpponentLevel(null)
    setWildOpponentMoves([])
    setSelectedGymId(null)
  }

  function handleOpponentInputChange(value: string): void {
    setOpponentInput(value)
    setOpponentLevel(null)
    setWildOpponentMoves([])
  }

  function handleSave(): void {
    if (saveTeam()) {
      setScreen('battle')
      setSuccessMessage('Team saved')
      window.setTimeout(() => setSuccessMessage(null), 2000)
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Pokémon Matchup Helper</h1>
        <div className={styles.headerActions}>
          <a
            href="https://github.com/atniptw/probable-computing-machine/blob/main/docs/USER_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.headerIconLink}
            aria-label="Open user guide"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="9"
                cy="9"
                r="8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7 7c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.5-1.2 1.8L9 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="9" cy="13" r=".75" fill="currentColor" />
            </svg>
          </a>
          <a
            href="https://github.com/atniptw/probable-computing-machine/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.headerIconLink}
            aria-label="Report an issue"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <ellipse
                cx="9"
                cy="10.5"
                rx="3.5"
                ry="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="9"
                cy="5"
                r="1.75"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="5.5"
                y1="8.5"
                x2="2.5"
                y2="7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="5.5"
                y1="11"
                x2="2.5"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="5.5"
                y1="13.5"
                x2="2.5"
                y2="14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="12.5"
                y1="8.5"
                x2="15.5"
                y2="7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="12.5"
                y1="11"
                x2="15.5"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="12.5"
                y1="13.5"
                x2="15.5"
                y2="14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </a>
          {screen === 'battle' && (
            <button
              type="button"
              className={styles.editTeamButton}
              onClick={openTeamEditor}
            >
              Edit Team
            </button>
          )}
        </div>
      </header>

      {screen === 'battle' ? (
        <BattleSelectorSection
          selectedGameVersion={selectedGame.version}
          onGameChange={handleGameChange}
          battleMode={battleMode}
          onBattleModeChange={handleBattleModeChange}
          selectedGymId={selectedGymId}
          onGymSelect={setSelectedGymId}
          opponentInput={opponentInput}
          onOpponentInputChange={handleOpponentInputChange}
          normalizedOpponent={normalizedOpponent}
          exactMatchFound={exactMatchFound}
          opponentSuggestions={opponentSuggestions}
          onSuggestionSelect={setOpponentInput}
          opponentLevel={opponentLevel}
          onOpponentLevelChange={setOpponentLevel}
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

      {successMessage && (
        <div className={styles.successBanner} role="status">
          {successMessage}
        </div>
      )}

      <main className={styles.resultsPane}>
        <ErrorBoundary>
          {screen === 'team' ? (
            <TeamEditorPanel
              teamDraft={teamDraft}
              teamMovesDraft={teamMovesDraft}
              teamSlotErrors={teamSlotErrors}
              teamMoveErrors={teamMoveErrors}
              activeTeamSlot={activeTeamSlot}
              getSuggestions={getSuggestions}
              getMoveSuggestions={getMoveSuggestions}
              onSlotChange={updateTeamSlot}
              onAddMove={addTeamMove}
              onRemoveMove={removeTeamMove}
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
            />
          ) : (
            <MatchupContainer
              teamMembers={teamMembers}
              teamNames={teamNames}
              normalizedOpponent={normalizedOpponent}
              exactMatchFound={exactMatchFound}
              nameIndexReady={nameIndexReady}
              generation={selectedGame.generation}
              gameLabel={selectedGame.label}
              pokemonNameSet={pokemonNameSet}
              opponentMoves={opponentMoves}
              opponentSuggestions={opponentSuggestions}
              onError={setError}
            />
          )}
        </ErrorBoundary>
      </main>

      {screen === 'team' && (
        <div className={styles.teamFooter}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={!nameIndexReady}
          >
            Save Team
          </button>
        </div>
      )}

      <footer className={styles.disclaimerFooter}>
        Fan-made tool. Pokémon and all related names are © Nintendo / Game
        Freak. Not affiliated with or endorsed by Nintendo.
      </footer>
    </div>
  )
}
