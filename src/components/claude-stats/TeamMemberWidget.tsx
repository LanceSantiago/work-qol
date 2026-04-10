import type { MemberStats, ModelUsageDetail } from '../../types/claudeStats'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function shortModel(model: string): string {
  const m = model.toLowerCase()
  let name = model
  if (m.includes('opus')) name = 'Opus'
  else if (m.includes('sonnet')) name = 'Sonnet'
  else if (m.includes('haiku')) name = 'Haiku'
  const v = model.match(/(\d+)[.-](\d+)/)
  if (v) name += ` ${v[1]}.${v[2]}`
  return name
}

/** Matches what the Claude CLI /stats command counts: input + output only (cache excluded). */
function totalForModel(u: ModelUsageDetail): number {
  return u.inputTokens + u.outputTokens
}

// ── Token bar ─────────────────────────────────────────────────────────────────

function TokenBar({ usage }: { usage: Record<string, ModelUsageDetail> }) {
  const entries = Object.values(usage)
  const input = entries.reduce((s, u) => s + u.inputTokens, 0)
  const output = entries.reduce((s, u) => s + u.outputTokens, 0)
  const cacheRead = entries.reduce((s, u) => s + u.cacheReadInputTokens, 0)
  const cacheWrite = entries.reduce((s, u) => s + u.cacheCreationInputTokens, 0)
  const total = input + output + cacheRead + cacheWrite || 1

  const segments = [
    { color: 'bg-blue-500 dark:bg-blue-400', label: 'Input', value: input },
    { color: 'bg-emerald-500 dark:bg-emerald-400', label: 'Output', value: output },
    { color: 'bg-amber-400 dark:bg-amber-300', label: 'Cache read', value: cacheRead },
    { color: 'bg-purple-400 dark:bg-purple-300', label: 'Cache write', value: cacheWrite },
  ]

  return (
    <div className="mt-3 mb-4">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {segments.map(({ color, label, value }) => (
          <div
            key={label}
            className={`${color} ${label === 'Input' ? 'rounded-l-full' : ''} ${label === 'Cache write' ? 'rounded-r-full' : ''}`}
            style={{ width: `${(value / total) * 100}%` }}
            title={`${label}: ${fmtTokens(value)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {segments.map(({ color, label, value }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {label}:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fmtTokens(value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Daily activity sparkline ───────────────────────────────────────────────────

function ActivityChart({ stats }: { stats: MemberStats }) {
  // Last 14 days of token data
  const days = [...stats.dailyModelTokens].slice(-14)
  if (days.length === 0) return null

  const maxTokens = Math.max(
    ...days.map((d) => Object.values(d.tokensByModel).reduce((s, v) => s + v, 0)),
    1
  )

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        Daily tokens (last {days.length} active days)
      </p>
      <div className="flex items-end gap-0.5 h-10">
        {days.map((d) => {
          const total = Object.values(d.tokensByModel).reduce((s, v) => s + v, 0)
          const pct = (total / maxTokens) * 100
          return (
            <div
              key={d.date}
              className="flex-1 bg-blue-400 dark:bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity min-w-0"
              style={{ height: `${Math.max(pct, 4)}%` }}
              title={`${d.date}: ${fmtTokens(total)}`}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function TeamMemberWidget({ stats }: { stats: MemberStats }) {
  const models = Object.entries(stats.modelUsage)
  const totalTokens = models.reduce((s, [, u]) => s + totalForModel(u), 0)
  const totalSessions = stats.totalSessions
  const totalMessages = stats.totalMessages

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {stats.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            since {fmtDate(stats.firstSessionDate)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {fmtTokens(totalTokens)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">total tokens</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {totalSessions.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">sessions</p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {totalMessages.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">messages</p>
        </div>
      </div>

      {/* Token breakdown bar */}
      <TokenBar usage={stats.modelUsage} />

      {/* Model breakdown */}
      {models.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            By model
          </p>
          <div className="space-y-0">
            {models.map(([model, u]) => (
              <div
                key={model}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span
                  className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate max-w-[55%]"
                  title={model}
                >
                  {shortModel(model)}
                </span>
                <div className="text-right">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {fmtTokens(totalForModel(u))}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                    {fmtTokens(u.inputTokens)} in · {fmtTokens(u.outputTokens)} out
                    {u.cacheReadInputTokens > 0 && ` · ${fmtTokens(u.cacheReadInputTokens)} cached`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity chart */}
      <ActivityChart stats={stats} />
    </div>
  )
}
