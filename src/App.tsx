import { useEffect, useMemo, useState } from 'react'
import {
  calcEffectiveness,
  getPokemonNameIndex,
  getPokemon,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
  type Effectiveness,
  type Pokemon,
} from './services/pokeapi'
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

type MatchCategory = 'Best' | 'Neutral' | 'Risky' | 'Avoid'

interface RankedMatchup {
  pokemon: Pokemon
  attackMod: number
  defenseMod: number
  attackLabel: Effectiveness
  defenseLabel: Effectiveness
  category: MatchCategory
  score: number
}

function readConfiguredTeam(): string[] {
  const raw = localStorage.getItem('pmh_team_v1')
  if (!raw) return [...EMERALD_DEFAULT_TEAM]
  try {
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return [...EMERALD_DEFAULT_TEAM]
    return parsed
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 6)
  } catch {
    return [...EMERALD_DEFAULT_TEAM]
  }
}

function toTeamSlots(values: string[]): string[] {
  const slots = Array.from({ length: TEAM_SIZE }, () => '')
  values.slice(0, TEAM_SIZE).forEach((name, index) => {
    slots[index] = name
  })
  return slots
}

function modifierLabel(mod: number): Effectiveness {
  if (mod >= 2) return '2x'
  if (mod === 1) return '1x'
  if (mod > 0) return '0.5x'
  return '0x'
}

function categorize(attackMod: number, defenseMod: number): MatchCategory {
  if (attackMod === 0 || defenseMod >= 4) return 'Avoid'
  if (attackMod >= 2 && defenseMod <= 1) return 'Best'
  if (attackMod < 1 || defenseMod > 1) return 'Risky'
  return 'Neutral'
}

function categoryRank(category: MatchCategory): number {
  if (category === 'Best') return 3
  if (category === 'Neutral') return 2
  if (category === 'Risky') return 1
  return 0
}

export default function App() {
  const [mode, setMode] = useState<'configure' | 'matchups'>('configure')
  const [teamDraft, setTeamDraft] = useState<string[]>(() => toTeamSlots(readConfiguredTeam()))
  const [teamSlotErrors, setTeamSlotErrors] = useState<(string | null)[]>(() => Array.from({ length: TEAM_SIZE }, () => null))
  const [teamNames, setTeamNames] = useState<string[]>(() => readConfiguredTeam())
  const [opponentInput, setOpponentInput] = useState('')
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [ranked, setRanked] = useState<RankedMatchup[]>([])
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [pokemonNameIndex, setPokemonNameIndex] = useState<string[]>([])
  const [nameIndexReady, setNameIndexReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getTypeMap().catch(() => {
      // Warm cache to keep opponent-switch updates snappy.
    })

    void getPokemonNameIndex()
      .then((names) => {
        setPokemonNameIndex(names)
      })
      .catch(() => {
        setError('Unable to load Pokemon search index. Please try again.')
      })
      .finally(() => {
        setNameIndexReady(true)
      })
  }, [])

  const normalizedOpponent = opponentInput.trim().toLowerCase()
  const pokemonNameSet = useMemo(() => new Set(pokemonNameIndex), [pokemonNameIndex])
  const exactMatchFound = pokemonNameSet.has(normalizedOpponent)

  const opponentSuggestions = useMemo(() => {
    if (!pokemonNameIndex.length) return []

    const query = normalizedOpponent
    if (!query) return pokemonNameIndex.slice(0, MAX_SUGGESTIONS)

    const prefixMatches: string[] = []
    const containsMatches: string[] = []

    for (const name of pokemonNameIndex) {
      if (name.startsWith(query)) {
        prefixMatches.push(name)
        continue
      }
      if (name.includes(query)) containsMatches.push(name)
    }

    return [...prefixMatches, ...containsMatches].slice(0, MAX_SUGGESTIONS)
  }, [pokemonNameIndex, normalizedOpponent])

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
      setError('Pokemon index is still loading. Please wait a moment and try again.')
      return
    }

    const normalized = teamDraft.map((slot) => slot.trim().toLowerCase())
    const nextErrors = normalized.map((name) => {
      if (!name) return null
      if (!pokemonNameSet.has(name)) return 'Pokemon not found in index.'
      return null
    })

    setTeamSlotErrors(nextErrors)

    if (nextErrors.some(Boolean)) {
      setError('Fix invalid team entries before continuing.')
      return
    }

    const nextTeam = normalized.filter(Boolean)
    if (!nextTeam.length) {
      setError('Enter at least one valid Pokemon for your team.')
      return
    }

    localStorage.setItem('pmh_team_v1', JSON.stringify(nextTeam))
    setTeamNames(nextTeam)
    setMode('matchups')
    setError(null)
    setExpandedCard(null)
    setOpponentInput('')
    setOpponent(null)
    setRanked([])
  }

  useEffect(() => {
    if (mode !== 'matchups') {
      setLoading(false)
      return
    }

    if (!normalizedOpponent) {
      setOpponent(null)
      setRanked([])
      setError(null)
      return
    }

    if (!nameIndexReady) return

    if (!exactMatchFound) {
      setOpponent(null)
      setRanked([])
      setError(null)
      return
    }

    if (!teamNames.length) {
      setOpponent(null)
      setRanked([])
      setError(null)
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const [typeMap, opponentPokemon, teamPokemon] = await Promise.all([
          getTypeMap(),
          getPokemon(normalizedOpponent),
          Promise.all(teamNames.map((name) => getPokemon(name))),
        ])

        if (cancelled) return

        const rankedEntries = teamPokemon
          .map((member): RankedMatchup => {
            const attackMod = calcEffectiveness(member.types, opponentPokemon.types, typeMap)
            const defenseMod = calcEffectiveness(opponentPokemon.types, member.types, typeMap)
            const category = categorize(attackMod, defenseMod)
            const score = attackMod / Math.max(defenseMod, 0.25)
            return {
              pokemon: member,
              attackMod,
              defenseMod,
              attackLabel: modifierLabel(attackMod),
              defenseLabel: modifierLabel(defenseMod),
              category,
              score,
            }
          })
          .sort((a, b) => {
            const catDelta = categoryRank(b.category) - categoryRank(a.category)
            if (catDelta !== 0) return catDelta
            return b.score - a.score
          })

        setOpponent(opponentPokemon)
        setRanked(rankedEntries)
      } catch (err) {
        if (cancelled) return
        if (err instanceof PokemonNotFoundError) {
          setError('Pokemon not found. Please select a valid Pokemon name.')
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
  }, [exactMatchFound, mode, nameIndexReady, normalizedOpponent, teamNames])

  const grouped = useMemo(() => {
    const groups: Record<MatchCategory, RankedMatchup[]> = {
      Best: [],
      Neutral: [],
      Risky: [],
      Avoid: [],
    }
    for (const item of ranked) groups[item.category].push(item)
    return groups
  }, [ranked])

  function categoryIcon(category: MatchCategory): string {
    if (category === 'Best') return '🟢'
    if (category === 'Neutral') return '🟡'
    if (category === 'Risky') return '🔴'
    return '⚫'
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Pokémon Matchup Helper</h1>
      </header>

      {mode === 'configure' ? (
        <section className={styles.selectorSection}>
          <div className={styles.selectorLabel}>Configure Team</div>
          <p className={styles.configureHint}>Set 1–6 Pokémon for your saved team before checking opponent matchups.</p>
        </section>
      ) : (
        <section className={styles.selectorSection}>
          <div className={styles.selectorHeader}>
            <div className={styles.selectorLabel}>Opponent</div>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setMode('configure')
                setError(null)
                setExpandedCard(null)
              }}
            >
              Edit Team
            </button>
          </div>
          <label className={styles.selectorRow}>
            <span className={styles.sprite} aria-hidden="true">
              {opponent?.sprite ? (
                <img src={opponent.sprite} alt="" />
              ) : (
                '🎯'
              )}
            </span>
            <input
              className={styles.selectorInput}
              list="pokemon-name-index"
              value={opponentInput}
              onChange={(e) => {
                setExpandedCard(null)
                setOpponentInput(e.target.value)
              }}
              placeholder="Search opponent (e.g. salamence)"
              aria-label="Opponent Pokemon"
            />
          </label>
          <datalist id="pokemon-name-index">
            {opponentSuggestions.map((name) => (
              <option value={name} key={name} />
            ))}
          </datalist>
        </section>
      )}

      {error && (
        <div className={styles.banner} role="alert">
          {error}
        </div>
      )}

      <main className={styles.resultsPane}>
        {mode === 'configure' ? (
          <section className={styles.configurePanel}>
            <div className={styles.configureGrid}>
              {teamDraft.map((slot, index) => (
                <div className={styles.teamSlot} key={`team-slot-${index}`}>
                  <label htmlFor={`team-slot-${index}`}>Team Pokemon {index + 1}</label>
                  <input
                    id={`team-slot-${index}`}
                    className={`${styles.teamInput} ${teamSlotErrors[index] ? styles.teamInputError : ''}`}
                    value={slot}
                    onChange={(e) => updateTeamSlot(index, e.target.value)}
                    placeholder={`Pokemon ${index + 1}`}
                    aria-label={`Team Pokemon ${index + 1}`}
                  />
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
              <p className={styles.empty}>Add Pokémon to your team to see results.</p>
            )}

            {!!teamNames.length && !normalizedOpponent && (
              <p className={styles.empty}>Select an opponent Pokémon to see matchups.</p>
            )}

            {!!teamNames.length && !!normalizedOpponent && loading && (
              <p className={styles.empty}>Calculating matchups...</p>
            )}

            {!!teamNames.length && !!opponent && !loading && (
              <>
                {(['Best', 'Neutral', 'Risky', 'Avoid'] as MatchCategory[]).map((category) => {
                  const entries = grouped[category]
                  if (!entries.length) return null
                  return (
                    <section className={styles.group} key={category}>
                      <h2 className={styles.groupTitle}>
                        <span>{categoryIcon(category)}</span>
                        <span>{category.toUpperCase()}</span>
                      </h2>
                      <div className={styles.cards}>
                        {entries.map((entry) => {
                          const isExpanded = expandedCard === entry.pokemon.name
                          return (
                            <button
                              key={entry.pokemon.name}
                              type="button"
                              className={`${styles.card} ${styles[entry.category.toLowerCase()]}`}
                              onClick={() => setExpandedCard(isExpanded ? null : entry.pokemon.name)}
                              aria-expanded={isExpanded}
                            >
                              <div className={styles.cardRow1}>
                                <span className={styles.cardIndicator}>{categoryIcon(entry.category)} {entry.category}</span>
                                <span className={styles.cardName}>{entry.pokemon.name}</span>
                              </div>
                              <div className={styles.cardRow2}>{entry.pokemon.types.join(' / ')}</div>
                              <div className={`${styles.cardDetails} ${isExpanded ? styles.cardDetailsOpen : ''}`}>
                                <div>Attack effectiveness: <strong>{entry.attackLabel}</strong></div>
                                <div>Defensive risk: <strong>{entry.defenseLabel}</strong></div>
                                <div>Tip: prioritize fast, reliable STAB moves.</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
