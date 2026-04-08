import { useState, useEffect } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type { Place, OsmPlace } from '../../types/places'
import { MARKHAM, nearbyIcon } from './mapIcons'

/**
 * Queries the Overpass API for restaurants/cafes within 2 km of MARKHAM and
 * renders them as purple map markers. Places already in the user's list show
 * as already-added; others show an "+ Add to my list" button.
 */
export function NearbyMarkers({
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

    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
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
