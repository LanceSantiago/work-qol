import type { Place, PlaceCategory } from '../../types/places'
import { CATEGORY_LABELS } from '../../types/places'
import { formatRelative } from '../../utils/dates'
import { pinColor } from './mapIcons'

const CATEGORY_BADGE: Record<PlaceCategory, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  cafe: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

interface PlaceListProps {
  places: Place[]
  totalCount: number
  onMarkVisited: (id: string) => void
  onRemove: (id: string) => void
  onAddClick: () => void
  showForm: boolean
  children?: React.ReactNode
}

/** Scrollable list of places with visited/remove actions and a header with the add-place toggle. */
export function PlaceList({
  places,
  totalCount,
  onMarkVisited,
  onRemove,
  onAddClick,
  showForm,
  children,
}: PlaceListProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Places ({totalCount})
        </h2>
        <button
          onClick={onAddClick}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Place'}
        </button>
      </div>

      {children}

      {places.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">No places in this category.</p>
      ) : (
        <ul className="space-y-2">
          {places.map((place) => {
            const lastVisit = place.visitedDates.at(-1)
            return (
              <li
                key={place.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
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
                        ? `Last visited ${formatRelative(lastVisit)} · ${place.visitedDates.length} visit${place.visitedDates.length === 1 ? '' : 's'}`
                        : 'Never visited'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onMarkVisited(place.id)}
                    className="px-2 py-1 rounded-lg text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                  >
                    ✓ Visited
                  </button>
                  <button
                    onClick={() => onRemove(place.id)}
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
  )
}
