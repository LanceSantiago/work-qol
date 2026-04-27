import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { AbsenceEntry } from '../../types/absence'
import { WidgetShell } from './WidgetShell'

function AbsenceWidgetContent() {
  const { data, loading, error } = useAutoRefresh<AbsenceEntry[]>(
    '/api/absence/today',
    5 * 60 * 1000
  )

  if (loading && !data) {
    return (
      <WidgetShell title="Out Today">
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1.5" />
      </WidgetShell>
    )
  }

  if (error) {
    return (
      <WidgetShell title="Out Today">
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      </WidgetShell>
    )
  }

  return (
    <WidgetShell title="Out Today">
      {!data || data.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Everyone&apos;s in today!</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((entry) => (
            <li key={entry.userId} className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {entry.userName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {entry.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  )
}

export function AbsenceWidget({ disabled }: { disabled?: boolean }) {
  if (disabled) return <WidgetShell title="Out Today" disabled />
  return <AbsenceWidgetContent />
}
