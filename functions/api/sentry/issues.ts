/// <reference types="@cloudflare/workers-types" />
import type { SentryIssue } from '../../../src/types/sentry'

interface Env {
  SENTRY_AUTH_TOKEN: string
  SENTRY_ORG_SLUG: string
  SENTRY_PROJECT_SLUG: string
}

interface SentryApiIssue {
  id: string
  title: string
  level: string
  count: string
  userCount: number
  lastSeen: string
  firstSeen: string
  permalink: string
  isUnhandled: boolean
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, SENTRY_PROJECT_SLUG } = context.env
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG_SLUG || !SENTRY_PROJECT_SLUG) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const url =
    `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${SENTRY_PROJECT_SLUG}/issues/` +
    '?query=is:unresolved&limit=25&statsPeriod=24h&sort=date'

  let res: globalThis.Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` },
    })
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'upstream_error', status: res.status }, { status: 502 })
  }

  const data: SentryApiIssue[] = await res.json()

  const issues: SentryIssue[] = data.map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level as SentryIssue['level'],
    count: i.count,
    userCount: i.userCount,
    lastSeen: i.lastSeen,
    firstSeen: i.firstSeen,
    permalink: i.permalink,
    isUnhandled: i.isUnhandled,
  }))

  return Response.json(issues, {
    headers: { 'Cache-Control': 'max-age=60' },
  })
}
