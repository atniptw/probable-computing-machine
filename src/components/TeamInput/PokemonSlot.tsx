import styles from './PokemonSlot.module.css'

interface PokemonSlotProps {
  value: string
  onChange: (value: string) => void
  error: string | null
  placeholder: string
  disabled: boolean
}

export default function PokemonSlot({
  value,
  onChange,
  error,
  placeholder,
  disabled,
}: PokemonSlotProps) {
  return (
    <div className={styles.slot}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        aria-invalid={!!error}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
      />
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
