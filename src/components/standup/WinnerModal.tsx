// ── Winner modal ──────────────────────────────────────────────────────────────

export function WinnerModal({
  winner,
  onDismiss,
  onRemove,
}: {
  winner: string | null
  onDismiss: () => void
  onRemove: (name: string) => void
}) {
  if (!winner) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
      onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
    >
      <div
        role="presentation"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-3 animate-[winner-pop_0.35s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-5xl">🎉</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Running standup today
        </p>
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{winner}</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onDismiss}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onRemove(winner)
              onDismiss()
            }}
            className="px-6 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 font-medium transition-colors"
          >
            Remove from wheel
          </button>
        </div>
      </div>
    </div>
  )
}
