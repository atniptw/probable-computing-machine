import TeamSlots from './TeamSlots'
import SubmitButton from './SubmitButton'
import styles from './TeamInput.module.css'

interface TeamInputProps {
  yourTeam: string[]
  opponentTeam: string[]
  yourSlotErrors: (string | null)[]
  opponentSlotErrors: (string | null)[]
  onYourTeamChange: (index: number, value: string) => void
  onOpponentTeamChange: (index: number, value: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function TeamInput({
  yourTeam,
  opponentTeam,
  yourSlotErrors,
  opponentSlotErrors,
  onYourTeamChange,
  onOpponentTeamChange,
  onSubmit,
  loading,
}: TeamInputProps) {
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
