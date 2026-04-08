import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { OnCallEntry } from '../../types/pagerduty'
import { LastUpdated } from './LastUpdated'
import { RefreshButton } from './RefreshButton'
import { SectionError } from './SectionError'
import { SkeletonRow } from './SkeletonRow'

// ── On-Call section ───────────────────────────────────────────────────────────

/** Fetches and displays who is currently on-call, including schedule name and escalation level. Auto-refreshes every 5 minutes. */
export function OnCallSection() {
  const { data, loading, error, lastUpdated, refresh } = useAutoRefresh<OnCallEntry[]>(
    '/api/pagerduty/oncall',
    5 * 60 * 1000
  )

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Who&apos;s On Call</h2>
        <div className="flex items-center gap-2">
          <LastUpdated date={lastUpdated} />
          <RefreshButton onClick={refresh} />
        </div>
      </div>

      {error && <SectionError message={error} />}

      {loading && !error && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(2)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No on-call schedules found.</p>
      )}

      {data && data.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              {entry.userAvatarUrl ? (
                <img
                  src={entry.userAvatarUrl}
                  alt={entry.userName}
                  className="w-9 h-9 rounded-full shrink-0 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full shrink-0 bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  {entry.userName[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm">{entry.userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {entry.scheduleName} · Level {entry.escalationLevel}
                </p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {entry.escalationPolicyName}
                </p>
                {entry.end && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Until{' '}
                    {new Date(entry.end).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
