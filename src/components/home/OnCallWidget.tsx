import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { OnCallEntry } from '../../types/pagerduty'
import { WidgetShell } from './WidgetShell'

function OnCallWidgetContent() {
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

  const now = Date.now()
  const primary = data?.find(
    (e) =>
      e.escalationPolicyName === 'NA+APAC Escalation Policy (2024)' &&
      e.scheduleName === 'On-Call Primary (2024)' &&
      (!e.start || new Date(e.start).getTime() <= now) &&
      (!e.end || new Date(e.end).getTime() >= now)
  )

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
        <p className="text-xs text-red-500 dark:text-red-400">Failed to load</p>
      )}
    </WidgetShell>
  )
}

export function OnCallWidget({ disabled }: { disabled?: boolean }) {
  if (disabled) return <WidgetShell title="Who's On Call" to="/pagerduty" disabled />
  return <OnCallWidgetContent />
}
