// ── Skeleton row ──────────────────────────────────────────────────────────────

/** Animated table-row placeholder shown while Sentry issues are loading. */
export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </td>
    </tr>
  )
}
