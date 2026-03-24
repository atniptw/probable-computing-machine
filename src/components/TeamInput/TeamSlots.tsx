import PokemonSlot from './PokemonSlot'
import styles from './TeamSlots.module.css'

interface TeamSlotsProps {
  label: string
  slots: string[]
  slotErrors: (string | null)[]
  onChange: (index: number, value: string) => void
  disabled: boolean
}

export default function TeamSlots({
  label,
  slots,
  slotErrors,
  onChange,
  disabled,
}: TeamSlotsProps) {
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
