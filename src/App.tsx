import { useEffect, useMemo, useState } from 'react'
import {
  calcEffectiveness,
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

const EMERALD_OPPONENTS = [
  'absol', 'aggron', 'altaria', 'armaldo', 'banette', 'blaziken', 'breloom', 'camerupt', 'claydol',
  'cradily', 'crawdaunt', 'dusclops', 'exploud', 'flygon', 'gardevoir', 'glalie', 'golbat', 'golem',
  'gyarados', 'hariyama', 'heracross', 'houndoom', 'huntail', 'jirachi', 'kecleon', 'kingdra', 'latias',
  'latios', 'ludicolo', 'lunatone', 'magneton', 'manectric', 'metagross', 'milotic', 'mightyena',
  'ninetales', 'pelipper', 'rhydon', 'salamence', 'sceptile', 'seviper', 'sharpedo', 'shiftry',
  'skarmory', 'slaking', 'solrock', 'starmie', 'swampert', 'tentacruel', 'torkoal', 'walrein', 'weezing',
  'whiscash', 'zangoose',
]

const OPPONENT_SET = new Set(EMERALD_OPPONENTS)

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
  const [teamNames] = useState<string[]>(() => readConfiguredTeam())
  const [opponentInput, setOpponentInput] = useState('')
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [ranked, setRanked] = useState<RankedMatchup[]>([])
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getTypeMap().catch(() => {
      // Warm cache to keep opponent-switch updates snappy.
    })
  }, [])

  const normalizedOpponent = opponentInput.trim().toLowerCase()

  useEffect(() => {
    if (!normalizedOpponent || !OPPONENT_SET.has(normalizedOpponent)) {
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
          setError('Opponent not found in Emerald list.')
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
  }, [normalizedOpponent, teamNames])

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

      <section className={styles.selectorSection}>
        <div className={styles.selectorLabel}>Opponent</div>
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
            list="emerald-opponents"
            value={opponentInput}
            onChange={(e) => {
              setExpandedCard(null)
              setOpponentInput(e.target.value)
            }}
            placeholder="Search opponent (e.g. salamence)"
            aria-label="Opponent Pokemon"
          />
        </label>
        <datalist id="emerald-opponents">
          {EMERALD_OPPONENTS.map((name) => (
            <option value={name} key={name} />
          ))}
        </datalist>
      </section>

      {error && (
        <div className={styles.banner} role="alert">
          {error}
        </div>
      )}

      <main className={styles.resultsPane}>
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
      </main>
    </div>
  )
}
