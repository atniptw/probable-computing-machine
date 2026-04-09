import styles from '../../App.module.css'
import GameVersionSelect from './GameVersionSelect'

interface TeamConfigurationSectionProps {
  selectedGameVersion: string
  onGameChange: (nextVersion: string) => void
  onBack: () => void
}

export default function TeamConfigurationSection({
  selectedGameVersion,
  onGameChange,
  onBack,
}: TeamConfigurationSectionProps) {
  return (
    <section className={styles.selectorSection}>
      <div className={styles.selectorHeader}>
        <div className={styles.selectorLabel}>Team configuration</div>
        <button type="button" className={styles.linkButton} onClick={onBack}>
          Back
        </button>
      </div>

      <GameVersionSelect
        id="game-version-team"
        value={selectedGameVersion}
        onChange={onGameChange}
      />

      <p className={styles.configureHint}>
        Save 1-6 Pokemon from the selected game Pokedex, plus optional moves.
      </p>
    </section>
  )
}
