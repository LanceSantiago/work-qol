// ── Skeleton row ──────────────────────────────────────────────────────────────

/** Animated loading placeholder row for the on-call and incident list sections. */
export function SkeletonRow() {
  return (
    <div className="flex gap-3 items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}
