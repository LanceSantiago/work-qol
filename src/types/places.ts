export interface Place {
  id: string
  name: string
  address: string
  category: 'food' | 'cafe' | 'activity' | 'other'
  lat: number
  lng: number
  visitedDates: string[] // ISO strings, most recent last
}

export type PlaceCategory = Place['category']

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: '🍜 Food',
  cafe: '☕ Cafe',
  activity: '🎯 Activity',
  other: '📍 Other',
}
