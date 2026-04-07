export interface PullRequest {
  id: number
  title: string
  url: string
  author: string
  repo: string
  createdAt: string
  isDraft: boolean
  isStale: boolean // open > 2 days
}

export interface ApiError {
  error: string
}
