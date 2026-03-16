import styles from './PokemonSlot.module.css'

export default function PokemonSlot({ value, onChange, error, placeholder, disabled }) {
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
