import { useState } from 'react'

import { MoveList, MoveRow } from './MoveList'
import styles from './MatchupViewer.module.css'

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
        <MoveList
          moves={superEffective}
          showAll={showAll}
          emptyText="No common moves listed."
          indicator={indicator}
        />
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>🟢 {opponentName} Resists</p>
        <MoveList
          moves={notEffective}
          showAll={showAll}
          emptyText="No common moves listed."
          indicator={indicator}
        />
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
