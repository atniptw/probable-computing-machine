import MatchupCell from './MatchupCell.jsx'
import styles from './MatchupGrid.module.css'

export default function MatchupGrid({ matrix, yourTeam, opponentTeam }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.cornerCell}>You ↓ / Them →</th>
            {opponentTeam.map((p) => (
              <th key={p.name} className={styles.colHeader}>
                {p.name}
                <span className={styles.types}>{p.types.join(' / ')}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yourTeam.map((yours) => (
            <tr key={yours.name}>
              <th className={styles.rowHeader}>
                {yours.name}
                <span className={styles.types}>{yours.types.join(' / ')}</span>
              </th>
              {opponentTeam.map((theirs) => {
                const entry = matrix.find(
                  (e) => e.yours.name === yours.name && e.theirs.name === theirs.name,
                )
                return <MatchupCell key={theirs.name} entry={entry} />
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
