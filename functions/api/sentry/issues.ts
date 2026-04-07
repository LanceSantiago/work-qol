/// <reference types="@cloudflare/workers-types" />
import type { SentryIssue } from '../../../src/types/sentry'

interface Env {
  SENTRY_AUTH_TOKEN: string
  SENTRY_ORG_SLUG: string
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
  project: { slug: string; name: string }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG } = context.env
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG_SLUG) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const url =
    `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/issues/` +
    '?query=is:unresolved&limit=50&statsPeriod=24h&sort=date'

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
    project: i.project?.name ?? i.project?.slug ?? 'unknown',
  }))

  return Response.json(issues, {
    headers: { 'Cache-Control': 'max-age=60' },
  })
}
