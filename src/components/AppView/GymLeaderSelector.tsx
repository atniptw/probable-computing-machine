import { getGymsForGame, type GymLeader } from '../../data/gyms'
import TypeBadge from '../TypeBadge'
import styles from '../../App.module.css'

interface Props {
  gameVersion: string
  selectedGymId: string | null
  onSelect: (gymId: string) => void
}

export default function GymLeaderSelector({
  gameVersion,
  selectedGymId,
  onSelect,
}: Props) {
  const gyms: GymLeader[] = getGymsForGame(gameVersion)

  if (gyms.length === 0) {
    return (
      <p className={styles.gymNoData}>
        No gym data available for this game yet.
      </p>
    )
  }

  return (
    <div className={styles.gymList}>
      {gyms.map((gym) => (
        <button
          key={gym.id}
          type="button"
          className={`${styles.gymLeaderBtn}${selectedGymId === gym.id ? ` ${styles.gymLeaderBtnSelected}` : ''}`}
          aria-pressed={selectedGymId === gym.id}
          onClick={() => onSelect(gym.id)}
        >
          <span className={styles.gymBadgeNum}>{gym.badge}.</span>
          <span className={styles.gymLeaderBtnName}>{gym.name}</span>
          <TypeBadge typeName={gym.type} className={styles.typeBadge} />
        </button>
      ))}
    </div>
  )
}
