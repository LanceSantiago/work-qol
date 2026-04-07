/// <reference types="@cloudflare/workers-types" />
import type { OnCallEntry } from '../../../src/types/pagerduty'

interface Env {
  PAGERDUTY_API_KEY: string
}

interface PDOnCallUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface PDOnCall {
  user: PDOnCallUser
  schedule?: { summary: string }
  escalation_policy: { summary: string }
  escalation_level: number
  start: string | null
  end: string | null
}

interface PDOnCallResponse {
  oncalls: PDOnCall[]
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const key = context.env.PAGERDUTY_API_KEY
  if (!key) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  let res: globalThis.Response
  try {
    res = await fetch(
      'https://api.pagerduty.com/oncalls?include[]=users&time_zone=UTC&limit=25',
      {
        headers: {
          Authorization: `Token token=${key}`,
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
      }
    )
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'upstream_error', status: res.status }, { status: 502 })
  }

  const data: PDOnCallResponse = await res.json()

  const oncalls: OnCallEntry[] = data.oncalls.map((o) => ({
    userId: o.user.id,
    userName: o.user.name,
    userEmail: o.user.email,
    userAvatarUrl: o.user.avatar_url,
    scheduleName: o.schedule?.summary ?? 'No schedule',
    escalationPolicyName: o.escalation_policy.summary,
    escalationLevel: o.escalation_level,
    start: o.start,
    end: o.end,
  }))

  return Response.json(oncalls, {
    headers: { 'Cache-Control': 'max-age=300' },
  })
}
