import { useMemo, useState, type TouchEvent } from 'react'

import { toTitleCase } from '../../utils/format'
import { useMatchupMatrix } from '../../hooks/useMatchupMatrix'
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
  pokemonNameSet: Set<string>
  teamNames: string[]
}

const SWIPE_THRESHOLD = 40

function positiveModulo(value: number, mod: number): number {
  if (mod === 0) return 0
  return ((value % mod) + mod) % mod
}

function tabLabel(name: string, fallbackIndex: number): string {
  const parsed = toTitleCase(name)
  if (parsed) return parsed
  return `Slot ${fallbackIndex + 1}`
}

export default function MatchupContainer({
  exactMatchFound,
  gameLabel,
  generation,
  nameIndexReady,
  normalizedOpponent,
  onError,
  pokemonNameSet,
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
    pokemonNameSet,
    selectedTeamIndex,
    teamNames,
  })

  const activeTeamIndex = useMemo(
    () => positiveModulo(selectedTeamIndex, Math.max(teamNames.length, 1)),
    [selectedTeamIndex, teamNames.length],
  )

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
      <p className={styles.viewerCard}>
        Add your team first, then choose an opponent to view matchup details.
      </p>
    )
  }

  if (!normalizedOpponent) {
    return (
      <p className={styles.viewerCard}>
        Select an opponent to view offense and defense details.
      </p>
    )
  }

  if (!exactMatchFound || !nameIndexReady) {
    return (
      <p className={styles.viewerCard}>
        Pick an exact Pokemon name to load matchup details.
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
            {opponentName} vs {playerName}
          </h2>
          <div className={styles.cycleControls}>
            <button
              type="button"
              className={styles.cycleButton}
              onClick={() => cycle(-1)}
              aria-label="Previous team member"
            >
              ←
            </button>
            <button
              type="button"
              className={styles.cycleButton}
              onClick={() => cycle(1)}
              aria-label="Next team member"
            >
              →
            </button>
          </div>
        </div>

        <div className={styles.sideGrid}>
          <article className={styles.sideCard} aria-label="Your side">
            <PokemonCard label="Your Pokemon" pokemon={matchup.player} />
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

        <section className={styles.teamNav} aria-label="Team member navigation">
          <div className={styles.titleRow}>
            <p className={styles.cardLabel}>Cycle Team Members</p>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Team members">
            {teamNames.map((name, index) => {
              const isActive = index === activeTeamIndex
              return (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                  onClick={() => setSelectedTeamIndex(index)}
                >
                  {tabLabel(name, index)}
                </button>
              )
            })}
          </div>

          <p className={styles.swipeHint}>
            Swipe left or right on mobile to cycle members.
          </p>
        </section>
      </article>
    </section>
  )
}
