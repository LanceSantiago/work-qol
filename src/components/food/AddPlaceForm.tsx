import type { PlaceCategory } from '../../types/places'
import { CATEGORY_LABELS } from '../../types/places'

interface AddPlaceFormProps {
  formName: string
  formAddress: string
  formCategory: PlaceCategory
  geocoding: boolean
  submitting: boolean
  onNameChange: (v: string) => void
  onAddressChange: (v: string) => void
  onCategoryChange: (v: PlaceCategory) => void
  onSubmit: () => void
  onCancel: () => void
}

/** Inline form for adding a new place. Geocodes the address via Nominatim on submit. */
export function AddPlaceForm({
  formName,
  formAddress,
  formCategory,
  geocoding,
  submitting,
  onNameChange,
  onAddressChange,
  onCategoryChange,
  onSubmit,
  onCancel,
}: AddPlaceFormProps) {
  return (
    <div className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={formName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Place name *"
          className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={formAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Address or search term (used to pin on map)"
          className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          value={formCategory}
          onChange={(e) => onCategoryChange(e.target.value as PlaceCategory)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(Object.entries(CATEGORY_LABELS) as [PlaceCategory, string][]).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={onSubmit}
          disabled={!formName.trim() || submitting}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors min-w-16"
        >
          {geocoding ? 'Locating…' : submitting ? 'Saving…' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        The address field is geocoded via OpenStreetMap to place a pin on the map.
      </p>
    </div>
  )
}
