import { useState } from 'react'
import TeamInput from './components/TeamInput/TeamInput.jsx'
import MatchupResults from './components/MatchupResults/MatchupResults.jsx'
import { computeMatchups, PokemonNotFoundError, RateLimitError } from './services/pokeapi.js'
import styles from './App.module.css'

const EMPTY_TEAM = ['', '', '', '', '', '']

export default function App() {
  const [yourTeam, setYourTeam] = useState([...EMPTY_TEAM])
  const [opponentTeam, setOpponentTeam] = useState([...EMPTY_TEAM])
  const [slotErrors, setSlotErrors] = useState({ yours: Array(6).fill(null), theirs: Array(6).fill(null) })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleYourTeamChange(index, value) {
    setYourTeam((prev) => prev.map((v, i) => (i === index ? value : v)))
    setSlotErrors((prev) => ({ ...prev, yours: prev.yours.map((e, i) => (i === index ? null : e)) }))
  }

  function handleOpponentTeamChange(index, value) {
    setOpponentTeam((prev) => prev.map((v, i) => (i === index ? value : v)))
    setSlotErrors((prev) => ({ ...prev, theirs: prev.theirs.map((e, i) => (i === index ? null : e)) }))
  }

  async function handleSubmit() {
    const filledYours = yourTeam.map((v) => v.trim()).filter(Boolean)
    const filledTheirs = opponentTeam.map((v) => v.trim()).filter(Boolean)
    if (!filledYours.length || !filledTheirs.length) return

    setLoading(true)
    setError(null)
    setSlotErrors({ yours: Array(6).fill(null), theirs: Array(6).fill(null) })

    try {
      const matchupResult = await computeMatchups(filledYours, filledTheirs)
      setResult(matchupResult)
    } catch (err) {
      if (err instanceof PokemonNotFoundError) {
        const name = err.pokemonName.toLowerCase().trim()
        const yoursIdx = yourTeam.findIndex((v) => v.trim().toLowerCase() === name)
        const theirsIdx = opponentTeam.findIndex((v) => v.trim().toLowerCase() === name)
        if (yoursIdx !== -1) {
          setSlotErrors((prev) => ({
            ...prev,
            yours: prev.yours.map((e, i) => (i === yoursIdx ? 'Not found' : e)),
          }))
        } else if (theirsIdx !== -1) {
          setSlotErrors((prev) => ({
            ...prev,
            theirs: prev.theirs.map((e, i) => (i === theirsIdx ? 'Not found' : e)),
          }))
        }
      } else if (err instanceof RateLimitError) {
        setError('Rate limit reached. Please wait a moment and try again.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Pokémon Matchup Advisor</h1>
        <p>Enter two teams to see type effectiveness matchups.</p>
      </header>

      {error && (
        <div className={styles.banner} role="alert">
          {error}
        </div>
      )}

      <TeamInput
        yourTeam={yourTeam}
        opponentTeam={opponentTeam}
        yourSlotErrors={slotErrors.yours}
        opponentSlotErrors={slotErrors.theirs}
        onYourTeamChange={handleYourTeamChange}
        onOpponentTeamChange={handleOpponentTeamChange}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {result && <MatchupResults result={result} />}
    </div>
  )
}
