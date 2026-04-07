import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseAutoRefreshResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

/**
 * Fetches `url` on mount and re-fetches every `intervalMs`.
 * Returns data, loading/error state, last-updated timestamp, and a manual refresh trigger.
 */
export function useAutoRefresh<T>(url: string, intervalMs: number): UseAutoRefreshResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Keep url/intervalMs changes from restarting the interval unnecessarily
  const urlRef = useRef(url)
  urlRef.current = url

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(urlRef.current)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: T = await res.json()
      setData(json)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  return { data, loading, error, lastUpdated, refresh }
}
