import { REACTION_EMOJIS } from '../types/scrumPoker'

// ── Emoji usage tracking ──────────────────────────────────────────────────────

export const USAGE_KEY = 'scrum-poker-emoji-usage'
export const BAR_SIZE = 8

/** Returns the emoji usage map stored in localStorage, keyed by emoji with last-used timestamps as values. */
export function getUsage(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Records the current timestamp for `emoji` in the localStorage usage map. */
export function recordUsage(emoji: string) {
  const usage = getUsage()
  usage[emoji] = Date.now()
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

/**
 * Returns up to `BAR_SIZE` emojis for the quick-pick bar.
 * Recently used emojis come first (sorted by timestamp), with default reaction emojis
 * filling remaining slots if the user hasn't used enough emojis yet.
 */
export function getTopEmojis(): string[] {
  const usage = getUsage()
  const sorted = Object.entries(usage)
    .sort(([, a], [, b]) => b - a)
    .map(([e]) => e)
  const result = [...sorted]
  for (const e of REACTION_EMOJIS) {
    if (result.length >= BAR_SIZE) break
    if (!result.includes(e)) result.push(e)
  }
  return result.slice(0, BAR_SIZE)
}
