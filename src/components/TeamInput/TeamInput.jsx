import TeamSlots from './TeamSlots.jsx'
import SubmitButton from './SubmitButton.jsx'
import styles from './TeamInput.module.css'

export default function TeamInput({
  yourTeam,
  opponentTeam,
  yourSlotErrors,
  opponentSlotErrors,
  onYourTeamChange,
  onOpponentTeamChange,
  onSubmit,
  loading,
}) {
  const hasYours = yourTeam.some((v) => v.trim())
  const hasTheirs = opponentTeam.some((v) => v.trim())

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className={styles.teams}>
        <TeamSlots
          label="Your Team"
          slots={yourTeam}
          slotErrors={yourSlotErrors}
          onChange={onYourTeamChange}
          disabled={loading}
        />
        <TeamSlots
          label="Opponent Team"
          slots={opponentTeam}
          slotErrors={opponentSlotErrors}
          onChange={onOpponentTeamChange}
          disabled={loading}
        />
      </div>
      <SubmitButton
        disabled={!hasYours || !hasTheirs || loading}
        loading={loading}
      />
    </form>
  )
}
