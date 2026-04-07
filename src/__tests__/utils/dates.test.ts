import { describe, it, expect } from 'vitest'
import { isStale, formatRelative } from '../../utils/dates'

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString()
const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString()

describe('isStale', () => {
  it('returns false for a recent date (same day)', () => {
    expect(isStale(hoursAgo(1))).toBe(false)
  })

  it('returns false for a date just under the threshold', () => {
    expect(isStale(hoursAgo(47))).toBe(false)
  })

  it('returns true for a date over the default 2-day threshold', () => {
    expect(isStale(daysAgo(3))).toBe(true)
  })

  it('respects a custom day threshold', () => {
    expect(isStale(daysAgo(5), 7)).toBe(false)
    expect(isStale(daysAgo(8), 7)).toBe(true)
  })
})

describe('formatRelative', () => {
  it('returns "just now" for very recent times', () => {
    expect(formatRelative(new Date().toISOString())).toBe('just now')
  })

  it('returns minutes for times under an hour', () => {
    expect(formatRelative(minutesAgo(5))).toBe('5 minutes ago')
  })

  it('uses singular for 1 minute', () => {
    expect(formatRelative(minutesAgo(1))).toBe('1 minute ago')
  })

  it('returns hours for times under a day', () => {
    expect(formatRelative(hoursAgo(3))).toBe('3 hours ago')
  })

  it('uses singular for 1 hour', () => {
    expect(formatRelative(hoursAgo(1))).toBe('1 hour ago')
  })

  it('returns days for older times', () => {
    expect(formatRelative(daysAgo(4))).toBe('4 days ago')
  })

  it('uses singular for 1 day', () => {
    expect(formatRelative(daysAgo(1))).toBe('1 day ago')
  })
})
