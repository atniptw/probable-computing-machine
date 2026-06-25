import type { JSX } from 'react'

import type { DamageRange } from '../../services/damageCalc'
import styles from './MatchupViewer.module.css'

export interface MoveRow {
  name: string
  multiplier: number
  // Damage calc (D3). Present only for the attacker's own configured moves.
  damageRange?: DamageRange | null
  // Attacker level known but opponent level unknown → show "?–? HP".
  damageUnknown?: boolean
  isTopMove?: boolean
}

interface MoveListProps {
  moves: MoveRow[]
  showAll: boolean
  emptyText: string
  indicator: (multiplier: number) => string
}

function indicatorClass(multiplier: number): string {
  if (multiplier === 0) return styles.moveIndicatorImmune
  if (multiplier < 1) return styles.moveIndicatorResisted
  if (multiplier > 1) return styles.moveIndicatorSuper
  return ''
}

function indicatorLabel(
  multiplier: number,
  indicator: (m: number) => string,
): string {
  const value = indicator(multiplier)
  if (multiplier === 0) return `immune, ${value}`
  if (multiplier < 1) return `resisted, ${value}`
  if (multiplier > 1) return `super effective, ${value}`
  return `neutral, ${value}`
}

export function MoveList({
  moves,
  showAll,
  emptyText,
  indicator,
}: MoveListProps): JSX.Element {
  if (!moves.length) return <p className={styles.summaryText}>{emptyText}</p>

  const visibleMoves = showAll ? moves : moves.slice(0, 2)

  return (
    <ul className={styles.moveList}>
      {visibleMoves.map((move) => (
        <li
          className={`${styles.moveRow} ${move.isTopMove ? styles.topMove : ''}`}
          key={move.name}
          data-top-move={move.isTopMove ? 'true' : undefined}
        >
          <span className={styles.moveName}>{move.name}</span>
          {move.damageRange ? (
            <span
              className={styles.moveDamage}
              title={`crit: ${move.damageRange.critMin}–${move.damageRange.critMax} HP`}
            >
              {move.damageRange.min}–{move.damageRange.max} HP
            </span>
          ) : move.damageUnknown ? (
            <span
              className={styles.moveDamage}
              title="Enter the opponent's level for a damage estimate"
            >
              ?–? HP
            </span>
          ) : null}
          <span
            className={`${styles.moveIndicator} ${indicatorClass(move.multiplier)}`}
            aria-label={indicatorLabel(move.multiplier, indicator)}
          >
            {indicator(move.multiplier)}
          </span>
        </li>
      ))}
    </ul>
  )
}
