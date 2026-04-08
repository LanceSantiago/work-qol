import { useEffect } from 'react'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import type { Incident } from '../../types/pagerduty'

// ── Tab title badge ───────────────────────────────────────────────────────────

export function TabTitleBadge() {
  const { data } = useAutoRefresh<Incident[]>('/api/pagerduty/incidents', 60 * 1000)

  useEffect(() => {
    const count = data?.length ?? 0
    document.title = count > 0 ? `(${count}) Track Revenue` : 'Track Revenue'
    return () => {
      document.title = 'Track Revenue'
    }
  }, [data])

  return null
}
