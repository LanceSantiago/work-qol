import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Place, PlaceCategory } from '../types/places'
import { CATEGORY_LABELS } from '../types/places'
import { weightedRandomPick, buildVisitWeights } from '../utils/random'
import { formatRelative, isStale } from '../utils/dates'

// ── Leaflet marker icons ──────────────────────────────────────────────────────
// Use divIcon to avoid the Vite asset bundling issue with default marker images

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

function pinColor(place: Place): string {
  const last = place.visitedDates.at(-1)
  if (!last) return '#10b981' // never visited — green
  if (isStale(last, 14)) return '#10b981' // >2 weeks ago — green
  if (isStale(last, 3)) return '#f97316' // 3–14 days ago — orange
  return '#6b7280' // visited very recently — gray
}

// ── Default location: Markham, Ontario ───────────────────────────────────────

const MARKHAM: [number, number] = [43.855284, -79.370958]
const DEFAULT_ZOOM = 14

// ── Auto-fit map bounds when places change ────────────────────────────────────

function MapFitter({ places }: { places: Place[] }) {
  const map = useMap()
  useEffect(() => {
    const withCoords = places.filter((p) => p.lat !== 0 || p.lng !== 0)
    if (withCoords.length === 0) return // keep Markham default
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 15)
      return
    }
    const bounds = L.latLngBounds(withCoords.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [places, map])
  return null
}

// ── Nearby places via Overpass API ────────────────────────────────────────────

interface OsmPlace {
  id: number
  lat: number
  lon: number
  tags: { name?: string; amenity?: string; cuisine?: string; 'addr:full'?: string }
}

function nearbyIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#a78bfa;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:0.85"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  })
}

function NearbyMarkers({
  existing,
  onAdd,
}: {
  existing: Place[]
  onAdd: (place: OsmPlace) => void
}) {
  const [nearby, setNearby] = useState<OsmPlace[]>([])

  useEffect(() => {
    const [lat, lng] = MARKHAM
    const query = `[out:json][timeout:15];
node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"](around:2000,${lat},${lng});
out body 40;`

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then((r) => r.json())
      .then((data) => {
        const typed = data as { elements: OsmPlace[] }
        setNearby(typed.elements.filter((e) => e.tags?.name))
      })
      .catch(() => {}) // silently ignore if Overpass is down
  }, [])

  const existingNames = new Set(existing.map((p) => p.name.toLowerCase()))

  return (
    <>
      {nearby.map((place) => {
        const alreadyAdded = existingNames.has((place.tags.name ?? '').toLowerCase())
        return (
          <Marker key={place.id} position={[place.lat, place.lon]} icon={nearbyIcon()}>
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-semibold mb-0.5">{place.tags.name}</p>
                {place.tags.amenity && (
                  <p className="text-xs text-gray-500 capitalize mb-2">
                    {place.tags.amenity.replace('_', ' ')}
                    {place.tags.cuisine ? ` · ${place.tags.cuisine}` : ''}
                  </p>
                )}
                {alreadyAdded ? (
                  <p className="text-xs text-gray-400">Already in your list</p>
                ) : (
                  <button
                    onClick={() => onAdd(place)}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    + Add to my list
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

// ── Nominatim geocoding ───────────────────────────────────────────────────────

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
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

// ── Category colors ───────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<PlaceCategory, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  cafe: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API = '/api/places'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) throw new Error(`${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FoodPicker() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)
  const [picked, setPicked] = useState<Place | null>(null)
  const [shaking, setShaking] = useState(false)
  const [filterCategory, setFilterCategory] = useState<PlaceCategory | 'all'>('all')

  // Add-place form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formCategory, setFormCategory] = useState<PlaceCategory>('food')
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Load places ─────────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch<Place[]>(API)
      .then((data) => {
        setPlaces(data)
        setApiAvailable(true)
      })
      .catch(() => {
        // Fall back to localStorage when running without Wrangler (plain `npm run dev`)
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

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addPlace = useCallback(async () => {
    if (!formName.trim()) return
    setSubmitting(true)

    let lat = 0
    let lng = 0

    if (formAddress.trim() || formName.trim()) {
      setGeocoding(true)
      const coords = await geocode(formAddress.trim() || formName.trim())
      if (coords) ({ lat, lng } = coords)
      setGeocoding(false)
    }

    const payload = {
      name: formName.trim(),
      address: formAddress.trim(),
      category: formCategory,
      lat,
      lng,
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
        // silently fail — could add toast here
      }
    } else {
      const newPlace: Place = { ...payload, id: crypto.randomUUID(), visitedDates: [] }
      setPlaces((prev) => [...prev, newPlace])
    }

    setFormName('')
    setFormAddress('')
    setFormCategory('food')
    setShowForm(false)
    setSubmitting(false)
  }, [formName, formAddress, formCategory, apiAvailable])

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
      if (picked?.id === id) setPicked(null)
    },
    [apiAvailable, picked]
  )

  const addFromOsm = useCallback(
    async (osm: OsmPlace) => {
      const name = osm.tags.name ?? 'Unknown'
      const address = osm.tags['addr:full'] ?? ''
      const payload = {
        name,
        address,
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

  const pickOne = () => {
    const eligible = places.filter((p) => filterCategory === 'all' || p.category === filterCategory)
    if (eligible.length === 0) return

    const lastVisited = eligible.map((p) => p.visitedDates.at(-1) ?? null)
    const weights = buildVisitWeights(lastVisited)
    const result = weightedRandomPick(eligible, weights)

    setPicked(result)
    setShaking(true)
    setTimeout(() => setShaking(false), 600)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredPlaces = places.filter(
    (p) => filterCategory === 'all' || p.category === filterCategory
  )
  const mappablePlaces = places.filter((p) => p.lat !== 0 || p.lng !== 0)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">Food Picker</h1>
        {!apiAvailable && (
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Offline mode — run <code className="font-mono">just pages</code> for full sync
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Track places you&apos;ve been and let the app pick where to go next.
      </p>

      {/* Map */}
      <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
        {loading ? (
          <div className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-gray-400 text-sm">
            Loading map…
          </div>
        ) : (
          <MapContainer
            center={MARKHAM}
            zoom={DEFAULT_ZOOM}
            style={{ height: '360px' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFitter places={mappablePlaces} />
            <NearbyMarkers existing={places} onAdd={addFromOsm} />
            {mappablePlaces.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={markerIcon(pinColor(place))}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold mb-0.5">{place.name}</p>
                    {place.address && <p className="text-gray-500 text-xs mb-1">{place.address}</p>}
                    <p className="text-xs text-gray-400 mb-2">
                      {place.visitedDates.length === 0
                        ? 'Never visited'
                        : `Last visited ${formatRelative(place.visitedDates.at(-1)!)}`}
                    </p>
                    <button
                      onClick={() => markVisited(place.id)}
                      className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors mr-1"
                    >
                      ✓ Visited today
                    </button>
                    <button
                      onClick={() => removePlace(place.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Map legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Not visited / &gt;2
          weeks ago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> 3–14 days ago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Last 3 days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-400 inline-block" /> Nearby (OSM) — click
          to add
        </span>
      </div>

      {/* Picker */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1 flex-wrap">
            {(['all', 'food', 'cafe', 'activity', 'other'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                {cat === 'all' ? '🎲 All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <button
            onClick={pickOne}
            disabled={filteredPlaces.length === 0}
            className={[
              'ml-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-sm',
              shaking ? 'animate-bounce' : '',
            ].join(' ')}
          >
            Pick for Today 🎲
          </button>
        </div>

        {picked && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400 mb-1">
                Today&apos;s pick
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{picked.name}</p>
              {picked.address && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{picked.address}</p>
              )}
            </div>
            <button
              onClick={async () => {
                await markVisited(picked.id)
                setPicked(null)
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              We went! ✓
            </button>
          </div>
        )}
      </section>

      {/* Place list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Places ({filteredPlaces.length})
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Place'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Place name *"
                className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlace()}
                placeholder="Address or search term (used to pin on map)"
                className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PlaceCategory)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.entries(CATEGORY_LABELS) as [PlaceCategory, string][]).map(
                  ([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <button
                onClick={addPlace}
                disabled={!formName.trim() || submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors min-w-16"
              >
                {geocoding ? 'Locating…' : submitting ? 'Saving…' : 'Add'}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              The address field is geocoded via OpenStreetMap to place a pin on the map.
            </p>
          </div>
        )}

        {filteredPlaces.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
            {places.length === 0
              ? 'No places yet — add some above.'
              : 'No places in this category.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredPlaces.map((place) => {
              const lastVisit = place.visitedDates.at(-1)
              return (
                <li
                  key={place.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: pinColor(place) }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{place.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[place.category]}`}
                        >
                          {CATEGORY_LABELS[place.category]}
                        </span>
                        {place.lat === 0 && place.lng === 0 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            📍 no map pin
                          </span>
                        )}
                      </div>
                      {place.address && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {place.address}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {lastVisit
                          ? `Last visited ${formatRelative(lastVisit)} \u00b7 ${place.visitedDates.length} visit${place.visitedDates.length === 1 ? '' : 's'}`
                          : 'Never visited'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => markVisited(place.id)}
                      className="px-2 py-1 rounded-lg text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                    >
                      ✓ Visited
                    </button>
                    <button
                      onClick={() => removePlace(place.id)}
                      aria-label={`Remove ${place.name}`}
                      className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
