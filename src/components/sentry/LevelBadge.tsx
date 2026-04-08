import type { SentryLevel } from '../../types/sentry'

// ── Level badge ───────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<SentryLevel, { badge: string; dot: string }> = {
  fatal: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  error: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  warning: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    dot: 'bg-yellow-400',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-400',
  },
  debug: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
}

/** Coloured pill badge that displays the Sentry issue severity level (fatal, error, warning, info, debug). */
export function LevelBadge({ level }: { level: SentryLevel }) {
  const s = LEVEL_STYLES[level] ?? LEVEL_STYLES.error
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${s.badge}`}
    >
      {level}
    </span>
  )
}

export { LEVEL_STYLES }
