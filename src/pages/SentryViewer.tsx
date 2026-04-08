import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatRelative } from '../utils/dates'
import type { SentryIssue } from '../types/sentry'
import { IssuesSummary } from '../components/sentry/IssuesSummary'
import { IssuesTable } from '../components/sentry/IssuesTable'

/**
 * Sentry issue viewer page. Fetches unresolved issues from the last 24 hours,
 * shows per-level summary stats, a warning banner for fatal/error issues,
 * and a sortable table with event count and last-seen time. Auto-refreshes every minute.
 */
export default function SentryViewer() {
  const { data, loading, error, lastUpdated, refresh } = useAutoRefresh<SentryIssue[]>(
    '/api/sentry/issues',
    60 * 1000
  )

  const issues = data ?? []
  const fatalOrError = issues.filter((i) => i.level === 'fatal' || i.level === 'error')

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h1 className="text-2xl font-bold">Sentry</h1>
        <div className="flex items-center gap-2 mt-1">
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Updated {formatRelative(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={refresh}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Unresolved issues from the last 24 hours, sorted by most recent.
      </p>

      {/* Summary stats */}
      {data && <IssuesSummary issues={issues} />}

      {/* Error banner if there are fatal/error issues */}
      {data && fatalOrError.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          ⚠️ {fatalOrError.length} error{fatalOrError.length !== 1 ? 's' : ''} or fatal issue
          {fatalOrError.length !== 1 ? 's' : ''} require attention
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 mb-4">
          Failed to load issues: {error}
        </div>
      )}

      {/* Issues table */}
      <IssuesTable issues={issues} loading={loading} error={error} />
    </div>
  )
}
