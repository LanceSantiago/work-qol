import { Link } from 'react-router-dom'

// ── Widget shell ──────────────────────────────────────────────────────────────

export function WidgetShell({
  title,
  to,
  children,
  disabled,
}: {
  title: string
  to: string
  children?: React.ReactNode
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
            No token
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Not configured</p>
      </div>
    )
  }

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
