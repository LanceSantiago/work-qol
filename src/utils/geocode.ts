/**
 * Resolves a place name or address string to lat/lng via the Nominatim API.
 * Returns null if the query yields no results or the request fails.
 */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  try {
    const res = await fetch(url)
    const results: { lat: string; lon: string }[] = await res.json()
    if (results.length === 0) return null
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
  } catch {
    return null
  }
}
