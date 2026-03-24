import styles from '../../App.module.css'
import { toTitleCase } from '../../utils/format'

interface SuggestionListProps {
  ariaLabel: string
  suggestions: string[]
  onSelect: (name: string) => void
}

export default function SuggestionList({
  ariaLabel,
  suggestions,
  onSelect,
}: SuggestionListProps) {
  return (
    <div
      className={styles.suggestionList}
      role="listbox"
      aria-label={ariaLabel}
    >
      {suggestions.map((name) => (
        <button
          key={name}
          type="button"
          className={styles.suggestionItem}
          onClick={() => onSelect(name)}
        >
          {toTitleCase(name)}
        </button>
      ))}
    </div>
  )
}
