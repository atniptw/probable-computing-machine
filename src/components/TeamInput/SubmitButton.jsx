import styles from './SubmitButton.module.css'

export default function SubmitButton({ disabled, loading }) {
  return (
    <button type="submit" disabled={disabled} className={styles.button}>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {loading ? 'Checking…' : 'Check Matchups'}
    </button>
  )
}
