import { Link } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import { IncidentsWidget } from '../components/home/IncidentsWidget'
import { OnCallWidget } from '../components/home/OnCallWidget'
import { SentryWidget } from '../components/home/SentryWidget'
import { AbsenceWidget } from '../components/home/AbsenceWidget'
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
      <section className="mb-6 sm:mb-10">
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
            <SentryWidget disabled />
          </ErrorBoundary>
          <ErrorBoundary title="Absence widget failed">
            <AbsenceWidget disabled />
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
            disabled ? null : (
              <Link
                key={to}
                to={to}
                className="group flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
              >
                <div className="text-3xl shrink-0 sm:mb-3">{icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                    {description}
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  )
}
