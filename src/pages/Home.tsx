import { Link } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import { IncidentsWidget } from '../components/home/IncidentsWidget'
import { OnCallWidget } from '../components/home/OnCallWidget'
import { SentryWidget } from '../components/home/SentryWidget'
import { GithubWidget } from '../components/home/GithubWidget'
import { TabTitleBadge } from '../components/home/TabTitleBadge'
import { LastRefreshHint } from '../components/home/LastRefreshHint'

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
    disabled: true,
  },
  {
    to: '/sentry',
    label: 'Sentry',
    description: 'Monitor unresolved errors across your projects.',
    icon: '🐛',
    disabled: true,
  },
  {
    to: '/github',
    label: 'GitHub PRs',
    description: 'Open pull requests across all configured repos.',
    icon: '🐙',
    disabled: true,
  },
]

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
            <IncidentsWidget disabled />
          </ErrorBoundary>
          <ErrorBoundary title="On-call widget failed">
            <OnCallWidget disabled />
          </ErrorBoundary>
          <ErrorBoundary title="Sentry widget failed">
            <SentryWidget disabled />
          </ErrorBoundary>
          <ErrorBoundary title="GitHub widget failed">
            <GithubWidget disabled />
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
          {tools.map(({ to, label, description, icon, disabled }) =>
            disabled ? (
              <div
                key={to}
                className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 opacity-50"
              >
                <span className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                  No token
                </span>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              </div>
            ) : (
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
            )
          )}
        </div>
      </section>
    </div>
  )
}
