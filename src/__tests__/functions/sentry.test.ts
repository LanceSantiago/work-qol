import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onRequestGet } from '../../../functions/api/sentry/issues'

const mockFetch = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', mockFetch))
afterEach(() => vi.restoreAllMocks())

function makeCtx(overrides: Record<string, string> = {}) {
  return {
    env: {
      SENTRY_AUTH_TOKEN: 'test-token',
      SENTRY_ORG_SLUG: 'my-org',
      SENTRY_PROJECT_SLUG: 'my-project',
      ...overrides,
    },
    params: {},
    request: new Request('http://localhost'),
  }
}

describe('GET /api/sentry/issues', () => {
  it('returns 503 when any required env var is missing', async () => {
    const res = await onRequestGet(
      makeCtx({ SENTRY_AUTH_TOKEN: '' }) as Parameters<typeof onRequestGet>[0]
    )
    expect(res.status).toBe(503)
  })

  it('sends Bearer auth header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await onRequestGet(makeCtx() as Parameters<typeof onRequestGet>[0])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('builds correct URL from org and project slugs', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await onRequestGet(makeCtx() as Parameters<typeof onRequestGet>[0])
    const url: string = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('/my-org/my-project/issues/')
    expect(url).toContain('is:unresolved')
  })

  it('transforms API response to SentryIssue shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: '123',
            title: 'TypeError: Cannot read property',
            level: 'error',
            count: '450',
            userCount: 12,
            lastSeen: '2024-01-01T10:00:00Z',
            firstSeen: '2024-01-01T09:00:00Z',
            permalink: 'https://sentry.io/issues/123',
            isUnhandled: true,
          },
        ]),
    })
    const res = await onRequestGet(makeCtx() as Parameters<typeof onRequestGet>[0])
    const data = (await res.json()) as Array<{ title: string; count: string; isUnhandled: boolean }>
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('TypeError: Cannot read property')
    expect(data[0].count).toBe('450')
    expect(data[0].isUnhandled).toBe(true)
  })

  it('returns 502 on upstream error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 })
    const res = await onRequestGet(makeCtx() as Parameters<typeof onRequestGet>[0])
    expect(res.status).toBe(502)
  })

  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'))
    const res = await onRequestGet(makeCtx() as Parameters<typeof onRequestGet>[0])
    expect(res.status).toBe(502)
  })
})
