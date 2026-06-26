import { useState } from 'react'

import styles from '../../App.module.css'
import { useTeamCoverage } from '../../hooks/useTeamCoverage'
import type { TeamMemberConfig } from '../../hooks/useTeamConfiguration'
import type { TypeRelations } from '../../services/pokeapiClient'
import { toTitleCase } from '../../utils/format'
import TypeBadge from '../TypeBadge'

interface TeamCoveragePanelProps {
  teamMembers: TeamMemberConfig[]
  generation: number
  typeMap: Map<string, TypeRelations> | null
  onError: (message: string | null) => void
}

export default function TeamCoveragePanel({
  teamMembers,
  generation,
  typeMap,
  onError,
}: TeamCoveragePanelProps) {
  const [open, setOpen] = useState(false)
  const { coverage, loading } = useTeamCoverage({
    teamMembers,
    generation,
    typeMap,
    onError,
  })

  // Only render when the type chart is ready (and never in the battle view).
  if (!typeMap) return null

  const allTypes = Array.from(typeMap.keys()).sort()
  const offensiveSet = new Set(coverage?.offensiveCoverage ?? [])
  const gaps = [...(coverage?.defensiveGaps ?? [])].sort()

  return (
    <section className={styles.coveragePanel} aria-label="Team coverage">
      <button
        type="button"
        className={styles.coverageToggle}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        Show team coverage {open ? '▴' : '▾'}
      </button>

      {open && (
        <div className={styles.coverageBody}>
          {loading ? (
            <p className={styles.coverageHint}>Analyzing team coverage…</p>
          ) : (
            <>
              <div className={styles.coverageGroup}>
                <p className={styles.coverageLabel}>
                  Offensive coverage — types your team hits ≥2×
                </p>
                <div className={styles.coverageGrid}>
                  {allTypes.map((type) =>
                    offensiveSet.has(type) ? (
                      <TypeBadge
                        key={type}
                        typeName={type}
                        className={styles.coveragePill}
                      />
                    ) : (
                      <span
                        key={type}
                        className={styles.coveragePillHollow}
                        data-covered="false"
                      >
                        {toTitleCase(type)}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className={styles.coverageGroup}>
                <p className={styles.coverageLabel}>
                  Defensive gaps — types no member resists
                </p>
                {gaps.length === 0 ? (
                  <p className={styles.coverageHint}>
                    No uncovered defensive gaps. 🎉
                  </p>
                ) : (
                  <div className={styles.coverageGrid}>
                    {gaps.map((type) => (
                      <span
                        key={type}
                        className={styles.coverageGapPill}
                        data-gap="true"
                      >
                        {toTitleCase(type)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
