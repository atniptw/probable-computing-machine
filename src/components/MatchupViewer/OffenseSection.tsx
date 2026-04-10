import { useState } from 'react'

import styles from './MatchupViewer.module.css'

interface MoveRow {
  name: string
  multiplier: number
}

interface OffenseSectionProps {
  opponentName: string
  superEffective: MoveRow[]
  notEffective: MoveRow[]
}

function indicator(multiplier: number): string {
  if (multiplier === 0) return '0x'
  if (multiplier >= 4) return '4x'
  if (multiplier >= 2) return '2x'
  if (multiplier === 1) return '1x'
  return '0.5x'
}

function indicatorClass(multiplier: number): string {
  if (multiplier === 0) return styles.moveIndicatorImmune
  if (multiplier < 1) return styles.moveIndicatorResisted
  if (multiplier > 1) return styles.moveIndicatorSuper
  return ''
}

function indicatorLabel(multiplier: number): string {
  const value = indicator(multiplier)
  if (multiplier === 0) return `immune, ${value}`
  if (multiplier < 1) return `resisted, ${value}`
  if (multiplier > 1) return `super effective, ${value}`
  return `neutral, ${value}`
}

function renderMoves(moves: MoveRow[], showAll: boolean): JSX.Element {
  if (!moves.length)
    return <p className={styles.summaryText}>No common moves listed.</p>

  const visibleMoves = showAll ? moves : moves.slice(0, 2)

  return (
    <ul className={styles.moveList}>
      {visibleMoves.map((move) => (
        <li className={styles.moveRow} key={move.name}>
          <span className={styles.moveName}>{move.name}</span>
          <span
            className={`${styles.moveIndicator} ${indicatorClass(move.multiplier)}`}
            aria-label={indicatorLabel(move.multiplier)}
          >
            {indicator(move.multiplier)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function OffenseSection({
  opponentName,
  superEffective,
  notEffective,
}: OffenseSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const moveCount = superEffective.length + notEffective.length

  return (
    <section className={styles.sectionCard} aria-label="Offense section">
      <div className={styles.group}>
        <p className={styles.groupLabel}>🔥 Threats to {opponentName}</p>
        {renderMoves(superEffective, showAll)}
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>🟢 {opponentName} Resists</p>
        {renderMoves(notEffective, showAll)}
      </div>

      {moveCount > 6 && (
        <button
          type="button"
          className={styles.compactToggle}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? 'Show fewer moves' : 'Show all moves'}
        </button>
      )}
    </section>
  )
}
