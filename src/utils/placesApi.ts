export const API = '/api/places'

/**
 * Thin fetch wrapper that throws on non-OK responses and handles 204 No Content.
 * Used for all /api/places CRUD calls.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) throw new Error(`${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
