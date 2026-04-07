import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatRelative } from '../utils/dates'
import type { OnCallEntry, Incident } from '../types/pagerduty'

// ── Shared ────────────────────────────────────────────────────────────────────

function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">
      Updated {formatRelative(date.toISOString())}
    </span>
  )
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
    >
      ↻ Refresh
    </button>
  )
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
      Failed to load: {message}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}

// ── On-Call section ───────────────────────────────────────────────────────────

function OnCallSection() {
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

function IncidentsSection() {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PagerDuty() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">PagerDuty</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        On-call schedule and active incidents. Refreshes automatically.
      </p>
      <OnCallSection />
      <IncidentsSection />
    </div>
  )
}
