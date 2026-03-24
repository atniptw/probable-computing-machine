import styles from '../../App.module.css'
import SuggestionList from './SuggestionList'

interface TeamEditorPanelProps {
  teamDraft: string[]
  teamSlotErrors: (string | null)[]
  activeTeamSlot: number | null
  getSuggestions: (query: string) => string[]
  onSlotChange: (index: number, value: string) => void
  onSlotFocus: (index: number) => void
  onSlotBlur: (index: number) => void
  onSuggestionSelect: (index: number, name: string) => void
  onSave: () => void
  saveDisabled: boolean
}

export default function TeamEditorPanel({
  teamDraft,
  teamSlotErrors,
  activeTeamSlot,
  getSuggestions,
  onSlotChange,
  onSlotFocus,
  onSlotBlur,
  onSuggestionSelect,
  onSave,
  saveDisabled,
}: TeamEditorPanelProps) {
  return (
    <section className={styles.configurePanel}>
      <div className={styles.configureGrid}>
        {teamDraft.map((slot, index) => {
          const suggestions = getSuggestions(slot)

          return (
            <div className={styles.teamSlot} key={`team-slot-${index}`}>
              <label htmlFor={`team-slot-${index}`}>
                Team Slot {index + 1}
              </label>
              <input
                id={`team-slot-${index}`}
                className={`${styles.teamInput} ${teamSlotErrors[index] ? styles.teamInputError : ''}`}
                value={slot}
                onChange={(event) => onSlotChange(index, event.target.value)}
                onFocus={() => onSlotFocus(index)}
                onBlur={() => onSlotBlur(index)}
                placeholder={`Pokemon ${index + 1}`}
                aria-label={`Team Slot ${index + 1}`}
              />

              {activeTeamSlot === index &&
                !!slot.trim() &&
                suggestions.length > 0 && (
                  <SuggestionList
                    ariaLabel={`Suggestions for team slot ${index + 1}`}
                    suggestions={suggestions}
                    onSelect={(name) => onSuggestionSelect(index, name)}
                  />
                )}

              {teamSlotErrors[index] && (
                <span className={styles.fieldError} role="alert">
                  {teamSlotErrors[index]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={onSave}
        disabled={saveDisabled}
      >
        Save Team
      </button>
    </section>
  )
}
