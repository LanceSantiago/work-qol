// ── Name list sidebar ─────────────────────────────────────────────────────────

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
]

export function NameList({
  names,
  input,
  saving,
  onInputChange,
  onAdd,
  onRemove,
  onLoadPreset,
}: {
  names: string[]
  input: string
  saving: boolean
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (name: string) => void
  onLoadPreset: () => void
}) {
  return (
    <div className="flex-1 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team members</h2>
        <button
          onClick={onLoadPreset}
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          Load team preset
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Add a name…"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAdd}
          disabled={!input.trim() || saving}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {names.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No names yet.</p>
      ) : (
        <ul className="space-y-2">
          {names.map((name, i) => (
            <li
              key={name}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm">{name}</span>
              </div>
              <button
                onClick={() => onRemove(name)}
                aria-label={`Remove ${name}`}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {names.length === 1 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Add at least one more name to spin.
        </p>
      )}
    </div>
  )
}
