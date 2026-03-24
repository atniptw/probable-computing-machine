import type { Pokemon } from '../../services/pokeapi'
import type { RankedTeamBuckets, RankedTeamEntry } from '../../services/ranking'
import styles from '../../App.module.css'
import { toTitleCase } from '../../utils/format'

interface BattleResultsPanelProps {
  teamNames: string[]
  normalizedOpponent: string
  loading: boolean
  hasOpponent: boolean
  rankedBuckets: RankedTeamBuckets
  selectedGameLabel: string
  showOtherOptions: boolean
  onToggleOtherOptions: () => void
  teamPreview: Pokemon[]
  onEditTeam: () => void
}

function renderTypeBadges(types: string[]): JSX.Element {
  return (
    <div className={styles.typeBadgeRow}>
      {types.map((typeName) => (
        <span className={styles.typeBadge} key={typeName}>
          {toTitleCase(typeName)}
        </span>
      ))}
    </div>
  )
}

function toneIcon(tone: 'good' | 'neutral' | 'risky'): string {
  if (tone === 'good') return '🟢'
  if (tone === 'neutral') return '🟡'
  return '🔴'
}

function renderMatchupCard(
  entry: RankedTeamEntry,
  tone: 'good' | 'neutral' | 'risky',
): JSX.Element {
  return (
    <article
      className={`${styles.matchupCard} ${styles[tone]}`}
      key={entry.pokemon.name}
    >
      <div className={styles.matchupCardHeader}>
        <span className={styles.toneLabel}>
          {toneIcon(tone)} {tone === 'good' ? 'Also Good' : toTitleCase(tone)}
        </span>
        <strong className={styles.pokemonName}>
          {toTitleCase(entry.pokemon.name)}
        </strong>
      </div>
      {renderTypeBadges(entry.pokemon.types)}
      <p className={styles.reasonText}>{entry.reason}</p>
    </article>
  )
}

export default function BattleResultsPanel({
  teamNames,
  normalizedOpponent,
  loading,
  hasOpponent,
  rankedBuckets,
  selectedGameLabel,
  showOtherOptions,
  onToggleOtherOptions,
  teamPreview,
  onEditTeam,
}: BattleResultsPanelProps) {
  const primaryRecommendation = rankedBuckets.best[0] ?? null
  const otherOptionCount =
    rankedBuckets.good.length +
    rankedBuckets.neutral.length +
    rankedBuckets.risky.length

  return (
    <>
      {!teamNames.length && (
        <p className={styles.empty}>
          Tap Edit Team to add Pokemon before checking matchups.
        </p>
      )}

      {!!teamNames.length && !normalizedOpponent && (
        <p className={styles.empty}>
          Select an opponent to see your best choice instantly.
        </p>
      )}

      {!!teamNames.length && !!normalizedOpponent && loading && (
        <p className={styles.empty}>Calculating matchups...</p>
      )}

      {!!teamNames.length &&
        hasOpponent &&
        !loading &&
        !!primaryRecommendation && (
          <>
            <article className={styles.primaryRecommendationCard}>
              <div className={styles.primaryLabel}>🟢 Best Choice</div>
              <h2 className={styles.primaryName}>
                {toTitleCase(primaryRecommendation.pokemon.name)}
              </h2>
              {renderTypeBadges(primaryRecommendation.pokemon.types)}
              <p className={styles.reasonText}>
                {primaryRecommendation.reason}
              </p>
              <p className={styles.effectivenessNote}>
                Based on {selectedGameLabel} type effectiveness rules
              </p>
            </article>

            {otherOptionCount > 0 && (
              <section className={styles.expandableList}>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={onToggleOtherOptions}
                  aria-expanded={showOtherOptions}
                >
                  Show other options ({otherOptionCount}){' '}
                  {showOtherOptions ? '▴' : '▾'}
                </button>

                {showOtherOptions && (
                  <div className={styles.otherResults}>
                    {!!rankedBuckets.good.length && (
                      <section className={styles.group}>
                        <h3 className={styles.groupTitle}>Also Good</h3>
                        <div className={styles.cards}>
                          {rankedBuckets.good.map((entry) =>
                            renderMatchupCard(entry, 'good'),
                          )}
                        </div>
                      </section>
                    )}

                    {!!rankedBuckets.neutral.length && (
                      <section className={styles.group}>
                        <h3 className={styles.groupTitle}>Neutral</h3>
                        <div className={styles.cards}>
                          {rankedBuckets.neutral.map((entry) =>
                            renderMatchupCard(entry, 'neutral'),
                          )}
                        </div>
                      </section>
                    )}

                    {!!rankedBuckets.risky.length && (
                      <section className={styles.group}>
                        <h3 className={styles.groupTitle}>Risky</h3>
                        <div className={styles.cards}>
                          {rankedBuckets.risky.map((entry) =>
                            renderMatchupCard(entry, 'risky'),
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}

      {!!teamNames.length && (
        <button
          type="button"
          className={styles.teamPreviewBar}
          onClick={onEditTeam}
        >
          <div className={styles.teamPreviewLabel}>Team</div>
          <div className={styles.teamPreviewTrack}>
            {teamPreview.map((pokemon) => (
              <span
                className={styles.teamPreviewChip}
                key={`preview-${pokemon.name}`}
              >
                {pokemon.sprite ? (
                  <img src={pokemon.sprite} alt="" />
                ) : (
                  <span>{toTitleCase(pokemon.name).charAt(0)}</span>
                )}
              </span>
            ))}
          </div>
        </button>
      )}
    </>
  )
}
