import { useState, useEffect, useCallback } from 'react'
import type { Place, PlaceCategory, OsmPlace } from '../types/places'
import { weightedRandomPick, buildVisitWeights } from '../utils/random'
import { geocode } from '../utils/geocode'
import { API, apiFetch } from '../utils/placesApi'

export interface AddPlacePayload {
  name: string
  address: string
  category: PlaceCategory
}

export interface UsePlacesReturn {
  places: Place[]
  loading: boolean
  apiAvailable: boolean
  addPlace: (payload: AddPlacePayload, onGeocoding: (v: boolean) => void) => Promise<void>
  markVisited: (id: string) => Promise<void>
  removePlace: (id: string) => Promise<void>
  addFromOsm: (osm: OsmPlace) => Promise<void>
  pickOne: (filterCategory: PlaceCategory | 'all') => Place | null
}

/**
 * Manages the full lifecycle of the places list: loading from the API (with
 * localStorage fallback), and all CRUD + pick actions.
 */
export function usePlaces(): UsePlacesReturn {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch<Place[]>(API)
      .then((data) => {
        setPlaces(data)
        setApiAvailable(true)
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('food-picker-places')
          if (stored) setPlaces(JSON.parse(stored))
        } catch {
          // ignore
        }
        setApiAvailable(false)
      })
      .finally(() => setLoading(false))
  }, [])

  // Sync to localStorage when API is unavailable (dev fallback)
  useEffect(() => {
    if (!apiAvailable) {
      localStorage.setItem('food-picker-places', JSON.stringify(places))
    }
  }, [places, apiAvailable])

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Geocodes the address, then POSTs the new place to the API (or falls back to local state). */
  const addPlace = useCallback(
    async (payload: AddPlacePayload, onGeocoding: (v: boolean) => void) => {
      let lat = 0
      let lng = 0

      if (payload.address.trim() || payload.name.trim()) {
        onGeocoding(true)
        const coords = await geocode(payload.address.trim() || payload.name.trim())
        if (coords) ({ lat, lng } = coords)
        onGeocoding(false)
      }

      const full = { ...payload, lat, lng }

      if (apiAvailable) {
        try {
          const created = await apiFetch<Place>(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(full),
          })
          setPlaces((prev) => [...prev, created])
        } catch {
          // silently fail
        }
      } else {
        setPlaces((prev) => [...prev, { ...full, id: crypto.randomUUID(), visitedDates: [] }])
      }
    },
    [apiAvailable]
  )

  /** Appends today's ISO timestamp to a place's visitedDates via PATCH, or updates local state if offline. */
  const markVisited = useCallback(
    async (id: string) => {
      if (apiAvailable) {
        try {
          const updated = await apiFetch<Place>(`${API}/${id}`, { method: 'PATCH' })
          setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)))
        } catch {
          // silently fail
        }
      } else {
        setPlaces((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, visitedDates: [...p.visitedDates, new Date().toISOString()] } : p
          )
        )
      }
    },
    [apiAvailable]
  )

  /** Deletes a place from the API and removes it from local state. */
  const removePlace = useCallback(
    async (id: string) => {
      if (apiAvailable) {
        try {
          await apiFetch(`${API}/${id}`, { method: 'DELETE' })
        } catch {
          // silently fail
        }
      }
      setPlaces((prev) => prev.filter((p) => p.id !== id))
    },
    [apiAvailable]
  )

  /** Creates a new place from an OSM node, inferring category from amenity type. */
  const addFromOsm = useCallback(
    async (osm: OsmPlace) => {
      const payload = {
        name: osm.tags.name ?? 'Unknown',
        address: osm.tags['addr:full'] ?? '',
        category: (osm.tags.amenity === 'cafe' ? 'cafe' : 'food') as PlaceCategory,
        lat: osm.lat,
        lng: osm.lon,
      }
      if (apiAvailable) {
        try {
          const created = await apiFetch<Place>(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          setPlaces((prev) => [...prev, created])
        } catch {
          // silently fail
        }
      } else {
        setPlaces((prev) => [...prev, { ...payload, id: crypto.randomUUID(), visitedDates: [] }])
      }
    },
    [apiAvailable]
  )

  /** Picks a random place from the filtered list using visit-recency weights. */
  const pickOne = useCallback(
    (filterCategory: PlaceCategory | 'all'): Place | null => {
      const eligible = places.filter(
        (p) => filterCategory === 'all' || p.category === filterCategory
      )
      if (eligible.length === 0) return null
      const weights = buildVisitWeights(eligible.map((p) => p.visitedDates.at(-1) ?? null))
      return weightedRandomPick(eligible, weights)
    },
    [places]
  )

  return { places, loading, apiAvailable, addPlace, markVisited, removePlace, addFromOsm, pickOne }
}
