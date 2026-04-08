import type { SentryIssue, SentryLevel } from '../../types/sentry'
import { LEVEL_STYLES } from './LevelBadge'

// ── Issues summary ────────────────────────────────────────────────────────────

export function IssuesSummary({ issues }: { issues: SentryIssue[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {(['fatal', 'error', 'warning', 'info'] as SentryLevel[]).map((level) => {
        const count = issues.filter((i) => i.level === level).length
        const s = LEVEL_STYLES[level]
        return (
          <div
            key={level}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 flex items-center gap-2"
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
            <div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{level}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
