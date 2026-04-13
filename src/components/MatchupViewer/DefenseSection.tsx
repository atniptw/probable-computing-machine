import { useState } from 'react'

import { MoveList, MoveRow } from './MoveList'
import styles from './MatchupViewer.module.css'

interface DefenseSectionProps {
  playerName: string
  dangerous: MoveRow[]
  resisted: MoveRow[]
}

function indicator(multiplier: number): string {
  if (multiplier === 0) return '0x'
  if (multiplier > 1) return '2x'
  if (multiplier === 1) return '1x'
  return '0.5x'
}

export default function DefenseSection({
  playerName,
  dangerous,
  resisted,
}: DefenseSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const threatCount = dangerous.length + resisted.length

  return (
    <section className={styles.sectionCard} aria-label="Defense section">
      <div className={styles.group}>
        <p className={styles.groupLabel}>🔴 Threats to {playerName}</p>
        <MoveList
          moves={dangerous}
          showAll={showAll}
          emptyText="No common threats listed."
          indicator={indicator}
        />
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>🟢 {playerName} Resists</p>
        <MoveList
          moves={resisted}
          showAll={showAll}
          emptyText="No common threats listed."
          indicator={indicator}
        />
      </div>

      {threatCount > 6 && (
        <button
          type="button"
          className={styles.compactToggle}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? 'Show fewer threats' : 'Show all threats'}
        </button>
      )}
    </section>
  )
}
