import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import ErrorBoundary from '../components/ErrorBoundary'
import { formatRelative } from '../utils/dates'
import type { Incident, OnCallEntry } from '../types/pagerduty'
import type { SentryIssue } from '../types/sentry'
import type { PullRequest } from '../types/github'

// ── Tool cards ────────────────────────────────────────────────────────────────

const tools = [
  {
    to: '/scrum-poker',
    label: 'Scrum Poker',
    description: 'Real-time collaborative planning poker for sprint estimation.',
    icon: '🃏',
  },
  {
    to: '/standup-wheel',
    label: 'Standup Wheel',
    description: 'Spin to randomly pick who runs standup today.',
    icon: '🎡',
  },
  {
    to: '/food-picker',
    label: 'Food Picker',
    description: 'Map of visited spots + a randomizer to pick where to eat.',
    icon: '🍜',
  },
  {
    to: '/pagerduty',
    label: 'PagerDuty',
    description: "See who's on call and active incidents.",
    icon: '📟',
  },
  {
    to: '/sentry',
    label: 'Sentry',
    description: 'Monitor unresolved errors across your projects.',
    icon: '🐛',
  },
  {
    to: '/github',
    label: 'GitHub PRs',
    description: 'Open pull requests across all configured repos.',
    icon: '🐙',
  },
]

// ── Widgets ───────────────────────────────────────────────────────────────────

function IncidentsWidget() {
  const { data, loading, error } = useAutoRefresh<Incident[]>('/api/pagerduty/incidents', 60 * 1000)

  if (loading && !data) {
    return (
      <WidgetShell title="Active Incidents" to="/pagerduty">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </WidgetShell>
    )
  }

  if (error) {
    return (
      <WidgetShell title="Active Incidents" to="/pagerduty">
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      </WidgetShell>
    )
  }

  const count = data?.length ?? 0
  const hasHigh = data?.some((i) => i.urgency === 'high') ?? false

  return (
    <WidgetShell title="Active Incidents" to="/pagerduty">
      <p
        className={`text-3xl font-bold ${count > 0 ? (hasHigh ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400') : 'text-green-600 dark:text-green-400'}`}
      >
        {count}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {count === 0 ? 'All clear' : count === 1 ? '1 incident' : `${count} incidents`}
      </p>
    </WidgetShell>
  )
}

function OnCallWidget() {
  const { data, loading, error } = useAutoRefresh<OnCallEntry[]>(
    '/api/pagerduty/oncall',
    5 * 60 * 1000
  )

  if (loading && !data) {
    return (
      <WidgetShell title="Who's On Call" to="/pagerduty">
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1.5" />
      </WidgetShell>
    )
  }

  if (error) {
    return (
      <WidgetShell title="Who's On Call" to="/pagerduty">
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      </WidgetShell>
    )
  }

  const primary = data?.[0]

  return (
    <WidgetShell title="Who's On Call" to="/pagerduty">
      {primary ? (
        <>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{primary.userName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {primary.escalationPolicyName}
          </p>
        </>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">No schedule found</p>
      )}
    </WidgetShell>
  )
}

function SentryWidget() {
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

function GithubWidget() {
  const { data, loading, error } = useAutoRefresh<PullRequest[]>('/api/github/prs', 5 * 60 * 1000)

  if (loading && !data) {
    return (
      <WidgetShell title="Open PRs" to="/github">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </WidgetShell>
    )
  }

  if (error) {
    return (
      <WidgetShell title="Open PRs" to="/github">
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      </WidgetShell>
    )
  }

  const prs = data ?? []
  const staleCount = prs.filter((p) => p.isStale).length

  return (
    <WidgetShell title="Open PRs" to="/github">
      <p
        className={`text-3xl font-bold ${staleCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}
      >
        {prs.length}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {staleCount > 0 ? `${staleCount} stale` : prs.length === 0 ? 'None open' : 'All fresh'}
      </p>
    </WidgetShell>
  )
}

function WidgetShell({
  title,
  to,
  children,
}: {
  title: string
  to: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </p>
      {children}
    </Link>
  )
}

// ── Tab title badge ───────────────────────────────────────────────────────────

function TabTitleBadge() {
  const { data } = useAutoRefresh<Incident[]>('/api/pagerduty/incidents', 60 * 1000)

  useEffect(() => {
    const count = data?.length ?? 0
    document.title = count > 0 ? `(${count}) work-qol` : 'work-qol'
    return () => {
      document.title = 'work-qol'
    }
  }, [data])

  return null
}

// ── Last refresh summary ──────────────────────────────────────────────────────

function LastRefreshHint() {
  const { lastUpdated } = useAutoRefresh<unknown>('/api/pagerduty/incidents', 60 * 1000)
  if (!lastUpdated) return null
  return (
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
      Last refreshed {formatRelative(lastUpdated.toISOString())}
    </p>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div>
      <TabTitleBadge />

      {/* Live status widgets */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Live Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ErrorBoundary title="Incidents widget failed">
            <IncidentsWidget />
          </ErrorBoundary>
          <ErrorBoundary title="On-call widget failed">
            <OnCallWidget />
          </ErrorBoundary>
          <ErrorBoundary title="Sentry widget failed">
            <SentryWidget />
          </ErrorBoundary>
          <ErrorBoundary title="GitHub widget failed">
            <GithubWidget />
          </ErrorBoundary>
        </div>
        <LastRefreshHint />
      </section>

      {/* Tool cards */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(({ to, label, description, icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
