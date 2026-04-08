/** Shape of a pull request entry returned by the `/api/github/prs` endpoint. */
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

/** Standard error envelope returned by API routes when a request fails. */
export interface ApiError {
  error: string
}
