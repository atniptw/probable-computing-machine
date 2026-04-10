import type { BattleMode } from '../../App'
import styles from '../../App.module.css'
import { getGymById } from '../../data/gyms/emerald'
import GameVersionSelect from './GameVersionSelect'
import GymLeaderSelector from './GymLeaderSelector'
import GymTeamPanel from './GymTeamPanel'
import SuggestionList from './SuggestionList'

interface BattleSelectorSectionProps {
  selectedGameVersion: string
  onGameChange: (nextVersion: string) => void
  battleMode: BattleMode
  onBattleModeChange: (mode: BattleMode) => void
  selectedGymId: string | null
  onGymSelect: (gymId: string) => void
  opponentInput: string
  onOpponentInputChange: (value: string) => void
  normalizedOpponent: string
  exactMatchFound: boolean
  opponentSuggestions: string[]
  onSuggestionSelect: (name: string) => void
}

export default function BattleSelectorSection({
  selectedGameVersion,
  onGameChange,
  battleMode,
  onBattleModeChange,
  selectedGymId,
  onGymSelect,
  opponentInput,
  onOpponentInputChange,
  normalizedOpponent,
  exactMatchFound,
  opponentSuggestions,
  onSuggestionSelect,
}: BattleSelectorSectionProps) {
  const selectedGym = selectedGymId
    ? getGymById(selectedGameVersion, selectedGymId)
    : null

  return (
    <section className={styles.selectorSection}>
      <GameVersionSelect
        id="game-version"
        value={selectedGameVersion}
        onChange={onGameChange}
      />

      <div className={styles.modeToggle}>
        <button
          type="button"
          className={`${styles.modeToggleBtn}${battleMode === 'free' ? ` ${styles.modeToggleBtnActive}` : ''}`}
          onClick={() => onBattleModeChange('free')}
        >
          Free battle
        </button>
        <button
          type="button"
          className={`${styles.modeToggleBtn}${battleMode === 'gym' ? ` ${styles.modeToggleBtnActive}` : ''}`}
          onClick={() => onBattleModeChange('gym')}
        >
          Gym leader
        </button>
      </div>

      {battleMode === 'free' ? (
        <>
          <div className={styles.selectorLabel}>Opponent</div>
          <label className={styles.selectorRow} htmlFor="opponent-input">
            <input
              id="opponent-input"
              className={styles.selectorInput}
              value={opponentInput}
              onChange={(event) => onOpponentInputChange(event.target.value)}
              placeholder="Search Pokémon…"
              aria-label="Opponent Pokemon"
            />
          </label>

          {!!normalizedOpponent &&
            !exactMatchFound &&
            opponentSuggestions.length > 0 && (
              <SuggestionList
                ariaLabel="Opponent suggestions"
                suggestions={opponentSuggestions}
                onSelect={onSuggestionSelect}
              />
            )}
        </>
      ) : exactMatchFound && selectedGym ? (
        <div className={styles.gymSummaryBar} aria-label="Selected opponent">
          <span className={styles.gymSummaryLeader}>{selectedGym.name}</span>
          <span className={styles.gymSummarySep}>›</span>
          <span className={styles.gymSummaryPokemon}>{normalizedOpponent}</span>
          <button
            type="button"
            className={styles.gymSummaryClear}
            onClick={() => onOpponentInputChange('')}
            aria-label="Clear selection"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <div className={styles.selectorLabel}>Gym</div>
          <GymLeaderSelector
            gameVersion={selectedGameVersion}
            selectedGymId={selectedGymId}
            onSelect={onGymSelect}
          />
          {selectedGym && (
            <GymTeamPanel
              gymLeader={selectedGym}
              selectedOpponent={normalizedOpponent}
              onPokemonSelect={onOpponentInputChange}
            />
          )}
        </>
      )}
    </section>
  )
}
