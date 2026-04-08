/** Represents a single on-call shift entry returned by the `/api/pagerduty/oncall` endpoint. */
export interface OnCallEntry {
  userId: string
  userName: string
  userEmail: string
  userAvatarUrl: string | null
  scheduleName: string
  escalationPolicyName: string
  escalationLevel: number
  start: string | null
  end: string | null
}

/** Represents an active PagerDuty incident returned by the `/api/pagerduty/incidents` endpoint. */
export interface Incident {
  id: string
  title: string
  status: 'triggered' | 'acknowledged'
  urgency: 'high' | 'low'
  createdAt: string
  serviceName: string
  htmlUrl: string
}

/** Standard error envelope returned by API routes when a request fails. */
export interface ApiError {
  error: string
}
