import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { PullRequest } from '../../types/github'
import { WidgetShell } from './WidgetShell'

function GithubWidgetContent() {
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

export function GithubWidget({ disabled }: { disabled?: boolean }) {
  if (disabled) return <WidgetShell title="Open PRs" to="/github" disabled />
  return <GithubWidgetContent />
}
