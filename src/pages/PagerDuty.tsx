import { OnCallSection } from '../components/pagerduty/OnCallSection'
import { IncidentsSection } from '../components/pagerduty/IncidentsSection'

// ── Page ──────────────────────────────────────────────────────────────────────

/** PagerDuty dashboard page. Composes the on-call and active incidents sections. */
export default function PagerDuty() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">PagerDuty</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        On-call schedule and active incidents. Refreshes automatically.
      </p>
      <IncidentsSection />
      <OnCallSection />
    </div>
  )
}
