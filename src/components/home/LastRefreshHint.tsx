import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { formatRelative } from '../../utils/dates'

// ── Last refresh summary ──────────────────────────────────────────────────────

export function LastRefreshHint() {
  const { lastUpdated } = useAutoRefresh<unknown>('/api/pagerduty/incidents', 60 * 1000)
  if (!lastUpdated) return null
  return (
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
      Last refreshed {formatRelative(lastUpdated.toISOString())}
    </p>
  )
}
