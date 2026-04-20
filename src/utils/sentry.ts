const ROTATION = ['Happi', 'Barry', 'Patrik', 'Lance', 'Kana', 'Craig']

// Monday when Happi's rotation starts: April 20, 2026
const REF_MONDAY = new Date(2026, 3, 20) // April 20, 2026 local time
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function getMondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export function getSentryOnCall(date = new Date()): string {
  const monday = getMondayOf(date)
  const weeksDiff = Math.round((monday.getTime() - REF_MONDAY.getTime()) / MS_PER_WEEK)
  const index = ((weeksDiff % ROTATION.length) + ROTATION.length) % ROTATION.length
  return ROTATION[index]
}
