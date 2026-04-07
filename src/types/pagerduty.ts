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

export interface Incident {
  id: string
  title: string
  status: 'triggered' | 'acknowledged'
  urgency: 'high' | 'low'
  createdAt: string
  serviceName: string
  htmlUrl: string
}

export interface ApiError {
  error: string
}
