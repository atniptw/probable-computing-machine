import styles from './SummaryBar.module.css'

import type { MatchupSummary } from '../../services/pokeapi'

interface SummaryBarProps {
  summary: MatchupSummary
}

export default function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className={styles.bar}>
      <span className={`${styles.badge} ${styles.super}`}>
        ⚡ Super effective: {summary.superEffective}
      </span>
      <span className={`${styles.badge} ${styles.neutral}`}>
        — Neutral: {summary.neutral}
      </span>
      <span className={`${styles.badge} ${styles.weak}`}>
        ↓ Not very effective: {summary.notVeryEffective}
      </span>
    </div>
  )
}
