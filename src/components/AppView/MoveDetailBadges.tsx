import styles from '../../App.module.css'
import { useMoveDetail } from '../../hooks/useMoveDetail'
import type { DamageClass } from '../../services/pokeapiClient'
import TypeBadge from '../TypeBadge'

const DAMAGE_CLASS_LABELS: Record<DamageClass, string> = {
  physical: 'Physical',
  special: 'Special',
  status: 'Status',
}

interface MoveDetailBadgesProps {
  moveName: string
}

export default function MoveDetailBadges({ moveName }: MoveDetailBadgesProps) {
  const { detail, loading } = useMoveDetail(moveName)

  if (loading) {
    return (
      <span
        className={styles.moveDetailSkeleton}
        aria-label={`Loading details for ${moveName}`}
      />
    )
  }

  if (!detail) return null

  return (
    <span className={styles.moveDetailBadges}>
      <TypeBadge typeName={detail.type} className={styles.typeBadge} />
      <span className={styles.damageClassChip} data-class={detail.damageClass}>
        {DAMAGE_CLASS_LABELS[detail.damageClass]}
      </span>
      {detail.damageClass !== 'status' && detail.basePower !== null && (
        <span className={styles.movePower}>{detail.basePower} BP</span>
      )}
    </span>
  )
}
