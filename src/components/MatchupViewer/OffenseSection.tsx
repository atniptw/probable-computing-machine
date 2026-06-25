import { useState } from 'react'

import type { MoveRecommendation } from '../../services/damageCalc'
import { MoveList, type MoveRow } from './MoveList'
import styles from './MatchupViewer.module.css'

interface OffenseSectionProps {
  opponentName: string
  superEffective: MoveRow[]
  notEffective: MoveRow[]
  moveRecommendations: MoveRecommendation[]
  attackerLevel: number | null
  defenderLevel: number | null
}

function indicator(multiplier: number): string {
  if (multiplier === 0) return '0x'
  if (multiplier >= 4) return '4x'
  if (multiplier >= 2) return '2x'
  if (multiplier === 1) return '1x'
  return '0.5x'
}

// Normalize a display name ("Ice Beam") and a raw move name ("ice-beam") to a
// common key so offense rows can be matched to their damage recommendation.
function moveKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function OffenseSection({
  opponentName,
  superEffective,
  notEffective,
  moveRecommendations,
  attackerLevel,
  defenderLevel,
}: OffenseSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const moveCount = superEffective.length + notEffective.length

  const recByKey = new Map(
    moveRecommendations.map((rec) => [moveKey(rec.moveName), rec]),
  )

  // Top move = highest damage floor among recommendations that have a range.
  let topKey: string | null = null
  let topMin = -1
  for (const rec of moveRecommendations) {
    if (rec.damageRange && rec.damageRange.min > topMin) {
      topMin = rec.damageRange.min
      topKey = moveKey(rec.moveName)
    }
  }

  function withDamage(rows: MoveRow[]): MoveRow[] {
    return rows.map((row) => {
      const rec = recByKey.get(moveKey(row.name))
      if (!rec) return row
      if (rec.damageRange) {
        return {
          ...row,
          damageRange: rec.damageRange,
          isTopMove: moveKey(row.name) === topKey,
        }
      }
      // Attacker level known but opponent level missing → show "?–? HP".
      if (
        attackerLevel !== null &&
        defenderLevel === null &&
        rec.basePower !== null
      ) {
        return { ...row, damageUnknown: true }
      }
      return row
    })
  }

  return (
    <section className={styles.sectionCard} aria-label="Offense section">
      <div className={styles.group}>
        <p className={styles.groupLabel}>🔥 Threats to {opponentName}</p>
        <MoveList
          moves={withDamage(superEffective)}
          showAll={showAll}
          emptyText="No common moves listed."
          indicator={indicator}
        />
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>🟢 {opponentName} Resists</p>
        <MoveList
          moves={withDamage(notEffective)}
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
