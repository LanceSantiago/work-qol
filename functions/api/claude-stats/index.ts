/// <reference types="@cloudflare/workers-types" />
import type { MemberStats } from '../../../src/types/claudeStats'

interface Env {
  CLAUDE_STATS: KVNamespace
  CLAUDE_STATS_TOKEN: string
}

const KV_KEY = 'stats:lance'

// ── GET — return stored stats ──────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { CLAUDE_STATS } = context.env
  if (!CLAUDE_STATS) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  const raw = await CLAUDE_STATS.get(KV_KEY)
  if (!raw) {
    return Response.json({ error: 'no_data' }, { status: 404 })
  }

  return Response.json(JSON.parse(raw), {
    headers: { 'Cache-Control': 'max-age=60' },
  })
}

// ── POST — receive pushed stats and store ──────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { CLAUDE_STATS, CLAUDE_STATS_TOKEN } = context.env

  if (!CLAUDE_STATS) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  // Verify bearer token
  const auth = context.request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!CLAUDE_STATS_TOKEN || token !== CLAUDE_STATS_TOKEN) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: MemberStats
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  await CLAUDE_STATS.put(KV_KEY, JSON.stringify(body))

  return Response.json({ ok: true })
}
