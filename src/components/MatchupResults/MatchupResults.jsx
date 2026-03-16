import SummaryBar from './SummaryBar.jsx'
import MatchupGrid from './MatchupGrid.jsx'
import styles from './MatchupResults.module.css'

export default function MatchupResults({ result }) {
  return (
    <div className={styles.results}>
      <h2 className={styles.heading}>Matchup Results</h2>
      <SummaryBar summary={result.summary} />
      <MatchupGrid
        matrix={result.matrix}
        yourTeam={result.yourTeam}
        opponentTeam={result.opponentTeam}
      />
    </div>
  )
}
