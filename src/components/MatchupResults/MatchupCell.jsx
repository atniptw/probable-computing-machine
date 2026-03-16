import styles from './MatchupCell.module.css'

const LABEL_CLASS = {
  '2x': styles.super,
  '1x': styles.neutral,
  '0.5x': styles.weak,
  '0x': styles.immune,
}

export default function MatchupCell({ entry }) {
  if (!entry) return <td />
  return (
    <td className={styles.cell}>
      <span className={`${styles.badge} ${LABEL_CLASS[entry.youVsThem] ?? ''}`} title="You → Them">
        {entry.youVsThem}
      </span>
      <span className={`${styles.badge} ${LABEL_CLASS[entry.themVsYou] ?? ''} ${styles.inverse}`} title="Them → You">
        {entry.themVsYou}
      </span>
    </td>
  )
}
