import styles from '../../App.module.css'
import GameVersionSelect from './GameVersionSelect'
import SuggestionList from './SuggestionList'

interface BattleSelectorSectionProps {
  selectedGameVersion: string
  onGameChange: (nextVersion: string) => void
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
  opponentInput,
  onOpponentInputChange,
  normalizedOpponent,
  exactMatchFound,
  opponentSuggestions,
  onSuggestionSelect,
}: BattleSelectorSectionProps) {
  return (
    <section className={styles.selectorSection}>
      <GameVersionSelect
        id="game-version"
        value={selectedGameVersion}
        onChange={onGameChange}
      />

      <div className={styles.selectorLabel}>Opponent</div>
      <label className={styles.selectorRow} htmlFor="opponent-input">
        <input
          id="opponent-input"
          className={styles.selectorInput}
          value={opponentInput}
          onChange={(event) => onOpponentInputChange(event.target.value)}
          placeholder="Type 2-3 letters"
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
    </section>
  )
}
