// ── Refresh button ────────────────────────────────────────────────────────────

/** Small button that triggers a manual data refresh when clicked. */
export function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
    >
      ↻ Refresh
    </button>
  )
}
