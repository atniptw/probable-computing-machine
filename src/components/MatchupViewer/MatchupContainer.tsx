import { useState, type TouchEvent } from 'react'

import { toTitleCase } from '../../utils/format'
import { useMatchupMatrix } from '../../hooks/useMatchupMatrix'
import type { TeamMemberConfig } from '../../hooks/useTeamConfiguration'
import styles from './MatchupViewer.module.css'
import DefenseSection from './DefenseSection'
import OffenseSection from './OffenseSection'
import PokemonCard from './PokemonCard'

interface MatchupContainerProps {
  exactMatchFound: boolean
  gameLabel: string
  generation: number
  nameIndexReady: boolean
  normalizedOpponent: string
  onError: (message: string | null) => void
  opponentMoves?: string[]
  opponentSuggestions: string[]
  pokemonNameSet: Set<string>
  teamMembers: TeamMemberConfig[]
  teamNames: string[]
}

const SWIPE_THRESHOLD = 40

function positiveModulo(value: number, mod: number): number {
  if (mod === 0) return 0
  return ((value % mod) + mod) % mod
}

export default function MatchupContainer({
  exactMatchFound,
  gameLabel,
  generation,
  nameIndexReady,
  normalizedOpponent,
  onError,
  opponentMoves,
  opponentSuggestions,
  pokemonNameSet,
  teamMembers,
  teamNames,
}: MatchupContainerProps) {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  )

  const { loading, matchup } = useMatchupMatrix({
    exactMatchFound,
    gameLabel,
    generation,
    nameIndexReady,
    normalizedOpponent,
    onError,
    opponentMoves,
    pokemonNameSet,
    selectedTeamIndex,
    teamMembers,
    teamNames,
  })

  function cycle(delta: number): void {
    setSelectedTeamIndex((current) =>
      positiveModulo(current + delta, Math.max(teamNames.length, 1)),
    )
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>): void {
    const first = event.changedTouches[0]
    setTouchStart({ x: first.clientX, y: first.clientY })
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>): void {
    if (!touchStart) return

    const first = event.changedTouches[0]
    const deltaX = first.clientX - touchStart.x
    const deltaY = first.clientY - touchStart.y

    if (
      Math.abs(deltaX) > SWIPE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      cycle(deltaX < 0 ? 1 : -1)
    }

    setTouchStart(null)
  }

  if (!teamNames.length) {
    return (
      <div className={`${styles.viewerCard} ${styles.emptyState}`}>
        <p className={styles.emptyStateTitle}>Get started</p>
        <ol className={styles.emptyStateSteps}>
          <li>
            Tap <strong>Edit Team</strong> to add your Pokémon
          </li>
          <li>Search for an opponent above to see matchup details</li>
        </ol>
      </div>
    )
  }

  if (!normalizedOpponent) {
    return (
      <div className={`${styles.viewerCard} ${styles.emptyState}`}>
        <p className={styles.emptyStateTitle}>Choose an opponent</p>
        <p className={styles.emptyStateBody}>
          Search by name above, or switch to Gym leader mode to pick from a gym
          roster.
        </p>
      </div>
    )
  }

  if (!exactMatchFound || !nameIndexReady) {
    if (!nameIndexReady) {
      return <p className={styles.viewerCard}>Loading Pokédex...</p>
    }
    if (opponentSuggestions.length > 0) {
      return (
        <p className={styles.viewerCard}>
          Select a Pokémon from the list above to view matchup details.
        </p>
      )
    }
    return (
      <p className={styles.viewerCard}>
        No Pokémon found for &ldquo;{toTitleCase(normalizedOpponent)}&rdquo;.
      </p>
    )
  }

  if (loading || !matchup) {
    return <p className={styles.viewerCard}>Loading matchup details...</p>
  }

  const playerName = toTitleCase(matchup.player.name)
  const opponentName = toTitleCase(matchup.opponent.name)

  return (
    <section
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Matchup viewer"
    >
      <article className={styles.viewerCard}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>
            {playerName} vs {opponentName}
          </h2>
          <div className={styles.cycleControls}>
            <button
              type="button"
              className={styles.cycleButton}
              onClick={() => cycle(-1)}
              aria-label="Previous team member"
              title="Previous team member"
            >
              ←
            </button>
            <button
              type="button"
              className={styles.cycleButton}
              onClick={() => cycle(1)}
              aria-label="Next team member"
              title="Next team member"
            >
              →
            </button>
          </div>
        </div>

        <div className={styles.sideGrid}>
          <article className={styles.sideCard} aria-label="Your side">
            <PokemonCard label="Your Pokémon" pokemon={matchup.player} />
            <DefenseSection
              playerName={playerName}
              dangerous={matchup.defense.dangerous}
              resisted={matchup.defense.resisted}
            />
          </article>

          <article className={styles.sideCard} aria-label="Opponent side">
            <PokemonCard label="Opponent" pokemon={matchup.opponent} />
            <OffenseSection
              opponentName={opponentName}
              superEffective={matchup.offense.superEffective}
              notEffective={matchup.offense.notEffective}
            />
          </article>
        </div>
      </article>
    </section>
  )
}
