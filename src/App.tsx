import { useEffect, useMemo, useState } from 'react'
import {
  getPokemonNameIndex,
  getPokemon,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
  type Pokemon,
} from './services/pokeapi'
import { rankTeamAgainstOpponent, type RankedTeamBuckets, type RankedTeamEntry } from './services/ranking'
import { DEFAULT_GAME_VERSION, SUPPORTED_GAMES, getGameDefinition } from './data/games'
import styles from './App.module.css'

const EMERALD_DEFAULT_TEAM = [
  'swampert',
  'manectric',
  'breloom',
  'gardevoir',
  'flygon',
  'salamence',
]
const TEAM_SIZE = 6
const MAX_SUGGESTIONS = 20

type Screen = 'battle' | 'team'

function readConfiguredTeam(): string[] {
  const raw = localStorage.getItem('pmh_team_v1')
  if (!raw) return [...EMERALD_DEFAULT_TEAM]
  try {
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return [...EMERALD_DEFAULT_TEAM]
    return parsed
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, TEAM_SIZE)
  } catch {
    return [...EMERALD_DEFAULT_TEAM]
  }
}

function readSelectedGame(): string {
  const raw = localStorage.getItem('pmh_game_v1')?.trim().toLowerCase()
  if (!raw) return DEFAULT_GAME_VERSION
  return getGameDefinition(raw) ? raw : DEFAULT_GAME_VERSION
}

function toTeamSlots(values: string[]): string[] {
  const slots = Array.from({ length: TEAM_SIZE }, () => '')
  values.slice(0, TEAM_SIZE).forEach((name, index) => {
    slots[index] = name
  })
  return slots
}

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function App() {
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>(() => readSelectedGame())
  const [screen, setScreen] = useState<Screen>('battle')
  const [teamDraft, setTeamDraft] = useState<string[]>(() => toTeamSlots(readConfiguredTeam()))
  const [teamSlotErrors, setTeamSlotErrors] = useState<(string | null)[]>(() => Array.from({ length: TEAM_SIZE }, () => null))
  const [teamNames, setTeamNames] = useState<string[]>(() => readConfiguredTeam())
  const [teamPreview, setTeamPreview] = useState<Pokemon[]>([])
  const [activeTeamSlot, setActiveTeamSlot] = useState<number | null>(null)
  const [opponentInput, setOpponentInput] = useState('')
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [rankedBuckets, setRankedBuckets] = useState<RankedTeamBuckets>({ best: [], good: [], neutral: [], risky: [] })
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [pokemonNameIndex, setPokemonNameIndex] = useState<string[]>([])
  const [nameIndexReady, setNameIndexReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedGame = useMemo(() => {
    return getGameDefinition(selectedGameVersion) ?? getGameDefinition(DEFAULT_GAME_VERSION)!
  }, [selectedGameVersion])

  useEffect(() => {
    setNameIndexReady(false)
    setPokemonNameIndex([])

    void getTypeMap({ generation: selectedGame.generation }).catch(() => {
      // Warm generation-specific cache to keep matchup updates snappy.
    })

    void getPokemonNameIndex(selectedGame.version)
      .then((names) => {
        setPokemonNameIndex(names)
      })
      .catch(() => {
        setError(`Unable to load ${selectedGame.label} Pokédex index. Please try again.`)
      })
      .finally(() => {
        setNameIndexReady(true)
      })
  }, [selectedGame.generation, selectedGame.label, selectedGame.version])

  useEffect(() => {
    localStorage.setItem('pmh_game_v1', selectedGame.version)
  }, [selectedGame.version])

  const normalizedOpponent = opponentInput.trim().toLowerCase()
  const pokemonNameSet = useMemo(() => new Set(pokemonNameIndex), [pokemonNameIndex])
  const exactMatchFound = pokemonNameSet.has(normalizedOpponent)

  const defaultSuggestions = useMemo(
    () => pokemonNameIndex.slice(0, MAX_SUGGESTIONS),
    [pokemonNameIndex],
  )

  const otherOptionCount = rankedBuckets.good.length + rankedBuckets.neutral.length + rankedBuckets.risky.length
  const primaryRecommendation = rankedBuckets.best[0] ?? null

  function getSuggestions(query: string): string[] {
    if (!pokemonNameIndex.length) return []

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return defaultSuggestions

    const prefixMatches: string[] = []
    const containsMatches: string[] = []

    for (const name of pokemonNameIndex) {
      if (name.startsWith(normalizedQuery)) {
        prefixMatches.push(name)
        continue
      }
      if (name.includes(normalizedQuery)) containsMatches.push(name)
    }

    return [...prefixMatches, ...containsMatches].slice(0, MAX_SUGGESTIONS)
  }

  const opponentSuggestions = getSuggestions(normalizedOpponent)

  useEffect(() => {
    let cancelled = false

    async function loadTeamPreview(): Promise<void> {
      if (!teamNames.length) {
        setTeamPreview([])
        return
      }

      const results = await Promise.allSettled(
        teamNames.map((name) => getPokemon(name, { generation: selectedGame.generation })),
      )
      if (cancelled) return

      const nextPreview = results
        .filter((result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled')
        .map((result) => result.value)

      setTeamPreview(nextPreview)
    }

    void loadTeamPreview()

    return () => {
      cancelled = true
    }
  }, [selectedGame.generation, teamNames])

  useEffect(() => {
    if (!pokemonNameIndex.length) return

    const teamStillValid = teamNames.every((name) => pokemonNameSet.has(name))
    if (!teamStillValid) {
      setOpponent(null)
      setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
      setError(`Your saved team has Pokémon outside the ${selectedGame.label} Pokédex. Tap Edit Team to fix it.`)
    }
  }, [pokemonNameIndex.length, pokemonNameSet, selectedGame.label, teamNames])

  function updateTeamSlot(index: number, value: string): void {
    setTeamDraft((current) => {
      const next = [...current]
      next[index] = value
      return next
    })

    setTeamSlotErrors((current) => {
      if (!current[index]) return current
      const next = [...current]
      next[index] = null
      return next
    })
  }

  function saveTeam(): void {
    if (!nameIndexReady) {
      setError('Pokédex index is still loading. Please wait a moment and try again.')
      return
    }

    const normalized = teamDraft.map((slot) => slot.trim().toLowerCase())
    const nextErrors = normalized.map((name) => {
      if (!name) return null
      if (!pokemonNameSet.has(name)) return `Not available in ${selectedGame.label}.`
      return null
    })

    setTeamSlotErrors(nextErrors)

    if (nextErrors.some(Boolean)) {
      setError('Fix invalid team entries before continuing.')
      return
    }

    const nextTeam = normalized.filter(Boolean)
    if (!nextTeam.length) {
      setError('Enter at least one valid Pokémon for your team.')
      return
    }

    localStorage.setItem('pmh_team_v1', JSON.stringify(nextTeam))
    setTeamNames(nextTeam)
    setScreen('battle')
    setError(null)
    setActiveTeamSlot(null)
  }

  useEffect(() => {
    if (screen !== 'battle') {
      setLoading(false)
      return
    }

    if (!normalizedOpponent) {
      setOpponent(null)
      setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
      setError(null)
      return
    }

    if (!nameIndexReady) return

    if (!exactMatchFound) {
      setOpponent(null)
      setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
      setError(null)
      return
    }

    if (!teamNames.length) {
      setOpponent(null)
      setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
      setError(null)
      return
    }

    const invalidSavedTeam = teamNames.some((name) => !pokemonNameSet.has(name))
    if (invalidSavedTeam) {
      setOpponent(null)
      setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
      setError(`Your saved team has Pokémon outside the ${selectedGame.label} Pokédex.`)
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const [typeMap, opponentPokemon, teamPokemon] = await Promise.all([
          getTypeMap({ generation: selectedGame.generation }),
          getPokemon(normalizedOpponent, { generation: selectedGame.generation }),
          Promise.all(teamNames.map((name) => getPokemon(name, { generation: selectedGame.generation }))),
        ])

        if (cancelled) return

        const nextRanked = rankTeamAgainstOpponent(teamPokemon, opponentPokemon, typeMap)

        setOpponent(opponentPokemon)
        setRankedBuckets(nextRanked)
        setShowOtherOptions(false)
      } catch (err) {
        if (cancelled) return
        if (err instanceof PokemonNotFoundError) {
          setError('Pokémon not found. Please select a valid name.')
        } else if (err instanceof RateLimitError) {
          setError('Rate limit reached. Please wait a moment and try again.')
        } else {
          setError('Network error. Please check your connection and try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [exactMatchFound, nameIndexReady, normalizedOpponent, pokemonNameSet, screen, selectedGame.generation, selectedGame.label, teamNames])

  function handleGameChange(nextVersion: string): void {
    setSelectedGameVersion(nextVersion)
    setOpponentInput('')
    setOpponent(null)
    setRankedBuckets({ best: [], good: [], neutral: [], risky: [] })
    setShowOtherOptions(false)
    setError(null)
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

  function renderMatchupCard(entry: RankedTeamEntry, tone: 'good' | 'neutral' | 'risky'): JSX.Element {
    return (
      <article className={`${styles.matchupCard} ${styles[tone]}`} key={entry.pokemon.name}>
        <div className={styles.matchupCardHeader}>
          <span className={styles.toneLabel}>{toneIcon(tone)} {tone === 'good' ? 'Also Good' : toTitleCase(tone)}</span>
          <strong className={styles.pokemonName}>{toTitleCase(entry.pokemon.name)}</strong>
        </div>
        {renderTypeBadges(entry.pokemon.types)}
        <p className={styles.reasonText}>{entry.reason}</p>
      </article>
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Pokémon Matchup Helper</h1>
        {screen === 'battle' && (
          <button
            type="button"
            className={styles.editTeamButton}
            onClick={() => {
              setTeamDraft(toTeamSlots(teamNames))
              setTeamSlotErrors(Array.from({ length: TEAM_SIZE }, () => null))
              setError(null)
              setScreen('team')
            }}
          >
            Edit Team
          </button>
        )}
      </header>

      {screen === 'battle' ? (
        <section className={styles.selectorSection}>
          <div className={styles.gameSelectorRow}>
            <label htmlFor="game-version" className={styles.selectorLabel}>Game</label>
            <select
              id="game-version"
              className={styles.gameSelector}
              value={selectedGame.version}
              onChange={(e) => handleGameChange(e.target.value)}
              aria-label="Game Version"
            >
              {SUPPORTED_GAMES.map((game) => (
                <option key={game.version} value={game.version}>{game.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectorLabel}>Opponent</div>
          <label className={styles.selectorRow} htmlFor="opponent-input">
            <input
              id="opponent-input"
              className={styles.selectorInput}
              value={opponentInput}
              onChange={(e) => {
                setOpponentInput(e.target.value)
                setShowOtherOptions(false)
              }}
              placeholder="Type 2–3 letters"
              aria-label="Opponent Pokemon"
            />
          </label>
          {!!normalizedOpponent && !exactMatchFound && opponentSuggestions.length > 0 && (
            <div className={styles.suggestionList} role="listbox" aria-label="Opponent suggestions">
              {opponentSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => setOpponentInput(name)}
                >
                  {toTitleCase(name)}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className={styles.selectorSection}>
          <div className={styles.selectorHeader}>
            <div className={styles.selectorLabel}>Team Configuration</div>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setScreen('battle')
                setError(null)
              }}
            >
              Back
            </button>
          </div>
          <div className={styles.gameSelectorRow}>
            <label htmlFor="game-version-team" className={styles.selectorLabel}>Game</label>
            <select
              id="game-version-team"
              className={styles.gameSelector}
              value={selectedGame.version}
              onChange={(e) => handleGameChange(e.target.value)}
              aria-label="Game Version"
            >
              {SUPPORTED_GAMES.map((game) => (
                <option key={game.version} value={game.version}>{game.label}</option>
              ))}
            </select>
          </div>
          <p className={styles.configureHint}>Save 1–6 Pokémon from the selected game Pokédex.</p>
        </section>
      )}

      {error && (
        <div className={styles.banner} role="alert">
          {error}
        </div>
      )}

      <main className={styles.resultsPane}>
        {screen === 'team' ? (
          <section className={styles.configurePanel}>
            <div className={styles.configureGrid}>
              {teamDraft.map((slot, index) => (
                <div className={styles.teamSlot} key={`team-slot-${index}`}>
                  <label htmlFor={`team-slot-${index}`}>Team Slot {index + 1}</label>
                  <input
                    id={`team-slot-${index}`}
                    className={`${styles.teamInput} ${teamSlotErrors[index] ? styles.teamInputError : ''}`}
                    value={slot}
                    onChange={(e) => updateTeamSlot(index, e.target.value)}
                    onFocus={() => setActiveTeamSlot(index)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setActiveTeamSlot((current) => (current === index ? null : current))
                      }, 120)
                    }}
                    placeholder={`Pokemon ${index + 1}`}
                    aria-label={`Team Slot ${index + 1}`}
                  />
                  {activeTeamSlot === index && !!slot.trim() && getSuggestions(slot).length > 0 && (
                    <div className={styles.suggestionList} role="listbox" aria-label={`Suggestions for team slot ${index + 1}`}>
                      {getSuggestions(slot).map((name) => (
                        <button
                          type="button"
                          key={`${name}-${index}`}
                          className={styles.suggestionItem}
                          onClick={() => {
                            updateTeamSlot(index, name)
                            setActiveTeamSlot(null)
                          }}
                        >
                          {toTitleCase(name)}
                        </button>
                      ))}
                    </div>
                  )}
                  {teamSlotErrors[index] && (
                    <span className={styles.fieldError} role="alert">{teamSlotErrors[index]}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={saveTeam}
              disabled={!nameIndexReady}
            >
              Save Team
            </button>
          </section>
        ) : (
          <>
            {!teamNames.length && (
              <p className={styles.empty}>Tap Edit Team to add Pokémon before checking matchups.</p>
            )}

            {!!teamNames.length && !normalizedOpponent && (
              <p className={styles.empty}>Select an opponent to see your best choice instantly.</p>
            )}

            {!!teamNames.length && !!normalizedOpponent && loading && (
              <p className={styles.empty}>Calculating matchups...</p>
            )}

            {!!teamNames.length && !!opponent && !loading && !!primaryRecommendation && (
              <>
                <article className={styles.primaryRecommendationCard}>
                  <div className={styles.primaryLabel}>🟢 Best Choice</div>
                  <h2 className={styles.primaryName}>{toTitleCase(primaryRecommendation.pokemon.name)}</h2>
                  {renderTypeBadges(primaryRecommendation.pokemon.types)}
                  <p className={styles.reasonText}>{primaryRecommendation.reason}</p>
                  <p className={styles.effectivenessNote}>Based on {selectedGame.label} type effectiveness rules</p>
                </article>

                {otherOptionCount > 0 && (
                  <section className={styles.expandableList}>
                    <button
                      type="button"
                      className={styles.expandButton}
                      onClick={() => setShowOtherOptions((current) => !current)}
                      aria-expanded={showOtherOptions}
                    >
                      Show other options ({otherOptionCount}) {showOtherOptions ? '▴' : '▾'}
                    </button>

                    {showOtherOptions && (
                      <div className={styles.otherResults}>
                        {!!rankedBuckets.good.length && (
                          <section className={styles.group}>
                            <h3 className={styles.groupTitle}>Also Good</h3>
                            <div className={styles.cards}>{rankedBuckets.good.map((entry) => renderMatchupCard(entry, 'good'))}</div>
                          </section>
                        )}

                        {!!rankedBuckets.neutral.length && (
                          <section className={styles.group}>
                            <h3 className={styles.groupTitle}>Neutral</h3>
                            <div className={styles.cards}>{rankedBuckets.neutral.map((entry) => renderMatchupCard(entry, 'neutral'))}</div>
                          </section>
                        )}

                        {!!rankedBuckets.risky.length && (
                          <section className={styles.group}>
                            <h3 className={styles.groupTitle}>Risky</h3>
                            <div className={styles.cards}>{rankedBuckets.risky.map((entry) => renderMatchupCard(entry, 'risky'))}</div>
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
                onClick={() => {
                  setTeamDraft(toTeamSlots(teamNames))
                  setScreen('team')
                }}
              >
                <div className={styles.teamPreviewLabel}>Team</div>
                <div className={styles.teamPreviewTrack}>
                  {teamPreview.map((pokemon) => (
                    <span className={styles.teamPreviewChip} key={`preview-${pokemon.name}`}>
                      {pokemon.sprite ? <img src={pokemon.sprite} alt="" /> : <span>{toTitleCase(pokemon.name).charAt(0)}</span>}
                    </span>
                  ))}
                </div>
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
