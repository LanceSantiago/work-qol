import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatRelative } from '../utils/dates'
import type { MemberStats } from '../types/claudeStats'
import { TeamMemberWidget } from '../components/claude-stats/TeamMemberWidget'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonWidget() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded" />
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClaudeStats() {
  const { data, loading, error, lastUpdated, refresh } = useAutoRefresh<MemberStats>(
    '/api/claude-stats',
    5 * 60 * 1000
  )

  const isNoData = !loading && !data && !error

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h1 className="text-2xl font-bold">Claude Token Usage</h1>
        <div className="flex items-center gap-2 mt-1">
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Fetched {formatRelative(lastUpdated.toISOString())}
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
        All-time Claude Code token usage per team member. Run{' '}
        <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          just push-stats
        </code>{' '}
        to sync the latest data from your machine.
      </p>

      {/* Last pushed timestamp */}
      {data?.pushedAt && (
        <div className="mb-4 text-xs text-gray-400 dark:text-gray-500">
          Last pushed {formatRelative(data.pushedAt)} · computed through {data.lastComputedDate}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 mb-6">
          <p className="font-medium mb-1">Failed to load usage data</p>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      )}

      {/* No data yet */}
      {isNoData && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No stats pushed yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Run{' '}
            <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              just push-stats
            </code>{' '}
            to sync your Claude Code usage data.
          </p>
        </div>
      )}

      {/* Team member widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !data && <SkeletonWidget />}
        {data && <TeamMemberWidget stats={data} />}
      </div>
    </div>
  )
}
