import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { Incident } from '../../types/pagerduty'
import { WidgetShell } from './WidgetShell'

function IncidentsWidgetContent() {
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

export function IncidentsWidget({ disabled }: { disabled?: boolean }) {
  if (disabled) return <WidgetShell title="Active Incidents" to="/pagerduty" disabled />
  return <IncidentsWidgetContent />
}
