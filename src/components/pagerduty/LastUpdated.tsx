import { formatRelative } from '../../utils/dates'

// ── Last updated ──────────────────────────────────────────────────────────────

/** Renders a human-readable "Updated X ago" timestamp. Returns nothing when `date` is null. */
export function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">
      Updated {formatRelative(date.toISOString())}
    </span>
  )
}
