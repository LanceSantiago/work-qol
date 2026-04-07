import { describe, it, expect, beforeEach } from 'vitest'
import { onRequestGet, onRequestPost } from '../../../functions/api/places/index'
import { onRequestPatch, onRequestDelete } from '../../../functions/api/places/[id]'
import type { Place } from '../../types/places'

// ── KV mock ───────────────────────────────────────────────────────────────────

function makeMockKV(initial: Place[] = []) {
  const store: Record<string, string> = {
    all: JSON.stringify(initial),
  }
  return {
    async get<T>(key: string, type?: string): Promise<T | null> {
      const val = store[key]
      if (val === undefined) return null
      return type === 'json' ? (JSON.parse(val) as T) : (val as T)
    },
    async put(key: string, value: string): Promise<void> {
      store[key] = value
    },
    // Expose store for assertions
    _store: store,
  }
}

function makeContext(
  kv: ReturnType<typeof makeMockKV>,
  overrides: { method?: string; body?: unknown; params?: Record<string, string> } = {}
) {
  return {
    env: { PLACES: kv },
    params: overrides.params ?? {},
    request: new Request('http://localhost/api/places', {
      method: overrides.method ?? 'GET',
      body: overrides.body ? JSON.stringify(overrides.body) : undefined,
      headers: overrides.body ? { 'Content-Type': 'application/json' } : {},
    }),
  }
}

// ── GET /api/places ───────────────────────────────────────────────────────────

describe('GET /api/places', () => {
  it('returns empty array when KV is empty', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv)
    const res = await onRequestGet(ctx as unknown as Parameters<typeof onRequestGet>[0])
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns existing places', async () => {
    const places: Place[] = [
      {
        id: '1',
        name: 'Sushi Place',
        address: '123 Main',
        category: 'food',
        lat: 1,
        lng: 2,
        visitedDates: [],
      },
    ]
    const kv = makeMockKV(places)
    const res = await onRequestGet(makeContext(kv) as unknown as Parameters<typeof onRequestGet>[0])
    expect(await res.json()).toEqual(places)
  })
})

// ── POST /api/places ──────────────────────────────────────────────────────────

describe('POST /api/places', () => {
  it('creates a new place and returns 201', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv, {
      method: 'POST',
      body: { name: 'Ramen Bar', address: '456 Oak', category: 'food', lat: 35.6, lng: 139.7 },
    })
    const res = await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])
    expect(res.status).toBe(201)
    const created: Place = await res.json()
    expect(created.name).toBe('Ramen Bar')
    expect(created.id).toBeTruthy()
    expect(created.visitedDates).toEqual([])
  })

  it('appends to existing places', async () => {
    const existing: Place[] = [
      { id: 'a', name: 'Pizza', address: '', category: 'food', lat: 0, lng: 0, visitedDates: [] },
    ]
    const kv = makeMockKV(existing)
    const ctx = makeContext(kv, { method: 'POST', body: { name: 'Tacos' } })
    await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])

    const stored: Place[] = JSON.parse(kv._store['all'])
    expect(stored).toHaveLength(2)
    expect(stored.map((p) => p.name)).toEqual(['Pizza', 'Tacos'])
  })

  it('returns 400 when name is missing', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv, { method: 'POST', body: { address: 'nowhere' } })
    const res = await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv, { method: 'POST', body: { name: '   ' } })
    const res = await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid JSON', async () => {
    const kv = makeMockKV([])
    const ctx = {
      env: { PLACES: kv },
      params: {},
      request: new Request('http://localhost/api/places', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      }),
    }
    const res = await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])
    expect(res.status).toBe(400)
  })

  it('defaults category to food when omitted', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv, { method: 'POST', body: { name: 'Burger Joint' } })
    const res = await onRequestPost(ctx as unknown as Parameters<typeof onRequestPost>[0])
    const created: Place = await res.json()
    expect(created.category).toBe('food')
  })
})

// ── PATCH /api/places/:id ─────────────────────────────────────────────────────

describe('PATCH /api/places/:id', () => {
  let kv: ReturnType<typeof makeMockKV>

  beforeEach(() => {
    kv = makeMockKV([
      { id: 'abc', name: 'Sushi', address: '', category: 'food', lat: 0, lng: 0, visitedDates: [] },
    ])
  })

  it('appends a visited date', async () => {
    const ctx = makeContext(kv, { method: 'PATCH', params: { id: 'abc' } })
    const res = await onRequestPatch(ctx as unknown as Parameters<typeof onRequestPatch>[0])
    expect(res.status).toBe(200)
    const updated: Place = await res.json()
    expect(updated.visitedDates).toHaveLength(1)
    expect(new Date(updated.visitedDates[0]).getTime()).toBeGreaterThan(0)
  })

  it('preserves prior visit dates', async () => {
    kv = makeMockKV([
      {
        id: 'abc',
        name: 'Sushi',
        address: '',
        category: 'food',
        lat: 0,
        lng: 0,
        visitedDates: ['2025-01-01T00:00:00.000Z'],
      },
    ])
    const ctx = makeContext(kv, { method: 'PATCH', params: { id: 'abc' } })
    const res = await onRequestPatch(ctx as unknown as Parameters<typeof onRequestPatch>[0])
    const updated: Place = await res.json()
    expect(updated.visitedDates).toHaveLength(2)
  })

  it('returns 404 for unknown id', async () => {
    const ctx = makeContext(kv, { method: 'PATCH', params: { id: 'nope' } })
    const res = await onRequestPatch(ctx as unknown as Parameters<typeof onRequestPatch>[0])
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/places/:id ────────────────────────────────────────────────────

describe('DELETE /api/places/:id', () => {
  it('removes the place and returns 204', async () => {
    const kv = makeMockKV([
      { id: 'abc', name: 'Sushi', address: '', category: 'food', lat: 0, lng: 0, visitedDates: [] },
    ])
    const ctx = makeContext(kv, { method: 'DELETE', params: { id: 'abc' } })
    const res = await onRequestDelete(ctx as unknown as Parameters<typeof onRequestDelete>[0])
    expect(res.status).toBe(204)

    const stored: Place[] = JSON.parse(kv._store['all'])
    expect(stored).toHaveLength(0)
  })

  it('returns 404 for unknown id', async () => {
    const kv = makeMockKV([])
    const ctx = makeContext(kv, { method: 'DELETE', params: { id: 'ghost' } })
    const res = await onRequestDelete(ctx as unknown as Parameters<typeof onRequestDelete>[0])
    expect(res.status).toBe(404)
  })

  it('does not affect other places', async () => {
    const kv = makeMockKV([
      { id: 'a', name: 'Sushi', address: '', category: 'food', lat: 0, lng: 0, visitedDates: [] },
      { id: 'b', name: 'Tacos', address: '', category: 'food', lat: 0, lng: 0, visitedDates: [] },
    ])
    const ctx = makeContext(kv, { method: 'DELETE', params: { id: 'a' } })
    await onRequestDelete(ctx as unknown as Parameters<typeof onRequestDelete>[0])

    const stored: Place[] = JSON.parse(kv._store['all'])
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Tacos')
  })
})
