export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

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

export interface ApiError {
  error: string
}
