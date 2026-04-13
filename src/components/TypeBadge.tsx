import { TYPE_COLORS } from '../utils/typeColors'
import { toTitleCase } from '../utils/format'

interface TypeBadgeProps {
  typeName: string
  className?: string
}

export default function TypeBadge({ typeName, className }: TypeBadgeProps) {
  const key = typeName.toLowerCase()
  const colors = TYPE_COLORS[key]

  const style = colors
    ? { backgroundColor: colors.bg, color: colors.text }
    : { border: '1px solid #d7dce0' }

  return (
    <span className={className} style={style}>
      {toTitleCase(typeName)}
    </span>
  )
}
