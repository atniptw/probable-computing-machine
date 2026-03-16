import SummaryBar from './SummaryBar'
import MatchupGrid from './MatchupGrid'
import styles from './MatchupResults.module.css'

import type { MatchupResult } from '../../services/pokeapi'

interface MatchupResultsProps {
  result: MatchupResult
}

export default function MatchupResults({ result }: MatchupResultsProps) {
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
