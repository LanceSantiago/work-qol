/** Severity levels used by Sentry issues, ordered from most to least severe. */
export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

/** Shape of a Sentry issue entry returned by the `/api/sentry/issues` endpoint. */
export interface SentryIssue {
  id: string
  title: string
  level: SentryLevel
  count: string // Sentry returns event counts as strings
  userCount: number
  lastSeen: string
  firstSeen: string
  permalink: string
  isUnhandled: boolean
  project: string
}

/** Standard error envelope returned by API routes when a request fails. */
export interface ApiError {
  error: string
}
