import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function mockOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

function mockFail(status = 500) {
  mockFetch.mockResolvedValue({ ok: false, status })
}

describe('useAutoRefresh', () => {
  it('starts in loading state', async () => {
    mockOk([])
    const { result } = renderHook(() => useAutoRefresh('/api/test', 60_000))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('populates data after fetch resolves', async () => {
    mockOk({ value: 42 })
    const { result } = renderHook(() => useAutoRefresh('/api/test', 60_000))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual({ value: 42 })
    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
  })

  it('sets error on failed fetch', async () => {
    mockFail(503)
    const { result } = renderHook(() => useAutoRefresh('/api/test', 60_000))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('HTTP 503')
    expect(result.current.data).toBeNull()
  })

  it('manual refresh triggers another fetch', async () => {
    mockOk([])
    const { result } = renderHook(() => useAutoRefresh('/api/test', 60_000))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refresh()
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('re-fetches after the interval elapses', async () => {
    // Use fake timers with shouldAdvanceTime so waitFor still works
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockOk([])
    const { result } = renderHook(() => useAutoRefresh('/api/test', 1_000))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1_000)
      // Flush the async fetch triggered by the interval
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })

  it('clears interval on unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockOk([])
    const { result, unmount } = renderHook(() => useAutoRefresh('/api/test', 1_000))
    await waitFor(() => expect(result.current.loading).toBe(false))

    unmount()
    await act(async () => {
      vi.advanceTimersByTime(3_000)
    })
    // Should still only be 1 call — interval was cleared on unmount
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
