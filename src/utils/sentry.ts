const ROTATION = ['Happi', 'Barry', 'Patrik', 'Lance', 'Kana', 'Craig']

// Monday of the week Happi starts (week of 2026-04-14)
const REF_MONDAY = new Date('2026-04-14T00:00:00')
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export function getSentryOnCall(date = new Date()): string {
  const monday = getMondayOf(date)
  const weeksDiff = Math.round((monday.getTime() - REF_MONDAY.getTime()) / MS_PER_WEEK)
  const index = ((weeksDiff % ROTATION.length) + ROTATION.length) % ROTATION.length
  return ROTATION[index]
}

export function isMonday(date = new Date()): boolean {
  return date.getDay() === 1
}
