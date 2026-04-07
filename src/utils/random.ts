/**
 * Picks a random item from an array with equal probability.
 */
export function randomPick<T>(items: T[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array')
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Picks a random item using weights. Higher weight = more likely to be picked.
 * weights[i] corresponds to items[i].
 */
export function weightedRandomPick<T>(items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array')
  if (items.length !== weights.length) throw new Error('items and weights must be the same length')

  const total = weights.reduce((sum, w) => sum + w, 0)
  let threshold = Math.random() * total

  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i]
    if (threshold <= 0) return items[i]
  }

  // Fallback for floating point edge cases
  return items[items.length - 1]
}

/**
 * Builds weights for a list of places based on how recently they were visited.
 * Places visited more recently get lower weight (less likely to be picked).
 *
 * Weight formula: daysSinceVisit + 1 (so never-visited places = highest weight,
 * and recently visited places still have a non-zero chance).
 */
export function buildVisitWeights(lastVisitedDates: (string | null)[]): number[] {
  const now = Date.now()
  const MS_PER_DAY = 1000 * 60 * 60 * 24

  return lastVisitedDates.map((dateStr) => {
    if (!dateStr) return 30 // never visited — high weight
    const daysSince = (now - new Date(dateStr).getTime()) / MS_PER_DAY
    return Math.max(1, Math.floor(daysSince) + 1)
  })
}
