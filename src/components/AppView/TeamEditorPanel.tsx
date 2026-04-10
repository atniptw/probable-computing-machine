import { useState, type KeyboardEvent } from 'react'

import styles from '../../App.module.css'
import SuggestionList from './SuggestionList'
import { toTitleCase } from '../../utils/format'

interface TeamEditorPanelProps {
  teamDraft: string[]
  teamMovesDraft: string[][]
  teamSlotErrors: (string | null)[]
  teamMoveErrors: (string | null)[]
  activeTeamSlot: number | null
  getSuggestions: (query: string) => string[]
  getMoveSuggestions: (query: string) => string[]
  onSlotChange: (index: number, value: string) => void
  onAddMove: (index: number, value: string) => boolean
  onRemoveMove: (index: number, moveIndex: number) => void
  onSlotFocus: (index: number) => void
  onSlotBlur: (index: number) => void
  onSuggestionSelect: (index: number, name: string) => void
}

export default function TeamEditorPanel({
  teamDraft,
  teamMovesDraft,
  teamSlotErrors,
  teamMoveErrors,
  activeTeamSlot,
  getSuggestions,
  getMoveSuggestions,
  onSlotChange,
  onAddMove,
  onRemoveMove,
  onSlotFocus,
  onSlotBlur,
  onSuggestionSelect,
}: TeamEditorPanelProps) {
  const [activeMoveSlot, setActiveMoveSlot] = useState<number | null>(null)
  const [moveInputDrafts, setMoveInputDrafts] = useState<string[]>(() =>
    Array.from({ length: teamDraft.length }, () => ''),
  )

  function updateMoveInput(index: number, value: string): void {
    setMoveInputDrafts((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  function handleAddMove(index: number, value: string): void {
    if (!onAddMove(index, value)) return

    setMoveInputDrafts((current) => {
      const next = [...current]
      next[index] = ''
      return next
    })
    setActiveMoveSlot(null)
  }

  function handleMoveKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key !== 'Enter') return
    event.preventDefault()
    handleAddMove(index, moveInputDrafts[index] ?? '')
  }

  return (
    <section className={styles.configurePanel}>
      <div className={styles.configureGrid}>
        {teamDraft.map((slot, index) => {
          const suggestions = getSuggestions(slot)
          const moves = teamMovesDraft[index] ?? []
          const moveQuery = moveInputDrafts[index] ?? ''
          const moveSuggestions = getMoveSuggestions(moveQuery).filter(
            (move) => !moves.includes(move),
          )

          return (
            <div className={styles.teamSlot} key={`team-slot-${index}`}>
              <label htmlFor={`team-slot-${index}`}>
                Team slot {index + 1}
              </label>
              <input
                id={`team-slot-${index}`}
                className={`${styles.teamInput} ${teamSlotErrors[index] ? styles.teamInputError : ''}`}
                value={slot}
                onChange={(event) => onSlotChange(index, event.target.value)}
                onFocus={() => onSlotFocus(index)}
                onBlur={() => onSlotBlur(index)}
                placeholder={`Pokemon ${index + 1}`}
                aria-label={`Team slot ${index + 1}`}
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

              <label htmlFor={`team-slot-moves-${index}`}>
                Moves (optional)
              </label>

              {moves.length > 0 && (
                <div className={styles.moveChipList}>
                  {moves.map((move, moveIndex) => (
                    <div
                      className={styles.moveChip}
                      key={`${move}-${moveIndex}`}
                    >
                      <span>{toTitleCase(move)}</span>
                      <button
                        type="button"
                        className={styles.moveChipButton}
                        onClick={() => onRemoveMove(index, moveIndex)}
                        aria-label={`Remove ${toTitleCase(move)} from team slot ${index + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.moveInputRow}>
                <input
                  id={`team-slot-moves-${index}`}
                  className={`${styles.teamInput} ${teamMoveErrors[index] ? styles.teamInputError : ''}`}
                  value={moveQuery}
                  onChange={(event) =>
                    updateMoveInput(index, event.target.value)
                  }
                  onFocus={() => setActiveMoveSlot(index)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setActiveMoveSlot((current) =>
                        current === index ? null : current,
                      )
                    }, 120)
                  }}
                  onKeyDown={(event) => handleMoveKeyDown(index, event)}
                  placeholder={
                    moves.length >= 4 ? 'Move limit reached' : 'Type a move'
                  }
                  aria-label={`Add move for team slot ${index + 1}`}
                  disabled={moves.length >= 4}
                />

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => handleAddMove(index, moveQuery)}
                  disabled={moves.length >= 4}
                >
                  Add Move
                </button>
              </div>

              {activeMoveSlot === index &&
                !!moveQuery.trim() &&
                moveSuggestions.length > 0 && (
                  <SuggestionList
                    ariaLabel={`Move suggestions for team slot ${index + 1}`}
                    suggestions={moveSuggestions}
                    onSelect={(move) => handleAddMove(index, move)}
                  />
                )}

              {teamMoveErrors[index] && (
                <span className={styles.fieldError} role="alert">
                  {teamMoveErrors[index]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
