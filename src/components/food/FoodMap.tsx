import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Place, OsmPlace } from '../../types/places'
import { formatRelative } from '../../utils/dates'
import { MARKHAM, DEFAULT_ZOOM, markerIcon, officeIcon, pinColor } from './mapIcons'
import { MapFitter } from './MapFitter'
import { NearbyMarkers } from './NearbyMarkers'

interface FoodMapProps {
  places: Place[]
  loading: boolean
  onMarkVisited: (id: string) => void
  onRemove: (id: string) => void
  onAddFromOsm: (place: OsmPlace) => void
}

/** Full map section including tile layer, place markers, and OSM nearby suggestions. */
export function FoodMap({ places, loading, onMarkVisited, onRemove, onAddFromOsm }: FoodMapProps) {
  const mappablePlaces = places.filter((p) => p.lat !== 0 || p.lng !== 0)

  return (
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
          <Marker position={MARKHAM} icon={officeIcon()}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">🏢 Office</p>
                <p className="text-xs text-gray-500">80 Tiverton Court, Markham</p>
              </div>
            </Popup>
          </Marker>
          <NearbyMarkers existing={places} onAdd={onAddFromOsm} />
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
                    onClick={() => onMarkVisited(place.id)}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors mr-1"
                  >
                    ✓ Visited today
                  </button>
                  <button
                    onClick={() => onRemove(place.id)}
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
  )
}

/** Color legend for map pin states. */
export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-green-700 inline-block" /> Not visited / &gt;2
        weeks ago
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-amber-600 inline-block" /> 3–14 days ago
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-red-600 inline-block" /> Last 3 days
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-violet-400 inline-block" /> Nearby (OSM) — click to
        add
      </span>
    </div>
  )
}
