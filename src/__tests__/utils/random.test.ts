import { describe, it, expect } from 'vitest'
import { randomPick, weightedRandomPick, buildVisitWeights } from '../../utils/random'

describe('randomPick', () => {
  it('returns an item from the array', () => {
    const items = ['a', 'b', 'c']
    const result = randomPick(items)
    expect(items).toContain(result)
  })

  it('throws on empty array', () => {
    expect(() => randomPick([])).toThrow('Cannot pick from empty array')
  })

  it('returns the only item when array has one element', () => {
    expect(randomPick(['only'])).toBe('only')
  })
})

describe('weightedRandomPick', () => {
  it('returns an item from the array', () => {
    const items = ['a', 'b', 'c']
    const weights = [1, 1, 1]
    expect(items).toContain(weightedRandomPick(items, weights))
  })

  it('throws on empty array', () => {
    expect(() => weightedRandomPick([], [])).toThrow('Cannot pick from empty array')
  })

  it('throws when items and weights lengths differ', () => {
    expect(() => weightedRandomPick(['a', 'b'], [1])).toThrow(
      'items and weights must be the same length'
    )
  })

  it('always picks the item with all the weight', () => {
    const items = ['a', 'b', 'c']
    const weights = [0, 100, 0]
    // Run many times to ensure it always picks 'b'
    for (let i = 0; i < 50; i++) {
      expect(weightedRandomPick(items, weights)).toBe('b')
    }
  })

  it('never picks zero-weight items', () => {
    const items = ['unlikely', 'certain']
    const weights = [0, 1]
    for (let i = 0; i < 50; i++) {
      expect(weightedRandomPick(items, weights)).toBe('certain')
    }
  })
})

describe('buildVisitWeights', () => {
  it('assigns high weight (30) to never-visited places', () => {
    const weights = buildVisitWeights([null])
    expect(weights[0]).toBe(30)
  })

  it('assigns lower weight to recently visited places', () => {
    const recent = new Date().toISOString()
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    const weights = buildVisitWeights([recent, old])
    expect(weights[0]).toBeLessThan(weights[1])
  })

  it('returns at least weight 1 for any visited place', () => {
    const today = new Date().toISOString()
    const weights = buildVisitWeights([today])
    expect(weights[0]).toBeGreaterThanOrEqual(1)
  })
})
