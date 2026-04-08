import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { formatRelative } from '../../utils/dates'
import type { Incident } from '../../types/pagerduty'
import { LastUpdated } from './LastUpdated'
import { RefreshButton } from './RefreshButton'
import { SectionError } from './SectionError'
import { SkeletonRow } from './SkeletonRow'

// ── Incidents section ─────────────────────────────────────────────────────────

const URGENCY_STYLES = {
  high: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    row: 'border-l-4 border-l-red-500',
  },
  low: {
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    row: 'border-l-4 border-l-yellow-400',
  },
}

const STATUS_BADGE: Record<Incident['status'], string> = {
  triggered: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  acknowledged: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

/** Fetches and displays active (triggered/acknowledged) PagerDuty incidents. Auto-refreshes every minute. */
export function IncidentsSection() {
  const { data, loading, error, lastUpdated, refresh } = useAutoRefresh<Incident[]>(
    '/api/pagerduty/incidents',
    60 * 1000
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Active Incidents</h2>
          {data && data.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {data.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated date={lastUpdated} />
          <RefreshButton onClick={refresh} />
        </div>
      </div>

      {error && <SectionError message={error} />}

      {loading && !error && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(3)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-600 dark:text-green-400">
          ✓ No active incidents
        </div>
      )}

      {data && data.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {data.map((incident) => {
            const s = URGENCY_STYLES[incident.urgency]
            return (
              <div key={incident.id} className={`px-4 py-3 ${s.row}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <a
                        href={incident.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {incident.title}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE[incident.status]}`}
                      >
                        {incident.status}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.badge}`}>
                        {incident.urgency} urgency
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {incident.serviceName}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatRelative(incident.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
