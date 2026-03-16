import PokemonSlot from './PokemonSlot.jsx'
import styles from './TeamSlots.module.css'

export default function TeamSlots({ label, slots, slotErrors, onChange, disabled }) {
  return (
    <div className={styles.group}>
      <h2 className={styles.label}>{label}</h2>
      <div className={styles.slots}>
        {slots.map((value, i) => (
          <PokemonSlot
            key={i}
            value={value}
            onChange={(v) => onChange(i, v)}
            error={slotErrors?.[i] ?? null}
            placeholder={`Pokémon ${i + 1}`}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
