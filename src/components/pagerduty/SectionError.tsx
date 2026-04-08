// ── Section error ─────────────────────────────────────────────────────────────

/** Styled error box used when an API section fails to load. */
export function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
      Failed to load: {message}
    </div>
  )
}
