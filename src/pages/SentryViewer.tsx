import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatRelative } from '../utils/dates'
import type { SentryIssue, SentryLevel } from '../types/sentry'

const LEVEL_STYLES: Record<SentryLevel, { badge: string; dot: string }> = {
  fatal: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  error: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  warning: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    dot: 'bg-yellow-400',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-400',
  },
  debug: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
}

function LevelBadge({ level }: { level: SentryLevel }) {
  const s = LEVEL_STYLES[level] ?? LEVEL_STYLES.error
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${s.badge}`}
    >
      {level}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
    </tr>
  )
}

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
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['fatal', 'error', 'warning', 'info'] as SentryLevel[]).map((level) => {
            const count = issues.filter((i) => i.level === level).length
            const s = LEVEL_STYLES[level]
            return (
              <div
                key={level}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 flex items-center gap-2"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{level}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium w-20">Level</th>
              <th className="text-left px-4 py-2.5 font-medium">Issue</th>
              <th className="text-right px-4 py-2.5 font-medium w-20">Events</th>
              <th className="text-right px-4 py-2.5 font-medium w-28">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && !data && (
              <>
                {[...Array(6)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            )}

            {!loading && issues.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm"
                >
                  {error ? 'Could not load issues.' : '✓ No unresolved issues in the last 24 hours'}
                </td>
              </tr>
            )}

            {issues.map((issue) => (
              <tr
                key={issue.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <LevelBadge level={issue.level} />
                </td>
                <td className="px-4 py-3 max-w-0">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <a
                        href={issue.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {issue.title}
                      </a>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        First seen {formatRelative(issue.firstSeen)}
                        {issue.isUnhandled && (
                          <span className="ml-2 text-red-400 dark:text-red-500">unhandled</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm font-medium">
                    {parseInt(issue.count).toLocaleString()}
                  </span>
                  {issue.userCount > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {issue.userCount} user{issue.userCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatRelative(issue.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
