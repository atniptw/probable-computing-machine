import { type GymLeader } from '../../data/gyms/emerald'
import styles from '../../App.module.css'

interface Props {
  gymLeader: GymLeader
  selectedOpponent: string
  onPokemonSelect: (name: string) => void
}

export default function GymTeamPanel({
  gymLeader,
  selectedOpponent,
  onPokemonSelect,
}: Props) {
  return (
    <div className={styles.gymTeamPanel}>
      <div className={styles.gymTeamHeader}>{gymLeader.name}&rsquo;s Team</div>
      <div className={styles.gymTeamList}>
        {gymLeader.team.map((pokemon, index) => {
          const isSelected = selectedOpponent === pokemon.name
          return (
            <button
              key={`${pokemon.name}-${index}`}
              type="button"
              className={`${styles.gymPokemonBtn}${isSelected ? ` ${styles.gymPokemonBtnSelected}` : ''}`}
              onClick={() => onPokemonSelect(pokemon.name)}
            >
              {pokemon.name}
              <span className={styles.gymPokemonLevel}>Lv.{pokemon.level}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
