import { SUPPORTED_GAMES } from '../../data/games'
import styles from '../../App.module.css'

interface GameVersionSelectProps {
  id: string
  value: string
  onChange: (nextVersion: string) => void
}

export default function GameVersionSelect({
  id,
  value,
  onChange,
}: GameVersionSelectProps) {
  return (
    <div className={styles.gameSelectorRow}>
      <label htmlFor={id} className={styles.selectorLabel}>
        Game
      </label>
      <select
        id={id}
        className={styles.gameSelector}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Game Version"
      >
        {SUPPORTED_GAMES.map((game) => (
          <option key={game.version} value={game.version}>
            {game.label}
          </option>
        ))}
      </select>
    </div>
  )
}
