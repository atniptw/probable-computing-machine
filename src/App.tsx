import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GAME_VERSION, getGameDefinition } from './data/games'
import { getGymById } from './data/gyms/emerald'
import BattleSelectorSection from './components/AppView/BattleSelectorSection'

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
  const [battleMode, setBattleMode] = useState<BattleMode>('free')
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null)

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

  const opponentMoves = useMemo(() => {
    if (battleMode !== 'gym' || !selectedGymId || !normalizedOpponent) return []
    const gym = getGymById(selectedGameVersion, selectedGymId)
    const gymPokemon = gym?.team.find((p) => p.name === normalizedOpponent)
    return gymPokemon?.moves ?? []
  }, [battleMode, selectedGymId, normalizedOpponent, selectedGameVersion])

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
    setError(null)
    resetTeam(nextGame.version, nextGame.defaultTeam)
  }

  function handleBattleModeChange(mode: BattleMode): void {
    setBattleMode(mode)
    setOpponentInput('')
    setSelectedGymId(null)
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
          battleMode={battleMode}
          onBattleModeChange={handleBattleModeChange}
          selectedGymId={selectedGymId}
          onGymSelect={setSelectedGymId}
          opponentInput={opponentInput}
          onOpponentInputChange={setOpponentInput}
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
            onSave={() => {
              if (saveTeam()) {
                setScreen('battle')
              }
            }}
            saveDisabled={!nameIndexReady}
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
            onError={setError}
          />
        )}
      </main>
    </div>
  )
}
