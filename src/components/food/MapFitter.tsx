import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Place } from '../../types/places'

/**
 * Invisible map child that adjusts the viewport to fit all placed markers.
 * Falls back to the default MARKHAM center when no places have coordinates.
 */
export function MapFitter({ places }: { places: Place[] }) {
  const map = useMap()

  useEffect(() => {
    const withCoords = places.filter((p) => p.lat !== 0 || p.lng !== 0)
    if (withCoords.length === 0) return
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 15)
      return
    }
    const bounds = L.latLngBounds(withCoords.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [places, map])

  return null
}
