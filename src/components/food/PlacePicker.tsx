import type { Place, PlaceCategory } from '../../types/places'
import { CATEGORY_LABELS } from '../../types/places'

interface PlacePickerProps {
  filterCategory: PlaceCategory | 'all'
  filteredCount: number
  picked: Place | null
  shaking: boolean
  onFilterChange: (cat: PlaceCategory | 'all') => void
  onPick: () => void
  onMarkVisited: (id: string) => void
  onDismiss: () => void
}

/** Category filter tabs, the "Pick for Today" button, and the current pick result card. */
export function PlacePicker({
  filterCategory,
  filteredCount,
  picked,
  shaking,
  onFilterChange,
  onPick,
  onMarkVisited,
  onDismiss,
}: PlacePickerProps) {
  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'food', 'cafe', 'activity', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
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
          onClick={onPick}
          disabled={filteredCount === 0}
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
              await onMarkVisited(picked.id)
              onDismiss()
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            We went! ✓
          </button>
        </div>
      )}
    </section>
  )
}
