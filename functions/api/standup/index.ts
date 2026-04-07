/// <reference types="@cloudflare/workers-types" />

interface Env {
  STANDUP: KVNamespace
}

interface StandupState {
  names: string[]
  winner: string | null
  spunAt: string | null // ISO timestamp of last spin
}

const KV_KEY = 'state'
const CORS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

async function getState(kv: KVNamespace): Promise<StandupState> {
  const stored = await kv.get<StandupState>(KV_KEY, 'json')
  return stored ?? { names: [], winner: null, spunAt: null }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.STANDUP) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }
  const state = await getState(env.STANDUP)
  return Response.json(state, { headers: CORS })
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.STANDUP) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }

  let body: Partial<StandupState>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const current = await getState(env.STANDUP)

  const next: StandupState = {
    names: Array.isArray(body.names) ? (body.names as string[]) : current.names,
    winner: 'winner' in body ? (body.winner ?? null) : current.winner,
    spunAt: 'winner' in body && body.winner ? new Date().toISOString() : current.spunAt,
  }

  await env.STANDUP.put(KV_KEY, JSON.stringify(next))
  return Response.json(next, { headers: CORS })
}
