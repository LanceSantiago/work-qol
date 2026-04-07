import { useState, useEffect } from 'react'
import type { Place, PlaceCategory } from '../types/places'
import { CATEGORY_LABELS } from '../types/places'
import { weightedRandomPick, buildVisitWeights } from '../utils/random'
import { formatRelative } from '../utils/dates'

const STORAGE_KEY = 'food-picker-places'

function loadPlaces(): Place[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  cafe: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function FoodPicker() {
  const [places, setPlaces] = useState<Place[]>(loadPlaces)
  const [picked, setPicked] = useState<Place | null>(null)
  const [shaking, setShaking] = useState(false)
  const [filterCategory, setFilterCategory] = useState<PlaceCategory | 'all'>('all')

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<PlaceCategory>('food')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
  }, [places])

  const addPlace = () => {
    const trimmedName = name.trim()
    const trimmedAddress = address.trim()
    if (!trimmedName) return

    const newPlace: Place = {
      id: crypto.randomUUID(),
      name: trimmedName,
      address: trimmedAddress,
      category,
      lat: 0,
      lng: 0,
      visitedDates: [],
    }

    setPlaces((prev) => [...prev, newPlace])
    setName('')
    setAddress('')
    setCategory('food')
    setShowForm(false)
  }

  const removePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id))
    if (picked?.id === id) setPicked(null)
  }

  const markVisited = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, visitedDates: [...p.visitedDates, new Date().toISOString()] } : p
      )
    )
  }

  const pickOne = () => {
    const eligible = places.filter((p) => filterCategory === 'all' || p.category === filterCategory)
    if (eligible.length === 0) return

    const lastVisited = eligible.map((p) =>
      p.visitedDates.length > 0 ? p.visitedDates[p.visitedDates.length - 1] : null
    )
    const weights = buildVisitWeights(lastVisited)
    const result = weightedRandomPick(eligible, weights)

    setPicked(result)
    setShaking(true)
    setTimeout(() => setShaking(false), 600)
  }

  const filteredPlaces = places.filter(
    (p) => filterCategory === 'all' || p.category === filterCategory
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Food Picker</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Track places you&apos;ve been and let the app pick where to go next.
      </p>

      {/* Map placeholder — Phase 4 */}
      <div className="mb-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        🗺️ Map view coming in Phase 4 (Cloudflare KV + Leaflet)
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
              onClick={() => {
                markVisited(picked.id)
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Place name *"
                className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address (optional)"
                className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlaceCategory)}
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
                disabled={!name.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{place.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[place.category]}`}
                      >
                        {CATEGORY_LABELS[place.category]}
                      </span>
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
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => markVisited(place.id)}
                      title="Mark visited today"
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
