/// <reference types="@cloudflare/workers-types" />
import type { PullRequest } from '../../../src/types/github'

interface Env {
  GITHUB_TOKEN: string
  GITHUB_REPOS: string // comma-separated: "org/repo1,org/repo2"
}

interface GHPullRequest {
  id: number
  title: string
  html_url: string
  user: { login: string }
  created_at: string
  draft: boolean
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { GITHUB_TOKEN, GITHUB_REPOS } = context.env
  if (!GITHUB_TOKEN || !GITHUB_REPOS) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const repos = GITHUB_REPOS.split(',')
    .map((r) => r.trim())
    .filter(Boolean)

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  let results: PullRequest[]
  try {
    const fetches = repos.map((repo) =>
      fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=50`, { headers })
        .then(async (res) => {
          if (!res.ok) return []
          const prs: GHPullRequest[] = await res.json()
          return prs.map(
            (pr): PullRequest => ({
              id: pr.id,
              title: pr.title,
              url: pr.html_url,
              author: pr.user.login,
              repo,
              createdAt: pr.created_at,
              isDraft: pr.draft,
              isStale: Date.now() - new Date(pr.created_at).getTime() > TWO_DAYS_MS,
            })
          )
        })
        .catch(() => [] as PullRequest[])
    )

    const nested = await Promise.all(fetches)
    results = nested.flat().sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  return Response.json(results, {
    headers: { 'Cache-Control': 'max-age=300' },
  })
}
