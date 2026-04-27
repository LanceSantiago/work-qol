import { Link } from 'react-router-dom'

// ── Widget shell ──────────────────────────────────────────────────────────────

export function WidgetShell({
  title,
  to,
  children,
  disabled,
}: {
  title: string
  to?: string
  children?: React.ReactNode
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 opacity-50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          {title}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-600 italic">Not configured</p>
      </div>
    )
  }

  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </p>
      {children}
    </>
  )

  if (!to) {
    return (
      <div className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={to}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
    >
      {inner}
    </Link>
  )
}
