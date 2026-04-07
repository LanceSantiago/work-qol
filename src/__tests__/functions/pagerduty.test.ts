import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onRequestGet as getOncall } from '../../../functions/api/pagerduty/oncall'
import { onRequestGet as getIncidents } from '../../../functions/api/pagerduty/incidents'

const mockFetch = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', mockFetch))
afterEach(() => vi.restoreAllMocks())

function makeCtx(key = 'test-key') {
  return {
    env: { PAGERDUTY_API_KEY: key },
    params: {},
    request: new Request('http://localhost'),
  }
}

// ── On-call ───────────────────────────────────────────────────────────────────

describe('GET /api/pagerduty/oncall', () => {
  it('returns 503 when API key is missing', async () => {
    const res = await getOncall(makeCtx('') as Parameters<typeof getOncall>[0])
    expect(res.status).toBe(503)
    expect(((await res.json()) as { error: string }).error).toBe('not_configured')
  })

  it('sends correct auth header to PagerDuty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ oncalls: [] }),
    })
    await getOncall(makeCtx('my-key') as Parameters<typeof getOncall>[0])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('pagerduty.com/oncalls'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token token=my-key' }),
      })
    )
  })

  it('transforms the response to OnCallEntry shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          oncalls: [
            {
              user: { id: 'u1', name: 'Alice', email: 'alice@co.com', avatar_url: null },
              schedule: { summary: 'Primary' },
              escalation_policy: { summary: 'Eng Policy' },
              escalation_level: 1,
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-08T00:00:00Z',
            },
          ],
        }),
    })
    const res = await getOncall(makeCtx() as Parameters<typeof getOncall>[0])
    const data = (await res.json()) as Array<{ userName: string; scheduleName: string }>
    expect(data).toHaveLength(1)
    expect(data[0].userName).toBe('Alice')
    expect(data[0].scheduleName).toBe('Primary')
  })

  it('returns 502 on upstream error status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    const res = await getOncall(makeCtx() as Parameters<typeof getOncall>[0])
    expect(res.status).toBe(502)
  })

  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))
    const res = await getOncall(makeCtx() as Parameters<typeof getOncall>[0])
    expect(res.status).toBe(502)
  })
})

// ── Incidents ─────────────────────────────────────────────────────────────────

describe('GET /api/pagerduty/incidents', () => {
  it('returns 503 when API key is missing', async () => {
    const res = await getIncidents(makeCtx('') as Parameters<typeof getIncidents>[0])
    expect(res.status).toBe(503)
  })

  it('transforms incidents to Incident shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          incidents: [
            {
              id: 'Q1',
              title: 'DB down',
              status: 'triggered',
              urgency: 'high',
              created_at: '2024-01-01T12:00:00Z',
              service: { summary: 'Database' },
              html_url: 'https://pd.example.com/Q1',
            },
          ],
        }),
    })
    const res = await getIncidents(makeCtx() as Parameters<typeof getIncidents>[0])
    const data = (await res.json()) as Array<{
      title: string
      urgency: string
      serviceName: string
    }>
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('DB down')
    expect(data[0].urgency).toBe('high')
    expect(data[0].serviceName).toBe('Database')
  })

  it('only requests triggered and acknowledged statuses', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ incidents: [] }) })
    await getIncidents(makeCtx() as Parameters<typeof getIncidents>[0])
    const url: string = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('statuses[]=triggered')
    expect(url).toContain('statuses[]=acknowledged')
  })

  it('returns 502 on upstream error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })
    const res = await getIncidents(makeCtx() as Parameters<typeof getIncidents>[0])
    expect(res.status).toBe(502)
  })
})
