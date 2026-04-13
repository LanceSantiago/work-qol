import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'

const navLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/scrum-poker', label: 'Scrum Poker' },
  { to: '/standup-wheel', label: 'Standup Wheel' },
  { to: '/food-picker', label: 'Food Picker' },
  { to: '/pagerduty', label: 'PagerDuty', disabled: true },
  { to: '/sentry', label: 'Sentry', disabled: true },
  { to: '/github', label: 'GitHub PRs', disabled: true },
  { to: '/claude-stats', label: 'Claude Stats' },
]

const activeLinks = navLinks.filter((l) => !l.disabled)

/**
 * Top-level page shell. Renders the sticky navigation bar with links to all
 * app pages, a dark-mode toggle, and an `<Outlet>` where the active route's
 * content is displayed.
 */
export default function Layout() {
  const { isDark, toggle } = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <nav
        ref={menuRef}
        className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <img src="/logo.png" alt="Track Revenue" className="h-6 shrink-0 dark:brightness-90" />

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1 ml-4 flex-1 overflow-x-auto scrollbar-hide">
              {activeLinks.map(({ to, label, end }) => (
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

            <div className="flex items-center gap-1 ml-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggle}
                aria-label="Toggle dark mode"
                className="p-2.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {/* Hamburger — below lg breakpoint */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                className="lg:hidden p-2.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {menuOpen ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
            {activeLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'block px-3 py-3 rounded-md text-sm font-medium transition-colors',
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
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
