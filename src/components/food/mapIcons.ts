import L from 'leaflet'
import type { Place } from '../../types/places'
import { isStale } from '../../utils/dates'

/** Default map center and zoom for the food picker map. */
export const MARKHAM: [number, number] = [43.855284, -79.370958]
export const DEFAULT_ZOOM = 14

/** Creates a circular Leaflet divIcon with the given fill color. */
export function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

/** Creates a building icon marker for the office location. */
export function officeIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#1d4ed8;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);font-size:14px;line-height:1">🏢</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

/** Creates a smaller purple divIcon used for Overpass/OSM nearby suggestions. */
export function nearbyIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#a78bfa;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:0.85"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  })
}

/**
 * Returns the map pin color for a place based on how recently it was visited.
 * - Green: never visited or more than 2 weeks ago
 * - Orange: visited 3–14 days ago
 * - Gray: visited within the last 3 days
 */
export function pinColor(place: Place): string {
  const last = place.visitedDates.at(-1)
  if (!last) return '#16a34a' // green  — never visited
  if (isStale(last, 14)) return '#16a34a' // green  — >2 weeks ago
  if (isStale(last, 3)) return '#d97706' // amber  — 3–14 days ago
  return '#dc2626' // red    — visited in last 3 days
}
