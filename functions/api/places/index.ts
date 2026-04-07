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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const places = await getPlaces(context.env)
  return new Response(JSON.stringify(places), { headers: CORS_HEADERS })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: unknown
  try {
    body = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: CORS_HEADERS,
    })
  }

  const { name, address, category, lat, lng } = body as Partial<Place>

  if (!name?.trim()) {
    return new Response(JSON.stringify({ error: 'name is required' }), {
      status: 400,
      headers: CORS_HEADERS,
    })
  }

  const newPlace: Place = {
    id: crypto.randomUUID(),
    name: name.trim(),
    address: address?.trim() ?? '',
    category: category ?? 'food',
    lat: lat ?? 0,
    lng: lng ?? 0,
    visitedDates: [],
  }

  const places = await getPlaces(context.env)
  places.push(newPlace)
  await context.env.PLACES.put('all', JSON.stringify(places))

  return new Response(JSON.stringify(newPlace), { status: 201, headers: CORS_HEADERS })
}
