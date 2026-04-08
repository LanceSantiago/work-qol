import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatRelative } from '../utils/dates'
import type { PullRequest } from '../types/github'

/** Animated placeholder row shown while PR data is loading. Renders 4 gray blocks matching the table columns. */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3 w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
    </tr>
  )
}

/**
 * Displays all open pull requests across configured repos, auto-refreshing every 5 minutes.
 * Shows summary stats (total, drafts, stale), a stale warning banner, and a sortable table.
 * PRs open for more than 2 days are flagged as stale.
 */
export default function GithubPRs() {
  const { data, loading, error, lastUpdated, refresh } = useAutoRefresh<PullRequest[]>(
    '/api/github/prs',
    5 * 60 * 1000
  )

  const prs = data ?? []
  const staleCount = prs.filter((p) => p.isStale).length

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h1 className="text-2xl font-bold">GitHub Pull Requests</h1>
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
        Open pull requests across all configured repos. Refreshes every 5 minutes.
      </p>

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <p className="text-xl font-bold">{prs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Open PRs</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <p className="text-xl font-bold">{prs.filter((p) => p.isDraft).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Drafts</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <p
              className={`text-xl font-bold ${staleCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
            >
              {staleCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stale (&gt;2 days)</p>
          </div>
        </div>
      )}

      {staleCount > 0 && data && (
        <div className="mb-4 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          ⚠️ {staleCount} PR{staleCount !== 1 ? 's' : ''} open for more than 2 days
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 mb-4">
          Failed to load pull requests: {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Title</th>
              <th className="text-left px-4 py-2.5 font-medium w-32">Repo</th>
              <th className="text-left px-4 py-2.5 font-medium w-28">Author</th>
              <th className="text-right px-4 py-2.5 font-medium w-28">Opened</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && !data && (
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            )}

            {!loading && prs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm"
                >
                  {error ? 'Could not load pull requests.' : '✓ No open pull requests'}
                </td>
              </tr>
            )}

            {prs.map((pr) => (
              <tr
                key={`${pr.repo}-${pr.id}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 max-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {pr.title}
                    </a>
                    {pr.isDraft && (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                        Draft
                      </span>
                    )}
                    {pr.isStale && !pr.isDraft && (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 font-medium">
                        Stale
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {pr.repo.split('/')[1] ?? pr.repo}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{pr.author}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatRelative(pr.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
