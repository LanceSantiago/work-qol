import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { SentryIssue } from '../../types/sentry'
import { WidgetShell } from './WidgetShell'

// ── Sentry widget ─────────────────────────────────────────────────────────────

export function SentryWidget() {
  const { data, loading, error } = useAutoRefresh<SentryIssue[]>('/api/sentry/issues', 60 * 1000)

  if (loading && !data) {
    return (
      <WidgetShell title="Sentry Errors" to="/sentry">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </WidgetShell>
    )
  }

  if (error) {
    return (
      <WidgetShell title="Sentry Errors" to="/sentry">
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      </WidgetShell>
    )
  }

  const total = data?.length ?? 0
  const errorCount = data?.filter((i) => i.level === 'fatal' || i.level === 'error').length ?? 0

  return (
    <WidgetShell title="Sentry Errors" to="/sentry">
      <p
        className={`text-3xl font-bold ${errorCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
      >
        {total}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {errorCount > 0
          ? `${errorCount} error${errorCount !== 1 ? 's' : ''} / fatal`
          : 'No errors in 24h'}
      </p>
    </WidgetShell>
  )
}
