const MS_PER_DAY = 1000 * 60 * 60 * 24
const MS_PER_HOUR = 1000 * 60 * 60
const MS_PER_MINUTE = 1000 * 60

/**
 * Returns true if the given ISO date string is older than `days` days.
 */
export function isStale(dateStr: string, days = 2): boolean {
  const age = Date.now() - new Date(dateStr).getTime()
  return age > days * MS_PER_DAY
}

/**
 * Returns a human-readable relative time string for a given ISO date string.
 * e.g. "just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()

  if (diff < MS_PER_MINUTE) return 'just now'
  if (diff < MS_PER_HOUR) {
    const mins = Math.floor(diff / MS_PER_MINUTE)
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (diff < MS_PER_DAY) {
    const hours = Math.floor(diff / MS_PER_HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.floor(diff / MS_PER_DAY)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
