export interface DailyActivity {
  date: string
  messageCount: number
  sessionCount: number
  toolCallCount: number
}

export interface DailyModelTokens {
  date: string
  tokensByModel: Record<string, number>
}

export interface ModelUsageDetail {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  webSearchRequests: number
}

export interface MemberStats {
  name: string
  lastComputedDate: string
  firstSessionDate: string
  totalSessions: number
  totalMessages: number
  modelUsage: Record<string, ModelUsageDetail>
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  pushedAt: string
}
