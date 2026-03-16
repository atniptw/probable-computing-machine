import styles from './SubmitButton.module.css'

interface SubmitButtonProps {
  disabled: boolean
  loading: boolean
}

export default function SubmitButton({ disabled, loading }: SubmitButtonProps) {
  return (
    <button type="submit" disabled={disabled} className={styles.button}>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {loading ? 'Checking…' : 'Check Matchups'}
    </button>
  )
}
