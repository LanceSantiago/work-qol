import { Outlet, NavLink } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'

const navLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/scrum-poker', label: 'Scrum Poker' },
  { to: '/standup-wheel', label: 'Standup Wheel' },
  { to: '/food-picker', label: 'Food Picker' },
  { to: '/pagerduty', label: 'PagerDuty' },
  { to: '/sentry', label: 'Sentry' },
]

export default function Layout() {
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <span className="font-semibold text-sm mr-3 shrink-0 text-gray-700 dark:text-gray-300">
                work-qol
              </span>
              {navLinks.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'px-3 py-1.5 rounded-md text-sm font-medium shrink-0 transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="ml-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
