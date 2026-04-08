import { formatRelative } from '../../utils/dates'
import type { SentryIssue } from '../../types/sentry'
import { LevelBadge } from './LevelBadge'
import { SkeletonRow } from './SkeletonRow'

// ── Issues table ──────────────────────────────────────────────────────────────

export function IssuesTable({
  issues,
  loading,
  error,
}: {
  issues: SentryIssue[]
  loading: boolean
  error: string | null
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th className="text-left px-4 py-2.5 font-medium w-20">Level</th>
            <th className="text-left px-4 py-2.5 font-medium">Issue</th>
            <th className="text-left px-4 py-2.5 font-medium w-32 hidden sm:table-cell">Project</th>
            <th className="text-right px-4 py-2.5 font-medium w-20">Events</th>
            <th className="text-right px-4 py-2.5 font-medium w-28">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading && !issues.length && (
            <>
              {[...Array(6)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </>
          )}

          {!loading && issues.length === 0 && (
            <tr>
              <td
                colSpan={5}
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
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] block">
                  {issue.project}
                </span>
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
  )
}
