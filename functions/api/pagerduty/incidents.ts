/// <reference types="@cloudflare/workers-types" />
import type { Incident } from '../../../src/types/pagerduty'

interface Env {
  PAGERDUTY_API_KEY: string
}

interface PDIncident {
  id: string
  title: string
  status: 'triggered' | 'acknowledged' | 'resolved'
  urgency: 'high' | 'low'
  created_at: string
  service: { summary: string }
  html_url: string
}

interface PDIncidentsResponse {
  incidents: PDIncident[]
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const key = context.env.PAGERDUTY_API_KEY
  if (!key) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const url =
    'https://api.pagerduty.com/incidents' +
    '?statuses[]=triggered&statuses[]=acknowledged' +
    '&sort_by=created_at:desc&limit=20'

  let res: globalThis.Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Token token=${key}`,
        Accept: 'application/vnd.pagerduty+json;version=2',
      },
    })
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'upstream_error', status: res.status }, { status: 502 })
  }

  const data: PDIncidentsResponse = await res.json()

  const incidents: Incident[] = data.incidents.map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status as 'triggered' | 'acknowledged',
    urgency: i.urgency,
    createdAt: i.created_at,
    serviceName: i.service.summary,
    htmlUrl: i.html_url,
  }))

  return Response.json(incidents, {
    headers: { 'Cache-Control': 'max-age=60' },
  })
}
