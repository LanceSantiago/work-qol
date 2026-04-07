/// <reference types="@cloudflare/workers-types" />
import type { Place } from '../../../src/types/places'

interface Env {
  PLACES: KVNamespace
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

async function getPlaces(env: Env): Promise<Place[]> {
  return (await env.PLACES.get<Place[]>('all', 'json')) ?? []
}

// PATCH /api/places/:id — mark the place as visited today
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string
  const places = await getPlaces(context.env)
  const index = places.findIndex((p) => p.id === id)

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    })
  }

  places[index] = {
    ...places[index],
    visitedDates: [...places[index].visitedDates, new Date().toISOString()],
  }

  await context.env.PLACES.put('all', JSON.stringify(places))

  return new Response(JSON.stringify(places[index]), { headers: CORS_HEADERS })
}

// DELETE /api/places/:id — remove a place
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string
  const places = await getPlaces(context.env)
  const updated = places.filter((p) => p.id !== id)

  if (updated.length === places.length) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    })
  }

  await context.env.PLACES.put('all', JSON.stringify(updated))

  return new Response(null, { status: 204 })
}
