import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onRequestGet } from '../../../functions/api/github/prs'

const mockFetch = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', mockFetch))
afterEach(() => vi.restoreAllMocks())

function makeCtx(repos = 'myorg/api,myorg/frontend', token = 'ghp_test') {
  return {
    env: { GITHUB_TOKEN: token, GITHUB_REPOS: repos },
    params: {},
    request: new Request('http://localhost'),
  }
}

function makePR(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'feat: add feature',
    html_url: 'https://github.com/myorg/api/pull/1',
    user: { login: 'alice' },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago → stale
    draft: false,
    ...overrides,
  }
}

describe('GET /api/github/prs', () => {
  it('returns 503 when env vars are missing', async () => {
    const res = await onRequestGet(makeCtx('', '') as Parameters<typeof onRequestGet>[0])
    expect(res.status).toBe(503)
  })

  it('fans out one fetch per repo', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await onRequestGet(makeCtx('org/a,org/b,org/c') as Parameters<typeof onRequestGet>[0])
    expect(mockFetch).toHaveBeenCalledTimes(3)
    const urls = mockFetch.mock.calls.map((c) => c[0] as string)
    expect(urls).toContain('https://api.github.com/repos/org/a/pulls?state=open&per_page=50')
    expect(urls).toContain('https://api.github.com/repos/org/b/pulls?state=open&per_page=50')
    expect(urls).toContain('https://api.github.com/repos/org/c/pulls?state=open&per_page=50')
  })

  it('sends correct auth header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await onRequestGet(makeCtx('org/repo', 'ghp_secret') as Parameters<typeof onRequestGet>[0])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer ghp_secret' }),
      })
    )
  })

  it('aggregates PRs from multiple repos', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([makePR({ id: 1 })]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([makePR({ id: 2 })]) })
    const res = await onRequestGet(makeCtx('org/a,org/b') as Parameters<typeof onRequestGet>[0])
    const data = (await res.json()) as unknown[]
    expect(data).toHaveLength(2)
  })

  it('marks PRs older than 2 days as stale', async () => {
    const stalePR = makePR({
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const freshPR = makePR({
      id: 2,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([stalePR, freshPR]),
    })
    const res = await onRequestGet(makeCtx('org/repo') as Parameters<typeof onRequestGet>[0])
    const data = (await res.json()) as Array<{ isStale: boolean }>
    const stale = data.filter((p) => p.isStale)
    const fresh = data.filter((p) => !p.isStale)
    expect(stale).toHaveLength(1)
    expect(fresh).toHaveLength(1)
  })

  it('skips repos that return non-ok responses', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([makePR()]) })
    const res = await onRequestGet(
      makeCtx('org/gone,org/exists') as Parameters<typeof onRequestGet>[0]
    )
    const data = (await res.json()) as unknown[]
    expect(data).toHaveLength(1)
  })

  it('includes repo name on each PR', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([makePR()]) })
    const res = await onRequestGet(makeCtx('myorg/api') as Parameters<typeof onRequestGet>[0])
    const data = (await res.json()) as Array<{ repo: string }>
    expect(data[0].repo).toBe('myorg/api')
  })
})
